using Microsoft.AspNetCore.Mvc;
using Panoptes.AspNetCore.Models;
using System.Collections.Generic;

namespace Panoptes.AspNetCore.Demo.Controllers;

public class ActionSheetController : Controller
{
    public IActionResult Index() => RedirectToAction(nameof(Overview));

    public IActionResult Overview()
    {
        ViewData["Title"] = "ActionSheet - Genel Bakış (Overview)";
        return View();
    }

    public IActionResult TagHelper()
    {
        ViewData["Title"] = "ActionSheet - Tag Helper Kullanımı";
        return View();
    }

    public IActionResult Animation()
    {
        ViewData["Title"] = "ActionSheet - Animasyon Efektleri (Animation Effects)";
        return View();
    }

    public IActionResult ActionButtons()
    {
        ViewData["Title"] = "ActionSheet - Eylem Butonları & Gruplama (Action Buttons)";
        return View();
    }

    public IActionResult Api()
    {
        ViewData["Title"] = "ActionSheet - İstemci JavaScript API Metotları";
        return View();
    }

    public IActionResult Events()
    {
        ViewData["Title"] = "ActionSheet - Olaylar & Konsol (Events)";
        return View();
    }

    public IActionResult KeyboardNavigation()
    {
        ViewData["Title"] = "ActionSheet - Klavye Gezintisi & Erişilebilirlik (A11y)";
        return View();
    }

    public IActionResult Templates()
    {
        ViewData["Title"] = "ActionSheet - Özel Şablonlar & İçerik (Templates)";
        return View();
    }

    public IActionResult ModalFullscreen()
    {
        ViewData["Title"] = "ActionSheet - Modal & Tam Ekran Modu (Modal & Fullscreen)";
        return View();
    }
}
