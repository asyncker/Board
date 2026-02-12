using Board.IdentityService.Application.Dtos;
using Board.IdentityService.Application.Service.Interface;
using Board.IdentityService.Persistence.Domain;
using Board.IdentityService.WebApi.Response;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.IdentityModel.Tokens;
using System.Security.Claims;

namespace Board.IdentityService.WebApi.Controllers;

[ApiController]
[Route("api/v1/auth")]
public class AuthController : ControllerBase
{
    private readonly ILogger<AuthController> _logger;
    private readonly IUserService _userService;
    private readonly ITokenService _tokenService;
    private readonly IConfiguration _configuration;
    public AuthController(ILogger<AuthController> logger,
        IUserService userService,
        ITokenService tokenService,
        IConfiguration configuration)
    {
        _logger = logger;
        _userService = userService;
        _tokenService = tokenService;
        _configuration = configuration;
    }

    [HttpPost("register")]
    public async Task<IActionResult> Register([FromBody] UserRegisterRequestDto request)
    {
        try
        {
            User user = await _userService.CreateUserAsync(request.UserName, request.Password, request.Email);
            TokenDto token = await _tokenService.GenerateTokenAsync(user, _configuration["Jwt:Secret"], int.Parse(_configuration["Jwt:ExpiresMinutes"]));
            return Ok(new SuccessApiResponse<TokenDto>(token));
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new ErrorApiResponse(ex.Message, 400));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Registration failed");
            return StatusCode(500, new ErrorApiResponse("Registration failed", 500));
        }
    }

    [HttpPost("login")]
    public async Task<IActionResult> Login([FromBody] UserLoginRequestDto request)
    {
        try
        {
            User user = await _userService.AuthenticateAsync(request.UserName, request.Password);
            if (user == null)
            {
                return Unauthorized(new ErrorApiResponse("Invalid credentials", 401));
            }
            TokenDto token = await _tokenService.GenerateTokenAsync(user, _configuration["Jwt:Secret"], int.Parse(_configuration["Jwt:ExpiresMinutes"]));
            return Ok(new SuccessApiResponse<TokenDto>(token));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Login failed");
            return StatusCode(500, new ErrorApiResponse("Login failed", 500));
        }
    }

    [HttpPost("refresh")]
    public async Task<IActionResult> Refresh([FromBody] RefreshTokenRequestDto request)
    {
        try
        {
            ClaimsPrincipal principal = _tokenService.GetPrincipalFromExpiredToken(request.Token, _configuration["Jwt:Secret"]);
            string userId = principal.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userId))
            {
                return BadRequest(new ErrorApiResponse("Invalid token", 400));
            }
            bool isValidRefreshToken = await _tokenService.ValidateRefreshTokenAsync(userId, request.RefreshToken);
            if (!isValidRefreshToken)
            {
                return BadRequest(new ErrorApiResponse("Invalid refresh token", 400));
            }
            User user = await _userService.GetUserByIdAsync(userId);
            if (user == null)
            {
                return NotFound(new ErrorApiResponse("User not found", 404));
            }
            TokenDto token = await _tokenService.GenerateTokenAsync(user, _configuration["Jwt:Secret"], int.Parse(_configuration["Jwt:ExpiresMinutes"]));
            return Ok(new SuccessApiResponse<TokenDto>(token));
        }
        catch (SecurityTokenException ex)
        {
            return BadRequest(new ErrorApiResponse("Invalid token", 400));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Token refresh failed");
            return StatusCode(500, new ErrorApiResponse("Token refresh failed", 500));
        }
    }

    [HttpPost("validate")]
    [AllowAnonymous]
    public IActionResult ValidateToken([FromBody] ValidateTokenRequestDto request)
    {
        try
        {
            ValidateTokenDto validateTokenDto = _tokenService.ValidateToken(request.Token, _configuration["Jwt:Secret"]);
            return Ok(new SuccessApiResponse<ValidateTokenDto>(validateTokenDto));
        }
        catch (Exception ex)
        {
            return Ok(new SuccessApiResponse<object>(new { IsValid = false }));
        }
    }

    [HttpPost("logout")]
    [Authorize]
    public async Task<IActionResult> Logout()
    {
        try
        {
            string userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (!string.IsNullOrEmpty(userId))
            {
                await _tokenService.RevokeRefreshTokensAsync(userId);
            }
            return Ok(new SuccessApiResponse<string>("Logged out successfully"));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Logout failed");
            return StatusCode(500, new ErrorApiResponse("Logout failed", 500));
        }
    }
}