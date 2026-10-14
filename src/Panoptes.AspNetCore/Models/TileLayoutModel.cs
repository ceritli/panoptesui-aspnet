using System.Collections.Generic;

namespace Panoptes.AspNetCore.Models;

/// <summary>
/// TileLayout içindeki bağımsız bir kart/konteyner modelini temsil eder.
/// </summary>
public class TileLayoutContainerModel
{
    public string Id { get; set; } = string.Empty;
    public string? HeaderText { get; set; }
    public string? HeaderTemplate { get; set; }
    public string? BodyHtml { get; set; }
    public int ColSpan { get; set; } = 1;
    public int RowSpan { get; set; } = 1;
    public int? Col { get; set; }
    public int? Row { get; set; }
    public int? Order { get; set; }
    public bool? Reorderable { get; set; }
    public bool? Resizable { get; set; }
    public bool Removable { get; set; } = false;
    public string? CssClass { get; set; }
}

/// <summary>
/// TileLayout bileşeninin üst ve alt TagHelper'lar arasındaki durum paylaşım bağlamı.
/// </summary>
public class TileLayoutContext
{
    public string Id { get; set; } = string.Empty;
    public int Columns { get; set; } = 3;
    public string ColumnWidth { get; set; } = "1fr";
    public string RowHeight { get; set; } = "180px";
    public string Gap { get; set; } = "16px";
    public bool Reorderable { get; set; } = true;
    public bool Resizable { get; set; } = true;
    public bool Navigatable { get; set; } = true;
}
