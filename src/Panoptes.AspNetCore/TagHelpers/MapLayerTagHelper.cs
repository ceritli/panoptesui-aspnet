using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Razor.TagHelpers;
using Panoptes.AspNetCore.Models;

namespace Panoptes.AspNetCore.TagHelpers;

/// <summary>
/// Harita katmanı tanımlama TagHelper'ı.
/// Desteklenen tipler: "tile", "marker", "bubble", "shape".
/// </summary>
[HtmlTargetElement("panoptes-map-layer", ParentTag = "panoptes-map")]
public class MapLayerTagHelper : TagHelper
{
    [HtmlAttributeName("id")]
    public string? Id { get; set; }

    [HtmlAttributeName("type")]
    public string Type { get; set; } = "tile"; // tile, marker, bubble, shape

    [HtmlAttributeName("title")]
    public string? Title { get; set; }

    [HtmlAttributeName("url-template")]
    public string? UrlTemplate { get; set; }

    [HtmlAttributeName("subdomains")]
    public string? Subdomains { get; set; } = "abc";

    [HtmlAttributeName("attribution")]
    public string? Attribution { get; set; }

    [HtmlAttributeName("opacity")]
    public double Opacity { get; set; } = 1.0;

    [HtmlAttributeName("visible")]
    public bool Visible { get; set; } = true;

    [HtmlAttributeName("source-url")]
    public string? DataSourceUrl { get; set; }

    [HtmlAttributeName("url")]
    public string? Url { get => DataSourceUrl; set => DataSourceUrl = value; }

    [HtmlAttributeName("location-field")]
    public string? LocationField { get; set; } = "location";

    [HtmlAttributeName("lat-field")]
    public string? LatField { get; set; } = "lat";

    [HtmlAttributeName("lng-field")]
    public string? LngField { get; set; } = "lng";

    [HtmlAttributeName("value-field")]
    public string? ValueField { get; set; } = "value";

    [HtmlAttributeName("min-size")]
    public double MinSize { get; set; } = 10;

    [HtmlAttributeName("max-size")]
    public double MaxSize { get; set; } = 60;

    [HtmlAttributeName("color")]
    public string? Color { get; set; } = "#3b82f6";

    [HtmlAttributeName("fill-color")]
    public string? FillColor { get; set; }

    [HtmlAttributeName("stroke-color")]
    public string? StrokeColor { get; set; }

    [HtmlAttributeName("stroke-width")]
    public double StrokeWidth { get; set; } = 1.5;

    [HtmlAttributeName("tooltip-template")]
    public string? TooltipTemplate { get; set; }

    [HtmlAttributeName("data")]
    public object? Data { get; set; }

    public override async Task ProcessAsync(TagHelperContext context, TagHelperOutput output)
    {
        output.SuppressOutput();

        if (!context.Items.TryGetValue(typeof(MapContext), out var ctxObj) || ctxObj is not MapContext mapContext)
        {
            return;
        }

        var layer = new MapLayerModel
        {
            Id = !string.IsNullOrWhiteSpace(Id) ? Id : $"layer_{Guid.NewGuid():N}",
            Type = Type.ToLowerInvariant(),
            Title = Title,
            UrlTemplate = UrlTemplate,
            Subdomains = Subdomains,
            Attribution = Attribution,
            Opacity = Opacity,
            Visible = Visible,
            DataSourceUrl = DataSourceUrl,
            LocationField = LocationField,
            LatField = LatField,
            LngField = LngField,
            ValueField = ValueField,
            MinSize = MinSize,
            MaxSize = MaxSize,
            Color = Color,
            FillColor = FillColor,
            StrokeColor = StrokeColor,
            StrokeWidth = StrokeWidth,
            TooltipTemplate = TooltipTemplate,
            Data = Data
        };

        // Context'e katmanı koyuyoruz ki alt marker etiketleri varsa bu katmana eklensin
        context.Items[typeof(MapLayerModel)] = layer;

        await output.GetChildContentAsync();

        mapContext.Layers.Add(layer);
    }
}
