namespace Board.SearchService.Persistence.Domain.Events;

public class GroupEventData
{
    public long GroupId { get; set; }
    public string Name { get; set; }
    public string Title { get; set; }
    public string Description { get; set; }
    public string AvatarUrl { get; set; }
}