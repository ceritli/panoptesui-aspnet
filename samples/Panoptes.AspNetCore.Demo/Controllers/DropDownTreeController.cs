using System.Collections.Generic;
using Microsoft.AspNetCore.Mvc;
using Panoptes.AspNetCore.Models;

namespace Panoptes.AspNetCore.Demo.Controllers;

[Route("[controller]")]
public class DropDownTreeController : Controller
{
    [HttpGet("")]
    [HttpGet("BasicUsage")]
    public IActionResult Index()
    {
        ViewData["ActiveTab"] = "BasicUsage";
        ViewData["Title"] = "DropDownTree - Temel Kullanım & Genel Bakış";
        var data = DropDownTreeDemoData.GetOrganizationTree();
        return View("BasicUsage", data);
    }

    [HttpGet("TagHelper")]
    public IActionResult TagHelper()
    {
        ViewData["ActiveTab"] = "TagHelper";
        ViewData["Title"] = "DropDownTree - TagHelper ile Bildirimsel Tanım";
        return View();
    }

    [HttpGet("Checkboxes")]
    public IActionResult Checkboxes()
    {
        ViewData["ActiveTab"] = "Checkboxes";
        ViewData["Title"] = "DropDownTree - Çoklu Seçim & Onay Kutuları (Checkboxes)";
        var data = DropDownTreeDemoData.GetCategoriesTree();
        return View(data);
    }

    [HttpGet("Appearance")]
    public IActionResult Appearance()
    {
        ViewData["ActiveTab"] = "Appearance";
        ViewData["Title"] = "DropDownTree - Görünüm, Boyut ve Dolgu Modları (Appearance)";
        var data = DropDownTreeDemoData.GetOrganizationTree();
        return View(data);
    }

    [HttpGet("FloatingLabel")]
    public IActionResult FloatingLabel()
    {
        ViewData["ActiveTab"] = "FloatingLabel";
        ViewData["Title"] = "DropDownTree - Yüzen Etiket (Floating Label)";
        var data = DropDownTreeDemoData.GetOrganizationTree();
        return View(data);
    }

    [HttpGet("AdaptiveMode")]
    public IActionResult AdaptiveMode()
    {
        ViewData["ActiveTab"] = "AdaptiveMode";
        ViewData["Title"] = "DropDownTree - Mobil Uyumlu Mod (Adaptive Mode)";
        var data = DropDownTreeDemoData.GetCategoriesTree();
        return View(data);
    }

    [HttpGet("Images")]
    public IActionResult Images()
    {
        ViewData["ActiveTab"] = "Images";
        ViewData["Title"] = "DropDownTree - İkonlar ve Resimli Düğümler (Images & Icons)";
        var data = DropDownTreeDemoData.GetOrganizationTree();
        return View(data);
    }

    [HttpGet("Templates")]
    public IActionResult Templates()
    {
        ViewData["ActiveTab"] = "Templates";
        ViewData["Title"] = "DropDownTree - Özel Düğüm ve Başlık Şablonları (Templates)";
        var data = DropDownTreeDemoData.GetOrganizationTree();
        return View(data);
    }

    [HttpGet("ClientFiltering")]
    public IActionResult ClientFiltering()
    {
        ViewData["ActiveTab"] = "ClientFiltering";
        ViewData["Title"] = "DropDownTree - İstemci Tarafı Anlık Arama (Client Filtering)";
        var data = DropDownTreeDemoData.GetCategoriesTree();
        return View(data);
    }

    [HttpGet("LocalDataBinding")]
    public IActionResult LocalDataBinding()
    {
        ViewData["ActiveTab"] = "LocalDataBinding";
        ViewData["Title"] = "DropDownTree - Yerel Model Veri Bağlama (Local Data Binding)";
        var data = DropDownTreeDemoData.GetLocationsTree();
        return View(data);
    }

    [HttpGet("RemoteDataBinding")]
    public IActionResult RemoteDataBinding()
    {
        ViewData["ActiveTab"] = "RemoteDataBinding";
        ViewData["Title"] = "DropDownTree - Uzak API Endpoint Veri Bağlama (Remote Data Binding)";
        return View();
    }

    [HttpGet("GetCategoriesTree")]
    public IActionResult GetCategoriesTree()
    {
        var data = DropDownTreeDemoData.GetCategoriesTree();
        return Json(data);
    }

    [HttpGet("Events")]
    public IActionResult Events()
    {
        ViewData["ActiveTab"] = "Events";
        ViewData["Title"] = "DropDownTree - Olay Konsolu & Dinleyiciler (Events)";
        var data = DropDownTreeDemoData.GetOrganizationTree();
        return View(data);
    }

    [HttpGet("Api")]
    public IActionResult Api()
    {
        ViewData["ActiveTab"] = "Api";
        ViewData["Title"] = "DropDownTree - İstemci JavaScript API Metotları (API)";
        var data = DropDownTreeDemoData.GetOrganizationTree();
        return View(data);
    }

    [HttpGet("RtlSupport")]
    public IActionResult RtlSupport()
    {
        ViewData["ActiveTab"] = "RtlSupport";
        ViewData["Title"] = "DropDownTree - Sağdan Sola Düzen (RTL Support)";
        var data = DropDownTreeDemoData.GetCategoriesTree();
        return View(data);
    }

    [HttpGet("KeyboardNavigation")]
    public IActionResult KeyboardNavigation()
    {
        ViewData["ActiveTab"] = "KeyboardNavigation";
        ViewData["Title"] = "DropDownTree - Klavye Gezintisi & Erişilebilirlik (Keyboard Navigation)";
        var data = DropDownTreeDemoData.GetOrganizationTree();
        return View(data);
    }
}
