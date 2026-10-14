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
/// Panoptes UI TabStrip bileşeni, modern, çok yönlü, animasyonlu ve sekmeli panel TagHelper bileşeni.
/// </summary>
[HtmlTargetElement("panoptes-tabstrip")]
public class TabStripTagHelper : TagHelper
{
    [HtmlAttributeName("id")]
    public string? Id { get; set; }

    [HtmlAttributeName("tab-position")]
    public string TabPosition { get; set; } = "top"; // top, bottom, left, right

    [HtmlAttributeName("animation")]
    public string Animation { get; set; } = "fade"; // fade, none

    [HtmlAttributeName("closable")]
    public bool Closable { get; set; }

    [HtmlAttributeName("on-select")]
    public string? OnSelect { get; set; }

    [HtmlAttributeName("on-close")]
    public string? OnClose { get; set; }

    [HtmlAttributeName("class")]
    public string? CssClass { get; set; }

    public override async Task ProcessAsync(TagHelperContext context, TagHelperOutput output)
    {
        var id = !string.IsNullOrWhiteSpace(Id) ? Id : $"panoptes_tabstrip_{Guid.NewGuid():N}";
        var tabContext = new TabStripContext
        {
            Id = id,
            TabPosition = TabPosition.ToLowerInvariant(),
            Animation = Animation.ToLowerInvariant(),
            Closable = Closable
        };

        context.Items[typeof(TabStripContext)] = tabContext;

        // Çocuk <panoptes-tab> etiketlerini yürüt ve bağlama topla
        await output.GetChildContentAsync();

        // Eğer hiçbir sekme aktif işaretlenmemişse ilk aktif edilebilir sekmeyi seç
        if (!tabContext.Tabs.Any(t => t.Active) && tabContext.Tabs.Count > 0)
        {
            var firstEnabled = tabContext.Tabs.FirstOrDefault(t => !t.Disabled);
            if (firstEnabled != null)
            {
                firstEnabled.Active = true;
            }
        }

        output.TagName = "div";
        output.TagMode = TagMode.StartTagAndEndTag;
        output.Attributes.SetAttribute("id", id);
        output.Attributes.SetAttribute("data-panoptes-tabstrip", "true");
        output.Attributes.SetAttribute("data-tab-position", tabContext.TabPosition);
        output.Attributes.SetAttribute("data-animation", tabContext.Animation);

        if (!string.IsNullOrWhiteSpace(OnSelect))
            output.Attributes.SetAttribute("data-on-select", OnSelect);

        if (!string.IsNullOrWhiteSpace(OnClose))
            output.Attributes.SetAttribute("data-on-close", OnClose);

        var isVertical = tabContext.TabPosition == "left" || tabContext.TabPosition == "right";
        var isBottom = tabContext.TabPosition == "bottom";
        var isRight = tabContext.TabPosition == "right";

        var baseLayoutClass = isVertical
            ? $"panoptes-tabstrip panoptes-tabstrip-vertical flex flex-col md:flex-row {(isRight ? "md:flex-row-reverse" : "")} gap-4 {CssClass ?? ""}".Trim()
            : $"panoptes-tabstrip panoptes-tabstrip-horizontal flex flex-col {(isBottom ? "flex-col-reverse" : "")} {CssClass ?? ""}".Trim();

        output.Attributes.SetAttribute("class", baseLayoutClass);

        // 1. Sekme Başlık Çubuğu (Tab Navigation Strip)
        var navBuilder = new TagBuilder("div");
        var navClass = isVertical
            ? "panoptes-tabstrip-nav flex flex-col space-y-1 w-full md:w-64 shrink-0 border-b md:border-b-0 " + (isRight ? "md:border-l border-slate-200 p-2 bg-slate-50/70 rounded-2xl" : "md:border-r border-slate-200 p-2 bg-slate-50/70 rounded-2xl")
            : (isBottom
                ? "panoptes-tabstrip-nav flex items-center border-t border-slate-200 gap-1 overflow-x-auto p-1.5 bg-slate-50/80 rounded-b-2xl"
                : "panoptes-tabstrip-nav flex items-center border-b border-slate-200 gap-1 overflow-x-auto p-1.5 bg-slate-50/80 rounded-t-2xl");
        navBuilder.AddCssClass(navClass);
        navBuilder.Attributes["role"] = "tablist";

        // 2. Sekme İçerik Alanı (Tab Content Area)
        var contentWrapper = new TagBuilder("div");
        var contentClass = isVertical
            ? "panoptes-tabstrip-contents flex-1 min-w-0 bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs"
            : (isBottom
                ? "panoptes-tabstrip-contents flex-1 min-w-0 bg-white rounded-t-2xl border border-b-0 border-slate-200 p-6 shadow-2xs"
                : "panoptes-tabstrip-contents flex-1 min-w-0 bg-white rounded-b-2xl border border-t-0 border-slate-200 p-6 shadow-2xs");
        contentWrapper.AddCssClass(contentClass);

        for (int i = 0; i < tabContext.Tabs.Count; i++)
        {
            var tab = tabContext.Tabs[i];
            var tabButtonId = $"{id}_tab_{i}";
            var paneId = $"{id}_pane_{i}";

            // Sekme Başlık Butonu
            var btn = new TagBuilder("button");
            btn.Attributes["type"] = "button";
            btn.Attributes["id"] = tabButtonId;
            btn.Attributes["role"] = "tab";
            btn.Attributes["aria-controls"] = paneId;
            btn.Attributes["aria-selected"] = tab.Active ? "true" : "false";
            btn.Attributes["data-tab-index"] = i.ToString();

            if (!string.IsNullOrWhiteSpace(tab.ContentUrl))
            {
                btn.Attributes["data-content-url"] = tab.ContentUrl;
            }

            if (tab.Disabled)
            {
                btn.Attributes["disabled"] = "disabled";
            }

            var btnBaseClass = isVertical
                ? "panoptes-tab-btn flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition text-left w-full select-none"
                : "panoptes-tab-btn flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold transition whitespace-nowrap select-none";

            if (tab.Disabled)
            {
                btnBaseClass += " opacity-50 cursor-not-allowed text-slate-400 bg-transparent";
            }
            else if (tab.Active)
            {
                btnBaseClass += " active bg-white text-blue-700 shadow-sm border border-slate-200/80 font-bold";
            }
            else
            {
                btnBaseClass += " text-slate-600 hover:text-slate-900 hover:bg-slate-200/60";
            }

            btn.AddCssClass(btnBaseClass);

            // Başlık içeriği: İkon + Başlık + Rozet + Kapat butonu
            var leftGroup = new TagBuilder("span");
            leftGroup.AddCssClass("flex items-center gap-2 min-w-0");

            if (!string.IsNullOrWhiteSpace(tab.Icon))
            {
                var iconSpan = new TagBuilder("span");
                iconSpan.AddCssClass("panoptes-tab-icon shrink-0");
                iconSpan.Attributes["data-icon"] = tab.Icon;
                leftGroup.InnerHtml.AppendHtml(iconSpan);
            }

            var titleSpan = new TagBuilder("span");
            titleSpan.AddCssClass("panoptes-tab-title truncate");
            titleSpan.InnerHtml.Append(tab.Title);
            leftGroup.InnerHtml.AppendHtml(titleSpan);

            btn.InnerHtml.AppendHtml(leftGroup);

            // Sağ grup: Rozet ve Kapatma Butonu
            var rightGroup = new TagBuilder("span");
            rightGroup.AddCssClass("flex items-center gap-1.5 shrink-0 ml-auto");

            if (!string.IsNullOrWhiteSpace(tab.Badge))
            {
                var badgeSpan = new TagBuilder("span");
                var badgeColorClass = tab.BadgeColor.ToLowerInvariant() switch
                {
                    "emerald" => "bg-emerald-100 text-emerald-800",
                    "amber" => "bg-amber-100 text-amber-800",
                    "red" => "bg-red-100 text-red-800",
                    "purple" => "bg-purple-100 text-purple-800",
                    "slate" => "bg-slate-200 text-slate-700",
                    _ => "bg-blue-100 text-blue-800"
                };
                badgeSpan.AddCssClass($"px-1.5 py-0.5 rounded-full text-[10px] font-bold {badgeColorClass}");
                badgeSpan.InnerHtml.Append(tab.Badge);
                rightGroup.InnerHtml.AppendHtml(badgeSpan);
            }

            if (tab.Closable)
            {
                var closeBtn = new TagBuilder("span");
                closeBtn.AddCssClass("panoptes-tab-close p-0.5 rounded hover:bg-slate-300/60 text-slate-400 hover:text-slate-700 transition cursor-pointer ml-1");
                closeBtn.Attributes["title"] = "Sekmeyi Kapat";
                closeBtn.Attributes["role"] = "button";
                closeBtn.InnerHtml.AppendHtml("<svg class=\"w-3 h-3\" fill=\"none\" stroke=\"currentColor\" viewBox=\"0 0 24 24\"><path stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"2\" d=\"M6 18L18 6M6 6l12 12\"/></svg>");
                rightGroup.InnerHtml.AppendHtml(closeBtn);
            }

            btn.InnerHtml.AppendHtml(rightGroup);
            navBuilder.InnerHtml.AppendHtml(btn);

            // Sekme İçerik Paneli (Pane)
            var pane = new TagBuilder("div");
            pane.Attributes["id"] = paneId;
            pane.Attributes["role"] = "tabpanel";
            pane.Attributes["aria-labelledby"] = tabButtonId;
            pane.Attributes["data-tab-index"] = i.ToString();

            var paneBaseClass = "panoptes-tab-pane";
            if (!tab.Active)
            {
                paneBaseClass += " hidden";
            }
            else
            {
                paneBaseClass += " block";
                if (tabContext.Animation == "fade")
                {
                    paneBaseClass += " animate-fadeIn";
                }
            }

            pane.AddCssClass(paneBaseClass);

            if (!string.IsNullOrWhiteSpace(tab.ContentUrl) && string.IsNullOrWhiteSpace(tab.ContentHtml))
            {
                // Lazy loading spinner iskeleti
                pane.InnerHtml.AppendHtml(@"<div class=""panoptes-tab-loading flex items-center justify-center p-8 text-slate-400 text-xs font-semibold gap-2"">
                    <svg class=""animate-spin h-5 w-5 text-blue-600"" fill=""none"" viewBox=""0 0 24 24"">
                        <circle class=""opacity-25"" cx=""12"" cy=""12"" r=""10"" stroke=""currentColor"" stroke-width=""4""></circle>
                        <path class=""opacity-75"" fill=""currentColor"" d=""M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z""></path>
                    </svg>
                    <span>Yükleniyor...</span>
                </div>");
            }
            else
            {
                pane.InnerHtml.AppendHtml(tab.ContentHtml);
            }

            contentWrapper.InnerHtml.AppendHtml(pane);
        }

        output.Content.AppendHtml(navBuilder);
        output.Content.AppendHtml(contentWrapper);
    }
}

/// <summary>
/// Panoptes TabStrip içerisindeki tek bir sekmeyi tanımlayan TagHelper bileşeni.
/// </summary>
[HtmlTargetElement("panoptes-tab", ParentTag = "panoptes-tabstrip")]
public class TabTagHelper : TagHelper
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

    [HtmlAttributeName("active")]
    public bool Active { get; set; }

    [HtmlAttributeName("disabled")]
    public bool Disabled { get; set; }

    [HtmlAttributeName("closable")]
    public bool? Closable { get; set; }

    [HtmlAttributeName("content-url")]
    public string? ContentUrl { get; set; }

    public override async Task ProcessAsync(TagHelperContext context, TagHelperOutput output)
    {
        if (!context.Items.TryGetValue(typeof(TabStripContext), out var ctxObj) || ctxObj is not TabStripContext tabStripContext)
        {
            output.SuppressOutput();
            return;
        }

        var childContent = await output.GetChildContentAsync();
        var htmlContent = childContent.GetContent();

        var tabModel = new TabItemModel
        {
            Id = !string.IsNullOrWhiteSpace(Id) ? Id : $"tab_{Guid.NewGuid():N}",
            Title = Title,
            Icon = Icon,
            Badge = Badge,
            BadgeColor = BadgeColor,
            Active = Active,
            Disabled = Disabled,
            Closable = Closable ?? tabStripContext.Closable,
            ContentUrl = ContentUrl,
            ContentHtml = htmlContent
        };

        tabStripContext.Tabs.Add(tabModel);
        output.SuppressOutput();
    }
}
