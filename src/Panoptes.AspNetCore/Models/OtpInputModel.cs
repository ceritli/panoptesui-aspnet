using System;

namespace Panoptes.AspNetCore.Models;

public enum OtpInputType
{
    Number,
    Text
}

public class OtpInputModel
{
    public string? Id { get; set; }
    public int Length { get; set; } = 6;
    public OtpInputType Type { get; set; } = OtpInputType.Number;
    public string? Value { get; set; }
    public bool Mask { get; set; } = false;
    public bool AutoFocus { get; set; } = false;
    public bool Disabled { get; set; } = false;
    public string? OnComplete { get; set; }
    public string? Title { get; set; }
    public string? Subtitle { get; set; }
}
