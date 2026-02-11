using Board.MessageService.Persistence.Domain;
using Board.MessageService.Persistence.Infrastructure;
using Board.MessageService.Application.Service.Interface;
using Board.MessageService.Application.Dtos;
using Microsoft.EntityFrameworkCore;

namespace Board.MessageService.Application.Service.Implementation;

/// <summary>
/// Сервис по чтению и записи сообщений
/// </summary>
public class MessageService : IMessageService
{
    private readonly AppDbContext _context;
    public MessageService(AppDbContext context)
    {
        _context = context;
    }

    /// <summary>
    /// Написать сообщение
    /// </summary>
    /// <param name="createMessageDto"></param>
    /// <returns></returns>
    public async Task WriteAsync(CreateMessageDto createMessageDto)
    {
        if (string.IsNullOrEmpty(createMessageDto?.GroupName))
        {
            throw new ArgumentException("Group name cannot be null or empty");
        }
        Group group = await _context.Groups.FirstOrDefaultAsync(x => x.Name == createMessageDto.GroupName);
        if (group == null)
        {
            throw new KeyNotFoundException("Group/page not found");
        }
        Message message = new()
        {
            Text = createMessageDto.Text,
            GroupId = group.Id,
            UserName = createMessageDto.UserName,
            UserNameColor = createMessageDto.UserNameColor,
            UserAvatarUrl = createMessageDto.UserAvatarUrl
        };
        await _context.Messages.AddAsync(message);
        List<MessageAttachment> messageAttachments = new();
        for (int index = 0; index < createMessageDto.Attachments.Count(); index++)
        {
            messageAttachments.Add(new MessageAttachment()
            {
                MessageId = message.Id,
                Url = createMessageDto.Attachments[index],
                OrderIndex = index
            });
        }
        await _context.MessagesAttachments.AddRangeAsync(messageAttachments);
        await _context.SaveChangesAsync();
    }

    /// <summary>
    /// Берёт по 100 записей с пагинацей и выдаёт сообщения
    /// </summary>
    /// <param name="groupName"></param>
    /// <param name="page"></param>
    /// <returns></returns>
    public async Task<GroupResultDto> GetPageAsync(string groupName, int page)
    {
        if (string.IsNullOrEmpty(groupName))
        {
            throw new ArgumentException("Group name cannot be null or empty");
        }
        Group group = await _context.Groups
            .AsNoTracking()
            .FirstOrDefaultAsync(x => x.Name == groupName);
        if (group == null)
        {
            throw new KeyNotFoundException("Group/page not found");
        }
        List<Message> messages = await _context.Messages
            .AsNoTracking()
            .Where(x => x.GroupId == group.Id)
            .OrderBy(x => x.Id)
            .Include(x => x.Attachments)
            .Skip(page * 100)
            .Take(100)
            .ToListAsync();
        GroupResultDto groupResultDto = new()
        {
            Name = groupName,
            Title = group.Title,
            Description = group.Description,
            Messages = messages.Select(message => new MessageDto()
            {
                Id = message.Id,
                Text = message.Text,
                UserAvatarUrl = message.UserAvatarUrl,
                UserName = message.UserName,
                UserNameColor = message.UserNameColor,
                Attachments = message.Attachments.Select(x => x.Url).ToList()
            }).ToList()
        };
        return groupResultDto;
    }

    /// <summary>
    /// Даёт текущий актуальный номер страницы
    /// </summary>
    /// <param name="groupName"></param>
    /// <returns></returns>
    public async Task<int> GetCurrentPageAsync(string groupName)
    {
        if (string.IsNullOrEmpty(groupName))
        {
            throw new ArgumentException("Group name cannot be null or empty");
        }
        Group group = await _context.Groups
            .AsNoTracking()
            .FirstOrDefaultAsync(x => x.Name == groupName);
        if (group == null)
        {
            throw new KeyNotFoundException("Group/page not found");
        }
        int countMessage = await _context.Messages
            .AsNoTracking()
            .Where(x => x.GroupId == group.Id)
            .CountAsync();
        return countMessage / 100;
    }

    /// <summary>
    /// Создать группу
    /// </summary>
    /// <param name="groupDto"></param>
    /// <returns></returns>
    public async Task<long> CreateGroupAsync(CreateGroupDto groupDto)
    {
        if (string.IsNullOrEmpty(groupDto?.Name))
        {
            throw new ArgumentException("Group name cannot be null or empty");
        }
        if (!System.Text.RegularExpressions.Regex.IsMatch(groupDto.Name, @"^[a-zA-Z0-9_]+$"))
        {
            throw new ArgumentException("Only English group name");
        }
        Group group = await _context.Groups
            .AsNoTracking()
            .FirstOrDefaultAsync(x => x.Name == groupDto.Name);
        if (group != null)
        {
            throw new ArgumentException("Group is exist");
        }
        Group newGroup = new()
        {
            Name = groupDto.Name,
            Description = groupDto.Description,
            AvatarUrl = groupDto.AvatarUrl,
            Title = groupDto.Title
        };
        await _context.Groups.AddAsync(newGroup);
        await _context.SaveChangesAsync();
        return newGroup.Id;
    }
}