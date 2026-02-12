namespace Board.IdentityService.Persistence.Domain;

/// <summary>
/// Пользователь
/// </summary>
public class User
{
    /// <summary>
    /// Уникальный идентификатор пользователя
    /// </summary>
    public string Id { get; set; } = Guid.NewGuid().ToString();

    /// <summary>
    /// Логин пользователя для входа в систему
    /// </summary>
    public string UserName { get; set; }

    /// <summary>
    /// Электронная почта пользователя
    /// </summary>
    public string Email { get; set; }

    /// <summary>
    /// Url аватара пользователя
    /// </summary>
    public string? AvatarUrl { get; set; }

    /// <summary>
    /// Хэш пароля пользователя
    /// </summary>
    public string PasswordHash { get; set; }

    /// <summary>
    /// Дата и время создания пользователя в формате UTC
    /// </summary>
    public DateTime CreatedUtcAt { get; set; } = DateTime.UtcNow;

    /// <summary>
    /// Список ролей пользователя
    /// </summary>
    public List<string> Roles { get; set; } = new List<string>();

    /// <summary>
    /// Коллекция токенов обновления пользователя
    /// </summary>
    public ICollection<RefreshToken> RefreshTokens { get; set; } = new List<RefreshToken>();
}