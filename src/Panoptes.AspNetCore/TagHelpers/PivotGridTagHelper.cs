using System;
using System.Collections.Generic;
using System.Linq;
using System.Text.Encodings.Web;
using System.Text.Json;
using Microsoft.AspNetCore.Razor.TagHelpers;
using Panoptes.AspNetCore.Models;

namespace Panoptes.AspNetCore.TagHelpers
{
    [HtmlTargetElement("panoptes-pivotgrid")]
    public class PivotGridTagHelper : TagHelper
    {
        [HtmlAttributeName("id")]
        public string? Id { get; set; }

        [HtmlAttributeName("title")]
        public string? Title { get; set; }

        [HtmlAttributeName("fields")]
        public List<PivotField>? Fields { get; set; }

        [HtmlAttributeName("rows")]
        public string? Rows { get; set; } // comma separated field names

        [HtmlAttributeName("columns")]
        public string? Columns { get; set; } // comma separated field names

        [HtmlAttributeName("measures")]
        public string? Measures { get; set; } // comma separated field names

        [HtmlAttributeName("data")]
        public object? Data { get; set; }

        [HtmlAttributeName("show-configurator")]
        public bool ShowConfigurator { get; set; } = true;

        [HtmlAttributeName("on-update")]
        public string? OnUpdate { get; set; }

        [HtmlAttributeName("class")]
        public string? CssClass { get; set; }

        public override void Process(TagHelperContext context, TagHelperOutput output)
        {
            var pivotId = string.IsNullOrWhiteSpace(Id) ? "panoptes-pivot-" + Guid.NewGuid().ToString("N")[..8] : Id;

            output.TagName = "div";
            output.TagMode = TagMode.StartTagAndEndTag;
            output.Attributes.SetAttribute("id", pivotId);
            output.Attributes.SetAttribute("data-panoptes-pivotgrid", "true");

            var fieldList = Fields ?? new List<PivotField>
            {
                new PivotField { Name = "Region", Title = "Bölge", Type = "string", DefaultArea = "row" },
                new PivotField { Name = "Category", Title = "Kategori", Type = "string", DefaultArea = "row" },
                new PivotField { Name = "Year", Title = "Yıl", Type = "string", DefaultArea = "column" },
                new PivotField { Name = "Revenue", Title = "Toplam Ciro", Type = "number", DefaultArea = "measure", Aggregate = "sum" }
            };

            var initialRows = !string.IsNullOrWhiteSpace(Rows) 
                ? Rows.Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries).ToList()
                : fieldList.Where(f => f.DefaultArea == "row").Select(f => f.Name).ToList();

            var initialCols = !string.IsNullOrWhiteSpace(Columns) 
                ? Columns.Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries).ToList()
                : fieldList.Where(f => f.DefaultArea == "column").Select(f => f.Name).ToList();

