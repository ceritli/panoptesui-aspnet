namespace Panoptes.AspNetCore.Models;

public class GridColumn
{
    public string? Field { get; set; }
    public string? Title { get; set; }
    public string? Width { get; set; }
    public bool? Sortable { get; set; }
    public bool? Filterable { get; set; }
    public bool? Frozen { get; set; }
    public bool? Editable { get; set; } = true;
    public string? EditorType { get; set; } // text, number, select, date, boolean
    public string? EditorOptions { get; set; }
    public string? Format { get; set; }
    public string? Align { get; set; } = "left"; // left, center, right
    public string? Template { get; set; }
    public string? Aggregates { get; set; } // sum, count, average, min, max
    public string? Class { get; set; }
    public string? HeaderClass { get; set; }
    public bool Hidden { get; set; } = false;
    public bool? Selectable { get; set; }
    public string? GroupHeaderTemplate { get; set; }
    public List<GridColumn> Columns { get; set; } = new(); // Multi-column headers
}
