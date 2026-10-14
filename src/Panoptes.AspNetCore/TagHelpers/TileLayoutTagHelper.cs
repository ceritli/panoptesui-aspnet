using System;
using System.Collections.Generic;
using System.Text.Encodings.Web;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc.Rendering;
using Microsoft.AspNetCore.Razor.TagHelpers;
using Panoptes.AspNetCore.Models;

namespace Panoptes.AspNetCore.TagHelpers;

/// <summary>
/// Panoptes UI TileLayout bileşeni, modern, 2 boyutlu CSS Grid tabanlı pano ve dashboard düzenleyici TagHelper.
/// Kartların sürüklenip bırakılarak yeniden sıralanmasını (reorder) ve yeniden boyutlandırılmasını (resize) sağlar.
/// </summary>
[HtmlTargetElement("panoptes-tilelayout")]
public class TileLayoutTagHelper : TagHelper
{
    [HtmlAttributeName("id")]
    public string? Id { get; set; }

    [HtmlAttributeName("columns")]
    public int Columns { get; set; } = 3;

    [HtmlAttributeName("column-width")]
    public string ColumnWidth { get; set; } = "1fr";

    [HtmlAttributeName("row-height")]
    public string RowHeight { get; set; } = "180px";

    [HtmlAttributeName("gap")]
    public string Gap { get; set; } = "16px";

    [HtmlAttributeName("reorderable")]
    public bool Reorderable { get; set; } = true;

    [HtmlAttributeName("resizable")]
    public bool Resizable { get; set; } = true;

    [HtmlAttributeName("navigatable")]
    public bool Navigatable { get; set; } = true;

    [HtmlAttributeName("height")]
    public string? Height { get; set; }

    [HtmlAttributeName("width")]
    public string? Width { get; set; }

    [HtmlAttributeName("dir")]
    public string? Dir { get; set; }

    [HtmlAttributeName("on-reorder")]
    public string? OnReorder { get; set; }

    [HtmlAttributeName("on-resize")]
    public string? OnResize { get; set; }

    [HtmlAttributeName("class")]
    public string? CssClass { get; set; }

    [HtmlAttributeName("style")]
    public string? Style { get; set; }

    [HtmlAttributeName("items")]
    public IEnumerable<TileLayoutContainerModel>? Items { get; set; }

    [HtmlAttributeName("containers")]
    public IEnumerable<TileLayoutContainerModel>? Containers { get => Items; set => Items = value; }

