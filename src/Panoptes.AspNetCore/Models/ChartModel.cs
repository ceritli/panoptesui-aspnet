using System;
using System.Collections.Generic;

namespace Panoptes.AspNetCore.Models;

public enum ChartType
{
    Column, // Dikey Sütun
    Bar,    // Yatay Çubuk
    Line,   // Çizgi
    Area,   // Alan (Gradyan Dolgulu Çizgi)
    Pie,    // Pasta
    Donut   // Halka
}

public class ChartDataPoint
{
    public string Label { get; set; } = string.Empty;
    public decimal Value { get; set; }
    public string? FormattedValue { get; set; }
    public string? Color { get; set; }
}

public class ChartSeries
{
    public string Name { get; set; } = string.Empty;
    public string? Color { get; set; }
    public ChartType? Type { get; set; }
    public List<decimal> Values { get; set; } = new();
}

public class ChartModel
{
    public string? Id { get; set; }
    public string? Title { get; set; }
    public string? Subtitle { get; set; }
    public ChartType Type { get; set; } = ChartType.Column;
    public List<string> Categories { get; set; } = new();
    public List<ChartSeries> Series { get; set; } = new();
    public List<ChartDataPoint> Points { get; set; } = new(); // Pie / Donut için tekil nokta listesi
    public int Height { get; set; } = 320;
    public bool ShowLegend { get; set; } = true;
    public bool ShowGrid { get; set; } = true;
    public string? ValuePrefix { get; set; }
    public string? ValueSuffix { get; set; }
}
