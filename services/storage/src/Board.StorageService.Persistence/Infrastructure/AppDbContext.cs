using Board.StorageService.Persistence.Domain;
using Microsoft.EntityFrameworkCore;

namespace Board.StorageService.Persistence.Infrastructure;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options)
        : base(options)
    {
    }

    public DbSet<FileData> Files { get; set; }
}