using Microsoft.AspNetCore.Mvc;

namespace Panoptes.AspNetCore.Demo.Controllers;

public class ToolBarController : Controller
{
    public IActionResult Index()
    {
        return View();
    }
}
