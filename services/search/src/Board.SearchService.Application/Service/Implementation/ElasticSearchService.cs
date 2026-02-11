using Board.SearchService.Application.Dtos;
using Board.SearchService.Application.Service.Interface;
using Board.SearchService.Persistence.Infrastructure.Repository.Interface;
using Board.SearchService.Persistence.Domain.Search;

namespace Board.SearchService.Application.Service.Implementation;

public class ElasticSearchService : ISearchService
{
    private readonly IElasticsearchRepository _elasticRepository;
    public ElasticSearchService(IElasticsearchRepository elasticRepository)
    {
        _elasticRepository = elasticRepository;
    }

    public async Task<IEnumerable<GroupDto>> SearchGroupsAsync(string searchTerm)
    {
        IEnumerable<ElasticGroup> groups = await _elasticRepository.SearchGroupsAsync(searchTerm);
        return groups.Select(x => new GroupDto()
        {
            Id = x.Id,
            Description = x.Description,
            Name = x.Name,
            Title = x.Title,
            AvatarUrl = x.AvatarUrl
        });
    }

    public async Task CreateGroupAsync(CreateGroupDto groupDto)
    {
        ElasticGroup elasticGroup = new()
        {
            Id = groupDto.Id,
            Name = groupDto.Name,
            Title = groupDto.Title,
            Description = groupDto.Description,
            AvatarUrl = groupDto.AvatarUrl
        };
        await _elasticRepository.CreateGroupAsync(elasticGroup);
    }
}
