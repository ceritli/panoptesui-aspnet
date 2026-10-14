using System;
using System.Collections.Generic;
using System.Text.Encodings.Web;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc.Rendering;
using Microsoft.AspNetCore.Razor.TagHelpers;
using Panoptes.AspNetCore.Models;

namespace Panoptes.AspNetCore.TagHelpers;

/// <summary>
/// Panoptes UI ActionSheet bileşeni, modern mobil/masaüstü alttan açılan eylem sayfası (bottom-sheet modal) TagHelper'ı.
/// </summary>
[HtmlTargetElement("panoptes-actionsheet")]
public class ActionSheetTagHelper : TagHelper
{
    [HtmlAttributeName("id")]
    public string? Id { get; set; }

    [HtmlAttributeName("title")]
    public string? Title { get; set; }

    [HtmlAttributeName("header-text")]
    public string? HeaderText { get => Title; set => Title = value; }

    [HtmlAttributeName("subtitle")]
    public string? Subtitle { get; set; }

    [HtmlAttributeName("description")]
    public string? Description { get => Subtitle; set => Subtitle = value; }

    [HtmlAttributeName("modal")]
    public bool Modal { get; set; } = true;

    [HtmlAttributeName("close-button")]
    public bool CloseButton { get; set; } = true;

    [HtmlAttributeName("fullscreen")]
    public bool Fullscreen { get; set; } = false;

    [HtmlAttributeName("animation")]
    public string Animation { get; set; } = "slide"; // slide, fade, none

    [HtmlAttributeName("dir")]
    public string? Dir { get; set; }

    [HtmlAttributeName("class")]
    public string? CssClass { get; set; }

    [HtmlAttributeName("on-open")]
    public string? OnOpen { get; set; }

    [HtmlAttributeName("on-close")]
    public string? OnClose { get; set; }

    [HtmlAttributeName("on-select")]
    public string? OnSelect { get; set; }

    [HtmlAttributeName("items")]
    public IEnumerable<ActionSheetItemModel>? Items { get; set; }

