namespace Board.MessageService.Application.Dtos;

public class GroupResultDto
{
    public string Name { get; set; }
    public string Title { get; set; }
    public string Description { get; set; }
    public IEnumerable<MessageDto> Messages { get; set; } = Enumerable.Empty<MessageDto>();
}