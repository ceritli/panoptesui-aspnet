namespace Panoptes.Core.Data;

public class AggregateDescriptor
{
    public string Field { get; set; } = string.Empty;
    public string Aggregate { get; set; } = "count"; // "count", "sum", "average", "min", "max"
}
