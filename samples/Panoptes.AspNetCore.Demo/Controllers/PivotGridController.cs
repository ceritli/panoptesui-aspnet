using System;
using System.Collections.Generic;
using Microsoft.AspNetCore.Mvc;
using Panoptes.AspNetCore.Models;

namespace Panoptes.AspNetCore.Demo.Controllers
{
    public class PivotGridDemoViewModel
    {
        public List<PivotField> Fields { get; set; } = new();
        public List<Dictionary<string, object>> SalesData { get; set; } = new();
    }

    public class PivotGridController : Controller
    {
        public IActionResult Index()
        {
            ViewData["Title"] = "PivotGrid (Çok Boyutlu Küp Analizi & Çapraz Tablo / OLAP)";

            var model = new PivotGridDemoViewModel();

            model.Fields = new List<PivotField>
            {
                new PivotField { Name = "Region", Title = "Bölge", Type = "string", DefaultArea = "row" },
                new PivotField { Name = "Category", Title = "Ürün Kategorisi", Type = "string", DefaultArea = "row" },
                new PivotField { Name = "Year", Title = "Mali Yıl", Type = "string", DefaultArea = "column" },
                new PivotField { Name = "Channel", Title = "Satış Kanalı", Type = "string", DefaultArea = "none" },
                new PivotField { Name = "Revenue", Title = "Toplam Ciro (₺)", Type = "number", DefaultArea = "measure", Aggregate = "sum" },
                new PivotField { Name = "Profit", Title = "Net Kar (₺)", Type = "number", DefaultArea = "none", Aggregate = "sum" },
                new PivotField { Name = "UnitsSold", Title = "Satış Adedi", Type = "number", DefaultArea = "none", Aggregate = "sum" }
            };

            var regions = new[] { "Marmara", "Ege", "İç Anadolu", "Akdeniz" };
            var categories = new[] { "Bulut Bilişim", "Siber Güvenlik", "Yapay Zeka & ML", "ERP Çözümleri" };
            var years = new[] { "2024", "2025" };
            var channels = new[] { "Kurumsal Satış", "İş Ortakları", "Online Portal" };

            var rand = new Random(42);

            foreach (var r in regions)
            {
                foreach (var c in categories)
                {
                    foreach (var y in years)
                    {
                        foreach (var ch in channels)
                        {
                            var rev = rand.Next(150, 950) * 1000;
                            var profit = (decimal)(rev * rand.Next(18, 42) / 100.0);
                            var units = rand.Next(25, 320);

                            model.SalesData.Add(new Dictionary<string, object>
                            {
                                { "Region", r },
                                { "Category", c },
                                { "Year", y },
                                { "Channel", ch },
                                { "Revenue", rev },
                                { "Profit", profit },
                                { "UnitsSold", units }
                            });
                        }
                    }
                }
            }

            return View(model);
        }
    }
}
