using System.Collections.Generic;

namespace Panoptes.AspNetCore.Models;

public class SplitterPaneModel
{
    public string? Id { get; set; }
    public string? Size { get; set; } // örn: "250px", "30%", "auto"
    public string? MinSize { get; set; }
    public string? MaxSize { get; set; }
    public bool Resizable { get; set; } = true;
    public bool Collapsible { get; set; } = true;
    public bool Collapsed { get; set; }
    public bool Scrollable { get; set; } = true;
    public string? ContentHtml { get; set; }
}

public class SplitterContext
{
    public string? Id { get; set; }
    public string Orientation { get; set; } = "horizontal"; // horizontal, vertical
    public string? OnResize { get; set; }
    public string? OnCollapse { get; set; }
    public string? OnExpand { get; set; }
    public List<SplitterPaneModel> Panes { get; set; } = new();
}
