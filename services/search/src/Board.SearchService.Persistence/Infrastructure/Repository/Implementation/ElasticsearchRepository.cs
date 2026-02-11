using Board.SearchService.Persistence.Domain.Search;
using Board.SearchService.Persistence.Infrastructure.Repository.Interface;
using Elastic.Clients.Elasticsearch;
using Elastic.Transport.Products.Elasticsearch;

namespace Board.SearchService.Persistence.Infrastructure.Repository.Implementation;

public class ElasticsearchRepository : IElasticsearchRepository
{
    private readonly ElasticsearchClient _elasticClient;
    public ElasticsearchRepository(ElasticsearchClient elasticClient)
    {
        _elasticClient = elasticClient;
    }

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

    public async Task CreateGroupAsync(ElasticGroup elasticGroup)
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