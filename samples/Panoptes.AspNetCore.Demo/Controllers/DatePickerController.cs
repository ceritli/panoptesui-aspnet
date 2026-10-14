using Microsoft.AspNetCore.Mvc;

namespace Panoptes.AspNetCore.Demo.Controllers;

public class DatePickerController : Controller
{
    public IActionResult Index()
    {
        ViewData["Title"] = "DatePicker (Genel Bakış) - Panoptes Kurumsal UI";
        return View();
    }

    public IActionResult Validation()
    {
        ViewData["Title"] = "DatePicker - Doğrulama (Min/Max)";
        return View();
    }

    public IActionResult DisabledDates()
    {
        ViewData["Title"] = "DatePicker - Pasif Tarihler";
        return View();
    }

    public IActionResult WeekNumber()
    {
        ViewData["Title"] = "DatePicker - Hafta Numaraları";
        return View();
    }

    public IActionResult Events()
    {
        ViewData["Title"] = "DatePicker - Olaylar (Events)";
        return View();
    }

    public IActionResult Api()
    {
        ViewData["Title"] = "DatePicker - API Metotları";
        return View();
    }
}
