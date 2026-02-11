using Board.SearchService.Application.Dtos;

namespace Board.SearchService.Application.Service.Interface;

/// <summary>
/// Интерфейс для поиска
/// </summary>
public interface ISearchService
{
    /// <summary>
    /// Поиск групп по name, title
    /// </summary>
    /// <param name="searchTerm"></param>
    /// <returns></returns>
    Task<IEnumerable<GroupDto>> SearchGroupsAsync(string searchTerm);

    /// <summary>
    /// Создает или обновляет группу
    /// </summary>
    /// <param name="groupDto"></param>
    /// <returns></returns>
    Task CreateOrUpdateGroupAsync(CreateOrUpdateGroupDto groupDto);
}