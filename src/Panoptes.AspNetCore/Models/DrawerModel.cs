using System.Collections.Generic;

namespace Panoptes.AspNetCore.Models;

public class DrawerItemModel
{
    public string? Text { get; set; }
    public string? Url { get; set; }
    public string? Icon { get; set; }
    public string? Badge { get; set; }
    public string BadgeColor { get; set; } = "blue";
    public bool IsActive { get; set; }
    public bool Disabled { get; set; }
    public bool IsSeparator { get; set; }
}

public class DrawerContext
{
    public string? Id { get; set; }
    public string Position { get; set; } = "left"; // left, right
    public string Mode { get; set; } = "overlay"; // overlay, push
    public bool Expanded { get; set; }
    public bool CloseOnBackdropClick { get; set; } = true;
    public string? Title { get; set; }
    public List<DrawerItemModel> Items { get; set; } = new();
}
