using System.Collections.Generic;

namespace Panoptes.AspNetCore.Models;

/// <summary>
/// Panoptes PanelBar (Accordion) içindeki her bir paneli temsil eden model.
/// </summary>
public class PanelBarItemModel
{
    public string Id { get; set; } = string.Empty;
    public string Title { get; set; } = string.Empty;
    public string? Icon { get; set; }
    public string? Badge { get; set; }
    public string BadgeColor { get; set; } = "blue";
    public bool Expanded { get; set; }
    public bool Disabled { get; set; }
    public string? ContentUrl { get; set; }
    public string ContentHtml { get; set; } = string.Empty;
    public List<PanelBarItemModel> Children { get; set; } = new();
}

/// <summary>
/// PanelBar TagHelper'ları arasında veri paylaşım bağlamı.
/// </summary>
public class PanelBarContext
{
    public string Id { get; set; } = string.Empty;
    public string ExpandMode { get; set; } = "multiple"; // single (accordion), multiple
    public string Animation { get; set; } = "fade"; // fade, none
    public List<PanelBarItemModel> Panels { get; } = new();
}
