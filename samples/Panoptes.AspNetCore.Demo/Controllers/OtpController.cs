using Microsoft.AspNetCore.Mvc;

namespace Panoptes.AspNetCore.Demo.Controllers;

public class OtpController : Controller
{
    public IActionResult Index()
    {
        ViewBag.DefaultOtp = "482915";
        ViewBag.DefaultPin = "1923";
        ViewBag.LicenseKey = "P8K2-9X4A";

        return View();
    }
}
