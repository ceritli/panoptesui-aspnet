using System.Text.Json;
using System.Text.Json.Serialization;
using Microsoft.AspNetCore.Razor.TagHelpers;
using Panoptes.AspNetCore.Models;

namespace Panoptes.AspNetCore.TagHelpers;

[HtmlTargetElement("panoptes-menu")]
public class MenuTagHelper : TagHelper
{
    [HtmlAttributeName("id")]
    public string Id { get; set; } = $"panoptes-menu-{Guid.NewGuid():N}";

    [HtmlAttributeName("orientation")]
    public string Orientation { get; set; } = "horizontal"; // "horizontal" | "vertical"

    [HtmlAttributeName("open-on")]
    public string OpenOn { get; set; } = "hover"; // "hover" | "click"

    [HtmlAttributeName("class")]
    public string? Class { get; set; }

    [HtmlAttributeName("on-select")]
    public string? OnSelect { get; set; }

    [HtmlAttributeName("on-open")]
    public string? OnOpen { get; set; }

    [HtmlAttributeName("on-close")]
    public string? OnClose { get; set; }

    public override async Task ProcessAsync(TagHelperContext context, TagHelperOutput output)
    {
        var menuContext = new MenuContext
        {
            Id = Id,
            Orientation = Orientation,
            OpenOn = OpenOn
        };
        context.Items[typeof(IMenuItemContainer)] = menuContext;

        await output.GetChildContentAsync();

        output.TagName = "nav";
        output.TagMode = TagMode.StartTagAndEndTag;
        output.Attributes.SetAttribute("id", Id);
        output.Attributes.SetAttribute("class", $"panoptes-menu-wrapper panoptes-menu-{Orientation} {Class}".Trim());

        var config = new
        {
            id = Id,
            type = "menu",
            orientation = Orientation,
            openOn = OpenOn,
            onSelect = OnSelect,
            onOpen = OnOpen,
            onClose = OnClose,
            items = menuContext.Items
        };

        var jsonOptions = new JsonSerializerOptions
        {
            PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
            DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull
        };

        var configJson = JsonSerializer.Serialize(config, jsonOptions);

        output.Content.SetHtmlContent($@"
<div class=""panoptes-menu-container""></div>
<script type=""application/json"" data-panoptes-config=""{Id}"">{configJson}</script>
<script>
  if (window.Panoptes && window.Panoptes.Menu) {{
    window.Panoptes.Menu.init('{Id}');
  }} else {{
    document.addEventListener('DOMContentLoaded', function() {{
      if (window.Panoptes && window.Panoptes.Menu) {{
        window.Panoptes.Menu.init('{Id}');
      }}
    }});
  }}
</script>");
    }
}

[HtmlTargetElement("panoptes-context-menu")]
public class ContextMenuTagHelper : TagHelper
{
    [HtmlAttributeName("id")]
    public string Id { get; set; } = $"panoptes-context-menu-{Guid.NewGuid():N}";

    [HtmlAttributeName("target")]
    public string Target { get; set; } = string.Empty; // CSS selector

    [HtmlAttributeName("filter")]
    public string? Filter { get; set; }

    [HtmlAttributeName("show-on")]
    public string ShowOn { get; set; } = "contextmenu"; // "contextmenu" (right click) | "click"

    [HtmlAttributeName("class")]
    public string? Class { get; set; }

    [HtmlAttributeName("on-select")]
    public string? OnSelect { get; set; }

    [HtmlAttributeName("on-open")]
    public string? OnOpen { get; set; }

    [HtmlAttributeName("on-close")]
    public string? OnClose { get; set; }

    public override async Task ProcessAsync(TagHelperContext context, TagHelperOutput output)
    {
        var contextMenuContext = new ContextMenuContext
        {
            Id = Id,
            Target = Target,
            Filter = Filter,
            ShowOn = ShowOn
        };
        context.Items[typeof(IMenuItemContainer)] = contextMenuContext;

        await output.GetChildContentAsync();

        output.TagName = "div";
        output.TagMode = TagMode.StartTagAndEndTag;
        output.Attributes.SetAttribute("id", Id);
        output.Attributes.SetAttribute("class", $"panoptes-context-menu-wrapper {Class}".Trim());

        var config = new
        {
            id = Id,
            type = "contextmenu",
            target = Target,
            filter = Filter,
            showOn = ShowOn,
            onSelect = OnSelect,
            onOpen = OnOpen,
            onClose = OnClose,
            items = contextMenuContext.Items
        };

        var jsonOptions = new JsonSerializerOptions
        {
            PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
            DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull
        };

        var configJson = JsonSerializer.Serialize(config, jsonOptions);

        output.Content.SetHtmlContent($@"
<div class=""panoptes-context-menu-container""></div>
<script type=""application/json"" data-panoptes-config=""{Id}"">{configJson}</script>
<script>
  if (window.Panoptes && window.Panoptes.ContextMenu) {{
    window.Panoptes.ContextMenu.init('{Id}');
  }} else {{
    document.addEventListener('DOMContentLoaded', function() {{
      if (window.Panoptes && window.Panoptes.ContextMenu) {{
        window.Panoptes.ContextMenu.init('{Id}');
      }}
    }});
  }}
</script>");
    }
}

[HtmlTargetElement("panoptes-menu-item")]
public class MenuItemTagHelper : TagHelper
{
    [HtmlAttributeName("id")]
    public string? Id { get; set; }

    [HtmlAttributeName("text")]
    public string Text { get; set; } = string.Empty;

    [HtmlAttributeName("url")]
    public string? Url { get; set; }

    [HtmlAttributeName("icon")]
    public string? Icon { get; set; }

    [HtmlAttributeName("badge")]
    public string? Badge { get; set; }

    [HtmlAttributeName("badge-class")]
    public string? BadgeClass { get; set; }

    [HtmlAttributeName("disabled")]
    public bool Disabled { get; set; } = false;

    [HtmlAttributeName("action")]
    public string? Action { get; set; }

    [HtmlAttributeName("shortcut")]
    public string? Shortcut { get; set; }

    [HtmlAttributeName("class")]
    public string? Class { get; set; }

    public override async Task ProcessAsync(TagHelperContext context, TagHelperOutput output)
    {
        output.SuppressOutput();

        var item = new MenuItemModel
        {
            Id = Id,
            Text = Text,
            Url = Url,
            Icon = Icon,
            Badge = Badge,
            BadgeClass = BadgeClass,
            Disabled = Disabled,
            Action = Action,
            Shortcut = Shortcut,
            Class = Class
        };

        // Add to parent container (either Menu, ContextMenu, or another MenuItem)
        if (context.Items.TryGetValue(typeof(IMenuItemContainer), out var parentObj) && parentObj is IMenuItemContainer parentContainer)
        {
            parentContainer.Items.Add(item);
        }

        // Set this item as the container for nested child items
        var prevContainer = context.Items.TryGetValue(typeof(IMenuItemContainer), out var p) ? p : null;
        context.Items[typeof(IMenuItemContainer)] = item;

        await output.GetChildContentAsync();

        if (prevContainer != null)
        {
            context.Items[typeof(IMenuItemContainer)] = prevContainer;
        }
    }
}

[HtmlTargetElement("panoptes-menu-separator")]
public class MenuSeparatorTagHelper : TagHelper
{
    public override void Process(TagHelperContext context, TagHelperOutput output)
    {
        output.SuppressOutput();
        if (context.Items.TryGetValue(typeof(IMenuItemContainer), out var parentObj) && parentObj is IMenuItemContainer parentContainer)
        {
            parentContainer.Items.Add(new MenuItemModel { Separator = true });
        }
    }
}
