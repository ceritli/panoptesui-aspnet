using System;
using System.Collections.Generic;
using System.Linq;
using System.Text.Encodings.Web;
using System.Text.Json;
using Microsoft.AspNetCore.Razor.TagHelpers;
using Panoptes.AspNetCore.Models;

namespace Panoptes.AspNetCore.TagHelpers
{
    [HtmlTargetElement("panoptes-stockchart")]
    public class StockChartTagHelper : TagHelper
    {
        [HtmlAttributeName("id")]
        public string? Id { get; set; }

        [HtmlAttributeName("title")]
        public string? Title { get; set; }

        [HtmlAttributeName("symbol")]
        public string? Symbol { get; set; } = "BIST:THYAO";

        [HtmlAttributeName("currency")]
        public string? Currency { get; set; } = "₺";

        [HtmlAttributeName("data")]
        public List<StockChartDataPoint>? Data { get; set; }

        [HtmlAttributeName("height")]
        public int Height { get; set; } = 420;

        [HtmlAttributeName("show-volume")]
        public bool ShowVolume { get; set; } = true;

        [HtmlAttributeName("show-navigator")]
        public bool ShowNavigator { get; set; } = true;

        [HtmlAttributeName("on-point-hover")]
        public string? OnPointHover { get; set; }

        [HtmlAttributeName("class")]
        public string? CssClass { get; set; }

