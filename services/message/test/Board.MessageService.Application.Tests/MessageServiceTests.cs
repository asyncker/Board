using Board.MessageService.Application.Service.Interface;
using Board.MessageService.Persistence.Infrastructure;
using Microsoft.EntityFrameworkCore;
using Board.MessageService.Persistence.Domain;
using Board.MessageService.Application.Dtos;

namespace Board.MessageService.Application.Tests;

public class MessageServiceTests : IDisposable
{
    private readonly IMessageService _messageService;
    private readonly AppDbContext _dbContext;

    public MessageServiceTests()
    {
        _dbContext = CreateInMemoryDbContext();
        _messageService = new Service.Implementation.MessageService(_dbContext);
    }

    private AppDbContext CreateInMemoryDbContext()
    {
        DbContextOptions<AppDbContext> options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;
        return new AppDbContext(options);
    }

    public void Dispose()
    {
        _dbContext?.Dispose();
    }

    [Fact]
    public async Task WriteAsync_ShouldAddMessageAndAttachments_WhenValidDataProvided()
    {
        // Arrange
        Group group = new()
        {
            Name = "test-group",
            Title = "Test Group",
            Description = "Test Description",
            AvatarUrl = "https://example.com"
        };
        await _dbContext.Groups.AddAsync(group);
        await _dbContext.SaveChangesAsync();
        CreateMessageDto createMessageDto = new()
        {
            GroupName = group.Name,
            Text = "Test message",
            UserName = "User1",
            UserNameColor = "#000000",
            UserAvatarUrl = "avatar.jpg",
            Attachments = new List<string> { "file1.jpg", "file2.jpg" }
        };

        // Act
        await _messageService.WriteAsync(createMessageDto);
        Message message = await _dbContext.Messages
            .Include(m => m.Attachments)
            .FirstOrDefaultAsync();
        List<MessageAttachment> attachments = message.Attachments.OrderBy(a => a.OrderIndex).ToList();

        // Assert
        Assert.NotNull(message);
        Assert.Equal("Test message", message.Text);
        Assert.Equal(group.Id, message.GroupId);
        Assert.Equal("User1", message.UserName);
        Assert.Equal(2, attachments.Count);
        Assert.Equal(0, attachments[0].OrderIndex);
        Assert.Equal("file1.jpg", attachments[0].Url);
        Assert.Equal(1, attachments[1].OrderIndex);
        Assert.Equal("file2.jpg", attachments[1].Url);
    }

    [Fact]
    public async Task GetCurrentPageAsync_ShouldReturnCorrectPageNumber_WhenMessagesExist()
    {
        // Arrange
        Group group = new()
        {
            Name = "test-group2",
            Title = "Test Group",
            Description = "Test Description",
            AvatarUrl = "https://example.com"
        };
        await _dbContext.Groups.AddAsync(group);
        await _dbContext.SaveChangesAsync();
        List<Message> messages = Enumerable.Range(1, 250)
            .Select(i => new Message
            {
                Id = Guid.NewGuid(),
                Text = $"Message {i}",
                GroupId = group.Id,
                CreatedUtcAt = DateTime.UtcNow,
                UserName = "test username",
                UserAvatarUrl = "https://example.com",
                UserNameColor = "#444444"
            })
            .ToList();
        await _dbContext.Messages.AddRangeAsync(messages);
        await _dbContext.SaveChangesAsync();

        // Act
        int result = await _messageService.GetCurrentPageAsync(group.Name);

        // Assert
        Assert.Equal(2, result);
    }

    [Fact]
    public async Task CreateGroupAsync_ShouldAddNewGroup_WhenValidDataProvided()
    {
        // Arrange
        CreateGroupDto groupDto = new()
        {
            Name = "new_group",
            Title = "New Group",
            Description = "New group description",
            AvatarUrl = "group-avatar.jpg"
        };

        // Act
        await _messageService.CreateGroupAsync(groupDto);
        Group group = await _dbContext.Groups.FirstOrDefaultAsync(g => g.Name == groupDto.Name);

        // Assert
        Assert.NotNull(group);
        Assert.Equal("new_group", group.Name);
        Assert.Equal("New Group", group.Title);
        Assert.Equal("New group description", group.Description);
        Assert.Equal("group-avatar.jpg", group.AvatarUrl);
    }

    [Fact]
    public async Task WriteAsync_ShouldThrowException_WhenGroupNotFound()
    {
        // Arrange
        CreateMessageDto createMessageDto = new()
        {
            GroupName = "non-existent-group",
            Text = "Test message",
            UserName = "User1"
        };

        // Act & Assert
        await Assert.ThrowsAsync<KeyNotFoundException>(async () => await _messageService.WriteAsync(createMessageDto));
    }

