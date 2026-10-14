using System;

namespace Panoptes.AspNetCore.Models
{
    public enum SliderOrientation
    {
        Horizontal,
        Vertical
    }

    public class SliderModel
    {
        public string Id { get; set; } = string.Empty;
        public string? Name { get; set; }
        public decimal Min { get; set; } = 0;
        public decimal Max { get; set; } = 100;
        public decimal Step { get; set; } = 1;
        public decimal Value { get; set; } = 50;
        public bool IsRange { get; set; } = false;
        public decimal? ValueStart { get; set; }
        public decimal? ValueEnd { get; set; }
        public string? NameStart { get; set; }
        public string? NameEnd { get; set; }
        public SliderOrientation Orientation { get; set; } = SliderOrientation.Horizontal;
        public bool ShowTooltip { get; set; } = true;
        public bool ShowTicks { get; set; } = true;
        public bool ShowButtons { get; set; } = false;
        public bool Disabled { get; set; } = false;
        public string Color { get; set; } = "blue"; // blue, emerald, indigo, amber, purple
        public string? OnChange { get; set; }
        public string? OnSlide { get; set; }
        public string? CssClass { get; set; }
    }
}
