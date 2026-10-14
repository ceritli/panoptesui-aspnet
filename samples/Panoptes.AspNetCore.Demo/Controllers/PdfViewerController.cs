using Microsoft.AspNetCore.Mvc;

namespace Panoptes.AspNetCore.Demo.Controllers
{
    public class PdfViewerController : Controller
    {
        public IActionResult Index()
        {
            ViewData["Title"] = "PDFViewer (PDF Döküman Okuyucu ve Gezdirici)";
            return View();
        }
    }
}
