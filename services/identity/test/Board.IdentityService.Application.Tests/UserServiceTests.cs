using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Identity;
using Moq;
using Microsoft.Extensions.Configuration;
using Board.IdentityService.Persistence.Domain;
using Board.IdentityService.Persistence.Infrastructure;
using Board.IdentityService.Application.Service.Interface;
using Board.IdentityService.Application.Service.Implementation;

namespace Board.IdentityService.Application.Tests;

public class UserServiceTests : IDisposable
{
    private readonly AppDbContext _context;
    private readonly Mock<IConfiguration> _configurationMock;
    private readonly Mock<IPasswordHasher<User>> _passwordHasherMock;
    private readonly IUserService _service;

    public UserServiceTests()
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;
        _context = new AppDbContext(options);
        _configurationMock = new Mock<IConfiguration>();
        _passwordHasherMock = new Mock<IPasswordHasher<User>>();
        _service = new UserService(_configurationMock.Object, _context, _passwordHasherMock.Object);
    }

    public void Dispose()
    {
        _context.Database.EnsureDeleted();
        _context.Dispose();
    }

    [Fact]
    public async Task GetUserByUserNameAsync_UserExists_ReturnsUser()
    {
        // Arrange
        User expectedUser = new()
        {
            Id = "1",
            UserName = "testuser",
            Email = "test@test.com",
            PasswordHash = "hash",
            CreatedUtcAt = DateTime.UtcNow
        };

        // Act
        await _context.Users.AddAsync(expectedUser);
        await _context.SaveChangesAsync();
        User result = await _service.GetUserByUserNameAsync("testuser");

        // Assert
        Assert.NotNull(result);
        Assert.Equal("testuser", result.UserName);
        Assert.Equal("test@test.com", result.Email);
    }

    [Fact]
    public async Task GetUserByUserNameAsync_UserNotExists_ReturnsNull()
    {
        // Arrange
        string username = "nonexistent";

        // Act
        User result = await _service.GetUserByUserNameAsync(username);

        // Assert
        Assert.Null(result);
    }

    [Fact]
    public async Task GetUserByIdAsync_UserExists_ReturnsUser()
    {
        // Arrange
        User expectedUser = new()
        {
            Id = "user-123",
            UserName = "testuser",
            Email = "test@test.com",
            PasswordHash = "hash",
            CreatedUtcAt = DateTime.UtcNow
        };
        await _context.Users.AddAsync(expectedUser);
        await _context.SaveChangesAsync();

        // Act
        User result = await _service.GetUserByIdAsync("user-123");

        // Assert
        Assert.NotNull(result);
        Assert.Equal("user-123", result.Id);
        Assert.Equal("testuser", result.UserName);
    }

    [Fact]
    public async Task CreateUserAsync_ValidData_CreatesUserWithRole()
    {
        // Arrange
        _passwordHasherMock
            .Setup(x => x.HashPassword(It.IsAny<User>(), "password123"))
            .Returns("hashed_password");

        // Act
        User result = await _service.CreateUserAsync("newuser", "password123", "newuser@test.com");
        User? userInDb = await _context.Users.FirstOrDefaultAsync(x => x.UserName == "newuser");

        // Assert
        Assert.NotNull(result);
        Assert.Equal("newuser", result.UserName);
        Assert.Equal("newuser@test.com", result.Email);
        Assert.Equal("hashed_password", result.PasswordHash);
        Assert.NotEmpty(result.Id);
        Assert.True(result.CreatedUtcAt <= DateTime.UtcNow.AddSeconds(10));
        Assert.NotNull(userInDb);
    }

    [Fact]
    public async Task CreateUserAsync_UserAlreadyExists_ThrowsException()
    {
        // Arrange
        User existingUser = new()
        {
            Id = "1",
            UserName = "existinguser",
            Email = "existing@test.com",
            PasswordHash = "hash",
            CreatedUtcAt = DateTime.UtcNow
        };

        await _context.Users.AddAsync(existingUser);
        await _context.SaveChangesAsync();

        // Act & Assert
        await Assert.ThrowsAsync<ArgumentException>(() =>
            _service.CreateUserAsync("existinguser", "password123", "newemail@test.com"));
    }

    [Fact]
    public async Task CreateUserAsync_RoleNotFound_CreatesUserWithoutRole()
    {
        // Arrange
        _passwordHasherMock
            .Setup(x => x.HashPassword(It.IsAny<User>(), "password123"))
            .Returns("hashed_password");

        // Act
        User result = await _service.CreateUserAsync("newuser", "password123", "newuser@test.com");

        // Assert
        Assert.NotNull(result);
        Assert.Equal("newuser", result.UserName);
        Assert.True(result.Roles.Count == 0);
    }

    [Fact]
    public async Task AuthenticateAsync_ValidCredentials_ReturnsUser()
    {
        // Arrange
        User testUser = new()
        {
            Id = "1",
            UserName = "testuser",
            Email = "test@test.com",
            PasswordHash = "hashed_password",
            CreatedUtcAt = DateTime.UtcNow
        };

        // Act
        await _context.Users.AddAsync(testUser);
        await _context.SaveChangesAsync();
        _passwordHasherMock
            .Setup(x => x.VerifyHashedPassword(testUser, "hashed_password", "correctpassword"))
            .Returns(PasswordVerificationResult.Success);
        User result = await _service.AuthenticateAsync("testuser", "correctpassword");

        // Assert
        Assert.NotNull(result);
        Assert.Equal("testuser", result.UserName);
    }

    [Fact]
    public async Task AuthenticateAsync_UserNotExists_ReturnsNull()
    {
        // Arrange
        string username = "nonexistent";
        string password = "password";

        // Act
        User result = await _service.AuthenticateAsync(username, password);

        // Assert
        Assert.Null(result);
    }

    [Fact]
    public async Task AuthenticateAsync_WrongPassword_ReturnsNull()
    {
        // Arrange
        User testUser = new()
        {
            Id = "1",
            UserName = "testuser",
            Email = "test@test.com",
            PasswordHash = "hashed_password",
            CreatedUtcAt = DateTime.UtcNow
        };

        await _context.Users.AddAsync(testUser);
        await _context.SaveChangesAsync();
        _passwordHasherMock
            .Setup(x => x.VerifyHashedPassword(testUser, "hashed_password", "wrongpassword"))
            .Returns(PasswordVerificationResult.Failed);

        // Act
        User result = await _service.AuthenticateAsync("testuser", "wrongpassword");

        // Assert
        Assert.Null(result);
    }

    [Fact]
    public async Task CreateUserAsync_PasswordIsHashed()
    {
        // Arrange
        string expectedHash = "expected_hashed_password";
        _passwordHasherMock
            .Setup(x => x.HashPassword(It.IsAny<User>(), "TestPassword123"))
            .Returns(expectedHash);

        // Act
        User result = await _service.CreateUserAsync("testuser", "TestPassword123", "test@test.com");
        _passwordHasherMock.Verify(x => x.HashPassword(It.IsAny<User>(), "TestPassword123"), Times.Once);

        // Assert
        Assert.Equal(expectedHash, result.PasswordHash);
    }

    [Fact]
    public async Task CreateUserAsync_MultipleUsers_CreatesWithUniqueIds()
    {
        // Arrange
        _passwordHasherMock
            .Setup(x => x.HashPassword(It.IsAny<User>(), It.IsAny<string>()))
            .Returns("hashed_password");

        // Act
        User user1 = await _service.CreateUserAsync("user1", "password1", "user1@test.com");
        User user2 = await _service.CreateUserAsync("user2", "password2", "user2@test.com");

        // Assert
        Assert.NotEqual(user1.Id, user2.Id);
        Assert.Equal(2, await _context.Users.CountAsync());
    }
}