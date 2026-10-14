namespace Panoptes.Core.Data;

public class SortDescriptor
{
    public string Field { get; set; } = string.Empty;
    public string Dir { get; set; } = "asc"; // "asc" or "desc"

    public bool IsAscending => !string.Equals(Dir, "desc", StringComparison.OrdinalIgnoreCase);
}
