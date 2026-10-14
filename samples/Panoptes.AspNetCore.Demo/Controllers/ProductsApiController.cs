using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Panoptes.AspNetCore.Demo.Data;
using Panoptes.AspNetCore.Demo.Models;
using Panoptes.Core.Data;
using Panoptes.Core.Extensions;

namespace Panoptes.AspNetCore.Demo.Controllers;

[ApiController]
[Route("api/products")]
public class ProductsApiController : ControllerBase
{
    private readonly DemoDbContext _db;

    public ProductsApiController(DemoDbContext db)
    {
        _db = db;
    }

    private static readonly Dictionary<string, string> CategoryMap = new(StringComparer.OrdinalIgnoreCase)
    {
        ["Elektronik"] = "Electronics",
        ["İçecek & Gıda"] = "Food & Beverages",
        ["Ofis & Kırtasiye"] = "Office & Stationery",
        ["Donanım"] = "Hardware",
        ["Ağ & Güvenlik"] = "Networking & Security",
        ["Deniz Ürünleri"] = "Seafood"
    };

    private static readonly Dictionary<string, string> CountryMap = new(StringComparer.OrdinalIgnoreCase)
    {
        ["Türkiye"] = "Turkey",
        ["Almanya"] = "Germany",
        ["Japonya"] = "Japan",
        ["ABD"] = "USA",
        ["İtalya"] = "Italy",
        ["İngiltere"] = "United Kingdom",
        ["Fransa"] = "France"
    };

    private static readonly Dictionary<string, string> SupplierMap = new(StringComparer.OrdinalIgnoreCase)
    {
        ["Anadolu Lojistik"] = "Anatolia Logistics",
        ["İnovasyon A.Ş."] = "Innovation Inc.",
        ["Ege Dağıtım"] = "Aegean Distribution",
        ["Marmara Tedarik"] = "Marmara Supply"
    };

    private static readonly Dictionary<string, string> ProductNameMap = new(StringComparer.OrdinalIgnoreCase)
    {
        ["Akıllı Saat Pro"] = "Smart Watch Pro",
        ["Kablosuz Kulaklık ANC"] = "Wireless ANC Headphones",
        ["Ultra HD 4K Monitör"] = "Ultra HD 4K Monitor",
        ["Mekanik RGB Klavye"] = "Mechanical RGB Keyboard",
        ["Ergonomik Dikey Fare"] = "Ergonomic Vertical Mouse",
        ["Tablet Stylus Pen"] = "Tablet Stylus Pen",
        ["Hızlı Şarj İstasyonu 100W"] = "100W Fast Charging Station",
        ["Organik Karadeniz Çayı"] = "Organic Black Sea Tea",
        ["Espresso Çekirdek Kahve"] = "Espresso Coffee Beans",
        ["Soğuk Sıkım Zeytinyağı"] = "Cold-Pressed Olive Oil",
        ["Doğal Çiçek Balı"] = "Natural Flower Honey",
        ["Dondurulmuş Somon Fileto"] = "Frozen Salmon Fillet",
        ["Geleneksel Türk Kahvesi"] = "Traditional Turkish Coffee",
        ["Ergonomik File Koltuk"] = "Ergonomic Mesh Chair",
        ["Ayarlanabilir Çalışma Masası"] = "Adjustable Standing Desk",
        ["Lüks Dolma Kalem Seti"] = "Luxury Fountain Pen Set",
        ["A4 Premium Fotokopi Kağıdı"] = "A4 Premium Copy Paper",
        ["Akıllı Not Defteri"] = "Smart Notebook",
        ["Belge İmha Cihazı"] = "Document Shredder",
        ["NVMe M.2 2TB SSD"] = "NVMe M.2 2TB SSD",
        ["DDR5 32GB RAM Kiti"] = "DDR5 32GB RAM Kit",
        ["Grafik İşlemci RTX 4070"] = "Graphics Card RTX 4070",
        ["Modüler Güç Kaynağı 850W"] = "850W Modular Power Supply",
        ["Sıvı Soğutma Bloğu 360mm"] = "360mm Liquid Cooling Block",
        ["Thunderbolt 4 Dock"] = "Thunderbolt 4 Dock",
        ["Wi-Fi 7 Mesh Yönlendirici"] = "Wi-Fi 7 Mesh Router",
        ["Yönetilebilir Gigabit Switch"] = "Managed Gigabit Switch",
        ["Donanımsal Güvenlik Duvarı"] = "Hardware Firewall",
        ["IP Güvenlik Kamerası 4K"] = "4K IP Security Camera",
        ["Ağ Depolama Cihazı NAS 4-Bay"] = "4-Bay NAS Storage",
        ["Norveç Somonu"] = "Norwegian Salmon",
        ["Karides Jumbo"] = "Jumbo Shrimp",
        ["Kalamar Tava Dilimi"] = "Fried Calamari Rings",
        ["Ege Çipura Fileto"] = "Aegean Sea Bream Fillet",
        ["Karadeniz Levrek"] = "Black Sea Bass",
        ["Midyeli Risotto Karışımı"] = "Mussel Risotto Mix"
    };

