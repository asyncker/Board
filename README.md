# Board
Запуск проекта:
```bash
docker-compose up --build
```

```mermaid
flowchart LR
    Client -->|5180| Gateway
    Gateway -->|8060| Identity
    Gateway -->|8070| Message
    Gateway -->|8080| Storage
    Gateway -->|8090| Search
    Identity -->|5434| IdentityDB[(Identity Postgres DB)]
    Message -->|5433| MessageDB[(Message Postgres DB)]
    Storage -->|5432| StorageDB[(Storage Postgres DB)]
    Search -->|9200| Elastic[(Elasticsearch ELK)]
    Storage -->|volume| Uploads[(/uploads)]
    Message -.->|send| Kafka
    Kafka -.->|consume| Search
    Kafka -->|2181| Zookeeper

    style Client fill:#1a2634,stroke:#3e5a76,stroke-width:3px,color:#ffffff
    style Gateway fill:#9c89b8,stroke:#7b6c9c,stroke-width:3px,color:#ffffff
    style Identity fill:#70ae6e,stroke:#558b55,stroke-width:3px,color:#ffffff
    style Message fill:#70ae6e,stroke:#558b55,stroke-width:3px,color:#ffffff
    style Storage fill:#70ae6e,stroke:#558b55,stroke-width:3px,color:#ffffff
    style Search fill:#70ae6e,stroke:#558b55,stroke-width:3px,color:#ffffff
    style IdentityDB fill:#3a7ca5,stroke:#2c5f7a,stroke-width:3px,color:#ffffff
    style MessageDB fill:#3a7ca5,stroke:#2c5f7a,stroke-width:3px,color:#ffffff
    style StorageDB fill:#3a7ca5,stroke:#2c5f7a,stroke-width:3px,color:#ffffff
    style Elastic fill:#3a7ca5,stroke:#2c5f7a,stroke-width:3px,color:#ffffff
    style Uploads fill:#3a7ca5,stroke:#2c5f7a,stroke-width:3px,color:#ffffff
    style Kafka fill:#e15554,stroke:#ba4040,stroke-width:3px,color:#ffffff
    style Zookeeper fill:#e15554,stroke:#ba4040,stroke-width:3px,color:#ffffff
```

# Технологический стек

## **Архитектура**
- **Микросервисная архитектура** - приложение разделено на независимые микросервисы (Identity, Message, Storage, Search), каждый из которых решает свою конкретную задачу и может масштабироваться независимо
- **API Gateway** - единая точка входа для клиентов и маршрутизация запросов к соответствующим микросервисам

## **Бэкенд**
- **C# / .NET** - все микросервисы реализованы на платформе .NET 8.0 (ASP.NET Core)
- **Entity Framework Core** - ORM для работы с базой данных PostgreSQL в сервисах Identity, Message и Storage (через Code First подход)
- **Apache Kafka** - брокер сообщений используется для асинхронной передачи данных между сервисами
- **REST API** - взаимодействие между клиентом и сервисами через HTTP-протокол
- **Health Checks** - встроенные проверки доступности сервисов и зависимостей (БД, Kafka) для обеспечения отказоустойчивости
- **Swagger/OpenAPI** - документация API для каждого микросервиса
- **Ocelot** - API Gateway с конфигурацией маршрутов
- **xUnit** - Юнит-тесты микросервисов, покрыто >50% кода и используется Moq библиотека

## **Базы данных и хранилища**
- **PostgreSQL** - реляционная БД для хранения данных пользователей (Identity), сообщений/групп (Message) и файлов (Storage)
- **Elasticsearch (ELK)** - полнотекстовый поиска по сообщениям
- **Файловое хранилище (volume)** - физическое хранение загруженных изображений и файлов в Docker-томе `/uploads`

## **Инфраструктура**
- **Docker Compose** - настроены Docker-контейнеры (микросервисы, БД, Kafka, Elasticsearch, ZooKeeper), что обеспечивает простой запуск всей системы одной командой
- **CI/CD** - автоматизация процессов сборки и тестирования при каждом push/merge в master с использованием GitHub Actions
- **Переменные окружения** - конфигурация подключений к БД, Kafka, Elasticsearch, ZooKeeper и портов через environment variables
  
