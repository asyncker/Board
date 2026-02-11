using Board.SearchService.Application.Dtos;

namespace Board.SearchService.Application.Service.Interface;

public interface ISearchService
{
    Task<IEnumerable<GroupDto>> SearchGroupsAsync(string searchTerm);
    Task CreateGroupAsync(CreateGroupDto groupDto);
}