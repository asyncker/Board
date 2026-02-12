namespace Board.StorageService.Persistence.Domain;

/// <summary>
/// Данные файла
/// </summary>
public class FileData
{
    /// <summary>
    /// Уникальный идентификатор файла
    /// </summary>
    public Guid Id { get; set; } = Guid.NewGuid();

    /// <summary>
    /// Оригинальное название файла
    /// </summary>
    public string OriginalFileName { get; set; } = string.Empty;

    /// <summary>
    /// Название файла в системе хранения
    /// </summary>
    public string StoredFileName { get; set; } = string.Empty;

    /// <summary>
    /// URL для доступа к файлу
    /// </summary>
    public string Url { get; set; } = string.Empty;

    /// <summary>
    /// MIME-тип содержимого файла
    /// </summary>
    public string ContentType { get; set; } = string.Empty;

    /// <summary>
    /// Дата и время загрузки файла в формате UTC
    /// </summary>
    public DateTime UploadedUtcAt { get; set; } = DateTime.UtcNow;

    /// <summary>
    /// Размер файла в байтах
    /// </summary>
    public long SizeInBytes { get; set; }

    /// <summary>
    /// Флаг удаления файла (мягкое удаление)
    /// </summary>
    public bool IsDelete { get; set; } = false;
}