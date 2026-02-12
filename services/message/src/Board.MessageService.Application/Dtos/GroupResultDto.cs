namespace Board.MessageService.Application.Dtos;

public class GroupResultDto
{
    public string Name { get; set; }
    public string Title { get; set; }
    public string Description { get; set; }
    public List<MessageDto> Messages { get; set; } = new();
}