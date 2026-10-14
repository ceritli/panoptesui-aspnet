using Microsoft.AspNetCore.Mvc;

namespace Panoptes.AspNetCore.Demo.Controllers;

public class ListViewController : Controller
{
    public IActionResult Index()
    {
        return View();
    }
}
