using System.Collections.Generic;

namespace Panoptes.AspNetCore.Models;

/// <summary>
/// Panoptes TabStrip içerisindeki her bir sekmeyi temsil eden veri modeli.
/// </summary>
public class TabItemModel
{
    public string Id { get; set; } = string.Empty;
    public string Title { get; set; } = string.Empty;
    public string? Icon { get; set; }
    public string? Badge { get; set; }
    public string BadgeColor { get; set; } = "blue";
    public bool Active { get; set; }
    public bool Disabled { get; set; }
    public bool Closable { get; set; }
    public string? ContentUrl { get; set; }
    public string ContentHtml { get; set; } = string.Empty;
}

/// <summary>
/// Sekme etiketlerinin TagHelper arasında paylaşımı için bağlam nesnesi.
/// </summary>
public class TabStripContext
{
    public string Id { get; set; } = string.Empty;
    public string TabPosition { get; set; } = "top"; // top, bottom, left, right
    public string Animation { get; set; } = "fade"; // fade, none
    public bool Closable { get; set; }
    public List<TabItemModel> Tabs { get; } = new();
}
