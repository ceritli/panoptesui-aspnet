using System.Collections.Generic;

namespace Panoptes.AspNetCore.Models;

/// <summary>
/// ActionSheet içindeki tek bir eylem butonunu temsil eden veri modeli.
/// </summary>
public class ActionSheetItemModel
{
    public string Id { get; set; } = string.Empty;
    public string Text { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string? Icon { get; set; }
    public string? ImageUrl { get; set; }
    public string? Group { get; set; }
    public bool Disabled { get; set; } = false;
    public string ThemeColor { get; set; } = "default"; // default, primary, danger, warning, success
    public string? Click { get; set; }
    public string? Url { get; set; }
    public string? CssClass { get; set; }
}

/// <summary>
/// ActionSheet TagHelper bağlamı.
/// </summary>
public class ActionSheetContext
{
    public string Id { get; set; } = string.Empty;
    public string? Title { get; set; }
    public string? Subtitle { get; set; }
    public bool Modal { get; set; } = true;
    public bool CloseButton { get; set; } = true;
    public bool Fullscreen { get; set; } = false;
    public string Animation { get; set; } = "slide";
    public List<ActionSheetItemModel> Items { get; set; } = new();
}
