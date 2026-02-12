FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS base
USER app
WORKDIR /app
EXPOSE 8080
EXPOSE 8081
RUN mkdir -p /app/wwwroot/files && chown -R app:app /app/wwwroot && chmod -R 755 /app/wwwroot && chmod -R 775 /app/wwwroot/files

# This stage is used to build the service project
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
ARG BUILD_CONFIGURATION=Release
WORKDIR /src
COPY ["services/storage/src/Board.StorageService.WebApi/Board.StorageService.WebApi.csproj", "services/storage/src/Board.StorageService.WebApi/"]
RUN dotnet restore "./services/storage/src/Board.StorageService.WebApi/Board.StorageService.WebApi.csproj"
COPY . .
WORKDIR "/src/services/storage/src/Board.StorageService.WebApi"
RUN dotnet build "./Board.StorageService.WebApi.csproj" -c $BUILD_CONFIGURATION -o /app/build

# This stage is used to publish the service project to be copied to the final stage
FROM build AS publish
ARG BUILD_CONFIGURATION=Release
RUN dotnet publish "./Board.StorageService.WebApi.csproj" -c $BUILD_CONFIGURATION -o /app/publish /p:UseAppHost=false

# This stage is used in production or when running from VS in regular mode (Default when not using the Debug configuration)
FROM base AS final
WORKDIR /app
COPY --from=publish --chown=app:app /app/publish .
RUN mkdir -p /app/wwwroot/files && chown -R app:app /app/wwwroot/files && chmod -R 775 /app/wwwroot/files
ENTRYPOINT ["dotnet", "Board.StorageService.WebApi.dll"]