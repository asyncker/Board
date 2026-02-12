namespace Board.MessageService.Application.Dtos;

public class CreateMessageDto
{
    public string Text { get; set; }
    public string GroupName { get; set; }
    public string UserName { get; set; }
    public string UserNameColor { get; set; }
    public string? UserAvatarUrl { get; set; }
    public List<string> Attachments { get; set; } = new List<string>();
}