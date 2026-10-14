using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc.Rendering;
using Microsoft.AspNetCore.Razor.TagHelpers;
using Panoptes.AspNetCore.Models;

namespace Panoptes.AspNetCore.TagHelpers;

/// <summary>
/// Panoptes UI Drawer bileşeni, modern, overlay/push modlu yan çekmece navigasyon TagHelper'ı.
/// </summary>
[HtmlTargetElement("panoptes-drawer")]
public class DrawerTagHelper : TagHelper
{
    [HtmlAttributeName("id")]
    public string? Id { get; set; }

    [HtmlAttributeName("position")]
    public string Position { get; set; } = "left"; // left, right

    [HtmlAttributeName("mode")]
    public string Mode { get; set; } = "overlay"; // overlay, push

    [HtmlAttributeName("title")]
    public string? Title { get; set; }

    [HtmlAttributeName("expanded")]
    public bool Expanded { get; set; }

    [HtmlAttributeName("close-on-backdrop")]
    public bool CloseOnBackdropClick { get; set; } = true;

    [HtmlAttributeName("class")]
    public string? CssClass { get; set; }

    public override async Task ProcessAsync(TagHelperContext context, TagHelperOutput output)
    {
        var id = !string.IsNullOrWhiteSpace(Id) ? Id : $"panoptes_drawer_{Guid.NewGuid():N}";
        var drawerContext = new DrawerContext
        {
            Id = id,
            Position = Position.ToLowerInvariant(),
            Mode = Mode.ToLowerInvariant(),
            Expanded = Expanded,
            Title = Title,
            CloseOnBackdropClick = CloseOnBackdropClick
        };

        context.Items[typeof(DrawerContext)] = drawerContext;

        // Çocuk <panoptes-drawer-item> veya serbest HTML içeriğini al
        var childContent = await output.GetChildContentAsync();

        output.TagName = "div";
        output.TagMode = TagMode.StartTagAndEndTag;
        output.Attributes.SetAttribute("id", id);
        output.Attributes.SetAttribute("data-panoptes-drawer", "true");
        output.Attributes.SetAttribute("data-position", drawerContext.Position);
        output.Attributes.SetAttribute("data-mode", drawerContext.Mode);
        output.Attributes.SetAttribute("data-expanded", drawerContext.Expanded ? "true" : "false");
        output.Attributes.SetAttribute("data-close-backdrop", drawerContext.CloseOnBackdropClick ? "true" : "false");

        var containerClass = "panoptes-drawer-root fixed inset-0 z-50 pointer-events-none transition-opacity duration-300 " +
                             (drawerContext.Expanded ? "opacity-100" : "opacity-0 pointer-events-none");
        output.Attributes.SetAttribute("class", containerClass);

        output.Content.Clear();

        // 1. Backdrop (Arkaplan Karartma)
        var backdropDiv = new TagBuilder("div");
        backdropDiv.AddCssClass("panoptes-drawer-backdrop fixed inset-0 bg-slate-900/50 backdrop-blur-xs transition-opacity duration-300 " +
                                (drawerContext.Expanded ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"));
        backdropDiv.Attributes["data-drawer-backdrop"] = "true";
        output.Content.AppendHtml(backdropDiv);

        // 2. Drawer Panel (Yan Menü Gövdesi)
        var panelDiv = new TagBuilder("div");
        var posClass = drawerContext.Position == "right"
            ? "right-0 top-0 bottom-0 " + (drawerContext.Expanded ? "translate-x-0" : "translate-x-full")
            : "left-0 top-0 bottom-0 " + (drawerContext.Expanded ? "translate-x-0" : "-translate-x-full");

        panelDiv.AddCssClass($"panoptes-drawer-panel fixed {posClass} w-80 max-w-[85vw] bg-white shadow-2xl flex flex-col transition-transform duration-300 ease-in-out pointer-events-auto {CssClass ?? ""}");
        panelDiv.Attributes["data-drawer-panel"] = "true";

        // Panel Başlığı (Header)
        var headerDiv = new TagBuilder("div");
        headerDiv.AddCssClass("p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50");

        var titleSpan = new TagBuilder("span");
        titleSpan.AddCssClass("text-sm font-bold text-slate-800 flex items-center gap-2");
        titleSpan.InnerHtml.Append(drawerContext.Title ?? "Menü");
        headerDiv.InnerHtml.AppendHtml(titleSpan);

        var closeBtn = new TagBuilder("button");
        closeBtn.Attributes["type"] = "button";
        closeBtn.Attributes["data-drawer-close"] = "true";
        closeBtn.AddCssClass("p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition");
        closeBtn.InnerHtml.AppendHtml(@"<svg class=""w-5 h-5"" fill=""none"" stroke=""currentColor"" viewBox=""0 0 24 24""><path stroke-linecap=""round"" stroke-linejoin=""round"" stroke-width=""2"" d=""M6 18L18 6M6 6l12 12"" /></svg>");
        headerDiv.InnerHtml.AppendHtml(closeBtn);

        panelDiv.InnerHtml.AppendHtml(headerDiv);

        // Panel İçeriği (Body)
        var bodyDiv = new TagBuilder("div");
        bodyDiv.AddCssClass("flex-1 overflow-y-auto p-4 space-y-1 text-xs text-slate-600");

        if (drawerContext.Items.Count > 0)
        {
            var navList = new TagBuilder("nav");
            navList.AddCssClass("space-y-1");

            foreach (var item in drawerContext.Items)
            {
                if (item.IsSeparator)
                {
                    var sep = new TagBuilder("div");
                    sep.AddCssClass("my-2 border-t border-slate-100");
                    navList.InnerHtml.AppendHtml(sep);
                    continue;
                }

                var itemEl = RenderDrawerItem(item);
                navList.InnerHtml.AppendHtml(itemEl);
            }

            bodyDiv.InnerHtml.AppendHtml(navList);
        }
        else
        {
            bodyDiv.InnerHtml.AppendHtml(childContent);
        }

        panelDiv.InnerHtml.AppendHtml(bodyDiv);
        output.Content.AppendHtml(panelDiv);
    }

    private TagBuilder RenderDrawerItem(DrawerItemModel item)
    {
        var link = new TagBuilder("a");
        link.Attributes["href"] = !string.IsNullOrWhiteSpace(item.Url) ? item.Url : "#";

        var baseClass = "flex items-center justify-between px-3 py-2.5 rounded-xl font-medium transition " +
            (item.IsActive
                ? "bg-blue-50 text-blue-700 font-bold"
                : item.Disabled
                    ? "opacity-50 cursor-not-allowed text-slate-400"
                    : "text-slate-700 hover:bg-slate-100 hover:text-blue-600");

        link.AddCssClass(baseClass);

        var leftGroup = new TagBuilder("div");
        leftGroup.AddCssClass("flex items-center gap-2.5 min-w-0");

        if (!string.IsNullOrWhiteSpace(item.Icon))
        {
            leftGroup.InnerHtml.AppendHtml(GetIconSvg(item.Icon));
        }

        var textSpan = new TagBuilder("span");
        textSpan.AddCssClass("truncate");
        textSpan.InnerHtml.Append(item.Text ?? string.Empty);
        leftGroup.InnerHtml.AppendHtml(textSpan);

        link.InnerHtml.AppendHtml(leftGroup);

        if (!string.IsNullOrWhiteSpace(item.Badge))
        {
            var badgeSpan = new TagBuilder("span");
            var badgeColorClass = item.BadgeColor.ToLowerInvariant() switch
            {
                "emerald" => "bg-emerald-100 text-emerald-800",
                "amber" => "bg-amber-100 text-amber-800",
                "red" => "bg-red-100 text-red-800",
                _ => "bg-blue-100 text-blue-800"
            };
            badgeSpan.AddCssClass($"text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 {badgeColorClass}");
            badgeSpan.InnerHtml.Append(item.Badge);
            link.InnerHtml.AppendHtml(badgeSpan);
        }

        return link;
    }

    private static string GetIconSvg(string iconName)
    {
        return iconName.ToLowerInvariant() switch
        {
            "home" => @"<svg class=""w-4 h-4 text-slate-500"" fill=""none"" stroke=""currentColor"" viewBox=""0 0 24 24""><path stroke-linecap=""round"" stroke-linejoin=""round"" stroke-width=""2"" d=""M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6""/></svg>",
            "inbox" => @"<svg class=""w-4 h-4 text-slate-500"" fill=""none"" stroke=""currentColor"" viewBox=""0 0 24 24""><path stroke-linecap=""round"" stroke-linejoin=""round"" stroke-width=""2"" d=""M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4""/></svg>",
            "calendar" => @"<svg class=""w-4 h-4 text-slate-500"" fill=""none"" stroke=""currentColor"" viewBox=""0 0 24 24""><path stroke-linecap=""round"" stroke-linejoin=""round"" stroke-width=""2"" d=""M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z""/></svg>",
            "folder" => @"<svg class=""w-4 h-4 text-slate-500"" fill=""none"" stroke=""currentColor"" viewBox=""0 0 24 24""><path stroke-linecap=""round"" stroke-linejoin=""round"" stroke-width=""2"" d=""M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z""/></svg>",
            "settings" => @"<svg class=""w-4 h-4 text-slate-500"" fill=""none"" stroke=""currentColor"" viewBox=""0 0 24 24""><path stroke-linecap=""round"" stroke-linejoin=""round"" stroke-width=""2"" d=""M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z""/><path stroke-linecap=""round"" stroke-linejoin=""round"" stroke-width=""2"" d=""M15 12a3 3 0 11-6 0 3 3 0 016 0z""/></svg>",
            "user" => @"<svg class=""w-4 h-4 text-slate-500"" fill=""none"" stroke=""currentColor"" viewBox=""0 0 24 24""><path stroke-linecap=""round"" stroke-linejoin=""round"" stroke-width=""2"" d=""M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z""/></svg>",
            _ => @"<svg class=""w-4 h-4 text-slate-500"" fill=""none"" stroke=""currentColor"" viewBox=""0 0 24 24""><path stroke-linecap=""round"" stroke-linejoin=""round"" stroke-width=""2"" d=""M13 10V3L4 14h7v7l9-11h-7z""/></svg>"
        };
    }
}

/// <summary>
/// Drawer içerisindeki navigasyon öğesi.
/// </summary>
[HtmlTargetElement("panoptes-drawer-item", ParentTag = "panoptes-drawer")]
public class DrawerItemTagHelper : TagHelper
{
    [HtmlAttributeName("text")]
    public string? Text { get; set; }

    [HtmlAttributeName("url")]
    public string? Url { get; set; }

    [HtmlAttributeName("icon")]
    public string? Icon { get; set; }

    [HtmlAttributeName("badge")]
    public string? Badge { get; set; }

    [HtmlAttributeName("badge-color")]
    public string BadgeColor { get; set; } = "blue";

    [HtmlAttributeName("is-active")]
    public bool IsActive { get; set; }

    [HtmlAttributeName("disabled")]
    public bool Disabled { get; set; }

    [HtmlAttributeName("is-separator")]
    public bool IsSeparator { get; set; }

    public override async Task ProcessAsync(TagHelperContext context, TagHelperOutput output)
    {
        if (!context.Items.TryGetValue(typeof(DrawerContext), out var obj) || obj is not DrawerContext drawerContext)
        {
            output.SuppressOutput();
            return;
        }

        var childContent = await output.GetChildContentAsync();
        var innerText = childContent.GetContent().Trim();

        var itemText = !string.IsNullOrWhiteSpace(Text) ? Text : innerText;

        drawerContext.Items.Add(new DrawerItemModel
        {
            Text = itemText,
            Url = Url,
            Icon = Icon,
            Badge = Badge,
            BadgeColor = BadgeColor,
            IsActive = IsActive,
            Disabled = Disabled,
            IsSeparator = IsSeparator
        });

        output.SuppressOutput();
    }
}
