using System;

namespace Panoptes.AspNetCore.Models;

public enum BarcodeType
{
    QRCode,
    Code128,
    Code39,
    EAN13
}

public class BarcodeModel
{
    public string? Id { get; set; }
    public string Value { get; set; } = string.Empty;
    public BarcodeType Type { get; set; } = BarcodeType.QRCode;
    public int Width { get; set; } = 200;
    public int Height { get; set; } = 200;
    public string Color { get; set; } = "#0f172a"; // Slate-900
    public string BackgroundColor { get; set; } = "#ffffff";
    public bool ShowText { get; set; } = true;
    public string? Title { get; set; }
    public string? Subtitle { get; set; }
}
