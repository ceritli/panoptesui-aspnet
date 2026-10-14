namespace Panoptes.AspNetCore.Models
{
    public class EditorModel
    {
        public string Id { get; set; } = string.Empty;
        public string? Name { get; set; }
        public string? Value { get; set; }
        public int Height { get; set; } = 320;
        public string Tools { get; set; } = "all"; // all, basic, standard
        public string Placeholder { get; set; } = "İçeriğinizi buraya yazın...";
        public bool ReadOnly { get; set; } = false;
        public string? OnChange { get; set; }
        public string? CssClass { get; set; }
    }
}
