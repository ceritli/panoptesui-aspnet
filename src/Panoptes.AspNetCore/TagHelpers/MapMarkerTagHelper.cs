using System;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Razor.TagHelpers;
using Panoptes.AspNetCore.Models;

namespace Panoptes.AspNetCore.TagHelpers;

/// <summary>
/// Harita üzerinde özel işaretçi (Pin / Marker) tanımlama TagHelper'ı.
/// İster <panoptes-map> altına doğrudan, ister <panoptes-map-layer> altına eklenebilir.
/// Gövde içeriği doğrudan Popup şablonu (HTML) olarak kullanılabilir.
/// </summary>
[HtmlTargetElement("panoptes-map-marker")]
public class MapMarkerTagHelper : TagHelper
{
    [HtmlAttributeName("id")]
    public string? Id { get; set; }

    [HtmlAttributeName("lat")]
    public double Lat { get; set; }

    [HtmlAttributeName("lng")]
    public double Lng { get; set; }

    [HtmlAttributeName("title")]
    public string? Title { get; set; }

    [HtmlAttributeName("tooltip")]
    public string? Tooltip { get; set; }

    [HtmlAttributeName("popup-template")]
    public string? PopupTemplate { get; set; }

    [HtmlAttributeName("icon")]
    public string? Icon { get; set; } = "pin"; // pin, star, building, hospital, store, airport, info, dot

    [HtmlAttributeName("color")]
    public string? Color { get; set; } = "#ef4444";

    [HtmlAttributeName("shape")]
    public string? Shape { get; set; } = "pin"; // pin, circle, badge

    public override async Task ProcessAsync(TagHelperContext context, TagHelperOutput output)
    {
        output.SuppressOutput();

        var childContent = await output.GetChildContentAsync();
        var innerHtml = childContent.GetContent().Trim();

        var marker = new MapMarkerModel
        {
            Id = !string.IsNullOrWhiteSpace(Id) ? Id : $"marker_{Guid.NewGuid():N}",
            Lat = Lat,
            Lng = Lng,
            Title = Title,
            Tooltip = Tooltip,
            PopupTemplate = !string.IsNullOrWhiteSpace(PopupTemplate) ? PopupTemplate : (!string.IsNullOrWhiteSpace(innerHtml) ? innerHtml : null),
            Icon = Icon,
            Color = Color,
            Shape = Shape
        };

        // Eğer bir katman içindeyse o katmanın marker listesine ekle
        if (context.Items.TryGetValue(typeof(MapLayerModel), out var layerObj) && layerObj is MapLayerModel layer)
        {
            layer.Markers.Add(marker);
            return;
        }

        // Değilse doğrudan haritanın marker listesine ekle
        if (context.Items.TryGetValue(typeof(MapContext), out var ctxObj) && ctxObj is MapContext mapContext)
        {
            mapContext.Markers.Add(marker);
        }
    }
}
