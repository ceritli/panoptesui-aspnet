using System;
using System.Collections.Generic;

namespace Panoptes.AspNetCore.Models;

public class GanttTaskModel
{
    public string? Id { get; set; }
    public string? ParentId { get; set; }
    public string? Title { get; set; }
    public DateTime Start { get; set; }
    public DateTime End { get; set; }
    public decimal PercentComplete { get; set; } // 0 - 100
    public bool Summary { get; set; } // Ana grup görevi mi?
    public bool Expanded { get; set; } = true;
    public string? ColorClass { get; set; } = "bg-blue-600";
    public int OrderId { get; set; }
}

public class GanttContext
{
    public string? Id { get; set; }
    public List<GanttTaskModel> Tasks { get; set; } = new();
    public string? OnTaskClick { get; set; }
}
