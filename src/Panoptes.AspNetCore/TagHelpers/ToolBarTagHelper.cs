using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc.Rendering;
using Microsoft.AspNetCore.Razor.TagHelpers;
using Panoptes.AspNetCore.Models;

namespace Panoptes.AspNetCore.TagHelpers;

/// <summary>
/// Panoptes UI ToolBar bileşeni, modern, responsive araç çubuğu TagHelper'ı.
/// </summary>
[HtmlTargetElement("panoptes-toolbar")]
public class ToolBarTagHelper : TagHelper
{
    [HtmlAttributeName("id")]
    public string? Id { get; set; }

    [HtmlAttributeName("class")]
    public string? CssClass { get; set; }

    public override async Task ProcessAsync(TagHelperContext context, TagHelperOutput output)
    {
        var id = !string.IsNullOrWhiteSpace(Id) ? Id : $"panoptes_tb_{Guid.NewGuid():N}";
        var tbContext = new ToolBarContext { Id = id };

        context.Items[typeof(ToolBarContext)] = tbContext;

        // Çocuk etiketleri yürüt
        var childContent = await output.GetChildContentAsync();

        output.TagName = "div";
        output.TagMode = TagMode.StartTagAndEndTag;
        output.Attributes.SetAttribute("id", id);
        output.Attributes.SetAttribute("data-panoptes-toolbar", "true");

        var baseClass = $"panoptes-toolbar flex flex-wrap items-center gap-2 p-2 bg-white border border-slate-200 rounded-2xl shadow-2xs {CssClass ?? ""}".Trim();
        output.Attributes.SetAttribute("class", baseClass);

        output.Content.Clear();

        if (tbContext.Items.Count > 0)
        {
            foreach (var item in tbContext.Items)
            {
                output.Content.AppendHtml(RenderItem(item));
            }
        }
        else
        {
            output.Content.AppendHtml(childContent);
        }
    }

    private TagBuilder RenderItem(ToolBarItemModel item)
    {
        switch (item.Type)
        {
            case "separator":
                var sep = new TagBuilder("div");
                sep.AddCssClass("h-5 w-px bg-slate-200 mx-1 select-none");
                return sep;

            case "search":
                var searchDiv = new TagBuilder("div");
                searchDiv.AddCssClass("relative flex items-center min-w-[200px]");
                var searchIcon = @"<svg class=""w-4 h-4 text-slate-400 absolute left-3 pointer-events-none"" fill=""none"" stroke=""currentColor"" viewBox=""0 0 24 24""><path stroke-linecap=""round"" stroke-linejoin=""round"" stroke-width=""2"" d=""M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z""/></svg>";
                searchDiv.InnerHtml.AppendHtml(searchIcon);

                var input = new TagBuilder("input");
                input.Attributes["type"] = "search";
                input.Attributes["placeholder"] = item.Placeholder ?? "Ara...";
                input.AddCssClass("w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none transition");
                searchDiv.InnerHtml.AppendHtml(input);
                return searchDiv;

            case "group":
                var groupDiv = new TagBuilder("div");
                groupDiv.AddCssClass("inline-flex rounded-xl shadow-2xs -space-x-px overflow-hidden");
                for (int i = 0; i < item.Children.Count; i++)
                {
                    var childBtn = RenderButton(item.Children[i], isGrouped: true, isFirst: i == 0, isLast: i == item.Children.Count - 1);
                    groupDiv.InnerHtml.AppendHtml(childBtn);
                }
                return groupDiv;

            case "custom":
                var customDiv = new TagBuilder("div");
                customDiv.AddCssClass("flex items-center");
                customDiv.InnerHtml.AppendHtml(item.HtmlContent ?? string.Empty);
                return customDiv;

            case "button":
            default:
                return RenderButton(item, isGrouped: false, isFirst: false, isLast: false);
        }
    }