    public override async Task ProcessAsync(TagHelperContext context, TagHelperOutput output)
    {
        var id = !string.IsNullOrWhiteSpace(Id) ? Id : $"panoptes_as_{Guid.NewGuid():N}";

        var actionSheetContext = new ActionSheetContext
        {
            Id = id,
            Title = Title,
            Subtitle = Subtitle,
            Modal = Modal,
            CloseButton = CloseButton,
            Fullscreen = Fullscreen,
            Animation = Animation
        };

        context.Items[typeof(ActionSheetContext)] = actionSheetContext;

        var childContent = await output.GetChildContentAsync();

        output.TagName = "div";
        output.TagMode = TagMode.StartTagAndEndTag;
        output.Attributes.SetAttribute("id", id);
        output.Attributes.SetAttribute("data-panoptes-actionsheet", "true");
        output.Attributes.SetAttribute("data-modal", Modal.ToString().ToLowerInvariant());
        output.Attributes.SetAttribute("data-animation", Animation.ToLowerInvariant());
        output.Attributes.SetAttribute("data-fullscreen", Fullscreen.ToString().ToLowerInvariant());
        output.Attributes.SetAttribute("role", "dialog");
        output.Attributes.SetAttribute("aria-modal", Modal.ToString().ToLowerInvariant());
        output.Attributes.SetAttribute("style", "display: none;");

        if (!string.IsNullOrWhiteSpace(OnOpen))
            output.Attributes.SetAttribute("data-on-open", OnOpen);
        if (!string.IsNullOrWhiteSpace(OnClose))
            output.Attributes.SetAttribute("data-on-close", OnClose);
        if (!string.IsNullOrWhiteSpace(OnSelect))
            output.Attributes.SetAttribute("data-on-select", OnSelect);

        if (!string.IsNullOrWhiteSpace(Dir))
            output.Attributes.SetAttribute("dir", Dir.ToLowerInvariant());

        var existingClass = output.Attributes["class"]?.Value?.ToString() ?? "";
        output.Attributes.SetAttribute("class", $"panoptes-actionsheet-wrapper k-actionsheet-container {existingClass} {CssClass}".Trim());

        // Header HTML
        var headerHtml = "";
        if (!string.IsNullOrWhiteSpace(Title) || CloseButton)
        {
            var titleHtml = !string.IsNullOrWhiteSpace(Title)
                ? $@"<h3 class=""panoptes-actionsheet-title text-base font-bold text-slate-900 leading-snug"">{HtmlEncoder.Default.Encode(Title)}</h3>"
                : "";

            var subtitleHtml = !string.IsNullOrWhiteSpace(Subtitle)
                ? $@"<p class=""panoptes-actionsheet-subtitle text-xs text-slate-500 mt-0.5 leading-snug"">{HtmlEncoder.Default.Encode(Subtitle)}</p>"
                : "";

            var closeBtnHtml = CloseButton
                ? @"<button type=""button"" class=""panoptes-actionsheet-btn-close p-1.5 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"" aria-label=""Kapat"">
                      <svg class=""w-4 h-4"" fill=""none"" stroke=""currentColor"" viewBox=""0 0 24 24"">
                        <path stroke-linecap=""round"" stroke-linejoin=""round"" stroke-width=""2"" d=""M6 18L18 6M6 6l12 12""/>
                      </svg>
                   </button>"
                : "";

            headerHtml = $@"<div class=""panoptes-actionsheet-header flex items-start justify-between p-4 border-b border-slate-100"">
                              <div class=""panoptes-actionsheet-header-text min-w-0 pr-3"">
                                  {titleHtml}
                                  {subtitleHtml}
                              </div>
                              {closeBtnHtml}
                           </div>";
        }

        // Programmatic items if any
        var itemsHtml = "";
        if (Items != null)
        {
            var sb = new System.Text.StringBuilder();
            foreach (var it in Items)
            {
                var itemId = !string.IsNullOrWhiteSpace(it.Id) ? it.Id : $"as_it_{Guid.NewGuid():N}";
                var themeClass = it.ThemeColor.ToLowerInvariant() switch
                {
                    "primary" => "theme-primary text-indigo-600 hover:bg-indigo-50",
                    "danger" or "destructive" => "theme-danger text-rose-600 hover:bg-rose-50",
                    "warning" => "theme-warning text-amber-600 hover:bg-amber-50",
                    "success" => "theme-success text-emerald-600 hover:bg-emerald-50",
                    _ => "theme-default text-slate-700 hover:bg-slate-50"
                };

                var iconHtml = !string.IsNullOrWhiteSpace(it.Icon)
                    ? (it.Icon.StartsWith("<svg")
                        ? $@"<span class=""panoptes-actionsheet-item-icon shrink-0 w-5 h-5 flex items-center justify-center"">{it.Icon}</span>"
                        : $@"<span class=""panoptes-actionsheet-item-icon shrink-0 w-5 h-5 flex items-center justify-center {it.Icon}""></span>")
                    : (!string.IsNullOrWhiteSpace(it.ImageUrl)
                        ? $@"<img src=""{it.ImageUrl}"" alt="""" class=""panoptes-actionsheet-item-image shrink-0 w-6 h-6 rounded-full object-cover"" />"
                        : "");

                var descHtml = !string.IsNullOrWhiteSpace(it.Description)
                    ? $@"<span class=""panoptes-actionsheet-item-desc text-[11px] text-slate-400 block mt-0.5 leading-tight"">{HtmlEncoder.Default.Encode(it.Description)}</span>"
                    : "";

                var tag = !string.IsNullOrWhiteSpace(it.Url) ? "a" : "div";
                var hrefAttr = !string.IsNullOrWhiteSpace(it.Url) ? $@"href=""{it.Url}""" : "";
                var clickAttr = !string.IsNullOrWhiteSpace(it.Click) ? $@"onclick=""{it.Click}""" : "";
                var disabledClass = it.Disabled ? "opacity-40 cursor-not-allowed pointer-events-none" : "cursor-pointer active:scale-[0.99]";

                sb.Append($@"<{tag} {hrefAttr} id=""{itemId}"" data-item-id=""{itemId}"" role=""button"" tabindex=""{(it.Disabled ? -1 : 0)}"" {clickAttr} class=""panoptes-actionsheet-item k-actionsheet-item {themeClass} {disabledClass} {it.CssClass}"">
                                {iconHtml}
                                <div class=""panoptes-actionsheet-item-text-wrapper min-w-0 flex-1"">
                                    <span class=""panoptes-actionsheet-item-title text-sm font-semibold block leading-tight truncate"">{HtmlEncoder.Default.Encode(it.Text)}</span>
                                    {descHtml}
                                </div>
                            </{tag}>");
            }
            itemsHtml = sb.ToString();
        }

        var overlayHtml = Modal ? @"<div class=""panoptes-actionsheet-overlay""></div>" : "";

        var fullHtml = $@"
            {overlayHtml}
            <div class=""panoptes-actionsheet k-actionsheet"">
                <div class=""panoptes-actionsheet-drag-pill-wrapper flex items-center justify-center pt-2.5 pb-1 cursor-grab"">
                    <span class=""panoptes-actionsheet-drag-pill w-10 h-1.5 rounded-full bg-slate-300 transition-colors hover:bg-slate-400""></span>
                </div>
                {headerHtml}
                <div class=""panoptes-actionsheet-content p-2 space-y-1 overflow-y-auto max-h-[80vh]"">
                    {childContent.GetContent()}
                    {itemsHtml}
                </div>
            </div>
        ";

        output.Content.SetHtmlContent(fullHtml);
    }
}
