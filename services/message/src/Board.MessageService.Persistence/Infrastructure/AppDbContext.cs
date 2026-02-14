using Board.MessageService.Persistence.Domain;
using Microsoft.EntityFrameworkCore;

namespace Board.MessageService.Persistence.Infrastructure;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) 
        : base(options)
    {
    }

    public DbSet<Message> Messages { get; set; }
    public DbSet<Group> Groups { get; set; }
    public DbSet<MessageAttachment> MessagesAttachments { get; set; }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<Message>(entity =>
        {
            entity.HasOne(m => m.Group)
                .WithMany(g => g.Messages)
                .HasForeignKey(m => m.GroupId);

            entity.HasMany(m => m.Attachments)
                .WithOne(a => a.Message)
                .HasForeignKey(m => m.MessageId);

            entity.Property(m => m.UserName)
                .IsRequired();

            entity.Property(m => m.UserAvatarUrl)
                .HasMaxLength(2048);

            entity.Property(m => m.UserNameColor)
                .HasMaxLength(10);

            entity.HasIndex(m => new { m.GroupId, m.CreatedUtcAt });
        });

        modelBuilder.Entity<Group>(entity =>
        {
            entity.HasIndex(e => e.Name)
                .HasDatabaseName("IX_Group_Name")
                .IsUnique(true);

            entity.Property(m => m.AvatarUrl)
                .HasMaxLength(2048);
        });
    }
}