using System;
using System.IO;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

namespace Panoptes.AspNetCore.Demo.Controllers
{
    public class UploadController : Controller
    {
        public IActionResult Index()
        {
            ViewData["Title"] = "Upload (Dosya ve Belge Yükleme)";
            return View();
        }

        public IActionResult Manual()
        {
            ViewData["Title"] = "Upload - Manuel Yükleme (Sync)";
            return View();
        }

        public IActionResult Validation()
        {
            ViewData["Title"] = "Upload - Doğrulama (Validation)";
            return View();
        }

        public IActionResult Events()
        {
            ViewData["Title"] = "Upload - Olaylar (Events)";
            return View();
        }

        public IActionResult Api()
        {
            ViewData["Title"] = "Upload - API Metotları";
            return View();
        }

        public IActionResult Gallery()
        {
            ViewData["Title"] = "Upload - Resim Galerisi Sıralama (Drag & Drop)";
            return View();
        }

        [HttpPost]
        public async Task<IActionResult> Save(IFormFile file)
        {
            if (file == null || file.Length == 0)
            {
                return BadRequest(new { success = false, message = "Dosya seçilmedi." });
            }

            // Simulated safe receive (without saving permanently to disk to avoid clutter)
            await Task.Delay(200); // simulate fast network processing

            return Ok(new
            {
                success = true,
                fileName = file.FileName,
                size = file.Length,
                uploadedAt = DateTime.Now.ToString("yyyy-MM-dd HH:mm:ss")
            });
        }

        [HttpPost]
        public IActionResult Remove(string fileName)
        {
            return Ok(new { success = true, removed = fileName });
        }
    }
}
