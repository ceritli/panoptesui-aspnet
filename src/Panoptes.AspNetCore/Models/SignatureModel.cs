namespace Panoptes.AspNetCore.Models
{
    public class SignatureModel
    {
        public string Id { get; set; } = string.Empty;
        public string? Name { get; set; }
        public int Width { get; set; } = 600;
        public int Height { get; set; } = 220;
        public string StrokeColor { get; set; } = "#0f172a";
        public double StrokeWidth { get; set; } = 2.5;
        public string BackgroundColor { get; set; } = "#ffffff";
        public bool ShowControls { get; set; } = true;
        public bool ReadOnly { get; set; } = false;
        public string? Value { get; set; }
        public string? OnChange { get; set; }
        public string? CssClass { get; set; }
    }
}
