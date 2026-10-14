using Microsoft.AspNetCore.Mvc;

namespace Panoptes.AspNetCore.Demo.Controllers
{
    public class EditorController : Controller
    {
        public IActionResult Index()
        {
            ViewData["Title"] = "Editor (Zengin Metin / WYSIWYG Düzenleyici)";
            return View();
        }
    }
}
