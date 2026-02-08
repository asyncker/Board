namespace Board.IdentityService.Persistence.Domain;

/// <summary>
/// Роль пользователя
/// </summary>
public class Role
{
    /// <summary>
    /// Уникальный идентификатор роли
    /// </summary>
    public string Id { get; set; }

    /// <summary>
    /// Название роли
    /// </summary>
    public string Name { get; set; }
}