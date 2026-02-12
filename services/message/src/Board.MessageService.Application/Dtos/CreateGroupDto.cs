namespace Board.MessageService.Application.Dtos;

public class CreateGroupDto
{
    public string Name { get; set; }
    public string Title { get; set; }
    public string Description { get; set; }
    public string AvatarUrl { get; set; }
}