using System;
using System.Collections.Generic;
using System.Text.Encodings.Web;
using System.Text.Json;
using Microsoft.AspNetCore.Razor.TagHelpers;
using Panoptes.AspNetCore.Models;

namespace Panoptes.AspNetCore.TagHelpers
{
    [HtmlTargetElement("panoptes-mediaplayer")]
    public class MediaPlayerTagHelper : TagHelper
    {
        [HtmlAttributeName("id")]
        public string? Id { get; set; }

        [HtmlAttributeName("src")]
        public string? Source { get; set; }

        [HtmlAttributeName("type")]
        public string Type { get; set; } = "video"; // video, audio

        [HtmlAttributeName("title")]
        public string? Title { get; set; }

        [HtmlAttributeName("poster")]
        public string? Poster { get; set; }

        [HtmlAttributeName("autoplay")]
        public bool AutoPlay { get; set; } = false;

        [HtmlAttributeName("loop")]
        public bool Loop { get; set; } = false;

        [HtmlAttributeName("muted")]
        public bool Muted { get; set; } = false;

        [HtmlAttributeName("playlist")]
        public List<PlaylistItem>? Playlist { get; set; }

        [HtmlAttributeName("on-play")]
        public string? OnPlay { get; set; }

        [HtmlAttributeName("on-pause")]
        public string? OnPause { get; set; }

        [HtmlAttributeName("on-ended")]
        public string? OnEnded { get; set; }

        [HtmlAttributeName("class")]
        public string? CssClass { get; set; }

