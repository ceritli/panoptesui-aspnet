using System.Collections.Generic;

namespace Panoptes.AspNetCore.Models;

public class TreeViewItemModel
{
    public string? Id { get; set; }
    public string? Text { get; set; }
    public string? Icon { get; set; }
    public string? Url { get; set; }
    public bool Expanded { get; set; }
    public bool Checked { get; set; }
    public bool Disabled { get; set; }
    public string? Badge { get; set; }
    public string BadgeColor { get; set; } = "blue";
    public List<TreeViewItemModel> Children { get; set; } = new();
}

public class TreeViewContext
{
    public string? Id { get; set; }
    public bool ShowCheckboxes { get; set; }
    public bool ShowIcons { get; set; } = true;
    public string? OnSelect { get; set; }
    public string? OnCheck { get; set; }
    public string? OnExpand { get; set; }
    public string? OnCollapse { get; set; }
    public List<TreeViewItemModel> Items { get; set; } = new();
}
