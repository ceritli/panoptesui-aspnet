using System.Collections.Generic;
using Microsoft.AspNetCore.Mvc;
using Panoptes.AspNetCore.Models;

namespace Panoptes.AspNetCore.Demo.Controllers
{
    public class MediaPlayerController : Controller
    {
        public IActionResult Index()
        {
            ViewData["Title"] = "MediaPlayer (Video ve Ses Oynatıcı)";

            var samplePlaylist = new List<PlaylistItem>
            {
                new PlaylistItem
                {
                    Title = "Big Buck Bunny - Doğal Yaşam Tanıtımı",
                    Subtitle = "Açık Kaynak HD Video",
                    Source = "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
                    Duration = "09:56"
                },
                new PlaylistItem
                {
                    Title = "Elephants Dream - 3D Animasyon",
                    Subtitle = "Blender Studio CGI",
                    Source = "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4",
                    Duration = "10:53"
                },
                new PlaylistItem
                {
                    Title = "For Bigger Blazes - Teknoloji Fragmanı",
                    Subtitle = "Google Sample Media",
                    Source = "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
                    Duration = "00:15"
                }
            };

            ViewBag.SamplePlaylist = samplePlaylist;
            return View();
        }
    }
}
