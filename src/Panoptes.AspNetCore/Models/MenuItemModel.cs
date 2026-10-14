namespace Panoptes.AspNetCore.Models;

public interface IMenuItemContainer
{
    List<MenuItemModel> Items { get; }
}

public class MenuItemModel : IMenuItemContainer
{
    public string? Id { get; set; }
    public string Text { get; set; } = string.Empty;
    public string? Url { get; set; }
    public string? Icon { get; set; }
    public string? Badge { get; set; }
    public string? BadgeClass { get; set; }
    public bool Disabled { get; set; }
    public bool Separator { get; set; }
    public string? Action { get; set; }
    public string? Shortcut { get; set; }
    public string? Class { get; set; }
    public List<MenuItemModel> Items { get; set; } = new();
}

public class MenuContext : IMenuItemContainer
{
    public string Id { get; set; } = string.Empty;
    public string Orientation { get; set; } = "horizontal";
    public string OpenOn { get; set; } = "hover";
    public List<MenuItemModel> Items { get; set; } = new();
}

public class ContextMenuContext : IMenuItemContainer
{
    public string Id { get; set; } = string.Empty;
    public string Target { get; set; } = string.Empty;
    public string? Filter { get; set; }
    public string ShowOn { get; set; } = "contextmenu";
    public List<MenuItemModel> Items { get; set; } = new();
}
