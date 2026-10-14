using System.Collections;

namespace Panoptes.Core.Data;

public class PanoptesGroupResult
{
    public object? Key { get; set; }
    public string Field { get; set; } = string.Empty;
    public int Count { get; set; }
    public IEnumerable Items { get; set; } = Array.Empty<object>();
    public Dictionary<string, object?>? Aggregates { get; set; }
}
