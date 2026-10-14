using System.Collections;

namespace Panoptes.Core.Data;

public class DataSourceResult
{
    public IEnumerable Data { get; set; } = Array.Empty<object>();
    public int Total { get; set; }
    public Dictionary<string, object?>? Aggregates { get; set; }
    public object? Errors { get; set; }
}
