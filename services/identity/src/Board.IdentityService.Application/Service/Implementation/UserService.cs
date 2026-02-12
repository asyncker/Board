using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Board.IdentityService.Persistence.Domain;
using Board.IdentityService.Application.Service.Interface;
using Board.IdentityService.Persistence.Infrastructure;
using Microsoft.Extensions.Configuration;

namespace Board.IdentityService.Application.Service.Implementation;

public class UserService : IUserService
{
    private readonly IConfiguration _configuration;
    private readonly AppDbContext _context;
    private readonly IPasswordHasher<User> _passwordHasher;
    public UserService(IConfiguration configuration,
        AppDbContext context,
        IPasswordHasher<User> passwordHasher)
    {
        _configuration = configuration;
        _context = context;
        _passwordHasher = passwordHasher;
    }

    public async Task<User> GetUserByUserNameAsync(string username)
    {
        return await _context.Users.FirstOrDefaultAsync(u => u.UserName == username);
    }

    public async Task<User> GetUserByIdAsync(string id)
    {
        return await _context.Users.FirstOrDefaultAsync(u => u.Id == id);
    }

    public async Task<User> CreateUserAsync(string username, string password, string email)
    {
        User existingUser = await GetUserByUserNameAsync(username);
        if (existingUser != null)
        {
            throw new ArgumentException("User already exists");
        }
        User user = new()
        {
            Id = Guid.NewGuid().ToString(),
            Email = email,
            UserName = username,
            CreatedUtcAt = DateTime.UtcNow
        };
        user.PasswordHash = _passwordHasher.HashPassword(user, password);
        Role role = await _context.Roles.FirstOrDefaultAsync(r => r.Name == "User");
        if (role != null)
        {
            user.Roles = new List<string> { role.Name };
        }
        await _context.Users.AddAsync(user);
        await _context.SaveChangesAsync();
        return user;
    }

    public async Task<User> AuthenticateAsync(string username, string password)
    {
        User user = await GetUserByUserNameAsync(username);
        if (user == null)
        {
            return null;
        }
        PasswordVerificationResult result = _passwordHasher.VerifyHashedPassword(user, user.PasswordHash, password);
        if (result == PasswordVerificationResult.Failed)
        {
            return null;
        }
        return user;
    }
}