    public override async Task ProcessAsync(TagHelperContext context, TagHelperOutput output)
    {
        var id = !string.IsNullOrWhiteSpace(Id) ? Id : $"panoptes_tl_{Guid.NewGuid():N}";

        var tileLayoutContext = new TileLayoutContext
        {
            Id = id,
            Columns = Columns,
            ColumnWidth = ColumnWidth,
            RowHeight = RowHeight,
            Gap = Gap,
            Reorderable = Reorderable,
            Resizable = Resizable,
            Navigatable = Navigatable
        };

        context.Items[typeof(TileLayoutContext)] = tileLayoutContext;

        // Process children <panoptes-tilelayout-item>
        var childContent = await output.GetChildContentAsync();

        output.TagName = "div";
        output.TagMode = TagMode.StartTagAndEndTag;
        output.Attributes.SetAttribute("id", id);
        output.Attributes.SetAttribute("data-panoptes-tilelayout", "true");
        output.Attributes.SetAttribute("data-columns", Columns.ToString());
        output.Attributes.SetAttribute("data-column-width", ColumnWidth);
        output.Attributes.SetAttribute("data-row-height", RowHeight);
        output.Attributes.SetAttribute("data-gap", Gap);
        output.Attributes.SetAttribute("data-reorderable", Reorderable.ToString().ToLowerInvariant());
        output.Attributes.SetAttribute("data-resizable", Resizable.ToString().ToLowerInvariant());
        output.Attributes.SetAttribute("data-navigatable", Navigatable.ToString().ToLowerInvariant());

        if (!string.IsNullOrWhiteSpace(OnReorder))
            output.Attributes.SetAttribute("data-on-reorder", OnReorder);

        if (!string.IsNullOrWhiteSpace(OnResize))
            output.Attributes.SetAttribute("data-on-resize", OnResize);

        if (!string.IsNullOrWhiteSpace(Dir))
            output.Attributes.SetAttribute("dir", Dir.ToLowerInvariant());

        var existingClass = output.Attributes["class"]?.Value?.ToString() ?? "";
        output.Attributes.SetAttribute("class", $"panoptes-tilelayout k-tilelayout {existingClass} {CssClass}".Trim());

        // Grid CSS styles
        var colDef = ColumnWidth.Contains("fr") || ColumnWidth.Contains("%") || ColumnWidth.Contains("px")
            ? $"repeat({Columns}, {ColumnWidth})"
            : $"repeat({Columns}, 1fr)";

        var gridStyles = $"display: grid; grid-template-columns: {colDef}; grid-auto-rows: {RowHeight}; gap: {Gap};";
        if (!string.IsNullOrWhiteSpace(Height)) gridStyles += $" height: {Height};";
        if (!string.IsNullOrWhiteSpace(Width)) gridStyles += $" width: {Width};";
        if (!string.IsNullOrWhiteSpace(Style)) gridStyles += " " + Style;

        output.Attributes.SetAttribute("style", gridStyles);

        var innerHtml = childContent.GetContent();

        // If items collection passed programmatically, render them as well
        if (Items != null)
        {
            var sb = new System.Text.StringBuilder(innerHtml);
            foreach (var item in Items)
            {
                var itemId = !string.IsNullOrWhiteSpace(item.Id) ? item.Id : $"panoptes_tile_{Guid.NewGuid():N}";
                var itemReorderable = item.Reorderable ?? Reorderable;
                var itemResizable = item.Resizable ?? Resizable;

                var itemStyle = $"grid-column: span {item.ColSpan}; grid-row: span {item.RowSpan};";
                if (item.Col.HasValue) itemStyle += $" grid-column-start: {item.Col.Value};";
                if (item.Row.HasValue) itemStyle += $" grid-row-start: {item.Row.Value};";
                if (item.Order.HasValue) itemStyle += $" order: {item.Order.Value};";

                var dragHandleHtml = itemReorderable
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

                var removeBtnHtml = item.Removable
                    ? @"<button type=""button"" class=""panoptes-tilelayout-btn-close"" title=""Kapat"" aria-label=""Kapat"">
                          <svg class=""w-4 h-4 text-slate-400 hover:text-rose-500 transition-colors"" fill=""none"" stroke=""currentColor"" viewBox=""0 0 24 24"">
                            <path stroke-linecap=""round"" stroke-linejoin=""round"" stroke-width=""2"" d=""M6 18L18 6M6 6l12 12""/>
                          </svg>
                       </button>"
                    : "";

                var headerHtml = !string.IsNullOrWhiteSpace(item.HeaderText) || itemReorderable || item.Removable
                    ? $@"<div class=""panoptes-tilelayout-item-header"">
                          <div class=""panoptes-tilelayout-header-left"">
                              {dragHandleHtml}
                              <span class=""panoptes-tilelayout-item-title"">{HtmlEncoder.Default.Encode(item.HeaderText ?? "")}</span>
                          </div>
                          <div class=""panoptes-tilelayout-item-actions"">
                              {removeBtnHtml}
                          </div>
                       </div>"
                    : "";

                var resizeHandleHtml = itemResizable
                    ? @"<span class=""panoptes-tilelayout-resize-handle"" title=""Yeniden Boyutlandır"" aria-label=""Yeniden Boyutlandır"">
                          <svg class=""w-3.5 h-3.5 text-slate-400 hover:text-indigo-600 transition-colors"" fill=""none"" stroke=""currentColor"" viewBox=""0 0 24 24"">
                            <path stroke-linecap=""round"" stroke-linejoin=""round"" stroke-width=""2.5"" d=""M21 15l-6 6m6-12l-12 12""/>
                          </svg>
                       </span>"
                    : "";

                var itemClasses = $"panoptes-tilelayout-item k-tilelayout-item {item.CssClass}".Trim();

                sb.Append($@"<div id=""{itemId}"" class=""{itemClasses}"" style=""{itemStyle}"" tabindex=""0"" role=""region"" aria-label=""{HtmlEncoder.Default.Encode(item.HeaderText ?? "")}"" data-tile-id=""{itemId}"" data-col-span=""{item.ColSpan}"" data-row-span=""{item.RowSpan}"" data-reorderable=""{itemReorderable.ToString().ToLowerInvariant()}"" data-resizable=""{itemResizable.ToString().ToLowerInvariant()}"" data-removable=""{item.Removable.ToString().ToLowerInvariant()}"">
                                {headerHtml}
                                <div class=""panoptes-tilelayout-item-body"">{item.BodyHtml}</div>
                                {resizeHandleHtml}
                            </div>");
            }
            innerHtml = sb.ToString();
        }

        output.Content.SetHtmlContent(innerHtml);
    }
}
