using System;
using System.Collections.Generic;

namespace Panoptes.AspNetCore.Models
{
    public class StockChartDataPoint
    {
        public string Date { get; set; } = string.Empty; // YYYY-MM-DD
        public decimal Open { get; set; }
        public decimal High { get; set; }
        public decimal Low { get; set; }
        public decimal Close { get; set; }
        public long Volume { get; set; }
    }

    public class StockChartConfiguration
    {
        public string Id { get; set; } = string.Empty;
        public string Title { get; set; } = string.Empty;
        public string Symbol { get; set; } = "BIST";
        public string Currency { get; set; } = "₺";
        public List<StockChartDataPoint> Data { get; set; } = new();
    }
}
