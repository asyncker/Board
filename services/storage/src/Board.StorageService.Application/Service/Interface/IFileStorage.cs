namespace Board.StorageService.Application.Service.Interface;

/// <summary>
/// Интерфейс для сохранения файла
/// </summary>
public interface IFileStorage
{
    /// <summary>
    /// Сохранение файла возврощает название файла
    /// </summary>
    /// <param name="fileStream"></param>
    /// <param name="fileName"></param>
    /// <param name="contentType"></param>
    /// <returns></returns>
    Task<string> SaveFileAsync(Stream fileStream, string fileName, string contentType);

    /// <summary>
    /// Скачивание файла по названию Stream 
    /// </summary>
    /// <param name="storadeFileName"></param>
    /// <returns></returns>
    /// <exception cref="FileNotFoundException"></exception>
    Task<Stream> GetStreamAsync(string storadeFileName);
}