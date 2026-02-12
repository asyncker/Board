using Board.SearchService.Application.Dtos;
using Board.SearchService.Application.Service.Interface;
using Board.SearchService.WebApi.Response;
using Microsoft.AspNetCore.Mvc;

namespace Board.SearchService.WebApi.Controllers;

[ApiController]
[Route("api/v1/search")]
public class SearchController : ControllerBase
{
    private readonly ILogger<SearchController> _logger;
    private readonly ISearchService _searchService;
    public SearchController(ILogger<SearchController> logger,
        ISearchService searchService)
    {
        _logger = logger;
        _searchService = searchService;
    }

    /// <summary>
    /// Поиск по группе
    /// </summary>
    /// <param name="terms"></param>
    /// <returns></returns>
    [HttpGet("group")]
    public async Task<ActionResult> Group(string? terms)
    {
        try
        {
            IEnumerable<GroupDto> groups = await _searchService.SearchGroupsAsync(terms ?? string.Empty);
            return Ok(new SuccessApiResponse<IEnumerable<GroupDto>>(groups));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error search group");
            return StatusCode(500, new ErrorApiResponse("Error search group", 500));
        }
    }
}