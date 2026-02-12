using System.Text.Json.Serialization;

namespace Board.SearchService.Persistence.Domain.Search;

/// <summary>
/// Сообщение для индексации в Elasticsearch
/// </summary>
public class ElasticMessage
{
    [JsonPropertyName("id")]
    public Guid Id { get; set; }

    [JsonPropertyName("group_id")]
    public long GroupId { get; set; }

    [JsonPropertyName("group_message_index")]
    public long GroupMessageIndex { get; set; }

    [JsonPropertyName("user_name")]
    public string UserName { get; set; }

    [JsonPropertyName("user_name_color")]
    public string UserNameColor { get; set; }

    [JsonPropertyName("user_avatar_url")]
    public string UserAvatarUrl { get; set; }

    [JsonPropertyName("text")]
    public string Text { get; set; }

    [JsonPropertyName("created_utc_at")]
    public DateTime CreatedUtcAt { get; set; }
}