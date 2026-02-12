namespace Board.SearchService.Application.Dtos;

public class MessageDto
{
    public Guid Id { get; set; }
    public long GroupId { get; set; }
    public long GroupMessageIndex { get; set; }
    public string UserName { get; set; }
    public string UserNameColor { get; set; }
    public string UserAvatarUrl { get; set; }
    public string Text { get; set; }
    public DateTime CreatedUtcAt { get; set; }
}