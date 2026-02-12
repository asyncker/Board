using Board.SearchService.Persistence.Domain.Search;
using Board.SearchService.Persistence.Infrastructure.Repository.Interface;
using Elastic.Clients.Elasticsearch;
using Elastic.Transport.Products.Elasticsearch;

namespace Board.SearchService.Persistence.Infrastructure.Repository.Implementation;

/// <summary>
/// Репозиторий для выполнения поисковых операций в Elasticsearch
/// </summary>
public class ElasticsearchRepository : IElasticsearchRepository
{
    private readonly ElasticsearchClient _elasticClient;
    public ElasticsearchRepository(ElasticsearchClient elasticClient)
    {
        _elasticClient = elasticClient;
    }

    /// <summary>
    /// Поиск групп по названию или титулу с использованием поиска
    /// </summary>
    /// <param name="searchTerm"></param>
    /// <returns></returns>
    public async Task<IEnumerable<ElasticGroup>> SearchGroupsAsync(string searchTerm)
    {
        SearchResponse<ElasticGroup> response = await _elasticClient.SearchAsync<ElasticGroup>(s => s
            .Index("groups")
            .Query(q => q
                .Bool(b => b
                    .Should(
                        sh => sh.Wildcard(w => w
                            .Field("name")
                            .Value($"*{searchTerm}*")
                            .CaseInsensitive(true)
                        ),
                        sh => sh.Wildcard(w => w
                            .Field("title")
                            .Value($"*{searchTerm}*")
                            .CaseInsensitive(true)
                        )
                    )
                )
            )
            .Size(100)
        );
        if (response.IsValidResponse && response.Documents != null)
        {
            return response.Documents;
        }
        return Enumerable.Empty<ElasticGroup>();
    }

    /// <summary>
    /// Создаёт или обновляет групповой документ в индексе Elasticsearch
    /// </summary>
    /// <param name="elasticGroup"></param>
    /// <returns></returns>
    /// <exception cref="Exception"></exception>
    public async Task CreateOrUpdateGroupAsync(ElasticGroup elasticGroup)
    {
        IndexResponse response = await _elasticClient.IndexAsync(
            elasticGroup,
            index: "groups",
            id: elasticGroup.Id
        );
        if (!response.IsValidResponse)
        {
            ElasticsearchServerError? error = response.ElasticsearchServerError;
            throw new Exception($"Status: {error?.Status} Error Type: {error?.Error?.Type} Error Reason: {error?.Error?.Reason}");
        }
    }
}