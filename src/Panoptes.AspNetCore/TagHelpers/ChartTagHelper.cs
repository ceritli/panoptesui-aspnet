using System;
using System.Collections.Generic;
using System.Linq;
using System.Text.Json;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc.Rendering;
using Microsoft.AspNetCore.Razor.TagHelpers;
using Panoptes.AspNetCore.Models;

namespace Panoptes.AspNetCore.TagHelpers;

/// <summary>
/// Panoptes UI Charts bileşeni,, saf SVG vektörel iş ve raporlama grafik bileşeni.
/// Column, Bar, Line, Area, Pie ve Donut grafik türlerini tam etkileşimli olarak destekler.
/// </summary>
[HtmlTargetElement("panoptes-chart")]
public class ChartTagHelper : TagHelper
{
    [HtmlAttributeName("id")]
    public string? Id { get; set; }

    [HtmlAttributeName("type")]
    public ChartType Type { get; set; } = ChartType.Column;

    [HtmlAttributeName("title")]
    public string? Title { get; set; }

    [HtmlAttributeName("subtitle")]
    public string? Subtitle { get; set; }

    [HtmlAttributeName("categories")]
    public List<string>? Categories { get; set; }

    [HtmlAttributeName("series")]
    public List<ChartSeries>? Series { get; set; }

    [HtmlAttributeName("points")]
    public List<ChartDataPoint>? Points { get; set; }

    [HtmlAttributeName("height")]
    public int Height { get; set; } = 320;

    [HtmlAttributeName("show-legend")]
    public bool ShowLegend { get; set; } = true;

    [HtmlAttributeName("show-grid")]
    public bool ShowGrid { get; set; } = true;

    [HtmlAttributeName("value-prefix")]
    public string? ValuePrefix { get; set; }

    [HtmlAttributeName("value-suffix")]
    public string? ValueSuffix { get; set; }

    [HtmlAttributeName("class")]
    public string? CssClass { get; set; }

    public override async Task ProcessAsync(TagHelperContext context, TagHelperOutput output)
    {
        var id = !string.IsNullOrWhiteSpace(Id) ? Id : $"panoptes_chart_{Guid.NewGuid():N}";

        output.TagName = "div";
        output.TagMode = TagMode.StartTagAndEndTag;
        output.Attributes.SetAttribute("id", id);
        output.Attributes.SetAttribute("data-panoptes-chart", "true");

        var config = new
        {
            id = id,
            type = Type.ToString().ToLowerInvariant(),
            title = Title,
            subtitle = Subtitle,
            categories = Categories ?? new List<string>(),
            series = Series ?? new List<ChartSeries>(),
            points = Points ?? new List<ChartDataPoint>(),
            height = Height,
            showLegend = ShowLegend,
            showGrid = ShowGrid,
            valuePrefix = ValuePrefix ?? "",
            valueSuffix = ValueSuffix ?? ""
        };

        var serializerOptions = new JsonSerializerOptions
        {
            PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
            WriteIndented = false
        };
        var jsonConfig = JsonSerializer.Serialize(config, serializerOptions);
        output.Attributes.SetAttribute("data-config", jsonConfig);

        var baseClass = $"panoptes-chart-card bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden flex flex-col w-full {CssClass ?? ""}".Trim();
        output.Attributes.SetAttribute("class", baseClass);

        output.Content.Clear();

        // 1. Üst Başlık Alanı (Varsa)
        if (!string.IsNullOrWhiteSpace(Title))
        {
            var header = new TagBuilder("div");
            header.AddCssClass("px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50");

            var titleBox = new TagBuilder("div");
            var h3 = new TagBuilder("h3");
            h3.AddCssClass("text-sm font-bold text-slate-800");
            h3.InnerHtml.Append(Title);
            titleBox.InnerHtml.AppendHtml(h3);

            if (!string.IsNullOrWhiteSpace(Subtitle))
            {
                var p = new TagBuilder("p");
                p.AddCssClass("text-xs text-slate-500 mt-0.5");
                p.InnerHtml.Append(Subtitle);
                titleBox.InnerHtml.AppendHtml(p);
            }

            header.InnerHtml.AppendHtml(titleBox);

            var typeBadge = new TagBuilder("span");
            typeBadge.AddCssClass("text-[11px] font-mono px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200");
            typeBadge.InnerHtml.Append(Type.ToString());
            header.InnerHtml.AppendHtml(typeBadge);

            output.Content.AppendHtml(header);
        }

        // 2. SVG Grafik Çizim Tuvali Kapsayıcısı
        var canvasContainer = new TagBuilder("div");
        canvasContainer.AddCssClass("panoptes-chart-canvas-container relative w-full p-4 overflow-hidden flex items-center justify-center");
        canvasContainer.Attributes["style"] = $"min-height: {Height}px;";

        var loadingPlaceholder = new TagBuilder("div");
        loadingPlaceholder.AddCssClass("panoptes-chart-loading text-slate-400 text-xs flex items-center gap-2");
        loadingPlaceholder.InnerHtml.AppendHtml(@"<svg class=""animate-spin h-4 w-4 text-blue-600"" fill=""none"" viewBox=""0 0 24 24""><circle class=""opacity-25"" cx=""12"" cy=""12"" r=""10"" stroke=""currentColor"" stroke-width=""4""></circle><path class=""opacity-75"" fill=""currentColor"" d=""M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z""></path></svg> <span>Grafik çiziliyor...</span>");
        canvasContainer.InnerHtml.AppendHtml(loadingPlaceholder);

        output.Content.AppendHtml(canvasContainer);

        // 3. Alt Gösterge (Legend) Alanı (Varsa)
        if (ShowLegend)
        {
            var legend = new TagBuilder("div");
            legend.AddCssClass("panoptes-chart-legend px-6 py-3 border-t border-slate-100 bg-slate-50/30 flex flex-wrap items-center justify-center gap-4 text-xs");
            output.Content.AppendHtml(legend);
        }

        await output.GetChildContentAsync();
    }
}
