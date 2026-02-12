namespace Board.IdentityService.Persistence.Domain;

/// <summary>
/// Токен обновления для аутентификации пользователей
/// </summary>
public class RefreshToken
{
    /// <summary>
    /// Уникальный идентификатор токена обновления
    /// </summary>
    public string Id { get; set; }

    /// <summary>
    /// Идентификатор пользователя, которому принадлежит токен
    /// </summary>
    public string UserId { get; set; }
    public User User { get; set; }

    /// <summary>
    /// Значение токена обновления
    /// </summary>
    public string Token { get; set; }

    /// <summary>
    /// Дата и время истечения срока действия токена
    /// </summary>
    public DateTime Expires { get; set; }

    /// <summary>
    /// Дата и время создания токена
    /// </summary>
    public DateTime Created { get; set; }

    /// <summary>
    /// Дата и время отзыва токена (если токен был отозван)
    /// </summary>
    /// <remarks>
    /// Имеет значение null, если токен активен и не был отозван
    /// </remarks>
    public DateTime? Revoked { get; set; }

    /// <summary>
    /// Флаг, указывающий, отозван ли токен
    /// </summary>
    /// <value>
    /// <c>true</c> - токен отозван; <c>false</c> - токен активен
    /// </value>
    public bool IsRevoked { get; set; }
}