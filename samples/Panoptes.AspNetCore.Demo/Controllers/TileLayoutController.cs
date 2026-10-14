using Microsoft.AspNetCore.Mvc;
using Panoptes.AspNetCore.Models;
using System.Collections.Generic;

namespace Panoptes.AspNetCore.Demo.Controllers;

public class TileLayoutController : Controller
{
    public IActionResult Index() => RedirectToAction(nameof(Overview));

    public IActionResult Overview()
    {
        ViewData["Title"] = "TileLayout - Genel Bakış (Overview)";
        return View();
    }

    public IActionResult TagHelper()
    {
        ViewData["Title"] = "TileLayout - Tag Helper Kullanımı";
        return View();
    }

    public IActionResult Reordering()
    {
        ViewData["Title"] = "TileLayout - Sürükle-Bırak Yeniden Sıralama (Reordering)";
        return View();
    }

    public IActionResult Resizing()
    {
        ViewData["Title"] = "TileLayout - 2D Yeniden Boyutlandırma (Resizing)";
        return View();
    }

    public IActionResult AddRemove()
    {
        ViewData["Title"] = "TileLayout - Dinamik Kart Ekleme ve Kaldırma (Add/Remove)";
        return View();
    }

    public IActionResult KeyboardNavigation()
    {
        ViewData["Title"] = "TileLayout - Klavye Gezintisi & Erişilebilirlik (A11y)";
        return View();
    }

    public IActionResult Events()
    {
        ViewData["Title"] = "TileLayout - Olaylar & Konsol (Events)";
        return View();
    }

    public IActionResult StatePersistence()
    {
        ViewData["Title"] = "TileLayout - Durum Saklama (State Persistence & Dashboard)";
        return View();
    }

    public IActionResult Api()
    {
        ViewData["Title"] = "TileLayout - İstemci JavaScript API Metotları";
        return View();
    }
}
