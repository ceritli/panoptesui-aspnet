namespace Panoptes.AspNetCore.Models;

public class GridDataSourceConfig
{
    public string Type { get; set; } = "ajax";
    public string? ReadUrl { get; set; }
    public string? ReadMethod { get; set; } = "POST";
    public string? CreateUrl { get; set; }
    public string? CreateMethod { get; set; } = "POST";
    public string? UpdateUrl { get; set; }
    public string? UpdateMethod { get; set; } = "POST";
    public string? DestroyUrl { get; set; }
    public string? DestroyMethod { get; set; } = "POST";
    public string? BatchUrl { get; set; }
    public string? BatchMethod { get; set; } = "POST";
}

public class GridContext
{
    public string Id { get; set; } = string.Empty;
    public List<GridColumn> Columns { get; set; } = new();
    public GridDataSourceConfig DataSource { get; set; } = new();
    public string? DetailTemplate { get; set; }
}
