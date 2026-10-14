using System;
using System.Collections.Generic;
using System.Linq;
using System.Text.Encodings.Web;
using System.Text.Json;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc.Rendering;
using Microsoft.AspNetCore.Razor.TagHelpers;
using Panoptes.AspNetCore.Models;

namespace Panoptes.AspNetCore.TagHelpers;

/// <summary>
/// Panoptes UI PanelBar bileşeni, modern, tekli/çoklu genişlemeli (Accordion) TagHelper bileşeni.
/// </summary>
[HtmlTargetElement("panoptes-panelbar")]
public class PanelBarTagHelper : TagHelper
{
    [HtmlAttributeName("id")]
    public string? Id { get; set; }

    /// <summary>
    /// Genişleme modu: "single" (akordeon - tek panel açık kalır) veya "multiple" (çoklu açılabilir).
    /// </summary>
    [HtmlAttributeName("expand-mode")]
    public string ExpandMode { get; set; } = "multiple"; // single, multiple

    [HtmlAttributeName("animation")]
    public string Animation { get; set; } = "fade"; // fade, none

    [HtmlAttributeName("on-select")]
    public string? OnSelect { get; set; }

    [HtmlAttributeName("on-expand")]
    public string? OnExpand { get; set; }

    [HtmlAttributeName("on-collapse")]
    public string? OnCollapse { get; set; }

    [HtmlAttributeName("class")]
    public string? CssClass { get; set; }

    public override async Task ProcessAsync(TagHelperContext context, TagHelperOutput output)
    {
        var id = !string.IsNullOrWhiteSpace(Id) ? Id : $"panoptes_panelbar_{Guid.NewGuid():N}";
        var panelContext = new PanelBarContext
        {
            Id = id,
            ExpandMode = ExpandMode.ToLowerInvariant(),
            Animation = Animation.ToLowerInvariant()
        };

        context.Items[typeof(PanelBarContext)] = panelContext;

        // Çocuk <panoptes-panel> etiketlerini yürüt ve bağlama topla
        await output.GetChildContentAsync();

        output.TagName = "div";
        output.TagMode = TagMode.StartTagAndEndTag;
        output.Attributes.SetAttribute("id", id);
        output.Attributes.SetAttribute("data-panoptes-panelbar", "true");
        output.Attributes.SetAttribute("data-expand-mode", panelContext.ExpandMode);
        output.Attributes.SetAttribute("data-animation", panelContext.Animation);

        if (!string.IsNullOrWhiteSpace(OnSelect))
            output.Attributes.SetAttribute("data-on-select", OnSelect);

        if (!string.IsNullOrWhiteSpace(OnExpand))
            output.Attributes.SetAttribute("data-on-expand", OnExpand);

        if (!string.IsNullOrWhiteSpace(OnCollapse))
            output.Attributes.SetAttribute("data-on-collapse", OnCollapse);

        var baseClass = $"panoptes-panelbar divide-y divide-slate-200 border border-slate-200 rounded-2xl bg-white shadow-2xs overflow-hidden {CssClass ?? ""}".Trim();
        output.Attributes.SetAttribute("class", baseClass);

        output.Content.Clear();

        for (int i = 0; i < panelContext.Panels.Count; i++)
        {
            var panel = panelContext.Panels[i];
            var panelItem = RenderPanelItem(panel, i, panelContext);
            output.Content.AppendHtml(panelItem);
        }
    }

