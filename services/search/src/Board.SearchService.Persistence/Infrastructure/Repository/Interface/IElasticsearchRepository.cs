using Board.SearchService.Persistence.Domain.Search;

namespace Board.SearchService.Persistence.Infrastructure.Repository.Interface;

public interface IElasticsearchRepository
{
    Task<IEnumerable<ElasticGroup>> SearchGroupsAsync(string searchTerm);
    Task CreateGroupAsync(ElasticGroup elasticGroup);
}