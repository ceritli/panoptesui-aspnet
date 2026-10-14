using System;
using System.Collections.Generic;
using System.Globalization;
using System.Linq;
using System.Text.Encodings.Web;
using System.Text.Json;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc.Rendering;
using Microsoft.AspNetCore.Razor.TagHelpers;
using Panoptes.AspNetCore.Models;

namespace Panoptes.AspNetCore.TagHelpers;

/// <summary>
/// Panoptes ASP.NET Core Map bileşeni, etkileşimli coğrafi harita TagHelper'ı.
/// Vektör katmanları (GeoJSON), oransal kabarcıklar (Bubble), zengin işaretçiler (Markers) ve
/// OpenStreetMap, Esri gibi çoklu karo (tile) katmanlarını destekler.
/// </summary>
[HtmlTargetElement("panoptes-map")]
public class MapTagHelper : TagHelper
{
    [HtmlAttributeName("id")]
    public string? Id { get; set; }

    /// <summary>
    /// Harita merkez koordinatı: "39.9334, 32.8597" veya "[39.9334, 32.8597]".
    /// </summary>
    [HtmlAttributeName("center")]
    public string? Center { get; set; } = "39.9334, 32.8597";

    [HtmlAttributeName("zoom")]
    public double Zoom { get; set; } = 6;

    [HtmlAttributeName("min-zoom")]
    public double MinZoom { get; set; } = 1;

    [HtmlAttributeName("max-zoom")]
    public double MaxZoom { get; set; } = 19;

    [HtmlAttributeName("height")]
    public string Height { get; set; } = "500px";

    [HtmlAttributeName("width")]
    public string Width { get; set; } = "100%";

    [HtmlAttributeName("controls")]
    public bool Controls { get; set; } = true;

    [HtmlAttributeName("wraparound")]
    public bool Wraparound { get; set; } = true;

    [HtmlAttributeName("pannable")]
    public bool Pannable { get; set; } = true;

    [HtmlAttributeName("zoomable")]
    public bool Zoomable { get; set; } = true;

    [HtmlAttributeName("layers")]
    public IEnumerable<MapLayerModel>? Layers { get; set; }

    [HtmlAttributeName("markers")]
    public IEnumerable<MapMarkerModel>? Markers { get; set; }

    [HtmlAttributeName("on-pan")]
    public string? OnPan { get; set; }

    [HtmlAttributeName("on-zoom-start")]
    public string? OnZoomStart { get; set; }

    [HtmlAttributeName("on-zoom-end")]
    public string? OnZoomEnd { get; set; }

    [HtmlAttributeName("on-click")]
    public string? OnClick { get; set; }

    [HtmlAttributeName("on-marker-click")]
    public string? OnMarkerClick { get; set; }

    [HtmlAttributeName("on-shape-click")]
    public string? OnShapeClick { get; set; }

    [HtmlAttributeName("on-shape-mouse-enter")]
    public string? OnShapeMouseEnter { get; set; }

    [HtmlAttributeName("on-shape-mouse-leave")]
    public string? OnShapeMouseLeave { get; set; }

    [HtmlAttributeName("class")]
    public string? CssClass { get; set; }

    [HtmlAttributeName("style")]
    public string? Style { get; set; }

