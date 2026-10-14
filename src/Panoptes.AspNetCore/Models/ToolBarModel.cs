using System.Collections.Generic;

namespace Panoptes.AspNetCore.Models;

public class ToolBarItemModel
{
    public string Type { get; set; } = "button"; // button, group, separator, search, custom
    public string? Text { get; set; }
    public string? Icon { get; set; }
    public string Variant { get; set; } = "secondary"; // primary, secondary, danger, ghost
    public string? OnClick { get; set; }
    public string? Badge { get; set; }
    public bool Disabled { get; set; }
    public string? Placeholder { get; set; }
    public string? HtmlContent { get; set; }
    public List<ToolBarItemModel> Children { get; set; } = new();
}

public class ToolBarContext
{
    public string? Id { get; set; }
    public List<ToolBarItemModel> Items { get; set; } = new();
}
