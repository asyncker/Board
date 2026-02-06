using Board.MessageService.Application.Dtos;

namespace Board.MessageService.Application.Service.Interface;

/// <summary>
/// Сервис по написанию и чтению сообщений и групп
/// </summary>
public interface IMessageService
{
    /// <summary>
    /// Написать сообщение
    /// </summary>
    /// <param name="createMessageDto"></param>
    /// <returns></returns>
    Task WriteAsync(CreateMessageDto createMessageDto);

    /// <summary>
    /// Берёт по 100 записей с пагинацей и выдаёт сообщения
    /// </summary>
    /// <param name="groupName"></param>
    /// <param name="page"></param>
    /// <returns></returns>
    Task<GroupResultDto> GetPageAsync(string groupName, int page);

    /// <summary>
    /// Даёт текущий актуальный номер страницы
    /// </summary>
    /// <param name="groupName"></param>
    /// <returns></returns>
    Task<int> GetCurrentPageAsync(string groupName);

    /// <summary>
    /// Создать группу
    /// </summary>
    /// <param name="groupDto"></param>
    /// <returns></returns>
    Task CreateGroupAsync(CreateGroupDto groupDto);
}