        public override void Process(TagHelperContext context, TagHelperOutput output)
        {
            var playerId = string.IsNullOrWhiteSpace(Id) ? "panoptes-player-" + Guid.NewGuid().ToString("N")[..8] : Id;
            var isAudio = Type.Equals("audio", StringComparison.OrdinalIgnoreCase);

            output.TagName = "div";
            output.TagMode = TagMode.StartTagAndEndTag;
            output.Attributes.SetAttribute("id", playerId);
            output.Attributes.SetAttribute("data-panoptes-player", "true");
            output.Attributes.SetAttribute("data-type", isAudio ? "audio" : "video");

            if (!string.IsNullOrWhiteSpace(Source))
                output.Attributes.SetAttribute("data-src", Source);

            if (Playlist != null && Playlist.Count > 0)
            {
                var json = JsonSerializer.Serialize(Playlist);
                output.Attributes.SetAttribute("data-playlist", json);
            }

            if (!string.IsNullOrWhiteSpace(OnPlay))
                output.Attributes.SetAttribute("data-on-play", OnPlay);

            if (!string.IsNullOrWhiteSpace(OnPause))
                output.Attributes.SetAttribute("data-on-pause", OnPause);

            if (!string.IsNullOrWhiteSpace(OnEnded))
                output.Attributes.SetAttribute("data-on-ended", OnEnded);

            output.Attributes.SetAttribute("class", $"panoptes-player-container rounded-2xl overflow-hidden bg-slate-950 text-white shadow-xl flex flex-col group relative select-none w-full {CssClass}".Trim());

            var sb = new System.Text.StringBuilder();

            // Screen Area
            if (!isAudio)
            {
                sb.Append("<div class=\"panoptes-player-screen-wrap relative w-full aspect-video bg-black flex items-center justify-center overflow-hidden cursor-pointer\">");
                
                var posterAttr = !string.IsNullOrWhiteSpace(Poster) ? $"poster=\"{HtmlEncoder.Default.Encode(Poster)}\"" : "";
                var loopAttr = Loop ? "loop" : "";
                var mutedAttr = Muted ? "muted" : "";
                var srcAttr = !string.IsNullOrWhiteSpace(Source) ? $"src=\"{HtmlEncoder.Default.Encode(Source)}\"" : "";

                sb.Append($"<video class=\"panoptes-player-media w-full h-full object-cover block\" {srcAttr} {posterAttr} {loopAttr} {mutedAttr} playsinline></video>");

                // Big Center Play Button Overlay
                sb.Append("<div class=\"panoptes-player-big-play absolute inset-0 flex items-center justify-center bg-black/30 backdrop-blur-[2px] transition-opacity duration-300\">");
                sb.Append("<button type=\"button\" class=\"w-16 h-16 rounded-full bg-blue-600/90 hover:bg-blue-600 hover:scale-110 active:scale-95 text-white flex items-center justify-center shadow-2xl transition-all\">");
                sb.Append("<svg class=\"w-8 h-8 translate-x-0.5\" fill=\"currentColor\" viewBox=\"0 0 24 24\"><path d=\"M8 5v14l11-7z\"/></svg>");
                sb.Append("</button>");
                sb.Append("</div>");

                // Title Overlay (top gradient)
                if (!string.IsNullOrWhiteSpace(Title))
                {
                    sb.Append("<div class=\"panoptes-player-title-overlay absolute top-0 inset-x-0 p-4 bg-gradient-to-b from-black/80 to-transparent text-sm font-bold text-white flex items-center gap-2 pointer-events-none transition-opacity\">");
                    sb.Append($"<span>{HtmlEncoder.Default.Encode(Title)}</span>");
                    sb.Append("</div>");
                }

                sb.Append("</div>"); // end screen wrap
            }
            else
            {
                // Audio Waveform & Artwork header
                sb.Append("<div class=\"panoptes-player-audio-header p-5 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 flex items-center gap-4 border-b border-slate-800\">");
                
                // Audio artwork icon
                sb.Append("<div class=\"w-14 h-14 rounded-2xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shrink-0 shadow-lg\">");
                sb.Append("<svg class=\"w-7 h-7\" fill=\"none\" stroke=\"currentColor\" viewBox=\"0 0 24 24\"><path stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"2\" d=\"M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3\"/></svg>");
                sb.Append("</div>");

                sb.Append("<div class=\"min-w-0 flex-1\">");
                sb.Append($"<h4 class=\"text-sm font-bold text-white truncate\">{HtmlEncoder.Default.Encode(Title ?? "Ses Parçası")}</h4>");
                sb.Append("<div class=\"text-xs text-slate-400 mt-0.5 flex items-center gap-2\">");
                sb.Append("<span class=\"w-2 h-2 rounded-full bg-emerald-500 animate-pulse\"></span>");
                sb.Append("<span class=\"panoptes-player-audio-sub\">Hazır</span>");
                sb.Append("</div>");
                sb.Append("</div>");

                var srcAttr = !string.IsNullOrWhiteSpace(Source) ? $"src=\"{HtmlEncoder.Default.Encode(Source)}\"" : "";
                var loopAttr = Loop ? "loop" : "";
                var mutedAttr = Muted ? "muted" : "";
                sb.Append($"<audio class=\"panoptes-player-media hidden\" {srcAttr} {loopAttr} {mutedAttr}></audio>");

                sb.Append("</div>"); // end audio header
            }

            // Controls Bar (Seek bar + Buttons)
            sb.Append("<div class=\"panoptes-player-controls px-4 py-3 bg-slate-900/95 border-t border-slate-800/80 flex flex-col gap-2\">");
            
            // Progress / Seek Bar
            sb.Append("<div class=\"panoptes-player-seek-wrap w-full h-2 bg-slate-700/60 hover:h-3 rounded-full cursor-pointer relative transition-all duration-150 flex items-center\">");
            sb.Append("<div class=\"panoptes-player-progress-bar bg-blue-500 h-full rounded-full relative\" style=\"width: 0%;\">");
            sb.Append("<div class=\"panoptes-player-seek-thumb w-3 h-3 bg-white rounded-full absolute -right-1.5 top-1/2 -translate-y-1/2 shadow-md opacity-0 group-hover:opacity-100 transition-opacity\"></div>");
            sb.Append("</div>");
            sb.Append("</div>");

            // Buttons row
            sb.Append("<div class=\"flex items-center justify-between gap-3 text-xs\">");

            // Left: Play/Pause, Rewind, Forward, Time
            sb.Append("<div class=\"flex items-center gap-2\">");
            
            // Play / Pause Toggle button
            sb.Append("<button type=\"button\" class=\"panoptes-player-btn-play w-8 h-8 rounded-lg bg-blue-600 hover:bg-blue-500 text-white flex items-center justify-center transition active:scale-95 shadow-sm\" title=\"Oynat / Duraklat\">");
            sb.Append("<svg class=\"w-4 h-4 panoptes-icon-play translate-x-0.5\" fill=\"currentColor\" viewBox=\"0 0 24 24\"><path d=\"M8 5v14l11-7z\"/></svg>");
            sb.Append("<svg class=\"w-4 h-4 panoptes-icon-pause hidden\" fill=\"currentColor\" viewBox=\"0 0 24 24\"><path d=\"M6 19h4V5H6v14zm8-14v14h4V5h-4z\"/></svg>");
            sb.Append("</button>");

            // Time Display (00:00 / 00:00)
            sb.Append("<span class=\"font-mono text-[11px] text-slate-300 ml-1\">");
            sb.Append("<span class=\"panoptes-player-time-current\">00:00</span>");
            sb.Append("<span class=\"text-slate-500 mx-1\">/</span>");
            sb.Append("<span class=\"panoptes-player-time-total text-slate-400\">00:00</span>");
            sb.Append("</span>");

            sb.Append("</div>"); // end left

            // Right: Volume Slider, Fullscreen
            sb.Append("<div class=\"flex items-center gap-3\">");

            // Volume Mute Button + Slider
            sb.Append("<div class=\"flex items-center gap-1.5\">");
            sb.Append("<button type=\"button\" class=\"panoptes-player-btn-mute p-1 text-slate-400 hover:text-white transition\" title=\"Sessize Al / Aç\">");
            sb.Append("<svg class=\"w-4 h-4 panoptes-icon-vol-up\" fill=\"none\" stroke=\"currentColor\" viewBox=\"0 0 24 24\"><path stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"2\" d=\"M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z\"/></svg>");
            sb.Append("<svg class=\"w-4 h-4 panoptes-icon-vol-mute hidden\" fill=\"none\" stroke=\"currentColor\" viewBox=\"0 0 24 24\"><path stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"2\" d=\"M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z\"/><path stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"2\" d=\"M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2\"/></svg>");
            sb.Append("</button>");
            sb.Append("<input type=\"range\" min=\"0\" max=\"1\" step=\"0.05\" value=\"1\" class=\"panoptes-player-vol-range w-16 h-1 bg-slate-700 rounded-lg accent-blue-500 cursor-pointer\" title=\"Ses Seviyesi\" />");
            sb.Append("</div>");

            // Fullscreen Button (only for video)
            if (!isAudio)
            {
                sb.Append("<button type=\"button\" class=\"panoptes-player-btn-fullscreen p-1 text-slate-400 hover:text-white transition\" title=\"Tam Ekran\">");
                sb.Append("<svg class=\"w-4 h-4\" fill=\"none\" stroke=\"currentColor\" viewBox=\"0 0 24 24\"><path stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"2\" d=\"M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4\"/></svg>");
                sb.Append("</button>");
            }

            sb.Append("</div>"); // end right

            sb.Append("</div>"); // end buttons row

            sb.Append("</div>"); // end controls

            // Playlist Drawer / List (if playlist is provided)
            if (Playlist != null && Playlist.Count > 0)
            {
                sb.Append("<div class=\"panoptes-player-playlist p-3 bg-slate-900 border-t border-slate-800 space-y-1 max-h-48 overflow-y-auto text-xs\">");
                sb.Append("<div class=\"text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 px-2\">Oynatma Listesi</div>");
                
                for (int i = 0; i < Playlist.Count; i++)
                {
                    var item = Playlist[i];
                    var activeClass = i == 0 ? "bg-blue-600/20 text-blue-400 border border-blue-500/30 font-bold" : "text-slate-300 hover:bg-slate-800 border border-transparent";
                    sb.Append($"<div class=\"panoptes-playlist-item flex items-center justify-between p-2 rounded-xl cursor-pointer transition {activeClass}\" data-src=\"{HtmlEncoder.Default.Encode(item.Source)}\" data-title=\"{HtmlEncoder.Default.Encode(item.Title)}\" data-index=\"{i}\">");
                    sb.Append("<div class=\"flex items-center gap-2 truncate\">");
                    sb.Append($"<span class=\"w-5 text-center font-mono opacity-60\">{i + 1}</span>");
                    sb.Append($"<span class=\"truncate\">{HtmlEncoder.Default.Encode(item.Title)}</span>");
                    sb.Append("</div>");
                    if (!string.IsNullOrWhiteSpace(item.Duration))
                    {
                        sb.Append($"<span class=\"font-mono text-[11px] opacity-60 ml-2\">{HtmlEncoder.Default.Encode(item.Duration)}</span>");
                    }
                    sb.Append("</div>");
                }
                sb.Append("</div>");
            }

            output.Content.SetHtmlContent(sb.ToString());
        }
    }
}
