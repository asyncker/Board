using Board.MessageService.Application.Service.Implementation;
using Board.MessageService.Application.Service.Interface;
using Board.MessageService.Persistence.Infrastructure;
using Board.MessageService.Persistence.Infrastructure.MessageBus;
using Confluent.Kafka;
using Microsoft.AspNetCore.Diagnostics.HealthChecks;
using Microsoft.EntityFrameworkCore;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

builder.Services.AddTransient<IMessageService, MessageService>();
builder.Services.AddSingleton<IKafkaGroupEventProducer, KafkaGroupEventProducer>();
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection")));

builder.Services.AddHealthChecks()
    .AddKafka(
        name: "kafka",
        tags: new[] { "broker", "kafka", "ready" },
        setup: config =>
        {
            config.BootstrapServers = builder.Configuration["Kafka:BootstrapServers"];
        })
    .AddNpgSql(connectionString: builder.Configuration.GetConnectionString("DefaultConnection"),
        name: "postgresql",
        tags: new[] { "db", "postgresql", "ready" },
        healthQuery: "SELECT 1;");

builder.Services.AddSingleton<IProducer<string, string>>(sp =>
{
    ProducerConfig config = new()
    {
        BootstrapServers = builder.Configuration["Kafka:BootstrapServers"],
        Acks = Acks.All,
        EnableDeliveryReports = true
    };
    return new ProducerBuilder<string, string>(config).Build();
});

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

using (IServiceScope scope = app.Services.CreateScope())
{
    ILogger<Program> logger = scope.ServiceProvider.GetRequiredService<ILogger<Program>>();
    try
    {
        AppDbContext context = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        if (context.Database.GetPendingMigrations().Any())
        {
            await context.Database.MigrateAsync();
        }
    }
    catch (Exception ex)
    {
        logger.LogError(ex, "An error occurred while applying migrations");
    }
}

app.Run();