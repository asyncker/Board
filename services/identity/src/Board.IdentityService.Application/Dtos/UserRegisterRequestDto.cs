namespace Board.IdentityService.Application.Dtos;

public class UserRegisterRequestDto
{
    public string UserName { get; set; }
    public string Password { get; set; }
    public string Email { get; set; }
}