using System.Collections.Generic;

namespace Panoptes.AspNetCore.Models;

public class MultiColumnComboBoxColumn
{
    public string? Field { get; set; }
    public string? Title { get; set; }
    public string? Width { get; set; }
    public string? Template { get; set; }
    public string? Align { get; set; } = "left"; // left, center, right
    public string? HeaderClass { get; set; }
    public string? Class { get; set; }
    public string? Format { get; set; }
}

public class MultiColumnComboBoxContext
{
    public List<MultiColumnComboBoxColumn> Columns { get; } = new();
}
