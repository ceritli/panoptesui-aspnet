using System;
using System.Collections.Generic;
using Microsoft.AspNetCore.Mvc;
using Panoptes.AspNetCore.Models;

namespace Panoptes.AspNetCore.Demo.Controllers
{
    public class StockChartDemoViewModel
    {
        public List<StockChartDataPoint> ThyaoData { get; set; } = new();
        public List<StockChartDataPoint> AselsData { get; set; } = new();
    }

    public class StockChartController : Controller
    {
        public IActionResult Index()
        {
            ViewData["Title"] = "StockChart (Finans Mum ve Hacim Grafiği / Candlestick)";

            var model = new StockChartDemoViewModel();

            // Generate 120 days historical data for THYAO
            var baseDate = DateTime.Today.AddDays(-120);
            var rand = new Random(101);

            decimal thyaoPrice = 285.50m;
            for (int i = 0; i < 120; i++)
            {
                var curDate = baseDate.AddDays(i);
                if (curDate.DayOfWeek == DayOfWeek.Saturday || curDate.DayOfWeek == DayOfWeek.Sunday)
                    continue;

                decimal change = (decimal)((rand.NextDouble() - 0.48) * 8.0);
                decimal open = thyaoPrice;
                decimal close = Math.Round(open + change, 2);
                if (close < 50) close = 50;

                decimal high = Math.Round(Math.Max(open, close) + (decimal)(rand.NextDouble() * 4.0), 2);
                decimal low = Math.Round(Math.Min(open, close) - (decimal)(rand.NextDouble() * 3.5), 2);
                long volume = rand.Next(1500000, 8500000);

                model.ThyaoData.Add(new StockChartDataPoint
                {
                    Date = curDate.ToString("yyyy-MM-dd"),
                    Open = open,
                    High = high,
                    Low = low,
                    Close = close,
                    Volume = volume
                });

                thyaoPrice = close;
            }

            // Generate 90 days historical data for ASELS
            decimal aselsPrice = 58.20m;
            for (int i = 0; i < 90; i++)
            {
                var curDate = baseDate.AddDays(30 + i);
                if (curDate.DayOfWeek == DayOfWeek.Saturday || curDate.DayOfWeek == DayOfWeek.Sunday)
                    continue;

                decimal change = (decimal)((rand.NextDouble() - 0.47) * 2.2);
                decimal open = aselsPrice;
                decimal close = Math.Round(open + change, 2);
                if (close < 10) close = 10;

                decimal high = Math.Round(Math.Max(open, close) + (decimal)(rand.NextDouble() * 1.5), 2);
                decimal low = Math.Round(Math.Min(open, close) - (decimal)(rand.NextDouble() * 1.2), 2);
                long volume = rand.Next(2500000, 14000000);

                model.AselsData.Add(new StockChartDataPoint
                {
                    Date = curDate.ToString("yyyy-MM-dd"),
                    Open = open,
                    High = high,
                    Low = low,
                    Close = close,
                    Volume = volume
                });

                aselsPrice = close;
            }

            return View(model);
        }
    }
}
