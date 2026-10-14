using Microsoft.AspNetCore.Mvc;

namespace Panoptes.AspNetCore.Demo.Controllers;

public class StepperController : Controller
{
    public IActionResult Index()
    {
        return View();
    }
}
