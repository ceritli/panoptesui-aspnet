using Microsoft.AspNetCore.Mvc;

namespace Panoptes.AspNetCore.Demo.Controllers;

public class RatingController : Controller
{
    public IActionResult Index()
    {
        ViewBag.ProductRating = 4;
        ViewBag.CustomerSatisfaction = 3.5m;
        ViewBag.StoreRating = 4.8m;

        return View();
    }
}
