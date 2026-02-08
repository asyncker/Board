using Board.IdentityService.Application.Dtos;
using Board.IdentityService.Persistence.Domain;
using System.Security.Claims;

namespace Board.IdentityService.Application.Service.Interface;

public interface ITokenService
{
    Task<TokenDto> GenerateTokenAsync(User user, string jwtSecret, int expiresMinutes);
    ClaimsPrincipal GetPrincipalFromExpiredToken(string token, string jwtSecret);
    ValidateTokenDto ValidateToken(string token, string jwtSecret);
    Task<bool> ValidateRefreshTokenAsync(string userId, string refreshToken);
    Task RevokeRefreshTokensAsync(string userId);
}