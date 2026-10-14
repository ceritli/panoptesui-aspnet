using System;
using System.Collections.Generic;

namespace Panoptes.AspNetCore.Models;

public enum GaugeType
{
    Radial, // Yuvarlak Kadran & Dönen İbre (Hız Göstergesi)
    Arc,    // Yarım Daire / Yay Şeklinde Dolum Çemberi
    Linear  // Dikey / Yatay Lineer İlerleme Termometresi
}

public class GaugeRange
{
    public decimal From { get; set; }
    public decimal To { get; set; }
    public string Color { get; set; } = "#10b981"; // Varsayılan yeşil
    public string? Label { get; set; }
}

public class GaugeModel
{
    public string? Id { get; set; }
    public GaugeType Type { get; set; } = GaugeType.Radial;
    public decimal Value { get; set; }
    public decimal Min { get; set; } = 0;
    public decimal Max { get; set; } = 100;
    public string? Title { get; set; }
    public string? Subtitle { get; set; }
    public string? Unit { get; set; } // Örn: "%", "km/s", "°C", "BAR"
    public List<GaugeRange> Ranges { get; set; } = new();
    public int Size { get; set; } = 240;
}
