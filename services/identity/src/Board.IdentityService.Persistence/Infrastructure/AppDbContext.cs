using Board.IdentityService.Persistence.Domain;
using Microsoft.EntityFrameworkCore;

namespace Board.IdentityService.Persistence.Infrastructure;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options)
        : base(options)
    {
    }

    public DbSet<User> Users { get; set; }
    public DbSet<Role> Roles { get; set; }
    public DbSet<RefreshToken> RefreshTokens { get; set; }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<User>(entity =>
        {
            entity.HasMany(u => u.RefreshTokens)
                .WithOne(rt => rt.User)
                .HasForeignKey(rt => rt.UserId);
        });
        modelBuilder.Entity<RefreshToken>(entity =>
        {
            entity.Property(rt => rt.Token).IsRequired();
        });
        modelBuilder.Entity<Role>(entity =>
        {
            entity.Property(r => r.Name).IsRequired();
        });
    }
}