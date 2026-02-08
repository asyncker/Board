using Board.IdentityService.Persistence.Domain;

namespace Board.IdentityService.Application.Service.Interface;

public interface IUserService
{
    Task<User> CreateUserAsync(string username, string password, string email);
    Task<User> AuthenticateAsync(string username, string password);
    Task<User> GetUserByUserNameAsync(string username);
    Task<User> GetUserByIdAsync(string id);
}