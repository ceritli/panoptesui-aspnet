using System;
using System.Collections.Generic;

namespace Panoptes.AspNetCore.Models
{
    public class PivotField
    {
        public string Name { get; set; } = string.Empty;
        public string Title { get; set; } = string.Empty;
        public string Type { get; set; } = "string"; // string, number, date
        public string DefaultArea { get; set; } = "none"; // row, column, measure, none
        public string? Aggregate { get; set; } // sum, count, avg, min, max
    }

    public class PivotGridConfiguration
    {
        public string Id { get; set; } = string.Empty;
        public List<PivotField> Fields { get; set; } = new();
        public List<string> Rows { get; set; } = new();
        public List<string> Columns { get; set; } = new();
        public List<string> Measures { get; set; } = new();
        public bool ShowConfigurator { get; set; } = true;
    }
}