            var initialMeasures = !string.IsNullOrWhiteSpace(Measures) 
                ? Measures.Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries).ToList()
                : fieldList.Where(f => f.DefaultArea == "measure").Select(f => f.Name).ToList();

            var dataJson = Data != null ? JsonSerializer.Serialize(Data) : "[]";
            var fieldsJson = JsonSerializer.Serialize(fieldList);
            var rowsJson = JsonSerializer.Serialize(initialRows);
            var colsJson = JsonSerializer.Serialize(initialCols);
            var measuresJson = JsonSerializer.Serialize(initialMeasures);

            output.Attributes.SetAttribute("data-fields", fieldsJson);
            output.Attributes.SetAttribute("data-rows", rowsJson);
            output.Attributes.SetAttribute("data-columns", colsJson);
            output.Attributes.SetAttribute("data-measures", measuresJson);
            if (!string.IsNullOrWhiteSpace(OnUpdate))
                output.Attributes.SetAttribute("data-on-update", OnUpdate);

            output.Attributes.SetAttribute("class", $"panoptes-pivotgrid bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden flex flex-col w-full {CssClass}".Trim());

            var sb = new System.Text.StringBuilder();

            // Hidden raw data script
            sb.Append($"<script type=\"application/json\" class=\"panoptes-pivot-data\">{dataJson}</script>");

            // Toolbar
            sb.Append("<div class=\"px-4 py-3 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs\">");
            sb.Append("<div class=\"flex items-center gap-2\">");
            sb.Append("<svg class=\"w-4 h-4 text-indigo-600\" fill=\"none\" stroke=\"currentColor\" viewBox=\"0 0 24 24\"><path stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"2\" d=\"M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2\"/></svg>");
            if (!string.IsNullOrWhiteSpace(Title))
            {
                sb.Append($"<span class=\"font-bold text-slate-800 text-sm\">{HtmlEncoder.Default.Encode(Title)}</span>");
            }
            sb.Append("<span class=\"px-2 py-0.5 rounded-full text-[10px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200\">OLAP & Çapraz Tablo</span>");
            sb.Append("</div>");

            sb.Append("<div class=\"flex items-center gap-2 ml-auto\">");
            if (ShowConfigurator)
            {
                sb.Append("<button type=\"button\" class=\"panoptes-pivot-btn-config px-2.5 py-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-lg font-medium transition shadow-2xs flex items-center gap-1.5\">");
                sb.Append("<svg class=\"w-3.5 h-3.5 text-slate-500\" fill=\"none\" stroke=\"currentColor\" viewBox=\"0 0 24 24\"><path stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"2\" d=\"M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4\"/></svg>");
                sb.Append("Yapılandırıcı (Configurator)");
                sb.Append("</button>");
            }

            sb.Append("<button type=\"button\" class=\"panoptes-pivot-btn-export px-2.5 py-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-lg font-medium transition shadow-2xs flex items-center gap-1.5\">");
            sb.Append("<svg class=\"w-3.5 h-3.5 text-slate-500\" fill=\"none\" stroke=\"currentColor\" viewBox=\"0 0 24 24\"><path stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"2\" d=\"M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4\"/></svg>");
            sb.Append("CSV İndir");
            sb.Append("</button>");
            sb.Append("</div>");
            sb.Append("</div>");

            // Configurator Panel (collapsible)
            if (ShowConfigurator)
            {
                sb.Append("<div class=\"panoptes-pivot-config-panel bg-slate-50/70 border-b border-slate-200 p-4 space-y-3 text-xs hidden\">");
                sb.Append("<div class=\"font-bold text-slate-700 flex items-center justify-between\">");
                sb.Append("<span>Pivot Tablo Boyut ve Metrik Yapılandırıcısı</span>");
                sb.Append("<span class=\"text-[11px] font-normal text-slate-500\">Alanları eklemek veya kaldırmak için butonlara tıklayın</span>");
                sb.Append("</div>");

                sb.Append("<div class=\"grid grid-cols-1 md:grid-cols-3 gap-3\">");

                // Rows Dropzone / Selector
                sb.Append("<div class=\"bg-white rounded-lg border border-slate-200 p-3 shadow-2xs space-y-2\">");
                sb.Append("<div class=\"font-semibold text-slate-700 flex items-center justify-between\">");
                sb.Append("<span>Satır Boyutları (Rows)</span>");
                sb.Append("<span class=\"text-[10px] text-blue-600 font-bold bg-blue-50 px-1.5 py-0.5 rounded\">Yatay Kırılım</span>");
                sb.Append("</div>");
                sb.Append("<div class=\"panoptes-pivot-zone-rows flex flex-wrap gap-1.5 min-h-[32px] p-1.5 bg-slate-50 rounded border border-dashed border-slate-200\"></div>");
                sb.Append("</div>");

                // Columns Dropzone / Selector
                sb.Append("<div class=\"bg-white rounded-lg border border-slate-200 p-3 shadow-2xs space-y-2\">");
                sb.Append("<div class=\"font-semibold text-slate-700 flex items-center justify-between\">");
                sb.Append("<span>Sütun Boyutları (Columns)</span>");
                sb.Append("<span class=\"text-[10px] text-emerald-600 font-bold bg-emerald-50 px-1.5 py-0.5 rounded\">Dikey Kırılım</span>");
                sb.Append("</div>");
                sb.Append("<div class=\"panoptes-pivot-zone-columns flex flex-wrap gap-1.5 min-h-[32px] p-1.5 bg-slate-50 rounded border border-dashed border-slate-200\"></div>");
                sb.Append("</div>");

                // Measures Dropzone / Selector
                sb.Append("<div class=\"bg-white rounded-lg border border-slate-200 p-3 shadow-2xs space-y-2\">");
                sb.Append("<div class=\"font-semibold text-slate-700 flex items-center justify-between\">");
                sb.Append("<span>Değerler & Metrikler (Measures)</span>");
                sb.Append("<span class=\"text-[10px] text-indigo-600 font-bold bg-indigo-50 px-1.5 py-0.5 rounded\">Hesaplama (SUM)</span>");
                sb.Append("</div>");
                sb.Append("<div class=\"panoptes-pivot-zone-measures flex flex-wrap gap-1.5 min-h-[32px] p-1.5 bg-slate-50 rounded border border-dashed border-slate-200\"></div>");
                sb.Append("</div>");

                sb.Append("</div>");

                // Available unused fields list
                sb.Append("<div class=\"pt-2 border-t border-slate-200 flex items-center gap-2 flex-wrap\">");
                sb.Append("<span class=\"text-[11px] font-semibold text-slate-500\">Kullanılabilir Alanlar:</span>");
                sb.Append("<div class=\"panoptes-pivot-available-fields flex items-center gap-1.5 flex-wrap\"></div>");
                sb.Append("</div>");

                sb.Append("</div>");
            }

            // Pivot Table Output Container
            sb.Append("<div class=\"panoptes-pivot-table-container overflow-x-auto overflow-y-auto max-h-[500px] w-full\">");
            sb.Append("<div class=\"p-8 text-center text-slate-400 font-mono text-xs\">Pivot tablo hesaplanıyor...</div>");
            sb.Append("</div>");

            output.Content.SetHtmlContent(sb.ToString());
        }
    }
}
