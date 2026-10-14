using Microsoft.AspNetCore.Mvc;
using Panoptes.AspNetCore.Models;

namespace Panoptes.AspNetCore.Demo.Controllers;

public class BreadcrumbController : Controller
{
    public IActionResult Index()
    {
        // Modelden bağlama demosu için örnek C# listesi
        var dynamicItems = new List<BreadcrumbItemModel>
        {
            new() { Text = "Ana Sayfa", Url = "/", Icon = "home" },
            new() { Text = "E-Ticaret Yönetimi", Url = "/Breadcrumb", Icon = "folder" },
            new() { Text = "Siparişler & Sevkiyat", Url = "/Breadcrumb", Icon = "document" },
            new() { Text = "#ORD-2026-9481 Detayı", IsCurrent = true }
        };

        return View(dynamicItems);
    }
}
