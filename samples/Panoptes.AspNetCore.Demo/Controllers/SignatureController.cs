using Microsoft.AspNetCore.Mvc;

namespace Panoptes.AspNetCore.Demo.Controllers
{
    public class SignatureController : Controller
    {
        public IActionResult Index()
        {
            ViewData["Title"] = "Signature (Dijital Islak İmza Padi)";
            return View();
        }
    }
}
