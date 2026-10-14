using Microsoft.AspNetCore.Mvc;

namespace Panoptes.AspNetCore.Demo.Controllers;

public class BarcodeController : Controller
{
    public IActionResult Index()
    {
        ViewBag.TrackingNumber = "PNP-TR-849204";
        ViewBag.ProductEan = "8690123456789";
        ViewBag.PortalUrl = "https://panoptes.dev/portal/auth?token=sec_993821";

        return View();
    }
}
