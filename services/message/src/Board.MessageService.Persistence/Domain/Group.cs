namespace Board.MessageService.Persistence.Domain;

/// <summary>
/// Группа
/// </summary>
public class Group
{
    /// <summary>
    /// Уникальный идентификатор группы
    /// </summary>
    public long Id { get; set; }

    /// <summary>
    /// Уникальное название группы
    /// </summary>
    public string Name { get; set; }

    /// <summary>
    /// Отображение название группы
    /// </summary>
    public string Title { get; set; }

    /// <summary>
    /// Описание группы
    /// </summary>
    public string Description { get; set; }

    /// <summary>
    /// Автарка группы
    /// </summary>
    public string AvatarUrl { get; set; }

    /// <summary>
    /// Сообщения в группе
    /// </summary>
    public ICollection<Message> Messages { get; set; }
}