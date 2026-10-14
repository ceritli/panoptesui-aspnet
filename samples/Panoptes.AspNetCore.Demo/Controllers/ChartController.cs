using System;
using System.Collections.Generic;
using Microsoft.AspNetCore.Mvc;
using Panoptes.AspNetCore.Models;

namespace Panoptes.AspNetCore.Demo.Controllers;

public class ChartController : Controller
{
    public IActionResult Index()
    {
        // 1. Aylık Finansal Gelir & Gider (Column & Bar)
        var months = new List<string> { "Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran" };
        var financialSeries = new List<ChartSeries>
        {
            new ChartSeries
            {
                Name = "Gelir",
                Color = "#2563eb", // Blue
                Values = new List<decimal> { 125000, 142000, 189000, 210000, 235000, 280000 }
            },
            new ChartSeries
            {
                Name = "Gider",
                Color = "#e11d48", // Rose
                Values = new List<decimal> { 85000, 92000, 110000, 125000, 140000, 155000 }
            }
        };

        // 2. Web Trafiği & Kullanıcı Trendi (Area & Line)
        var trafficMonths = new List<string> { "Pzt", "Sal", "Çar", "Per", "Cum", "Cmt", "Paz" };
        var trafficSeries = new List<ChartSeries>
        {
            new ChartSeries
            {
                Name = "Tekil Ziyaretçi",
                Color = "#059669", // Emerald
                Values = new List<decimal> { 4200, 5800, 7100, 6900, 8400, 9500, 11200 }
            },
            new ChartSeries
            {
                Name = "Sayfa Görüntüleme",
                Color = "#4f46e5", // Indigo
                Values = new List<decimal> { 12400, 16800, 21500, 19800, 26000, 28500, 34200 }
            }
        };

        // 3. Pazar Payı & Portföy Dağılımı (Donut & Pie)
        var marketSharePoints = new List<ChartDataPoint>
        {
            new ChartDataPoint { Label = "Kurumsal Bankacılık", Value = 42, Color = "#2563eb" },
            new ChartDataPoint { Label = "Bireysel Kredi & Kart", Value = 28, Color = "#4f46e5" },
            new ChartDataPoint { Label = "Yatırım & Fon Yönetimi", Value = 18, Color = "#059669" },
            new ChartDataPoint { Label = "Sigorta & Emeklilik", Value = 12, Color = "#d97706" }
        };

        ViewBag.Months = months;
        ViewBag.FinancialSeries = financialSeries;

        ViewBag.TrafficDays = trafficMonths;
        ViewBag.TrafficSeries = trafficSeries;

        ViewBag.MarketSharePoints = marketSharePoints;

        return View();
    }
}
