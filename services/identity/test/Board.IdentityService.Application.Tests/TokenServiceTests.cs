using System.Text;
using System.Security.Claims;
using System.IdentityModel.Tokens.Jwt;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Moq;
using Board.IdentityService.Application.Dtos;
using Board.IdentityService.Persistence.Domain;
using Board.IdentityService.Persistence.Infrastructure;
using Board.IdentityService.Application.Service.Interface;
using Board.IdentityService.Application.Service.Implementation;

namespace Board.IdentityService.Application.Tests;

public class TokenServiceTests : IDisposable
{
    private readonly AppDbContext _context;
    private readonly ITokenService _tokenService;
    private readonly string _jwtSecret = "test-secret-key-that-is-long-enough-for-hmacsha256";
    private readonly int _jwtExpiresMinutes = 30;
    public TokenServiceTests()
    {
        _context = CreateInMemoryDbContext();
        _tokenService = new TokenService(_context);
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
        _context.Database.EnsureDeleted();
        _context.Dispose();
    }

    [Fact]
    public async Task GenerateTokenAsync_ValidUser_ReturnsTokenDto()
    {
        // Arrange
        User user = new()
        {
            Id = "user-123",
            Email = "test@example.com",
            UserName = "testuser",
            Roles = new List<string> { "User" }
        };

        // Act
        int initialCount = await _context.RefreshTokens.CountAsync();
        TokenDto result = await _tokenService.GenerateTokenAsync(user, _jwtSecret, _jwtExpiresMinutes);
        int finalCount = await _context.RefreshTokens.CountAsync();

        // Assert
        Assert.NotNull(result);
        Assert.NotNull(result.Token);
        Assert.NotNull(result.RefreshToken);
        Assert.Equal(user.Id, result.User.Id);
        Assert.Equal(user.Email, result.User.Email);
        Assert.Equal(user.UserName, result.User.UserName);
        Assert.True(result.ExpiresAt > DateTime.UtcNow);
        Assert.Equal(initialCount + 1, finalCount);
    }

    [Fact]
    public async Task GenerateTokenAsync_RevokesExistingTokens()
    {
        // Arrange
        string userId = "user-123";
        RefreshToken existingToken = new()
        {
            Id = "existing-token",
            UserId = userId,
            Token = "old-refresh-token",
            IsRevoked = false,
            Expires = DateTime.UtcNow.AddDays(1)
        };
        User user = new()
        {
            Id = userId,
            Email = "test@example.com",
            UserName = "testuser"
        };

        // Act
        await _context.RefreshTokens.AddAsync(existingToken);
        await _context.SaveChangesAsync();
        await _tokenService.GenerateTokenAsync(user, _jwtSecret, _jwtExpiresMinutes);
        RefreshToken updatedToken = await _context.RefreshTokens.FindAsync(existingToken.Id);

        // Assert
        Assert.True(updatedToken.IsRevoked);
        Assert.NotNull(updatedToken.Revoked);
    }

    [Fact]
    public async Task ValidateRefreshTokenAsync_ValidToken_ReturnsTrue()
    {
        // Arrange
        string userId = "user-123";
        string refreshToken = "valid-refresh-token";
        RefreshToken storedToken = new()
        {
            Id = "token-1",
            UserId = userId,
            Token = refreshToken,
            IsRevoked = false,
            Expires = DateTime.UtcNow.AddDays(1)
        };

        // Act
        await _context.RefreshTokens.AddAsync(storedToken);
        await _context.SaveChangesAsync();
        bool result = await _tokenService.ValidateRefreshTokenAsync(userId, refreshToken);

        // Assert
        Assert.True(result);
    }

    [Fact]
    public async Task ValidateRefreshTokenAsync_ExpiredToken_ReturnsFalse()
    {
        // Arrange
        string userId = "user-123";
        string refreshToken = "expired-token";
        RefreshToken storedToken = new()
        {
            Id = "token-1",
            UserId = userId,
            Token = refreshToken,
            IsRevoked = false,
            Expires = DateTime.UtcNow.AddDays(-1)
        };

        // Act
        await _context.RefreshTokens.AddAsync(storedToken);
        await _context.SaveChangesAsync();
        bool result = await _tokenService.ValidateRefreshTokenAsync(userId, refreshToken);
        
        // Assert
        Assert.False(result);
    }

    [Fact]
    public async Task ValidateRefreshTokenAsync_RevokedToken_ReturnsFalse()
    {
        // Arrange
        string userId = "user-123";
        string refreshToken = "revoked-token";
        RefreshToken storedToken = new()
        {
            Id = "token-1",
            UserId = userId,
            Token = refreshToken,
            IsRevoked = true,
            Expires = DateTime.UtcNow.AddDays(1)
        };

        // Act
        await _context.RefreshTokens.AddAsync(storedToken);
        await _context.SaveChangesAsync();
        bool result = await _tokenService.ValidateRefreshTokenAsync(userId, refreshToken);

        // Assert
        Assert.False(result);
    }

