using System;
using System.Collections.Generic;

namespace Panoptes.AspNetCore.Models;

/// <summary>
/// Harita işaretçisi (Marker) modeli.
/// </summary>
public class MapMarkerModel
{
    public string? Id { get; set; }
    public double Lat { get; set; }
    public double Lng { get; set; }
    public string? Title { get; set; }
    public string? Tooltip { get; set; }
    public string? PopupTemplate { get; set; }
    public string? Icon { get; set; } = "pin"; // pin, star, building, hospital, store, airport, info, dot
    public string? Color { get; set; } = "#ef4444";
    public string? Shape { get; set; } = "pin"; // pin, circle, badge
    public object? Data { get; set; }
}

/// <summary>
/// Harita katmanı (Layer) modeli: Tile, Marker, Bubble, Shape (GeoJSON).
/// </summary>
public class MapLayerModel
{
    public string? Id { get; set; }
    public string Type { get; set; } = "tile"; // tile, marker, bubble, shape
    public string? Title { get; set; }
    public string? UrlTemplate { get; set; }
    public string? Subdomains { get; set; } = "abc";
    public string? Attribution { get; set; }
    public double Opacity { get; set; } = 1.0;
    public bool Visible { get; set; } = true;
    public string? DataSourceUrl { get; set; }
    public string? LocationField { get; set; } = "location";
    public string? LatField { get; set; } = "lat";
    public string? LngField { get; set; } = "lng";
    public string? ValueField { get; set; } = "value";
    public double MinSize { get; set; } = 10;
    public double MaxSize { get; set; } = 60;
    public string? Color { get; set; } = "#3b82f6";
    public string? FillColor { get; set; }
    public string? StrokeColor { get; set; }
    public double StrokeWidth { get; set; } = 1.5;
    public string? TooltipTemplate { get; set; }
    public List<MapMarkerModel> Markers { get; set; } = new();
    public object? Data { get; set; }
}

/// <summary>
/// Harita bileşeni modeli.
/// </summary>
public class MapModel
{
    public string Id { get; set; } = string.Empty;
    public double[]? Center { get; set; } // [lat, lng]
    public double Zoom { get; set; } = 6;
    public double MinZoom { get; set; } = 1;
    public double MaxZoom { get; set; } = 19;
    public bool Controls { get; set; } = true;
    public bool Wraparound { get; set; } = true;
    public bool Pannable { get; set; } = true;
    public bool Zoomable { get; set; } = true;
    public string? Height { get; set; } = "500px";
    public string? Width { get; set; } = "100%";
    public List<MapLayerModel> Layers { get; set; } = new();
    public List<MapMarkerModel> Markers { get; set; } = new();
}

/// <summary>
/// Map TagHelper bağlamı (Context).
/// </summary>
public class MapContext
{
    public string Id { get; set; } = string.Empty;
    public double[] Center { get; set; } = new[] { 39.9334, 32.8597 }; // Ankara varsayılan
    public double Zoom { get; set; } = 6;
    public double MinZoom { get; set; } = 1;
    public double MaxZoom { get; set; } = 19;
    public bool Controls { get; set; } = true;
    public bool Wraparound { get; set; } = true;
    public bool Pannable { get; set; } = true;
    public bool Zoomable { get; set; } = true;
    public List<MapLayerModel> Layers { get; set; } = new();
    public List<MapMarkerModel> Markers { get; set; } = new();
}
