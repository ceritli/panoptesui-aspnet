using Microsoft.AspNetCore.Mvc;

namespace Panoptes.AspNetCore.Demo.Controllers;

public class WindowController : Controller
{
    public IActionResult Index()
    {
        return View();
    }
}
