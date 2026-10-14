using System.Collections.Generic;

namespace Panoptes.AspNetCore.Models
{
    public class PlaylistItem
    {
        public string Title { get; set; } = string.Empty;
        public string? Subtitle { get; set; }
        public string Source { get; set; } = string.Empty;
        public string? Poster { get; set; }
        public string? Duration { get; set; }
    }

    public class MediaPlayerModel
    {
        public string Id { get; set; } = string.Empty;
        public string? Title { get; set; }
        public string? Source { get; set; }
        public string? Poster { get; set; }
        public string Type { get; set; } = "video"; // video, audio
        public bool AutoPlay { get; set; } = false;
        public bool Loop { get; set; } = false;
        public bool Muted { get; set; } = false;
        public int Width { get; set; } = 800;
        public int Height { get; set; } = 450;
        public List<PlaylistItem>? Playlist { get; set; }
        public string? OnPlay { get; set; }
        public string? OnPause { get; set; }
        public string? OnEnded { get; set; }
        public string? CssClass { get; set; }
    }
}