    private TagBuilder RenderButton(ToolBarItemModel item, bool isGrouped, bool isFirst, bool isLast)
    {
        var btn = new TagBuilder("button");
        btn.Attributes["type"] = "button";

        if (!string.IsNullOrWhiteSpace(item.OnClick))
        {
            btn.Attributes["onclick"] = item.OnClick;
        }

        if (item.Disabled)
        {
            btn.Attributes["disabled"] = "disabled";
        }

        var variantClass = item.Variant.ToLowerInvariant() switch
        {
            "primary" => "bg-blue-600 text-white hover:bg-blue-700 shadow-2xs font-bold",
            "danger" => "bg-red-50 text-red-700 hover:bg-red-100 border border-red-200 font-semibold",
            "ghost" => "text-slate-600 hover:bg-slate-100 hover:text-slate-900 font-medium",
            _ => "bg-slate-50 text-slate-700 hover:bg-slate-100 border border-slate-200 font-medium"
        };

        var roundingClass = isGrouped
            ? (isFirst ? "rounded-l-xl rounded-r-none" : (isLast ? "rounded-r-xl rounded-l-none" : "rounded-none"))
            : "rounded-xl";

        var disabledClass = item.Disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer active:scale-95";

        btn.AddCssClass($"inline-flex items-center gap-1.5 px-3 py-1.5 text-xs transition {variantClass} {roundingClass} {disabledClass}");

        if (!string.IsNullOrWhiteSpace(item.Icon))
        {
            btn.InnerHtml.AppendHtml(GetIconSvg(item.Icon));
        }

        if (!string.IsNullOrWhiteSpace(item.Text))
        {
            var span = new TagBuilder("span");
            span.InnerHtml.Append(item.Text);
            btn.InnerHtml.AppendHtml(span);
        }

        if (!string.IsNullOrWhiteSpace(item.Badge))
        {
            var badgeSpan = new TagBuilder("span");
            badgeSpan.AddCssClass("text-[10px] font-bold px-1.5 py-0.2 rounded-full bg-blue-100 text-blue-800");
            badgeSpan.InnerHtml.Append(item.Badge);
            btn.InnerHtml.AppendHtml(badgeSpan);
        }

        return btn;
    }

    private static string GetIconSvg(string iconName)
    {
        return iconName.ToLowerInvariant() switch
        {
            "plus" or "add" => @"<svg class=""w-3.5 h-3.5"" fill=""none"" stroke=""currentColor"" viewBox=""0 0 24 24""><path stroke-linecap=""round"" stroke-linejoin=""round"" stroke-width=""2"" d=""M12 4v16m8-8H4""/></svg>",
            "edit" => @"<svg class=""w-3.5 h-3.5"" fill=""none"" stroke=""currentColor"" viewBox=""0 0 24 24""><path stroke-linecap=""round"" stroke-linejoin=""round"" stroke-width=""2"" d=""M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z""/></svg>",
            "trash" or "delete" => @"<svg class=""w-3.5 h-3.5"" fill=""none"" stroke=""currentColor"" viewBox=""0 0 24 24""><path stroke-linecap=""round"" stroke-linejoin=""round"" stroke-width=""2"" d=""M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16""/></svg>",
            "download" or "export" => @"<svg class=""w-3.5 h-3.5"" fill=""none"" stroke=""currentColor"" viewBox=""0 0 24 24""><path stroke-linecap=""round"" stroke-linejoin=""round"" stroke-width=""2"" d=""M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4""/></svg>",
            "refresh" => @"<svg class=""w-3.5 h-3.5"" fill=""none"" stroke=""currentColor"" viewBox=""0 0 24 24""><path stroke-linecap=""round"" stroke-linejoin=""round"" stroke-width=""2"" d=""M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15""/></svg>",
            "filter" => @"<svg class=""w-3.5 h-3.5"" fill=""none"" stroke=""currentColor"" viewBox=""0 0 24 24""><path stroke-linecap=""round"" stroke-linejoin=""round"" stroke-width=""2"" d=""M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z""/></svg>",
            "print" => @"<svg class=""w-3.5 h-3.5"" fill=""none"" stroke=""currentColor"" viewBox=""0 0 24 24""><path stroke-linecap=""round"" stroke-linejoin=""round"" stroke-width=""2"" d=""M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z""/></svg>",
            _ => @"<svg class=""w-3.5 h-3.5"" fill=""none"" stroke=""currentColor"" viewBox=""0 0 24 24""><path stroke-linecap=""round"" stroke-linejoin=""round"" stroke-width=""2"" d=""M13 10V3L4 14h7v7l9-11h-7z""/></svg>"
        };
    }
}

