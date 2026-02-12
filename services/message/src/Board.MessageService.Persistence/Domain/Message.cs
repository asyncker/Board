namespace Board.MessageService.Persistence.Domain;

/// <summary>
/// Сообщения пользователя
/// </summary>
public class Message
{
    /// <summary>
    /// Уникальный идентификатор сообщения
    /// </summary>
    public Guid Id { get; set; } = Guid.NewGuid();

    /// <summary>
    /// Логин пользователя
    /// </summary>
    public string UserName { get; set; }

    /// <summary>
    /// Цвет логина пользователя
    /// </summary>
    public string UserNameColor { get; set; }

    /// <summary>
    /// Ссылка на аватарку пользователя
    /// </summary>
    public string UserAvatarUrl { get; set; }

    /// <summary>
    /// Текст сообщения
    /// </summary>
    public string Text { get; set; }

    /// <summary>
    /// Дата создания сообщения
    /// </summary>
    public DateTime CreatedUtcAt { get; set; } = DateTime.UtcNow;

    /// <summary>
    /// Идентификатор группы
    /// </summary>
    public long GroupId { get; set; }

    /// <summary>
    /// Группа в которой написанно сообщение
    /// </summary>
    public Group Group { get; set; }

    /// <summary>
    /// Список файлов
    /// </summary>
    public List<MessageAttachment> Attachments { get; set; } = new();
}