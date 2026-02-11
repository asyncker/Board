using Board.SearchService.Persistence.Domain.Events;
using Board.SearchService.Persistence.Infrastructure.Repository.Interface;
using Confluent.Kafka;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using System.Text.Json;

namespace Board.SearchService.Persistence.Infrastructure.MessageBus;

/// <summary>
/// Обрабатывает события, такие как GroupCreated, и обновляет индекс поиска Elasticsearch
/// </summary>
public class KafkaGroupEventHandler : BackgroundService
{
    private readonly string _topicName;
    private readonly ILogger<KafkaGroupEventHandler> _logger;
    private readonly IConsumer<string, string> _consumer;
    private readonly IElasticsearchRepository _elasticsearchRepository;
    public KafkaGroupEventHandler(ILogger<KafkaGroupEventHandler> logger,
        IConsumer<string, string> consumer,
        IElasticsearchRepository elasticsearchRepository,
        IConfiguration configuration)
    {
        _logger = logger;
        _consumer = consumer;
        _elasticsearchRepository = elasticsearchRepository;
        _topicName = configuration["Kafka:GroupEventsTopic"] ?? "group-topic";
    }

    /// <summary>
    /// Выполняет фоновую задачу, подписываясь на сообщение от Kafka
    /// </summary>
    /// <param name="stoppingToken"></param>
    /// <returns></returns>
    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        await Task.Yield();
        await ConsumeMessages(stoppingToken);
    }

    private async Task ConsumeMessages(CancellationToken stoppingToken)
    {
        try
        {
            _consumer.Subscribe(_topicName);
            while (!stoppingToken.IsCancellationRequested)
            {
                ConsumeResult<string, string> message = null;
                try
                {
                    message = _consumer.Consume(stoppingToken);
                    GroupEvent? groupEvent = JsonSerializer.Deserialize<GroupEvent>(message.Message.Value, new JsonSerializerOptions { PropertyNameCaseInsensitive = true });
                    if (groupEvent != null)
                    {
                        await ProcessMessageAsync(groupEvent, stoppingToken);
                    }
                }
                catch (JsonException ex)
                {
                    _logger.LogError(ex, "Error deserialization JSON");
                }
                catch (ConsumeException ex)
                {
                    _logger.LogError(ex, "Error message consumer from Kafka");
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Error when processing a message");
                }
                finally
                {
                    if (message != null)
                    {
                        _consumer.Commit(message);
                    }
                }
            }
        }
        finally
        {
            _consumer.Close();
            _consumer.Dispose();
        }
    }

    private async Task ProcessMessageAsync(GroupEvent groupEvent, CancellationToken cancellationToken)
    {
        switch (groupEvent.Action)
        {
            case "GroupCreated":
                await _elasticsearchRepository.CreateOrUpdateGroupAsync(new Domain.Search.ElasticGroup()
                {
                    Id = groupEvent.Data.GroupId,
                    Name = groupEvent.Data.Name,
                    Title = groupEvent.Data.Title,
                    Description = groupEvent.Data.Description,
                    AvatarUrl = groupEvent.Data.AvatarUrl
                });
                break;
            default:
                _logger.LogWarning("Unknown event type: {Action}", groupEvent?.Action);
                break;
        }
    }
}