namespace Panoptes.AspNetCore.Models
{
    public class PdfViewerModel
    {
        public string Id { get; set; } = string.Empty;
        public string? Source { get; set; }
        public string? Title { get; set; }
        public int Height { get; set; } = 650;
        public int TotalPages { get; set; } = 5;
        public double InitialZoom { get; set; } = 1.0;
        public bool EnableDownload { get; set; } = true;
        public bool EnablePrint { get; set; } = true;
        public bool EnableSearch { get; set; } = true;
        public string? OnPageChange { get; set; }
        public string? CssClass { get; set; }
    }
}
