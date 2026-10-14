using System.Collections.Generic;

namespace Panoptes.AspNetCore.Models;

public class StepperStepModel
{
    public string? Id { get; set; }
    public string? Label { get; set; }
    public string? Subtitle { get; set; }
    public string? Icon { get; set; }
    public bool Selected { get; set; }
    public bool Completed { get; set; }
    public bool Disabled { get; set; }
    public bool Optional { get; set; }
    public string? ContentHtml { get; set; }
}

public class StepperContext
{
    public string? Id { get; set; }
    public string Orientation { get; set; } = "horizontal"; // horizontal, vertical
    public bool Linear { get; set; } = true;
    public string? OnSelect { get; set; }
    public string? OnChange { get; set; }
    public List<StepperStepModel> Steps { get; set; } = new();
}
