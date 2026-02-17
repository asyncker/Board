using Board.StorageService.Application.Service.Interface;
using Board.StorageService.WebApi.Response;
using Microsoft.AspNetCore.Mvc;

namespace Board.StorageService.WebApi.Controllers;

/// <summary>
/// Сервис для создания файлов
/// </summary>
[ApiController]
[Route("api/v1/files")]
public class FileStorageController : ControllerBase
{
    private readonly ILogger<FileStorageController> _logger;
    private readonly IFileStorage _fileStorage;
    private readonly IHttpContextAccessor _httpContextAccessor;
    public FileStorageController(ILogger<FileStorageController> logger,
        IFileStorage fileStorage,
        IHttpContextAccessor httpContextAccessor)
    {
        _logger = logger;
        _fileStorage = fileStorage;
        _httpContextAccessor = httpContextAccessor;
    }

    /// <summary>
    /// Загрузить файл и получить ссылку
    /// </summary>
    /// <param name="file"></param>
    /// <returns>URL загруженного файла</returns>
    [HttpPost("upload")]
    [Consumes("multipart/form-data")]
    public async Task<ActionResult<string>> UploadFileAsync(IFormFile? file)
    {
        try
        {
            string storageFileName = await _fileStorage.SaveFileAsync(file?.OpenReadStream(), file?.FileName, file?.ContentType);
            var request = _httpContextAccessor.HttpContext?.Request;
            string fileUrl = $"{request?.Scheme}://{request?.Host}{request?.PathBase}/api/v1/files/{storageFileName}";
            return Ok(fileUrl);
        }
        catch (ArgumentNullException ex)
        {
            return BadRequest(new ErrorApiResponse(ex.ParamName, 400));
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new ErrorApiResponse(ex.Message, 400));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error upload file");
            return StatusCode(500, new ErrorApiResponse("Error upload file", 500));
        }
    }

    /// <summary>
    /// Получить файл по названию
    /// </summary>
    /// <param name="fileName"></param>
    /// <returns></returns>
    [HttpGet("{fileName}")]
    public async Task<ActionResult<Stream>> GetFileAsync(string fileName)
    {
        try
        {
            Stream stream = await _fileStorage.GetStreamAsync(fileName);
            return Ok(stream);
        }
        catch (FileNotFoundException ex)
        {
            return NotFound(new ErrorApiResponse(ex.Message, 404));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error get file");
            return StatusCode(500, new ErrorApiResponse("Error get file", 500));
        }
    }
}