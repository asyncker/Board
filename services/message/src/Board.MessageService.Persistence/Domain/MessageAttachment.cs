namespace Board.MessageService.Persistence.Domain;

/// <summary>
/// Прикреплённые файлы сообщения
/// </summary>
public class MessageAttachment
{
    /// <summary>
    /// Уникальный идентификатор вложений
    /// </summary>
    public Guid Id { get; set; } = Guid.NewGuid();

    /// <summary>
    /// Ссылка на файл
    /// </summary>
    public string Url { get; set; }

    /// <summary>
    /// Порядковый номер файла
    /// </summary>
    public int OrderIndex { get; set; }

    /// <summary>
    /// Ссылка на сообщение
    /// </summary>
    public Guid MessageId { get; set; }
    public Message Message { get; set; }
}