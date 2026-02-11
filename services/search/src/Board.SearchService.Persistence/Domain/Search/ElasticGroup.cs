using System.Text.Json.Serialization;

namespace Board.SearchService.Persistence.Domain.Search;

/// <summary>
/// Группа для индексации в Elasticsearch
/// </summary>
public class ElasticGroup
{
    [JsonPropertyName("id")]
    public long Id { get; set; }

    [JsonPropertyName("name")]
    public string Name { get; set; }

    [JsonPropertyName("title")]
    public string Title { get; set; }

    [JsonPropertyName("description")]
    public string Description { get; set; }

    [JsonPropertyName("avatar_url")]
    public string AvatarUrl { get; set; }
}