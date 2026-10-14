using Microsoft.AspNetCore.Mvc;

namespace Panoptes.AspNetCore.Demo.Controllers;

public class MenuController : Controller
{
    public record DemoProduct(int Id, string Code, string Name, string Category, decimal Price, int Stock, string Status);

    public IActionResult Index()
    {
        var products = new List<DemoProduct>
        {
            new(101, "PRD-001", "MacBook Pro M3 Max 16\"", "Bilgisayar", 124999.00m, 12, "Aktif"),
            new(102, "PRD-002", "Dell UltraSharp 32\" 4K USB-C Hub", "Monitör", 34500.00m, 28, "Aktif"),
            new(103, "PRD-003", "Logitech MX Master 3S Kablosuz Mouse", "Aksesuar", 4199.00m, 64, "Aktif"),
            new(104, "PRD-004", "Keychron Q1 Pro Mekanik Klavye", "Donanım", 7850.00m, 15, "Kritik Stok"),
            new(105, "PRD-005", "Sony WH-1000XM5 ANC Kulaklık", "Ses & Müzik", 14200.00m, 0, "Tükendi"),
            new(106, "PRD-006", "CalDigit TS4 Thunderbolt 4 Dock", "Aksesuar", 18900.00m, 9, "Aktif")
        };

        return View(products);
    }
}
