using System.Collections.Generic;
using Microsoft.AspNetCore.Mvc;
using Panoptes.AspNetCore.Models;

namespace Panoptes.AspNetCore.Demo.Controllers;

public class GaugeController : Controller
{
    public IActionResult Index()
    {
        // Radial Kadran Eşik Dilimleri (Güvenli, Uyarı, Kritik)
        var serverCpuRanges = new List<GaugeRange>
        {
            new GaugeRange { From = 0, To = 60, Color = "#10b981", Label = "Normal" },
            new GaugeRange { From = 60, To = 80, Color = "#f59e0b", Label = "Yüksek" },
            new GaugeRange { From = 80, To = 100, Color = "#ef4444", Label = "Kritik" }
        };

        ViewBag.ServerCpuRanges = serverCpuRanges;

        return View();
    }
}
