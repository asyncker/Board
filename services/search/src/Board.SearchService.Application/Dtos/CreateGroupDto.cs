namespace Board.SearchService.Application.Dtos;

public class CreateGroupDto
{
    public long Id { get; set; }
    public string Name { get; set; }
    public string Title { get; set; }
    public string Description { get; set; }
    public string AvatarUrl { get; set; }
}