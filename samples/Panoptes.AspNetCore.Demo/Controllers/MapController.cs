using System.IO;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc;
using Panoptes.AspNetCore.Models;

namespace Panoptes.AspNetCore.Demo.Controllers;

public class MapController : Controller
{
    private readonly IWebHostEnvironment _env;

    public MapController(IWebHostEnvironment env)
    {
        _env = env;
    }

    // 1. Genel Bakış
    public IActionResult Index() => View("Overview");
    public IActionResult Overview() => View();

    // 2. TagHelper Kullanımı
    public IActionResult TagHelper() => View();

    // 3. Çoklu Harita Katmanları (Tile Layers)
    public IActionResult TileLayers() => View();

    // 4. Kabarcık Katmanı (Bubble Layer)
    public IActionResult BubbleLayer() => View();

    // 5. GeoJSON & Vektör Katmanı
    public IActionResult GeoJson() => View();

    // 6. İşaretçiler ve Bilgi Pencereleri (Markers)
    public IActionResult Markers() => View();

    // 7. Dışa Aktarma (Export)
    public IActionResult Export() => View();

    // 8. Olaylar (Events)
    public IActionResult Events() => View();

    // 9. İstemci API (Client API)
    public IActionResult Api() => View();

    // ==================== AJAX JSON ENDPOINTLERİ ====================

    [HttpGet]
    public IActionResult GetCitiesJson()
    {
        return Json(MapDemoData.GetCities());
    }

    [HttpGet]
    public IActionResult GetStoresJson()
    {
        return Json(MapDemoData.GetRetailStores());
    }

    [HttpGet]
    public IActionResult GetRegionsGeoJson()
    {
        var filePath = Path.Combine(_env.WebRootPath, "panoptes", "data", "turkey-regions.json");
        if (System.IO.File.Exists(filePath))
        {
            return PhysicalFile(filePath, "application/json");
        }
        return Json(MapDemoData.GetTurkeyRegionsGeoJson());
    }

    [HttpGet]
    public IActionResult GetCitiesGeoJson()
    {
        var filePath = Path.Combine(_env.WebRootPath, "panoptes", "data", "turkey-cities.json");
        if (System.IO.File.Exists(filePath))
        {
            return PhysicalFile(filePath, "application/json");
        }
        return NotFound();
    }
}