    public override async Task ProcessAsync(TagHelperContext context, TagHelperOutput output)
    {
        var id = !string.IsNullOrWhiteSpace(Id) ? Id : $"panoptes_map_{Guid.NewGuid():N}";

        double[] centerCoords = ParseCenter(Center);

        var mapContext = new MapContext
        {
            Id = id,
            Center = centerCoords,
            Zoom = Zoom,
            MinZoom = MinZoom,
            MaxZoom = MaxZoom,
            Controls = Controls,
            Wraparound = Wraparound,
            Pannable = Pannable,
            Zoomable = Zoomable
        };

        if (Layers != null)
        {
            mapContext.Layers.AddRange(Layers);
        }

        if (Markers != null)
        {
            mapContext.Markers.AddRange(Markers);
        }

        context.Items[typeof(MapContext)] = mapContext;

        // Render child tag helpers (layers, markers)
        var childContent = await output.GetChildContentAsync();

        // Eğer hiç katman eklenmemişse varsayılan OpenStreetMap katmanı ekleyelim
        if (mapContext.Layers.Count == 0)
        {
            mapContext.Layers.Add(new MapLayerModel
            {
                Type = "tile",
                Title = "OpenStreetMap",
                UrlTemplate = "https://tile.openstreetmap.org/{z}/{x}/{y}.png",
                Attribution = "&copy; <a href=\"https://www.openstreetmap.org/copyright\" target=\"_blank\">OpenStreetMap</a> contributors",
                Opacity = 1.0,
                Visible = true
            });
        }

        output.TagName = "div";
        output.TagMode = TagMode.StartTagAndEndTag;
        output.Attributes.SetAttribute("id", id);
        output.Attributes.SetAttribute("data-panoptes-map", "true");
        output.Attributes.SetAttribute("data-zoom", Zoom.ToString(CultureInfo.InvariantCulture));
        output.Attributes.SetAttribute("data-min-zoom", MinZoom.ToString(CultureInfo.InvariantCulture));
        output.Attributes.SetAttribute("data-max-zoom", MaxZoom.ToString(CultureInfo.InvariantCulture));
        output.Attributes.SetAttribute("data-controls", Controls.ToString().ToLowerInvariant());
        output.Attributes.SetAttribute("data-wraparound", Wraparound.ToString().ToLowerInvariant());
        output.Attributes.SetAttribute("data-pannable", Pannable.ToString().ToLowerInvariant());
        output.Attributes.SetAttribute("data-zoomable", Zoomable.ToString().ToLowerInvariant());

        if (!string.IsNullOrWhiteSpace(OnPan)) output.Attributes.SetAttribute("data-on-pan", OnPan);
        if (!string.IsNullOrWhiteSpace(OnZoomStart)) output.Attributes.SetAttribute("data-on-zoom-start", OnZoomStart);
        if (!string.IsNullOrWhiteSpace(OnZoomEnd)) output.Attributes.SetAttribute("data-on-zoom-end", OnZoomEnd);
        if (!string.IsNullOrWhiteSpace(OnClick)) output.Attributes.SetAttribute("data-on-click", OnClick);
        if (!string.IsNullOrWhiteSpace(OnMarkerClick)) output.Attributes.SetAttribute("data-on-marker-click", OnMarkerClick);
        if (!string.IsNullOrWhiteSpace(OnShapeClick)) output.Attributes.SetAttribute("data-on-shape-click", OnShapeClick);
        if (!string.IsNullOrWhiteSpace(OnShapeMouseEnter)) output.Attributes.SetAttribute("data-on-shape-mouse-enter", OnShapeMouseEnter);
        if (!string.IsNullOrWhiteSpace(OnShapeMouseLeave)) output.Attributes.SetAttribute("data-on-shape-mouse-leave", OnShapeMouseLeave);

        var existingClass = output.Attributes["class"]?.Value?.ToString() ?? "";
        output.Attributes.SetAttribute("class", $"panoptes-map-wrapper relative overflow-hidden rounded-xl border border-slate-200/80 bg-slate-50 shadow-sm {existingClass} {CssClass}".Trim());

        var sizeStyles = $"height: {Height}; width: {Width}; min-height: 250px;";
        var finalStyle = string.IsNullOrWhiteSpace(Style) ? sizeStyles : $"{sizeStyles} {Style}";
        output.Attributes.SetAttribute("style", finalStyle);

        // Serialization of Map configuration
        var configJson = JsonSerializer.Serialize(new
        {
            id = id,
            center = mapContext.Center,
            zoom = mapContext.Zoom,
            minZoom = mapContext.MinZoom,
            maxZoom = mapContext.MaxZoom,
            controls = mapContext.Controls,
            wraparound = mapContext.Wraparound,
            pannable = mapContext.Pannable,
            zoomable = mapContext.Zoomable,
            layers = mapContext.Layers,
            markers = mapContext.Markers
        }, new JsonSerializerOptions
        {
            PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
            WriteIndented = false
        });

        var html = $@"
<div class=""panoptes-map-viewport w-full h-full relative z-0""></div>
<script type=""application/json"" class=""panoptes-map-config"">{configJson}</script>
";
        output.Content.SetHtmlContent(html);
    }

    private static double[] ParseCenter(string? center)
    {
        if (string.IsNullOrWhiteSpace(center))
            return new[] { 39.9334, 32.8597 };

        var clean = center.Trim().Trim('[', ']', '(', ')');
        var parts = clean.Split(new[] { ',', ';' }, StringSplitOptions.RemoveEmptyEntries);
        if (parts.Length >= 2 &&
            double.TryParse(parts[0].Trim(), NumberStyles.Any, CultureInfo.InvariantCulture, out var lat) &&
            double.TryParse(parts[1].Trim(), NumberStyles.Any, CultureInfo.InvariantCulture, out var lng))
        {
            return new[] { lat, lng };
        }

        return new[] { 39.9334, 32.8597 };
    }
}
