using System.Collections.Generic;

namespace Panoptes.AspNetCore.Models
{
    public class FilterFieldDefinition
    {
        public string Name { get; set; } = string.Empty;
        public string Title { get; set; } = string.Empty;
        public string Type { get; set; } = "string"; // string, number, date, boolean
        public string? DefaultValue { get; set; }
    }

    public class FilterBuilderModel
    {
        public string Id { get; set; } = string.Empty;
        public string? Name { get; set; }
        public List<FilterFieldDefinition> Fields { get; set; } = new();
        public string? OnChange { get; set; }
        public string? OnApply { get; set; }
        public string? CssClass { get; set; }
    }
}
