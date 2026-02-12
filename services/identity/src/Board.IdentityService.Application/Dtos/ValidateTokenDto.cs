namespace Board.IdentityService.Application.Dtos;

public class ValidateTokenDto
{
    public bool IsValid { get; set; }
    public string UserId { get; set; }
    public string Email { get; set; }
    public List<string> Roles { get; set; }
    public DateTime ExpiresAt { get; set; }
}