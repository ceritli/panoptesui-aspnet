using System;
using System.Collections.Generic;

namespace Panoptes.AspNetCore.Models
{
    public class DiagramNode
    {
        public string Id { get; set; } = string.Empty;
        public string Title { get; set; } = string.Empty;
        public string? Subtitle { get; set; }
        public string Shape { get; set; } = "rounded"; // rect, rounded, pill, circle
        public string Color { get; set; } = "blue"; // blue, emerald, amber, rose, purple, slate
        public string? Icon { get; set; }
        public double X { get; set; }
        public double Y { get; set; }
        public double Width { get; set; } = 180;
        public double Height { get; set; } = 70;
    }

    public class DiagramConnection
    {
        public string From { get; set; } = string.Empty;
        public string To { get; set; } = string.Empty;
        public string? Label { get; set; }
        public string? Color { get; set; }
        public bool Dashed { get; set; }
    }

    public class DiagramConfiguration
    {
        public string Id { get; set; } = string.Empty;
        public string Title { get; set; } = string.Empty;
        public string Layout { get; set; } = "flowchart"; // flowchart, orgchart
        public List<DiagramNode> Nodes { get; set; } = new();
        public List<DiagramConnection> Connections { get; set; } = new();
    }
}
