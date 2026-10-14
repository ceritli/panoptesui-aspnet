namespace Panoptes.AspNetCore.Models;

public class WindowModel
{
    public string? Id { get; set; }
    public string? Title { get; set; }
    public string? Width { get; set; } = "500px";
    public string? Height { get; set; } = "350px";
    public bool Modal { get; set; } = true;
    public bool Draggable { get; set; } = true;
    public bool Resizable { get; set; } = true;
    public bool Closable { get; set; } = true;
    public bool Maximizable { get; set; } = true;
    public bool Minimizable { get; set; } = true;
    public bool Visible { get; set; }
    public string? ContentHtml { get; set; }
}
