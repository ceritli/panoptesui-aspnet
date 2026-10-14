namespace Panoptes.Core.Data;

public class DataSourceRequest
{
    public int Page { get; set; } = 1;
    public int PageSize { get; set; } = 10;
    public string? QuickSearch { get; set; }
    public List<SortDescriptor> Sorts { get; set; } = new();
    public List<GroupDescriptor> Groups { get; set; } = new();
    public FilterDescriptor? Filter { get; set; }
    public List<AggregateDescriptor> Aggregates { get; set; } = new();
}
