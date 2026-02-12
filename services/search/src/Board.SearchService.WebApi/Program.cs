using Board.SearchService.Application.Service.Implementation;
using Board.SearchService.Application.Service.Interface;
using Board.SearchService.Persistence.Infrastructure.MessageBus;
using Board.SearchService.Persistence.Infrastructure.Repository.Implementation;
using Board.SearchService.Persistence.Infrastructure.Repository.Interface;
using Confluent.Kafka;
using Elastic.Clients.Elasticsearch;
using Elastic.Transport;
using Microsoft.AspNetCore.Diagnostics.HealthChecks;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddSingleton(sp =>
{
    string url = builder.Configuration["Elasticsearch:Uri"];
    string defaultIndex = builder.Configuration["Elasticsearch:DefaultIndex"];
    string username = builder.Configuration["Elasticsearch:Username"];
    string password = builder.Configuration["Elasticsearch:Password"];
    bool isDebug = bool.Parse(builder.Configuration["Elasticsearch:IsDebug"] ?? "false");
    ElasticsearchClientSettings config = new(new Uri(url));
    if (!string.IsNullOrEmpty(username) && !string.IsNullOrEmpty(password))
    {
        config.Authentication(new BasicAuthentication(username, password));
    }
    config.DefaultIndex(defaultIndex);
    if (isDebug)
    {
        config.EnableDebugMode();
    }
    return new ElasticsearchClient(config);
});

builder.Services.AddSingleton<IConsumer<string, string>>(sp =>
{
    ConsumerConfig config = new()
    {
        BootstrapServers = builder.Configuration["Kafka:BootstrapServers"],
        GroupId = builder.Configuration["Kafka:GroupId"],
        AutoOffsetReset = AutoOffsetReset.Earliest,
        EnableAutoCommit = false
    };
    return new ConsumerBuilder<string, string>(config).Build();
});

builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();
builder.Services.AddHealthChecks()
    .AddElasticsearch(
        name: "elasticsearch",
        tags: new[] { "db", "elasticsearch", "ready" },
        elasticsearchUri: builder.Configuration["Elasticsearch:Uri"]!)
    .AddKafka(
        name: "kafka",
        tags: new[] { "broker", "kafka", "ready" },
        setup: config =>
        {
            config.BootstrapServers = builder.Configuration["Kafka:BootstrapServers"];
        });

builder.Services.AddTransient<IElasticsearchRepository, ElasticsearchRepository>();
builder.Services.AddTransient<ISearchService, ElasticSearchService>();
builder.Services.AddHostedService<KafkaGroupEventHandler>();

var app = builder.Build();
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseHttpsRedirection();
app.UseAuthorization();

app.MapHealthChecks("/health", new HealthCheckOptions
{
    Predicate = check => check.Tags.Contains("ready")
});

app.MapHealthChecks("/health/ready", new HealthCheckOptions
{
    Predicate = check => check.Tags.Contains("ready")
});

app.MapHealthChecks("/health/live", new HealthCheckOptions
{
    Predicate = _ => false
});

app.MapControllers();
app.Run();