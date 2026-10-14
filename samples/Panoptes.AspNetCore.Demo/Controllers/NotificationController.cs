using Microsoft.AspNetCore.Mvc;

namespace Panoptes.AspNetCore.Demo.Controllers;

public class NotificationController : Controller
{
    public IActionResult Index()
    {
        return View();
    }
}
