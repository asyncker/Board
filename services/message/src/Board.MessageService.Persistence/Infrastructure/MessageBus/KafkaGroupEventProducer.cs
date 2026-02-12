using Confluent.Kafka;
using Board.MessageService.Persistence.Domain.Events;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using System.Text.Json;

namespace Board.MessageService.Persistence.Infrastructure.MessageBus;

public class KafkaGroupEventProducer : IKafkaGroupEventProducer, IDisposable
{
    private readonly string _topicName;
    private readonly ILogger<KafkaGroupEventProducer> _logger;
    private readonly IProducer<string, string> _producer;
    public KafkaGroupEventProducer(ILogger<KafkaGroupEventProducer> logger,
        IProducer<string, string> producer,
        IConfiguration configuration)
    {
        _logger = logger;
        _producer = producer;
        _topicName = configuration["Kafka:GroupEventsTopic"] ?? "group-topic";
    }

    public async Task ProduceCreateEventAsync(GroupEventData eventData, CancellationToken cancellationToken)
    {
        try
        {
            GroupEvent groupEvent = new()
            {
                Action = "GroupCreated",
                TimestampUtc = DateTime.UtcNow,
                Data = eventData
            };
            Message<string, string> message = new()
            {
                Key = groupEvent.Data.GroupId.ToString(),
                Value = JsonSerializer.Serialize(groupEvent, new JsonSerializerOptions { PropertyNamingPolicy = JsonNamingPolicy.CamelCase, WriteIndented = false }),
                Headers = new Headers
                {
                    { "event-type", System.Text.Encoding.UTF8.GetBytes(groupEvent.Action) },
                    { "timestamp", System.Text.Encoding.UTF8.GetBytes(groupEvent.TimestampUtc.ToString("O")) }
                }
            };
            var deliveryResult = await _producer.ProduceAsync(_topicName, message, cancellationToken);
        }
        catch (ProduceException<string, string> ex)
        {
            _logger.LogError(ex, "Failed to deliver message to Kafka. Error: {Error}", ex.Error.Reason);
            throw;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unexpected error while producing Kafka message");
            throw;
        }
    }

    public void Flush(TimeSpan timeout)
    {
        _producer.Flush(timeout);
    }

    public void Dispose()
    {
        _producer.Flush(TimeSpan.FromSeconds(10));
        _producer.Dispose();
        GC.SuppressFinalize(this);
    }
}