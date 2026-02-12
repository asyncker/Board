using Microsoft.AspNetCore.Diagnostics;
using Ocelot.DependencyInjection;
using Ocelot.Middleware;
using Serilog;

var builder = WebApplication.CreateBuilder(args);
Log.Logger = new LoggerConfiguration().WriteTo.Console().CreateLogger();

builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();
builder.Services.AddOcelot();
builder.Configuration
    .AddJsonFile(path: "ocelot.json", optional: false, reloadOnChange: true)
    .AddEnvironmentVariables();


var app = builder.Build();
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseAuthorization();
app.MapControllers();

app.Map("/error", (HttpContext context) =>
{
    Exception exception = context.Features.Get<IExceptionHandlerFeature>()?.Error;
    Log.Error(exception, "Gateway error");
    return Results.Problem(detail: exception?.Message, title: "Gateway Error", statusCode: StatusCodes.Status500InternalServerError);
});

await app.UseOcelot();
app.Run();