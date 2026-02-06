using Microsoft.EntityFrameworkCore;
using Moq;
using System.Text;
using Microsoft.AspNetCore.Hosting;
using Board.StorageService.Persistence.Infrastructure;
using Board.StorageService.Application.Service.Implementation;
using Board.StorageService.Application.Service.Interface;
using Board.StorageService.Persistence.Domain;
using Microsoft.Extensions.Hosting;

namespace Board.StorageService.Application.Tests;

public class LocalFileStorageTests : IDisposable
{
    private readonly List<string> _tempDirectories = new();
    private readonly AppDbContext _context;
    private readonly IFileStorage _localFileStorage;

    public LocalFileStorageTests()
    {
        string tempPath = CreateTempDirectory();
        IHostEnvironment webHostEnvironment = Mock.Of<IHostEnvironment>(x => x.ContentRootPath == tempPath);
        _context = CreateInMemoryDbContext();
        _localFileStorage = new LocalFileStorage(webHostEnvironment, _context);
    }

    private string CreateTempDirectory()
    {
        string tempDir = Path.Combine(Path.GetTempPath(), Guid.NewGuid().ToString());
        Directory.CreateDirectory(tempDir);
        _tempDirectories.Add(tempDir);
        return tempDir;
    }

    private AppDbContext CreateInMemoryDbContext()
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;
        return new AppDbContext(options);
    }

    public void Dispose()
    {
        foreach (string dir in _tempDirectories)
        {
            if (Directory.Exists(dir))
            {
                Directory.Delete(dir, true);
            }
        }
    }

    [Fact]
    public async Task SaveFileAsync_ShouldSaveFileAndReturnStorageFile()
    {
        // Arrange
        MemoryStream fileStream = new MemoryStream(Encoding.UTF8.GetBytes("test content"));
        string fileName = "test.txt";
        string contentType = "text/plain";

        // Act
        string result = await _localFileStorage.SaveFileAsync(fileStream, fileName, contentType);
        FileData fileData = await _context.Files.FirstAsync();

        // Assert
        Assert.False(string.IsNullOrEmpty(result));
        Assert.Single(_context.Files);
        Assert.Equal(fileName, fileData.OriginalFileName);
        Assert.Equal(contentType, fileData.ContentType);
    }

    [Fact]
    public async Task GetStreamAsync_ShouldThrowFileNotFoundException()
    {
        // Arrange
        string nonExistentFile = "nonexistent.txt";

        // Act & Assert
        await Assert.ThrowsAsync<FileNotFoundException>(async () => await _localFileStorage.GetStreamAsync(nonExistentFile));
    }

    [Fact]
    public async Task SaveFileAsync_ShouldGenerateUniqueFileNames()
    {
        // Arrange
        MemoryStream fileStream1 = new MemoryStream(Encoding.UTF8.GetBytes("content1"));
        MemoryStream fileStream2 = new MemoryStream(Encoding.UTF8.GetBytes("content2"));

        // Act
        string result1 = await _localFileStorage.SaveFileAsync(fileStream1, "test.txt", "text/plain");
        string result2 = await _localFileStorage.SaveFileAsync(fileStream2, "test.txt", "text/plain");
        List<FileData> files = await _context.Files.ToListAsync();

        // Assert
        Assert.Equal(2, files.Count);
        Assert.Equal(files[0].OriginalFileName, files[1].OriginalFileName);
        Assert.NotEqual(result1, result2);
        Assert.NotEqual(files[0].StoredFileName, files[1].StoredFileName);
    }

    [Fact]
    public async Task SaveFileAsync_ShouldHandleEmptyStream()
    {
        // Arrange
        MemoryStream emptyStream = new MemoryStream();
        string fileName = "empty.txt";
        string contentType = "text/plain";

        // Act
        string result = await _localFileStorage.SaveFileAsync(emptyStream, fileName, contentType);
        FileData savedFile = await _context.Files.FirstAsync();

        // Assert
        Assert.NotNull(result);
        Assert.Equal(0, savedFile.SizeInBytes);
        Assert.Equal(fileName, savedFile.OriginalFileName);
    }

    [Fact]
    public async Task SaveFileAsync_ShouldThrowArgumentNullException_WhenStreamIsNull()
    {
        // Arrange
        string fileName = "test.txt";
        string contentType = "text/plain";

        // Act & Assert
        await Assert.ThrowsAsync<ArgumentNullException>(() => _localFileStorage.SaveFileAsync(null!, fileName, contentType));
    }

    [Fact]
    public async Task GetStreamAsync_ShouldReturnValidFileStream_WhenFileExists()
    {
        // Arrange
        string fileName = "test.txt";
        string contentType = "text/plain";
        string testFileContent = "test file content";
        MemoryStream originalContent = new MemoryStream(Encoding.UTF8.GetBytes(testFileContent));
        string storedFileName = await _localFileStorage.SaveFileAsync(originalContent, fileName, contentType);

        // Act
        Stream resultStream = await _localFileStorage.GetStreamAsync(storedFileName);
        using StreamReader reader = new StreamReader(resultStream);
        string resultContent = await reader.ReadToEndAsync();

        // Assert
        Assert.Equal(testFileContent, resultContent);
    }
}