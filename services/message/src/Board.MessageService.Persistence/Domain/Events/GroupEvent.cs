namespace Board.MessageService.Persistence.Domain.Events;

public class GroupEvent
{
    /// <summary>
    /// Действие для сообщения "GroupCreated"
    /// </summary>
    public string Action { get; set; }
    public DateTime TimestampUtc { get; set; }
    public GroupEventData Data { get; set; }
}