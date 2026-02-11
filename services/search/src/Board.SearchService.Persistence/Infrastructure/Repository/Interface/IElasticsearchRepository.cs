using Board.SearchService.Persistence.Domain.Search;

namespace Board.SearchService.Persistence.Infrastructure.Repository.Interface;

/// <summary>
/// Репозиторий для выполнения поисковых операций в Elasticsearch
/// </summary>
public interface IElasticsearchRepository
{
    /// <summary>
    /// Поиск групп по названию или титулу с использованием поиска
    /// </summary>
    /// <param name="searchTerm"></param>
    /// <returns></returns>
    Task<IEnumerable<ElasticGroup>> SearchGroupsAsync(string searchTerm);

    /// <summary>
    /// Создаёт или обновляет групповой документ в индексе Elasticsearch
    /// </summary>
    /// <param name="elasticGroup"></param>
    /// <returns></returns>
    Task CreateOrUpdateGroupAsync(ElasticGroup elasticGroup);
}