    [Fact]
    public async Task ValidateToken_ValidToken_ReturnsValidateTokenDto()
    {
        // Arrange
        User user = new()
        {
            Id = "user-123",
            Email = "test@example.com",
            Roles = new List<string> { "User", "Admin" }
        };

        // Act
        TokenDto token = await _tokenService.GenerateTokenAsync(user, _jwtSecret, _jwtExpiresMinutes);
        ValidateTokenDto result = _tokenService.ValidateToken(token.Token, _jwtSecret);

        // Assert
        Assert.NotNull(result);
        Assert.True(result.IsValid);
        Assert.Equal(user.Id, result.UserId);
        Assert.Equal(user.Email, result.Email);
        Assert.Equal(2, result.Roles.Count);
        Assert.Contains("User", result.Roles);
        Assert.Contains("Admin", result.Roles);
        Assert.True(result.ExpiresAt > DateTime.UtcNow);
    }

    [Fact]
    public void ValidateToken_InvalidToken_ThrowsSecurityTokenException()
    {
        // Arrange
        string invalidToken = "invalid.jwt.token";

        // Act & Assert
        Assert.ThrowsAny<Exception>(() => _tokenService.ValidateToken(invalidToken, _jwtSecret));
    }

    [Fact]
    public void GetPrincipalFromExpiredToken_ValidExpiredToken_ReturnsClaimsPrincipal()
    {
        // Arrange
        User user = new()
        {
            Id = "user-123",
            Email = "test@example.com",
            Roles = new List<string> { "User" }
        };
        JwtSecurityTokenHandler tokenHandler = new();
        byte[] key = Encoding.ASCII.GetBytes(_jwtSecret);
        List<Claim> claims = new()
        {
            new Claim(ClaimTypes.NameIdentifier, user.Id),
            new Claim(ClaimTypes.Email, user.Email)
        };
        SecurityTokenDescriptor tokenDescriptor = new()
        {
            Subject = new ClaimsIdentity(claims),
            Expires = DateTime.UtcNow.AddMinutes(1),
            SigningCredentials = new SigningCredentials(new SymmetricSecurityKey(key), SecurityAlgorithms.HmacSha256Signature)
        };

        // Act
        SecurityToken expiredToken = tokenHandler.CreateToken(tokenDescriptor);
        string tokenString = tokenHandler.WriteToken(expiredToken);
        ClaimsPrincipal principal = _tokenService.GetPrincipalFromExpiredToken(tokenString, _jwtSecret);
        string userIdClaim = principal.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        string emailClaim = principal.FindFirst(ClaimTypes.Email)?.Value;

        // Assert
        Assert.NotNull(principal);
        Assert.Equal(user.Id, userIdClaim);
        Assert.Equal(user.Email, emailClaim);
    }

    [Fact]
    public async Task RevokeRefreshTokensAsync_ValidUserId_RevokesAllTokens()
    {
        // Arrange
        string userId = "user-123";
        List<RefreshToken> tokens = new()
        {
            new RefreshToken { Id = "1", UserId = userId, IsRevoked = false, Token = "" },
            new RefreshToken { Id = "2", UserId = userId, IsRevoked = false, Token = "" },
            new RefreshToken { Id = "3", UserId = "other-user", IsRevoked = false, Token = "" }
        };

        // Act
        await _context.RefreshTokens.AddRangeAsync(tokens);
        await _context.SaveChangesAsync();
        await _tokenService.RevokeRefreshTokensAsync(userId);
        List<RefreshToken> updatedTokens = await _context.RefreshTokens.ToListAsync();
        List<RefreshToken> userTokens = updatedTokens.Where(t => t.UserId == userId).ToList();
        RefreshToken otherUserToken = updatedTokens.First(t => t.UserId == "other-user");

        // Assert
        Assert.All(userTokens, t => Assert.True(t.IsRevoked));
        Assert.All(userTokens, t => Assert.NotNull(t.Revoked));
        Assert.False(otherUserToken.IsRevoked);
        Assert.Null(otherUserToken.Revoked);
    }

    [Fact]
    public void GenerateRefreshToken_ReturnsBase64String()
    {
        // Arrange
        var method = typeof(TokenService).GetMethod("GenerateRefreshToken",
            System.Reflection.BindingFlags.NonPublic | System.Reflection.BindingFlags.Instance);

        // Act
        string token = (string)method.Invoke(_tokenService, null);

        // Assert
        Assert.NotNull(token);
        Assert.NotEmpty(token);
        Assert.Matches(@"^[A-Za-z0-9+/]+={0,2}$", token);
    }
}