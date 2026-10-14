using Microsoft.AspNetCore.Mvc;

namespace Panoptes.AspNetCore.Demo.Controllers;

public class DialogController : Controller
{
    public IActionResult Index()
    {
        return View();
    }
}
