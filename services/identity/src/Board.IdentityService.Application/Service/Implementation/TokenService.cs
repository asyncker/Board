using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using Microsoft.IdentityModel.Tokens;
using Microsoft.EntityFrameworkCore;
using Board.IdentityService.Application.Service.Interface;
using Board.IdentityService.Persistence.Infrastructure;
using Board.IdentityService.Application.Dtos;
using Board.IdentityService.Persistence.Domain;

namespace Board.IdentityService.Application.Service.Implementation;

public class TokenService : ITokenService
{
    private readonly AppDbContext _context;
    private readonly TimeSpan _refreshTokenExpiry = TimeSpan.FromDays(7);
    public TokenService(AppDbContext context)
    {
        _context = context;
    }

    public async Task<TokenDto> GenerateTokenAsync(User user, string jwtSecret, int expiresMinutes)
    {
        string token = GenerateJwtToken(user, jwtSecret, expiresMinutes);
        string refreshToken = GenerateRefreshToken();
        await RevokeRefreshTokensAsync(user.Id);
        RefreshToken newToken = new()
        {
            Id = Guid.NewGuid().ToString(),
            UserId = user.Id,
            Token = refreshToken,
            Expires = DateTime.UtcNow.Add(_refreshTokenExpiry),
            Created = DateTime.UtcNow,
            IsRevoked = false
        };
        await _context.RefreshTokens.AddAsync(newToken);
        await _context.SaveChangesAsync();
        TokenDto tokenDto = new()
        {
            Token = token,
            RefreshToken = refreshToken,
            ExpiresAt = DateTime.UtcNow.AddMinutes(expiresMinutes),
            User = new UserDto()
            {
                Id = user.Id,
                Email = user.Email,
                UserName = user.UserName,
            }
        };
        return tokenDto;
    }

    public async Task RevokeRefreshTokensAsync(string userId)
    {
        List<RefreshToken> tokens = await _context.RefreshTokens
            .Where(rt => rt.UserId == userId && !rt.IsRevoked)
            .ToListAsync();
        foreach (RefreshToken token in tokens)
        {
            token.IsRevoked = true;
            token.Revoked = DateTime.UtcNow;
        }
        await _context.SaveChangesAsync();
    }

    public async Task<bool> ValidateRefreshTokenAsync(string userId, string refreshToken)
    {
        RefreshToken storedToken = await _context.RefreshTokens.FirstOrDefaultAsync(rt =>
            rt.UserId == userId && rt.Token == refreshToken && !rt.IsRevoked && rt.Expires > DateTime.UtcNow);
        return storedToken != null;
    }

    public ValidateTokenDto ValidateToken(string token, string jwtSecret)
    {
        byte[] key = Encoding.ASCII.GetBytes(jwtSecret);
        JwtSecurityTokenHandler tokenHandler = new();
        TokenValidationParameters validationParameters = new()
        {
            ValidateIssuer = false,
            ValidateAudience = false,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            IssuerSigningKey = new SymmetricSecurityKey(key),
            ClockSkew = TimeSpan.Zero
        };
        ClaimsPrincipal principal = tokenHandler.ValidateToken(token, validationParameters, out var validatedToken);
        JwtSecurityToken jwtToken = (JwtSecurityToken)validatedToken;
        string userId = principal.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        string email = principal.FindFirst(ClaimTypes.Email)?.Value;
        List<string> roles = principal.FindAll(ClaimTypes.Role).Select(c => c.Value).ToList();
        ValidateTokenDto response = new()
        {
            IsValid = true,
            UserId = userId,
            Email = email,
            Roles = roles,
            ExpiresAt = jwtToken.ValidTo
        };
        return response;
    }

    public ClaimsPrincipal GetPrincipalFromExpiredToken(string token, string jwtSecret)
    {
        TokenValidationParameters tokenValidationParameters = new()
        {
            ValidateAudience = false,
            ValidateIssuer = false,
            ValidateLifetime = false,
            ValidateIssuerSigningKey = true,
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtSecret))
        };
        JwtSecurityTokenHandler tokenHandler = new();
        ClaimsPrincipal principal = tokenHandler.ValidateToken(token, tokenValidationParameters, out var securityToken);
        if (securityToken is not JwtSecurityToken jwtSecurityToken || !jwtSecurityToken.Header.Alg.Equals(SecurityAlgorithms.HmacSha256, StringComparison.InvariantCultureIgnoreCase))
        {
            throw new SecurityTokenException("Invalid token");
        }
        return principal;
    }

    private string GenerateRefreshToken()
    {
        byte[] randomNumber = new byte[64];
        using var rng = RandomNumberGenerator.Create();
        rng.GetBytes(randomNumber);
        return Convert.ToBase64String(randomNumber);
    }

    private string GenerateJwtToken(User user, string jwtSecret, int expiresMinutes)
    {
        JwtSecurityTokenHandler tokenHandler = new();
        List<Claim> claims = new()
        {
            new Claim(ClaimTypes.NameIdentifier, user.Id),
            new Claim(ClaimTypes.Email, user.Email),
            new Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString())
        };
        if (user.Roles != null)
        {
            foreach (string role in user.Roles)
            {
                claims.Add(new Claim(ClaimTypes.Role, role));
            }
        }
        byte[] key = Encoding.ASCII.GetBytes(jwtSecret);
        SecurityTokenDescriptor tokenDescriptor = new()
        {
            Subject = new ClaimsIdentity(claims),
            Expires = DateTime.UtcNow.AddMinutes(expiresMinutes),
            SigningCredentials = new SigningCredentials(new SymmetricSecurityKey(key), SecurityAlgorithms.HmacSha256Signature)
        };
        SecurityToken token = tokenHandler.CreateToken(tokenDescriptor);
        return tokenHandler.WriteToken(token);
    }
}