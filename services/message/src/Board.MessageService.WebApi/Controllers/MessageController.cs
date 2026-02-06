using Board.MessageService.Application.Dtos;
using Board.MessageService.Application.Service.Interface;
using Board.MessageService.WebApi.Response;
using Microsoft.AspNetCore.Mvc;

namespace Board.MessageService.WebApi.Controllers;

/// <summary>
/// Сервис для создания сообщений
/// </summary>
[ApiController]
[Route("api/v1/message")]
public class MessageController : ControllerBase
{
    private readonly ILogger<MessageController> _logger;
    private readonly IMessageService _messageService;
    public MessageController(ILogger<MessageController> logger,
        IMessageService messageService)
    {
        _logger = logger;
        _messageService = messageService;
    }

    /// <summary>
    /// Создать группу
    /// </summary>
    /// <param name="group"></param>
    /// <returns></returns>
    [HttpPost("createGroup")]
    public async Task<ActionResult> CreateGroup(CreateGroupDto group)
    {
        try
        {
            await _messageService.CreateGroupAsync(group);
            return Ok(new SuccessApiResponse<string>("Group success create"));
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new ErrorApiResponse(ex.ParamName, 400));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error create group");
            return StatusCode(500, new ErrorApiResponse("Error create group", 500));
        }
    }

    /// <summary>
    /// Создать сообщение в группе
    /// </summary>
    /// <param name="message"></param>
    /// <returns></returns>
    [HttpPost("write")]
    public async Task<ActionResult> Write(CreateMessageDto message)
    {
        try
        {
            await _messageService.WriteAsync(message);
            return Ok(new SuccessApiResponse<string>("Message success create"));
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new ErrorApiResponse(ex.Message, 404));
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new ErrorApiResponse(ex.ParamName, 400));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error write message");
            return StatusCode(500, new ErrorApiResponse("Error write message", 500));
        }
    }

    /// <summary>
    /// Получить 100 записей от группы
    /// </summary>
    /// <param name="group"></param>
    /// <param name="page"></param>
    /// <returns></returns>
    [HttpGet("list")]
    public async Task<ActionResult<GroupResultDto>> List(string? group, int? page)
    {
        try
        {
            GroupResultDto result = await _messageService.GetPageAsync(group, page ?? 0);
            return Ok(new SuccessApiResponse<GroupResultDto>(result));
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new ErrorApiResponse(ex.Message, 404));
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new ErrorApiResponse(ex.ParamName, 400));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error list group");
            return StatusCode(500, new ErrorApiResponse("Error list group", 500));
        }
    }

    /// <summary>
    /// Получить текущую страницу от группы
    /// </summary>
    /// <param name="group"></param>
    /// <returns></returns>
    [HttpGet("currentPage")]
    public async Task<ActionResult<int>> CurrentPage(string? group)
    {
        try
        {
            int currentPage = await _messageService.GetCurrentPageAsync(group);
            return Ok(new SuccessApiResponse<int>(currentPage));
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new ErrorApiResponse(ex.Message, 404));
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new ErrorApiResponse(ex.ParamName, 400));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error get current page");
            return StatusCode(500, new ErrorApiResponse("Error get current page", 500));
        }
    }
}