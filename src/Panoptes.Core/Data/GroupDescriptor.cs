namespace Panoptes.Core.Data;

public class GroupDescriptor
{
    public string Field { get; set; } = string.Empty;
    public string Dir { get; set; } = "asc";
    public List<AggregateDescriptor> Aggregates { get; set; } = new();

    public bool IsAscending => !string.Equals(Dir, "desc", StringComparison.OrdinalIgnoreCase);
}
