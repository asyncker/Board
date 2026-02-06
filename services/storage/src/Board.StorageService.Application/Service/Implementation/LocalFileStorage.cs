using Board.StorageService.Application.Service.Interface;
using Board.StorageService.Persistence.Domain;
using Board.StorageService.Persistence.Infrastructure;
using Microsoft.Extensions.Hosting;

namespace Board.StorageService.Application.Service.Implementation;

/// <summary>
/// Реализация сохранение файлов локально
/// </summary>
public class LocalFileStorage : IFileStorage
{
    private static readonly string _savePathFolder = Path.Combine("wwwroot", "files");
    private readonly IHostEnvironment _hostEnvironment;
    private readonly AppDbContext _context;
    public LocalFileStorage(IHostEnvironment hostEnvironment,
        AppDbContext context)
    {
        _hostEnvironment = hostEnvironment;
        _context = context;
    }

    /// <summary>
    /// Сохранение файла возврощает название файла
    /// </summary>
    /// <param name="fileStream"></param>
    /// <param name="fileName"></param>
    /// <param name="contentType"></param>
    /// <returns></returns>
    public async Task<string> SaveFileAsync(Stream fileStream, string fileName, string contentType)
    {
        if (fileStream == null)
        {
            throw new ArgumentNullException("File is required");
        }
        if (string.IsNullOrWhiteSpace(fileName))
        {
            throw new ArgumentException("File name cannot be empty", nameof(fileName));
        }
        if (!Directory.Exists(_savePathFolder))
        {
            Directory.CreateDirectory(_savePathFolder);
        }
        Guid fileId = Guid.NewGuid();
        string extension = Path.GetExtension(fileName);
        string storedeFileName = $"{fileId}{extension}";
        string filePath = Path.Combine(_savePathFolder, storedeFileName);
        using (FileStream file = File.Create(filePath))
        {
            await fileStream.CopyToAsync(file);
        }
        await _context.Files.AddAsync(new FileData()
        {
            Id = fileId,
            OriginalFileName = fileName,
            StoredFileName = storedeFileName,
            ContentType = contentType,
            SizeInBytes = fileStream.Length
        });
        await _context.SaveChangesAsync();
        return storedeFileName;
    }

    /// <summary>
    /// Получение Stream файла по названию файла
    /// </summary>
    /// <param name="storadeFileName"></param>
    /// <returns></returns>
    public async Task<Stream> GetStreamAsync(string storadeFileName)
    {
        string filePath = Path.Combine(_savePathFolder, storadeFileName);
        if (!File.Exists(filePath))
        {
            throw new FileNotFoundException($"File {storadeFileName} not found");
        }
        return File.OpenRead(filePath);
    }
}