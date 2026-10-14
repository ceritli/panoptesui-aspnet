using System.Text.Json.Serialization;

namespace Panoptes.Core.Data;

public class FilterDescriptor
{
    public string? Field { get; set; }
    public string? Operator { get; set; }
    public object? Value { get; set; }

    public string? Logic { get; set; } = "and"; // "and" or "or"
    public List<FilterDescriptor> Filters { get; set; } = new();

    [JsonIgnore]
    public bool IsComposite => Filters != null && Filters.Count > 0;
}
