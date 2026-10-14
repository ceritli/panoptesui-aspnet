using Microsoft.EntityFrameworkCore;
using Panoptes.AspNetCore.Demo.Models;

namespace Panoptes.AspNetCore.Demo.Data;

public class DemoDbContext : DbContext
{
    public DemoDbContext(DbContextOptions<DemoDbContext> options) : base(options)
    {
    }

    public DbSet<Product> Products => Set<Product>();
    public DbSet<StockMovement> StockMovements => Set<StockMovement>();

    public static void Seed(DemoDbContext db)
    {
        if (db.Products.Any()) return;

                var suppliers = new[] { "TechCorp", "GlobalTrade", "Anadolu Lojistik", "İnovasyon A.Ş.", "Ege Dağıtım", "Marmara Tedarik" };
        var categories = new[] { "Elektronik", "İçecek & Gıda", "Ofis & Kırtasiye", "Donanım", "Ağ & Güvenlik", "Deniz Ürünleri" };
        var countries = new[]
        {
            ("Türkiye", "tr"),
            ("Almanya", "de"),
            ("Japonya", "jp"),
            ("ABD", "us"),
            ("İtalya", "it"),
            ("İngiltere", "gb"),
            ("Fransa", "fr")
        };

        var productNames = new Dictionary<string, string[]>
        {
            ["Elektronik"] = new[] { "Akıllı Saat Pro", "Kablosuz Kulaklık ANC", "Ultra HD 4K Monitör", "Mekanik RGB Klavye", "Ergonomik Dikey Fare", "Tablet Stylus Pen", "Hızlı Şarj İstasyonu 100W" },
            ["İçecek & Gıda"] = new[] { "Organik Karadeniz Çayı", "Espresso Çekirdek Kahve", "Soğuk Sıkım Zeytinyağı", "Doğal Çiçek Balı", "Dondurulmuş Somon Fileto", "Geleneksel Türk Kahvesi" },
            ["Ofis & Kırtasiye"] = new[] { "Ergonomik File Koltuk", "Ayarlanabilir Çalışma Masası", "Lüks Dolma Kalem Seti", "A4 Premium Fotokopi Kağıdı", "Akıllı Not Defteri", "Belge İmha Cihazı" },
            ["Donanım"] = new[] { "NVMe M.2 2TB SSD", "DDR5 32GB RAM Kiti", "Grafik İşlemci RTX 4070", "Modüler Güç Kaynağı 850W", "Sıvı Soğutma Bloğu 360mm", "Thunderbolt 4 Dock" },
            ["Ağ & Güvenlik"] = new[] { "Wi-Fi 7 Mesh Yönlendirici", "Yönetilebilir Gigabit Switch", "Donanımsal Güvenlik Duvarı", "IP Güvenlik Kamerası 4K", "Ağ Depolama Cihazı NAS 4-Bay" },
            ["Deniz Ürünleri"] = new[] { "Norveç Somonu", "Karides Jumbo", "Kalamar Tava Dilimi", "Ege Çipura Fileto", "Karadeniz Levrek", "Midyeli Risotto Karışımı" }
        };

        var photos = new[]
        {
            "https://images.unsplash.com/photo-1546868871-7041f2a55e12?w=100&q=80",
            "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=100&q=80",
            "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=100&q=80",
            "https://images.unsplash.com/photo-1583394838336-acd977736f90?w=100&q=80",
            "https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=100&q=80",
            "https://images.unsplash.com/photo-1560343090-f0409e92791a?w=100&q=80",
            "https://images.unsplash.com/photo-1585386959984-a4155224a1ad?w=100&q=80"
        };

        var random = new Random(42);
        var products = new List<Product>();

        for (int i = 1; i <= 100; i++)
        {
            var cat = categories[random.Next(categories.Length)];
            var nameList = productNames.ContainsKey(cat) ? productNames[cat] : new[] { $"{cat} Ürünü #{i:D3}" };
            var baseName = nameList[random.Next(nameList.Length)];
            var fullName = i > 30 ? $"{baseName} (Sürüm {i % 5 + 1}.0)" : baseName;
            var price = Math.Round((decimal)(random.NextDouble() * 4500 + 150), 2);
            var stock = random.Next(0, 300);
            var isActive = stock > 0 && random.Next(0, 10) > 1;
            var countryInfo = countries[random.Next(countries.Length)];
            var salesQty = random.Next(40, 400);

            products.Add(new Product
            {
                Id = i,
                Name = fullName,
                Category = cat,
                Price = price,
                Stock = stock,
                IsActive = isActive,
                Discontinued = !isActive,
                Supplier = suppliers[random.Next(suppliers.Length)],
                ImageUrl = photos[i % photos.Length],
                CustomerRating = random.Next(3, 6),
                Country = countryInfo.Item1,
                CountryCode = countryInfo.Item2,
                TotalSales = price * salesQty,
                TargetSales = random.Next(65, 125),
                CreatedAt = DateTime.UtcNow.AddDays(-random.Next(1, 365))
            });
        }

        db.Products.AddRange(products);
        var movements = new List<StockMovement>();
        var moveTypes = new[] { "Giriş", "Çıkış", "Transfer", "İade" };
        var warehouses = new[] { "İstanbul Merkez", "Ankara Lojistik", "İzmir Bölge", "Bursa Depo" };

        int movId = 1;
        for (int i = 1; i <= 120; i++)
        {
            int count = random.Next(3, 8);
            for (int k = 0; k < count; k++)
            {
                var mType = moveTypes[random.Next(moveTypes.Length)];
                movements.Add(new StockMovement
                {
                    Id = movId++,
                    ProductId = i,
                    MovementType = mType,
                    Quantity = mType == "Çıkış" ? -random.Next(5, 40) : random.Next(10, 100),
                    UnitCost = Math.Round((decimal)(random.NextDouble() * 500 + 50), 2),
                    Warehouse = warehouses[random.Next(warehouses.Length)],
                    ReferenceNo = $"MOV-2026-{movId:D5}",
                    CreatedAt = DateTime.UtcNow.AddDays(-random.Next(1, 60))
                });
            }
        }
        db.StockMovements.AddRange(movements);

        db.SaveChanges();
    }
}