    [Fact]
    public async Task GetCurrentPageAsync_ShouldReturnZero_WhenNoMessagesExist()
    {
        // Arrange
        Group group = new()
        {
            Name = "empty-group",
            Title = "Empty Group",
            Description = "No messages here",
            AvatarUrl = "https://example.com"
        };
        await _dbContext.Groups.AddAsync(group);
        await _dbContext.SaveChangesAsync();

        // Act
        int result = await _messageService.GetCurrentPageAsync(group.Name);

        // Assert
        Assert.Equal(0, result);
    }

    [Fact]
    public async Task GetPageAsync_ShouldReturnEmptyMessages_WhenPageOutOfRange()
    {
        // Arrange
        int page = 10;
        Group group = new()
        {
            Name = "test-group",
            Title = "Test Group",
            Description = "Test Description",
            AvatarUrl = "https://example.com"
        };
        await _dbContext.Groups.AddAsync(group);
        await _dbContext.SaveChangesAsync();
        List<Message> messages = Enumerable.Range(1, 50)
            .Select(i => new Message
            {
                Id = Guid.NewGuid(),
                Text = $"Message {i}",
                GroupId = group.Id,
                CreatedUtcAt = DateTime.UtcNow.AddMinutes(i),
                UserName = "test username",
                UserAvatarUrl = "https://example.com",
                UserNameColor = "#444444"
            })
            .ToList();
        _dbContext.Messages.AddRange(messages);
        await _dbContext.SaveChangesAsync();

        // Act
        GroupResultDto result = await _messageService.GetPageAsync(group.Name, page);

        // Assert
        Assert.NotNull(result);
        Assert.Equal(group.Name, result.Name);
        Assert.Empty(result.Messages);
    }

    [Fact]
    public async Task WriteAsync_ShouldHandleEmptyAttachmentsList_Correctly()
    {
        // Arrange
        Group group = new()
        {
            Name = "test-group",
            Title = "Test Group",
            Description = "Test Description",
            AvatarUrl = "https://example.com"
        };
        await _dbContext.Groups.AddAsync(group);
        await _dbContext.SaveChangesAsync();
        CreateMessageDto createMessageDto = new()
        {
            GroupName = group.Name,
            Text = "Test message without attachments",
            UserName = "User1",
            UserAvatarUrl = "https://example.com",
            UserNameColor = "#444444",
            Attachments = new List<string>()
        };

        // Act
        await _messageService.WriteAsync(createMessageDto);
        Message message = await _dbContext.Messages
            .Include(m => m.Attachments)
            .FirstOrDefaultAsync();

        // Assert
        Assert.NotNull(message);
        Assert.Equal(group.Id, message.GroupId);
        Assert.Equal("Test message without attachments", message.Text);
        Assert.Empty(message.Attachments);
    }

    [Fact]
    public async Task WriteAsync_ShouldMaintainAttachmentOrder_AccordingToOriginalList()
    {
        // Arrange
        Group group = new()
        {
            Name = "test-group",
            Title = "Test Group",
            Description = "Test Description",
            AvatarUrl = "https://example.com"
        };
        await _dbContext.Groups.AddAsync(group);
        await _dbContext.SaveChangesAsync();
        CreateMessageDto createMessageDto = new()
        {
            GroupName = group.Name,
            Text = "Test message with attachments",
            UserName = "User1",
            Attachments = new List<string>
            {
                "third.jpg",
                "first.jpg",
                "second.jpg"
            },
            UserAvatarUrl = "https://example.com",
            UserNameColor = "#444444"
        };

        // Act
        await _messageService.WriteAsync(createMessageDto);
        Message message = await _dbContext.Messages
            .Include(m => m.Attachments)
            .FirstOrDefaultAsync();
        List<MessageAttachment> savedAttachments = message.Attachments
            .OrderBy(a => a.OrderIndex)
            .ToList();

        // Assert
        Assert.NotNull(message);
        Assert.Equal(3, savedAttachments.Count);
        Assert.Equal(0, savedAttachments[0].OrderIndex);
        Assert.Equal("third.jpg", savedAttachments[0].Url);
        Assert.Equal(1, savedAttachments[1].OrderIndex);
        Assert.Equal("first.jpg", savedAttachments[1].Url);
        Assert.Equal(2, savedAttachments[2].OrderIndex);
        Assert.Equal("second.jpg", savedAttachments[2].Url);
    }

    [Fact]
    public async Task GetPageAsync_ShouldThrowException_WhenGroupNotFound()
    {
        // Arrange
        string groupName = "non-existent-group";
        int page = 0;

        // Act & Assert
        await Assert.ThrowsAsync<KeyNotFoundException>(() => _messageService.GetPageAsync(groupName, page));
    }
}