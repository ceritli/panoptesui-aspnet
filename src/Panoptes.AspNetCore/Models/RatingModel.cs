using System;

namespace Panoptes.AspNetCore.Models;

public enum RatingIcon
{
    Star,   // Yıldız
    Heart,  // Kalp
    Circle  // Daire
}

public class RatingModel
{
    public string? Id { get; set; }
    public decimal Value { get; set; } = 0;
    public int Max { get; set; } = 5;
    public decimal Precision { get; set; } = 1; // 1 (tam) veya 0.5 (yarım)
    public bool Readonly { get; set; } = false;
    public bool Disabled { get; set; } = false;
    public RatingIcon Icon { get; set; } = RatingIcon.Star;
    public bool ShowLabel { get; set; } = true;
    public string? LabelTemplate { get; set; } // Örn: "{value} / {max}"
    public string? OnChange { get; set; }
}
