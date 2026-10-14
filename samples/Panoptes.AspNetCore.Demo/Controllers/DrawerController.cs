using Microsoft.AspNetCore.Mvc;

namespace Panoptes.AspNetCore.Demo.Controllers;

public class DrawerController : Controller
{
    public IActionResult Index()
    {
        return View();
    }
}