        public override void Process(TagHelperContext context, TagHelperOutput output)
        {
            var chartId = string.IsNullOrWhiteSpace(Id) ? "panoptes-stock-" + Guid.NewGuid().ToString("N")[..8] : Id;

            output.TagName = "div";
            output.TagMode = TagMode.StartTagAndEndTag;
            output.Attributes.SetAttribute("id", chartId);
            output.Attributes.SetAttribute("data-panoptes-stockchart", "true");
            output.Attributes.SetAttribute("data-symbol", Symbol ?? "BIST");
            output.Attributes.SetAttribute("data-currency", Currency ?? "₺");
            output.Attributes.SetAttribute("data-show-volume", ShowVolume.ToString().ToLower());
            output.Attributes.SetAttribute("data-show-navigator", ShowNavigator.ToString().ToLower());

            if (!string.IsNullOrWhiteSpace(OnPointHover))
                output.Attributes.SetAttribute("data-on-point-hover", OnPointHover);

            output.Attributes.SetAttribute("class", $"panoptes-stockchart bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden flex flex-col w-full select-none {CssClass}".Trim());

            var dataList = Data ?? new List<StockChartDataPoint>();
            var dataJson = JsonSerializer.Serialize(dataList);

            var lastPoint = dataList.LastOrDefault();
            var prevPoint = dataList.Count > 1 ? dataList[^2] : lastPoint;

            decimal lastClose = lastPoint?.Close ?? 0;
            decimal prevClose = prevPoint?.Close ?? lastClose;
            decimal diff = lastClose - prevClose;
            decimal pct = prevClose > 0 ? (diff / prevClose) * 100 : 0;
            bool isPositive = diff >= 0;

            var sb = new System.Text.StringBuilder();

            // Hidden data payload
            sb.Append($"<script type=\"application/json\" class=\"panoptes-stock-data\">{dataJson}</script>");

            // Top Header & Financial Info Toolbar
            sb.Append("<div class=\"px-5 py-3.5 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs\">");
            sb.Append("<div class=\"flex items-center gap-3\">");
            sb.Append("<div class=\"flex items-center gap-1.5\">");
            sb.Append("<svg class=\"w-4 h-4 text-emerald-600\" fill=\"none\" stroke=\"currentColor\" viewBox=\"0 0 24 24\"><path stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"2\" d=\"M13 7h8m0 0v8m0-8l-8 8-4-4-6 6\"/></svg>");
            sb.Append($"<span class=\"font-black text-slate-800 text-sm tracking-wide\">{HtmlEncoder.Default.Encode(Symbol ?? "BIST")}</span>");
            if (!string.IsNullOrWhiteSpace(Title))
            {
                sb.Append($"<span class=\"text-slate-500 font-medium\">({HtmlEncoder.Default.Encode(Title)})</span>");
            }
            sb.Append("</div>");

            if (lastPoint != null)
            {
                var sign = isPositive ? "+" : "";
                var colorClass = isPositive ? "text-emerald-700 bg-emerald-50 border-emerald-200" : "text-rose-700 bg-rose-50 border-rose-200";

                sb.Append("<div class=\"flex items-center gap-2 pl-3 border-l border-slate-200\">");
                sb.Append($"<span class=\"font-mono font-bold text-slate-900 text-sm\">{lastClose:N2} {Currency}</span>");
                sb.Append($"<span class=\"px-2 py-0.5 rounded-full text-[10px] font-bold border {colorClass}\">{sign}{diff:N2} ({sign}{pct:N2}%)</span>");
                sb.Append("</div>");
            }
            sb.Append("</div>");

            // Range Buttons (1H, 1A, 3A, 6A, 1Y, Tümü)
            sb.Append("<div class=\"flex items-center gap-1 panoptes-stock-ranges\">");
            sb.Append("<button type=\"button\" data-range=\"7\" class=\"px-2.5 py-1 rounded text-[11px] font-semibold bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 transition shadow-2xs\">1H</button>");
            sb.Append("<button type=\"button\" data-range=\"30\" class=\"px-2.5 py-1 rounded text-[11px] font-semibold bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 transition shadow-2xs\">1A</button>");
            sb.Append("<button type=\"button\" data-range=\"90\" class=\"px-2.5 py-1 rounded text-[11px] font-semibold bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 transition shadow-2xs\">3A</button>");
            sb.Append("<button type=\"button\" data-range=\"180\" class=\"px-2.5 py-1 rounded text-[11px] font-semibold bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 transition shadow-2xs\">6A</button>");
            sb.Append("<button type=\"button\" data-range=\"365\" class=\"px-2.5 py-1 rounded text-[11px] font-semibold bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 transition shadow-2xs\">1Y</button>");
            sb.Append("<button type=\"button\" data-range=\"all\" class=\"px-2.5 py-1 rounded text-[11px] font-semibold bg-blue-600 text-white shadow-2xs transition\">Tümü</button>");
            sb.Append("</div>");
            sb.Append("</div>");

            // Chart Canvas Container
            sb.Append("<div class=\"relative w-full bg-slate-900 p-2\" style=\"min-height: " + Height + "px;\">");
            sb.Append($"<canvas class=\"panoptes-stock-canvas w-full block\" style=\"height: {Height}px;\"></canvas>");

            // Floating Crosshair Tooltip
            sb.Append("<div class=\"panoptes-stock-tooltip absolute top-3 left-4 bg-slate-800/90 backdrop-blur-xs text-white p-2 rounded-lg border border-slate-700 shadow-md font-mono text-[11px] pointer-events-none hidden z-20 space-y-0.5\">");
            sb.Append("<div class=\"text-slate-400 font-semibold text-[10px] panoptes-stock-tip-date\">Tarih</div>");
            sb.Append("<div class=\"flex items-center gap-3\">");
            sb.Append("<span>Açılış: <b class=\"text-blue-400 panoptes-stock-tip-open\">-</b></span>");
            sb.Append("<span>Yüksek: <b class=\"text-emerald-400 panoptes-stock-tip-high\">-</b></span>");
            sb.Append("<span>Düşük: <b class=\"text-rose-400 panoptes-stock-tip-low\">-</b></span>");
            sb.Append("<span>Kapanış: <b class=\"text-amber-400 panoptes-stock-tip-close\">-</b></span>");
            sb.Append("<span>Hacim: <b class=\"text-purple-400 panoptes-stock-tip-volume\">-</b></span>");
            sb.Append("</div>");
            sb.Append("</div>");

            sb.Append("</div>");

            output.Content.SetHtmlContent(sb.ToString());
        }
    }
}
