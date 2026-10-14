using System;
using System.Collections.Generic;
using System.Text.Json;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc.Rendering;
using Microsoft.AspNetCore.Razor.TagHelpers;
using Panoptes.AspNetCore.Models;

namespace Panoptes.AspNetCore.TagHelpers;

/// <summary>
/// Panoptes UI Gauges bileşeni,, saf SVG vektörel ibreli kadran, yay ve termometre gösterge bileşeni.
/// Radial (İbreli Hız Göstergesi), Arc (Yay Dolumu) ve Linear göstergeleri destekler.
/// </summary>
[HtmlTargetElement("panoptes-gauge")]
public class GaugeTagHelper : TagHelper
{
    [HtmlAttributeName("id")]
    public string? Id { get; set; }

    [HtmlAttributeName("type")]
    public GaugeType Type { get; set; } = GaugeType.Radial;

    [HtmlAttributeName("value")]
    public decimal Value { get; set; }

    [HtmlAttributeName("min")]
    public decimal Min { get; set; } = 0;

    [HtmlAttributeName("max")]
    public decimal Max { get; set; } = 100;

    [HtmlAttributeName("unit")]
    public string? Unit { get; set; }

    [HtmlAttributeName("title")]
    public string? Title { get; set; }

    [HtmlAttributeName("subtitle")]
    public string? Subtitle { get; set; }

    [HtmlAttributeName("ranges")]
    public List<GaugeRange>? Ranges { get; set; }

    [HtmlAttributeName("size")]
    public int Size { get; set; } = 240;

    [HtmlAttributeName("class")]
    public string? CssClass { get; set; }

    public override async Task ProcessAsync(TagHelperContext context, TagHelperOutput output)
    {
        var id = !string.IsNullOrWhiteSpace(Id) ? Id : $"panoptes_gauge_{Guid.NewGuid():N}";

        output.TagName = "div";
        output.TagMode = TagMode.StartTagAndEndTag;
        output.Attributes.SetAttribute("id", id);
        output.Attributes.SetAttribute("data-panoptes-gauge", "true");

        var config = new
        {
            id = id,
            type = Type.ToString().ToLowerInvariant(),
            value = Value,
            min = Min,
            max = Max,
            unit = Unit ?? "",
            title = Title,
            subtitle = Subtitle,
            ranges = Ranges ?? new List<GaugeRange>(),
            size = Size
        };

        var jsonConfig = JsonSerializer.Serialize(config);
        output.Attributes.SetAttribute("data-config", jsonConfig);

        var baseClass = $"panoptes-gauge-card bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden flex flex-col items-center justify-center p-6 w-full {CssClass ?? ""}".Trim();
        output.Attributes.SetAttribute("class", baseClass);

        output.Content.Clear();

        // Üst Başlık
        if (!string.IsNullOrWhiteSpace(Title))
        {
            var header = new TagBuilder("div");
            header.AddCssClass("text-center mb-3 w-full");
            header.InnerHtml.AppendHtml($@"<h3 class=""text-sm font-bold text-slate-800"">{Title}</h3>");
            if (!string.IsNullOrWhiteSpace(Subtitle))
            {
                header.InnerHtml.AppendHtml($@"<p class=""text-xs text-slate-500 mt-0.5"">{Subtitle}</p>");
            }
            output.Content.AppendHtml(header);
        }

        // SVG Çizim Alanı
        var canvas = new TagBuilder("div");
        canvas.AddCssClass("panoptes-gauge-canvas flex items-center justify-center relative");
        canvas.Attributes["style"] = $"width: 100%; height: {Size}px;";
        output.Content.AppendHtml(canvas);

        await output.GetChildContentAsync();
    }
}
