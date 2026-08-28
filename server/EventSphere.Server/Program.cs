using EventSphere.Server.Data;
using EventSphere.Server.Extensions;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers()
    .AddJsonOptions(options =>
        options.JsonSerializerOptions.ReferenceHandler = System.Text.Json.Serialization.ReferenceHandler.IgnoreCycles);

builder.Services.AddSingleton<InMemoryDataContext>();

builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend", policy =>
        policy.AllowAnyOrigin()
              .AllowAnyMethod()
              .AllowAnyHeader());
});

var app = builder.Build();

var data = app.Services.GetRequiredService<InMemoryDataContext>();
SampleData.Seed(data);

app.UseCors("AllowFrontend");

app.UseAuthorization();

app.MapControllers();

app.Run();