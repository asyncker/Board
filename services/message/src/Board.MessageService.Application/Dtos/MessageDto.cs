namespace Board.MessageService.Application.Dtos;

public class MessageDto
{
    public Guid Id { get; set; }
    public string Text { get; set; }
    public string UserName { get; set; }
    public string UserNameColor { get; set; }
    public string? UserAvatarUrl { get; set; }
    public DateTime CreatedUtcAt { get; set; }
    public IEnumerable<string> Attachments { get; set; } = Enumerable.Empty<string>();
}