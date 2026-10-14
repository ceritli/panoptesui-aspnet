namespace Panoptes.AspNetCore.Models
{
    public class UploadModel
    {
        public string Id { get; set; } = string.Empty;
        public string? Name { get; set; }
        public bool Multiple { get; set; } = true;
        public bool AutoUpload { get; set; } = true;
        public string? AllowedExtensions { get; set; } // e.g. ".pdf,.docx,.png"
        public long MaxFileSize { get; set; } = 10 * 1024 * 1024; // 10MB
        public string? SaveUrl { get; set; }
        public string? RemoveUrl { get; set; }
        public string? OnSelect { get; set; }
        public string? OnUpload { get; set; }
        public string? OnSuccess { get; set; }
        public string? OnError { get; set; }
        public string? OnRemove { get; set; }
        public string? DropZoneText { get; set; } = "Dosyaları buraya sürükleyip bırakın veya bilgisayarınızdan seçin";
        public string? CssClass { get; set; }
    }
}
