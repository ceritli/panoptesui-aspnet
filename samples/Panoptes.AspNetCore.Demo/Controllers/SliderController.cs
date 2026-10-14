using Microsoft.AspNetCore.Mvc;

namespace Panoptes.AspNetCore.Demo.Controllers
{
    public class SliderController : Controller
    {
        public IActionResult Index()
        {
            ViewData["Title"] = "Slider & RangeSlider (Sürgü ve Aralık Seçici)";
            return View();
        }
    }
}