/// <summary>
/// ToolBar butonu.
/// </summary>
[HtmlTargetElement("panoptes-toolbar-button")]
public class ToolBarButtonTagHelper : TagHelper
{
    [HtmlAttributeName("text")]
    public string? Text { get; set; }

    [HtmlAttributeName("icon")]
    public string? Icon { get; set; }

    [HtmlAttributeName("variant")]
    public string Variant { get; set; } = "secondary"; // primary, secondary, danger, ghost

    [HtmlAttributeName("onclick")]
    public string? OnClick { get; set; }

    [HtmlAttributeName("badge")]
    public string? Badge { get; set; }

    [HtmlAttributeName("disabled")]
    public bool Disabled { get; set; }

    public override async Task ProcessAsync(TagHelperContext context, TagHelperOutput output)
    {
        var childContent = await output.GetChildContentAsync();
        var innerText = childContent.GetContent().Trim();

        var item = new ToolBarItemModel
        {
            Type = "button",
            Text = !string.IsNullOrWhiteSpace(Text) ? Text : innerText,
            Icon = Icon,
            Variant = Variant,
            OnClick = OnClick,
            Badge = Badge,
            Disabled = Disabled
        };

        if (context.Items.TryGetValue(typeof(ToolBarGroupContext), out var groupObj) && groupObj is ToolBarGroupContext grpContext)
        {
            grpContext.Items.Add(item);
        }
        else if (context.Items.TryGetValue(typeof(ToolBarContext), out var tbObj) && tbObj is ToolBarContext tbContext)
        {
            tbContext.Items.Add(item);
        }

        output.SuppressOutput();
    }
}

/// <summary>
/// ToolBar dikey ayırıcı çizgi.
/// </summary>
[HtmlTargetElement("panoptes-toolbar-separator", ParentTag = "panoptes-toolbar")]
public class ToolBarSeparatorTagHelper : TagHelper
{
    public override void Process(TagHelperContext context, TagHelperOutput output)
    {
        if (context.Items.TryGetValue(typeof(ToolBarContext), out var tbObj) && tbObj is ToolBarContext tbContext)
        {
            tbContext.Items.Add(new ToolBarItemModel { Type = "separator" });
        }
        output.SuppressOutput();
    }
}

/// <summary>
/// ToolBar dahili arama alanı.
/// </summary>
[HtmlTargetElement("panoptes-toolbar-search", ParentTag = "panoptes-toolbar")]
public class ToolBarSearchTagHelper : TagHelper
{
    [HtmlAttributeName("placeholder")]
    public string Placeholder { get; set; } = "Ara...";

    public override void Process(TagHelperContext context, TagHelperOutput output)
    {
        if (context.Items.TryGetValue(typeof(ToolBarContext), out var tbObj) && tbObj is ToolBarContext tbContext)
        {
            tbContext.Items.Add(new ToolBarItemModel
            {
                Type = "search",
                Placeholder = Placeholder
            });
        }
        output.SuppressOutput();
    }
}

public class ToolBarGroupContext
{
    public List<ToolBarItemModel> Items { get; set; } = new();
}

/// <summary>
/// Birbirine bitişik buton grubu.
/// </summary>
[HtmlTargetElement("panoptes-toolbar-group", ParentTag = "panoptes-toolbar")]
public class ToolBarGroupTagHelper : TagHelper
{
    public override async Task ProcessAsync(TagHelperContext context, TagHelperOutput output)
    {
        var groupContext = new ToolBarGroupContext();
        context.Items[typeof(ToolBarGroupContext)] = groupContext;

        await output.GetChildContentAsync();

        if (context.Items.TryGetValue(typeof(ToolBarContext), out var tbObj) && tbObj is ToolBarContext tbContext)
        {
            tbContext.Items.Add(new ToolBarItemModel
            {
                Type = "group",
                Children = groupContext.Items
            });
        }

        output.SuppressOutput();
    }
}
