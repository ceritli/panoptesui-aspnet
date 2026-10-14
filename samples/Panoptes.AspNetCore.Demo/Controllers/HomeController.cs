using System.Diagnostics;
using Microsoft.AspNetCore.Mvc;
using Panoptes.AspNetCore.Demo.Models;

namespace Panoptes.AspNetCore.Demo.Controllers;

public class HomeController : Controller
{
    private readonly ILogger<HomeController> _logger;

    public HomeController(ILogger<HomeController> logger)
    {
        _logger = logger;
    }

    public IActionResult Index()
    {
        return View();
    }

    [HttpGet("/Home/ComponentCatalog")]
    [HttpGet("/Home/Catalog")]
    public IActionResult ComponentCatalog()
    {
        return View("ComponentCatalog");
    }

    public IActionResult Privacy()
    {
        return View();
    }

    [HttpPost]
    public IActionResult SetLanguage(string culture, string returnUrl = "/")
    {
        Response.Cookies.Append(
            Microsoft.AspNetCore.Localization.CookieRequestCultureProvider.DefaultCookieName,
            Microsoft.AspNetCore.Localization.CookieRequestCultureProvider.MakeCookieValue(new Microsoft.AspNetCore.Localization.RequestCulture(culture)),
            new CookieOptions { Expires = DateTimeOffset.UtcNow.AddYears(1) }
        );

        var isEn = culture.StartsWith("en", StringComparison.OrdinalIgnoreCase);

        if (!string.IsNullOrEmpty(returnUrl) && Url.IsLocalUrl(returnUrl))
        {
            var cleanUrl = returnUrl.StartsWith("/en", StringComparison.OrdinalIgnoreCase)
                ? (returnUrl.Length == 3 ? "/" : returnUrl.Substring(3))
                : returnUrl;

            var targetUrl = isEn ? (cleanUrl == "/" ? "/en" : "/en" + cleanUrl) : cleanUrl;
            return LocalRedirect(targetUrl);
        }
        return Redirect(isEn ? "/en" : "/");
    }

    [ResponseCache(Duration = 0, Location = ResponseCacheLocation.None, NoStore = true)]
    public IActionResult Error()
    {
        return View(new ErrorViewModel { RequestId = Activity.Current?.Id ?? HttpContext.TraceIdentifier });
    }
}
