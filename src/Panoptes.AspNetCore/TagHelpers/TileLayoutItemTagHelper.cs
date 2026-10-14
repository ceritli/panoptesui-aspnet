using System;
using System.Text.Encodings.Web;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc.Rendering;
using Microsoft.AspNetCore.Razor.TagHelpers;
using Panoptes.AspNetCore.Models;

namespace Panoptes.AspNetCore.TagHelpers;

/// <summary>
/// TileLayout içindeki bağımsız bir kart/konteyner bileşenini render eden TagHelper.
/// </summary>
[HtmlTargetElement("panoptes-tilelayout-item")]
[HtmlTargetElement("panoptes-tilelayout-container")]
public class TileLayoutItemTagHelper : TagHelper
{
    [HtmlAttributeName("id")]
    public string? Id { get; set; }

    [HtmlAttributeName("header-text")]
    public string? HeaderText { get; set; }

    [HtmlAttributeName("title")]
    public string? Title { get => HeaderText; set => HeaderText = value; }

    [HtmlAttributeName("col-span")]
    public int ColSpan { get; set; } = 1;

    [HtmlAttributeName("row-span")]
    public int RowSpan { get; set; } = 1;

    [HtmlAttributeName("col")]
    public int? Col { get; set; }

    [HtmlAttributeName("row")]
    public int? Row { get; set; }

    [HtmlAttributeName("order")]
    public int? Order { get; set; }

    [HtmlAttributeName("reorderable")]
    public bool? Reorderable { get; set; }

    [HtmlAttributeName("resizable")]
    public bool? Resizable { get; set; }

    [HtmlAttributeName("removable")]
    public bool Removable { get; set; } = false;

    [HtmlAttributeName("class")]
    public string? CssClass { get; set; }

    [HtmlAttributeName("style")]
    public string? Style { get; set; }

    public override async Task ProcessAsync(TagHelperContext context, TagHelperOutput output)
    {
        var parentContext = context.Items.TryGetValue(typeof(TileLayoutContext), out var ctxObj)
            ? ctxObj as TileLayoutContext
            : null;

        var isReorderable = Reorderable ?? parentContext?.Reorderable ?? true;
        var isResizable = Resizable ?? parentContext?.Resizable ?? true;

        var id = !string.IsNullOrWhiteSpace(Id) ? Id : $"panoptes_tile_{Guid.NewGuid():N}";

        // Get inner Razor HTML
        var childContent = await output.GetChildContentAsync();

        output.TagName = "div";
        output.TagMode = TagMode.StartTagAndEndTag;
        output.Attributes.SetAttribute("id", id);
        output.Attributes.SetAttribute("data-tile-id", id);
        output.Attributes.SetAttribute("data-col-span", ColSpan.ToString());
        output.Attributes.SetAttribute("data-row-span", RowSpan.ToString());
        if (Order.HasValue)
            output.Attributes.SetAttribute("data-order", Order.Value.ToString());
        if (Col.HasValue)
            output.Attributes.SetAttribute("data-col", Col.Value.ToString());
        if (Row.HasValue)
            output.Attributes.SetAttribute("data-row", Row.Value.ToString());

        output.Attributes.SetAttribute("data-reorderable", isReorderable.ToString().ToLowerInvariant());
        output.Attributes.SetAttribute("data-resizable", isResizable.ToString().ToLowerInvariant());
        output.Attributes.SetAttribute("data-removable", Removable.ToString().ToLowerInvariant());

        output.Attributes.SetAttribute("tabindex", "0");
        output.Attributes.SetAttribute("role", "region");
        if (!string.IsNullOrWhiteSpace(HeaderText))
            output.Attributes.SetAttribute("aria-label", HeaderText);

        var existingClass = output.Attributes["class"]?.Value?.ToString() ?? "";
        var classes = $"panoptes-tilelayout-item k-tilelayout-item {existingClass} {CssClass}".Trim();
        output.Attributes.SetAttribute("class", classes);

        // Grid inline placement
        var gridStyle = $"grid-column: span {ColSpan}; grid-row: span {RowSpan};";
        if (Col.HasValue) gridStyle += $" grid-column-start: {Col.Value};";
        if (Row.HasValue) gridStyle += $" grid-row-start: {Row.Value};";
        if (Order.HasValue) gridStyle += $" order: {Order.Value};";
        if (!string.IsNullOrWhiteSpace(Style))
            gridStyle += " " + Style;

        output.Attributes.SetAttribute("style", gridStyle);

        // Build Header
        var headerHtml = "";
        if (!string.IsNullOrWhiteSpace(HeaderText) || isReorderable || Removable)
        {
            var dragHandleHtml = isReorderable
                ? @"<span class=""panoptes-tilelayout-drag-handle"" title=""Taşı"" aria-label=""Taşı"">
                      <svg class=""w-4 h-4 text-slate-400 group-hover:text-slate-600 transition-colors"" fill=""none"" stroke=""currentColor"" viewBox=""0 0 24 24"">
                        <circle cx=""9"" cy=""6"" r=""1.5"" fill=""currentColor""/>
                        <circle cx=""15"" cy=""6"" r=""1.5"" fill=""currentColor""/>
                        <circle cx=""9"" cy=""12"" r=""1.5"" fill=""currentColor""/>
                        <circle cx=""15"" cy=""12"" r=""1.5"" fill=""currentColor""/>
                        <circle cx=""9"" cy=""18"" r=""1.5"" fill=""currentColor""/>
                        <circle cx=""15"" cy=""18"" r=""1.5"" fill=""currentColor""/>
                      </svg>
                   </span>"
                : "";

            var removeBtnHtml = Removable
                ? @"<button type=""button"" class=""panoptes-tilelayout-btn-close"" title=""Kapat"" aria-label=""Kapat"">
                      <svg class=""w-4 h-4 text-slate-400 hover:text-rose-500 transition-colors"" fill=""none"" stroke=""currentColor"" viewBox=""0 0 24 24"">
                        <path stroke-linecap=""round"" stroke-linejoin=""round"" stroke-width=""2"" d=""M6 18L18 6M6 6l12 12""/>
                      </svg>
                   </button>"
                : "";

            headerHtml = $@"<div class=""panoptes-tilelayout-item-header"">
                              <div class=""panoptes-tilelayout-header-left"">
                                  {dragHandleHtml}
                                  <span class=""panoptes-tilelayout-item-title"">{HtmlEncoder.Default.Encode(HeaderText ?? "")}</span>
                              </div>
                              <div class=""panoptes-tilelayout-item-actions"">
                                  {removeBtnHtml}
                              </div>
                           </div>";
        }

        var resizeHandleHtml = isResizable
            ? @"<span class=""panoptes-tilelayout-resize-handle"" title=""Yeniden Boyutlandır"" aria-label=""Yeniden Boyutlandır"">
                  <svg class=""w-3.5 h-3.5 text-slate-400 hover:text-indigo-600 transition-colors"" fill=""none"" stroke=""currentColor"" viewBox=""0 0 24 24"">
                    <path stroke-linecap=""round"" stroke-linejoin=""round"" stroke-width=""2.5"" d=""M21 15l-6 6m6-12l-12 12""/>
                  </svg>
               </span>"
            : "";

        var innerBodyHtml = $@"<div class=""panoptes-tilelayout-item-body"">{childContent.GetContent()}</div>";

        output.Content.SetHtmlContent($"{headerHtml}{innerBodyHtml}{resizeHandleHtml}");
    }
}