    private bool IsEnglish()
    {
        var referer = Request.Headers.Referer.ToString();
        if (referer.Contains("/en/", StringComparison.OrdinalIgnoreCase) || referer.EndsWith("/en", StringComparison.OrdinalIgnoreCase))
            return true;
        if (Request.Query["culture"].ToString().StartsWith("en", StringComparison.OrdinalIgnoreCase))
            return true;
        if (Request.Headers["Accept-Language"].ToString().StartsWith("en", StringComparison.OrdinalIgnoreCase))
            return true;
        return false;
    }

    private Product LocalizeProduct(Product p)
    {
        var clone = new Product
        {
            Id = p.Id,
            Price = p.Price,
            Stock = p.Stock,
            IsActive = p.IsActive,
            Discontinued = p.Discontinued,
            CreatedAt = p.CreatedAt,
            ImageUrl = p.ImageUrl,
            CustomerRating = p.CustomerRating,
            CountryCode = p.CountryCode,
            TotalSales = p.TotalSales,
            TargetSales = p.TargetSales
        };

        clone.Category = CategoryMap.TryGetValue(p.Category, out var cat) ? cat : p.Category;
        clone.Country = CountryMap.TryGetValue(p.Country, out var ctry) ? ctry : p.Country;
        clone.Supplier = SupplierMap.TryGetValue(p.Supplier, out var sup) ? sup : p.Supplier;

        var name = p.Name;
        foreach (var pair in ProductNameMap)
        {
            if (name.StartsWith(pair.Key))
            {
                name = name.Replace(pair.Key, pair.Value);
                break;
            }
        }
        name = name.Replace("Sürüm", "Version");
        clone.Name = name;
        return clone;
    }

    [HttpGet("")]
    [HttpGet("read")]
    public async Task<IActionResult> Get([FromQuery] int page = 1, [FromQuery] int pageSize = 50, [FromQuery] string? quickSearch = null, [FromQuery] string? filter = null)
    {
        var term = !string.IsNullOrWhiteSpace(filter) ? filter : quickSearch;
        var query = _db.Products.AsQueryable();
        if (!string.IsNullOrWhiteSpace(term))
        {
            query = query.Where(p => p.Name.Contains(term) || p.Category.Contains(term) || p.Supplier.Contains(term));
        }

        var request = new DataSourceRequest
        {
            Page = page <= 0 ? 1 : page,
            PageSize = pageSize <= 0 ? 50 : pageSize,
            QuickSearch = term
        };
        var result = await query.ToDataSourceResultAsync(request);
        if (IsEnglish() && result.Data != null)
        {
            result.Data = result.Data.Cast<Product>().Select(LocalizeProduct).ToList();
        }
        return Ok(result);
    }

    [HttpPost("")]
    [HttpPost("read")]
    public async Task<IActionResult> Read([FromBody] DataSourceRequest? request)
    {
        request ??= new DataSourceRequest { Page = 1, PageSize = 10 };
        if (request.Page <= 0) request.Page = 1;
        if (request.PageSize <= 0) request.PageSize = 10;
        var result = await _db.Products.ToDataSourceResultAsync(request);
        if (IsEnglish() && result.Data != null)
        {
            result.Data = result.Data.Cast<Product>().Select(LocalizeProduct).ToList();
        }
        return Ok(result);
    }

    [HttpPost("create")]
    public async Task<IActionResult> Create([FromBody] Product product)
    {
        if (string.IsNullOrWhiteSpace(product.Name))
        {
            return BadRequest(new { error = "Ürün adı boş olamaz" });
        }

        product.CreatedAt = DateTime.UtcNow;
        _db.Products.Add(product);
        await _db.SaveChangesAsync();
        return Ok(product);
    }

    [HttpPost("update")]
    public async Task<IActionResult> Update([FromBody] Product product)
    {
        var existing = await _db.Products.FindAsync(product.Id);
        if (existing == null)
        {
            return NotFound(new { error = "Ürün bulunamadı" });
        }

        existing.Name = product.Name;
        existing.Category = product.Category;
        existing.Price = product.Price;
        existing.Stock = product.Stock;
        existing.IsActive = product.IsActive;
        if (product.CreatedAt != default) existing.CreatedAt = product.CreatedAt;

        await _db.SaveChangesAsync();
        return Ok(existing);
    }

    [HttpPost("batch")]
    public async Task<IActionResult> Batch([FromBody] List<Product> products)
    {
        foreach (var item in products)
        {
            var existing = await _db.Products.FindAsync(item.Id);
            if (existing != null)
            {
                existing.Name = item.Name;
                existing.Category = item.Category;
                existing.Price = item.Price;
                existing.Stock = item.Stock;
                existing.IsActive = item.IsActive;
                if (item.CreatedAt != default) existing.CreatedAt = item.CreatedAt;
            }
        }
        await _db.SaveChangesAsync();
        return Ok(new { success = true, count = products.Count });
    }

    public class DeleteRequest
    {
        public int Id { get; set; }
    }

    [HttpPost("delete")]
    public async Task<IActionResult> Delete([FromBody] DeleteRequest request)
    {
        var existing = await _db.Products.FindAsync(request.Id);
        if (existing == null)
        {
            return NotFound(new { error = "Ürün bulunamadı" });
        }

        _db.Products.Remove(existing);
        await _db.SaveChangesAsync();
        return Ok(new { success = true, id = request.Id });
    }
}