    private TagBuilder RenderPanelItem(PanelBarItemModel panel, int index, PanelBarContext panelContext)
    {
        var itemDiv = new TagBuilder("div");
        itemDiv.AddCssClass("panoptes-panelbar-item");
        itemDiv.Attributes["data-panel-id"] = panel.Id;
        itemDiv.Attributes["data-index"] = index.ToString();

        // 1. Header Button
        var headerBtn = new TagBuilder("button");
        headerBtn.Attributes["type"] = "button";
        headerBtn.Attributes["data-panel-toggle"] = "true";
        headerBtn.Attributes["aria-expanded"] = panel.Expanded ? "true" : "false";

        var headerBaseClass = "w-full p-4 flex items-center justify-between text-left transition select-none " +
            (panel.Disabled
                ? "opacity-50 cursor-not-allowed bg-slate-50 text-slate-400"
                : "cursor-pointer hover:bg-slate-50/80 text-slate-800 font-semibold");
        headerBtn.AddCssClass(headerBaseClass);

        if (panel.Disabled)
        {
            headerBtn.Attributes["disabled"] = "disabled";
        }

        // Sol Kısım: İkon + Başlık + Rozet
        var leftGroup = new TagBuilder("div");
        leftGroup.AddCssClass("flex items-center gap-2.5 min-w-0");

        if (!string.IsNullOrWhiteSpace(panel.Icon))
        {
            var iconHtml = GetIconSvg(panel.Icon);
            leftGroup.InnerHtml.AppendHtml(iconHtml);
        }

        var titleSpan = new TagBuilder("span");
        titleSpan.AddCssClass("text-sm font-bold text-slate-800 truncate");
        titleSpan.InnerHtml.Append(panel.Title);
        leftGroup.InnerHtml.AppendHtml(titleSpan);

        if (!string.IsNullOrWhiteSpace(panel.Badge))
        {
            var badgeSpan = new TagBuilder("span");
            var badgeColorClass = panel.BadgeColor.ToLowerInvariant() switch
            {
                "emerald" => "bg-emerald-100 text-emerald-800 border-emerald-200",
                "amber" => "bg-amber-100 text-amber-800 border-amber-200",
                "red" => "bg-red-100 text-red-800 border-red-200",
                "purple" => "bg-purple-100 text-purple-800 border-purple-200",
                _ => "bg-blue-100 text-blue-800 border-blue-200"
            };
            badgeSpan.AddCssClass($"text-[10px] font-bold px-2 py-0.5 rounded-full border shrink-0 {badgeColorClass}");
            badgeSpan.InnerHtml.Append(panel.Badge);
            leftGroup.InnerHtml.AppendHtml(badgeSpan);
        }

        headerBtn.InnerHtml.AppendHtml(leftGroup);

        // Sağ Kısım: Dönen Chevron İkonu
        var chevronSvg = @"<svg class=""w-4 h-4 text-slate-400 transition-transform duration-200 transform panoptes-panel-chevron " + (panel.Expanded ? "rotate-180 text-blue-600" : "") + @""" fill=""none"" stroke=""currentColor"" viewBox=""0 0 24 24""><path stroke-linecap=""round"" stroke-linejoin=""round"" stroke-width=""2"" d=""M19 9l-7 7-7-7"" /></svg>";
        headerBtn.InnerHtml.AppendHtml(chevronSvg);

        itemDiv.InnerHtml.AppendHtml(headerBtn);

        // 2. Panel Content Body
        var contentDiv = new TagBuilder("div");
        contentDiv.AddCssClass("panoptes-panelbar-content");
        contentDiv.Attributes["data-panel-content"] = "true";

        if (!string.IsNullOrWhiteSpace(panel.ContentUrl))
        {
            contentDiv.Attributes["data-content-url"] = panel.ContentUrl;
        }

        if (!panel.Expanded)
        {
            contentDiv.AddCssClass("hidden");
        }

        var contentInner = new TagBuilder("div");
        contentInner.AddCssClass("p-5 border-t border-slate-100 bg-white text-xs text-slate-600 leading-relaxed");

        if (!string.IsNullOrWhiteSpace(panel.ContentUrl) && !panel.Expanded)
        {
            contentInner.InnerHtml.AppendHtml(@"<div class=""panoptes-panel-lazy-placeholder flex items-center justify-center p-6 text-slate-400 gap-2""><span class=""w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin""></span><span>Yükleniyor...</span></div>");
        }
        else
        {
            contentInner.InnerHtml.AppendHtml(panel.ContentHtml);
        }

        contentDiv.InnerHtml.AppendHtml(contentInner);
        itemDiv.InnerHtml.AppendHtml(contentDiv);

        return itemDiv;
    }

    private static string GetIconSvg(string iconName)
    {
        return iconName.ToLowerInvariant() switch
        {
            "user" or "profile" => @"<svg class=""w-4 h-4 text-slate-500"" fill=""none"" stroke=""currentColor"" viewBox=""0 0 24 24""><path stroke-linecap=""round"" stroke-linejoin=""round"" stroke-width=""2"" d=""M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"" /></svg>",
            "settings" or "gear" => @"<svg class=""w-4 h-4 text-slate-500"" fill=""none"" stroke=""currentColor"" viewBox=""0 0 24 24""><path stroke-linecap=""round"" stroke-linejoin=""round"" stroke-width=""2"" d=""M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z""/><path stroke-linecap=""round"" stroke-linejoin=""round"" stroke-width=""2"" d=""M15 12a3 3 0 11-6 0 3 3 0 016 0z"" /></svg>",
            "shield" or "security" => @"<svg class=""w-4 h-4 text-slate-500"" fill=""none"" stroke=""currentColor"" viewBox=""0 0 24 24""><path stroke-linecap=""round"" stroke-linejoin=""round"" stroke-width=""2"" d=""M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"" /></svg>",
            "chart" or "analytics" => @"<svg class=""w-4 h-4 text-slate-500"" fill=""none"" stroke=""currentColor"" viewBox=""0 0 24 24""><path stroke-linecap=""round"" stroke-linejoin=""round"" stroke-width=""2"" d=""M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"" /></svg>",
            "dollar" or "billing" => @"<svg class=""w-4 h-4 text-slate-500"" fill=""none"" stroke=""currentColor"" viewBox=""0 0 24 24""><path stroke-linecap=""round"" stroke-linejoin=""round"" stroke-width=""2"" d=""M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"" /></svg>",
            "file" or "doc" => @"<svg class=""w-4 h-4 text-slate-500"" fill=""none"" stroke=""currentColor"" viewBox=""0 0 24 24""><path stroke-linecap=""round"" stroke-linejoin=""round"" stroke-width=""2"" d=""M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"" /></svg>",
            "bell" => @"<svg class=""w-4 h-4 text-slate-500"" fill=""none"" stroke=""currentColor"" viewBox=""0 0 24 24""><path stroke-linecap=""round"" stroke-linejoin=""round"" stroke-width=""2"" d=""M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"" /></svg>",
            "help" or "faq" => @"<svg class=""w-4 h-4 text-slate-500"" fill=""none"" stroke=""currentColor"" viewBox=""0 0 24 24""><path stroke-linecap=""round"" stroke-linejoin=""round"" stroke-width=""2"" d=""M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"" /></svg>",
            _ => @"<svg class=""w-4 h-4 text-slate-500"" fill=""none"" stroke=""currentColor"" viewBox=""0 0 24 24""><path stroke-linecap=""round"" stroke-linejoin=""round"" stroke-width=""2"" d=""M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"" /></svg>"
        };
    }
}

/// <summary>
/// PanelBar içerisindeki tek bir paneli temsil eden çocuk TagHelper.
/// </summary>
[HtmlTargetElement("panoptes-panel", ParentTag = "panoptes-panelbar")]
[HtmlTargetElement("panoptes-panelbar-item", ParentTag = "panoptes-panelbar")]
public class PanelBarItemTagHelper : TagHelper
{
    [HtmlAttributeName("id")]
    public string? Id { get; set; }

    [HtmlAttributeName("title")]
    public string Title { get; set; } = string.Empty;

    [HtmlAttributeName("icon")]
    public string? Icon { get; set; }

    [HtmlAttributeName("badge")]
    public string? Badge { get; set; }

    [HtmlAttributeName("badge-color")]
    public string BadgeColor { get; set; } = "blue";

    [HtmlAttributeName("expanded")]
    public bool Expanded { get; set; }

    [HtmlAttributeName("disabled")]
    public bool Disabled { get; set; }

    [HtmlAttributeName("content-url")]
    public string? ContentUrl { get; set; }

    public override async Task ProcessAsync(TagHelperContext context, TagHelperOutput output)
    {
        if (!context.Items.TryGetValue(typeof(PanelBarContext), out var obj) || obj is not PanelBarContext panelContext)
        {
            output.SuppressOutput();
            return;
        }

        var childContent = await output.GetChildContentAsync();
        var htmlContent = childContent.GetContent();

        var panelId = !string.IsNullOrWhiteSpace(Id) ? Id : $"panel_{Guid.NewGuid():N}";

        panelContext.Panels.Add(new PanelBarItemModel
        {
            Id = panelId,
            Title = Title,
            Icon = Icon,
            Badge = Badge,
            BadgeColor = BadgeColor,
            Expanded = Expanded,
            Disabled = Disabled,
            ContentUrl = ContentUrl,
            ContentHtml = htmlContent
        });

        // Çıktıyı ebeveyn <panoptes-panelbar> yönetecek
        output.SuppressOutput();
    }
}
