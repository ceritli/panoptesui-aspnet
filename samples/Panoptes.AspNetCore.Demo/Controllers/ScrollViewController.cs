using Microsoft.AspNetCore.Mvc;

namespace Panoptes.AspNetCore.Demo.Controllers
{
    public class ScrollViewController : Controller
    {
        public IActionResult Index()
        {
            return View();
        }
    }
}
