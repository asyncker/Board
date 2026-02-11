namespace Board.SearchService.Persistence.Domain.Events;

public class GroupEvent
{
    public string Action { get; set; }
    public DateTime TimestampUtc { get; set; }
    public GroupEventData Data { get; set; }
}