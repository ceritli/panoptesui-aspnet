using System;
using System.Collections.Generic;
using System.Text.Encodings.Web;
using System.Text.Json;
using Microsoft.AspNetCore.Razor.TagHelpers;
using Panoptes.AspNetCore.Models;

namespace Panoptes.AspNetCore.TagHelpers
{
    [HtmlTargetElement("panoptes-filter")]
    public class FilterTagHelper : TagHelper
    {
        [HtmlAttributeName("id")]
        public string? Id { get; set; }

        [HtmlAttributeName("fields")]
        public List<FilterFieldDefinition>? Fields { get; set; }

        [HtmlAttributeName("on-change")]
        public string? OnChange { get; set; }

        [HtmlAttributeName("on-apply")]
        public string? OnApply { get; set; }

        [HtmlAttributeName("class")]
        public string? CssClass { get; set; }

        public override void Process(TagHelperContext context, TagHelperOutput output)
        {
            var filterId = string.IsNullOrWhiteSpace(Id) ? "panoptes-filter-" + Guid.NewGuid().ToString("N")[..8] : Id;

            output.TagName = "div";
            output.TagMode = TagMode.StartTagAndEndTag;
            output.Attributes.SetAttribute("id", filterId);
            output.Attributes.SetAttribute("data-panoptes-filter", "true");

            var fieldList = Fields ?? new List<FilterFieldDefinition>
            {
                new FilterFieldDefinition { Name = "Name", Title = "Ürün Adı", Type = "string" },
                new FilterFieldDefinition { Name = "Category", Title = "Kategori", Type = "string" },
                new FilterFieldDefinition { Name = "Price", Title = "Birim Fiyat (₺)", Type = "number" },
                new FilterFieldDefinition { Name = "Stock", Title = "Stok Miktarı", Type = "number" },
                new FilterFieldDefinition { Name = "CreatedDate", Title = "Eklenme Tarihi", Type = "date" },
                new FilterFieldDefinition { Name = "IsActive", Title = "Aktif Durumda", Type = "boolean" }
            };

            var fieldsJson = JsonSerializer.Serialize(fieldList);
            output.Attributes.SetAttribute("data-fields", fieldsJson);

            if (!string.IsNullOrWhiteSpace(OnChange))
                output.Attributes.SetAttribute("data-on-change", OnChange);

            if (!string.IsNullOrWhiteSpace(OnApply))
                output.Attributes.SetAttribute("data-on-apply", OnApply);

            output.Attributes.SetAttribute("class", $"panoptes-filter-builder rounded-2xl border border-slate-300 bg-white p-5 shadow-xs flex flex-col gap-4 text-xs select-none w-full {CssClass}".Trim());

            var sb = new System.Text.StringBuilder();

            // Hidden input for storing expression JSON
            sb.Append($"<input type=\"hidden\" name=\"{filterId}_expression\" id=\"{filterId}_input\" value=\"\" />");

            // Tree Root Container
            sb.Append("<div class=\"panoptes-filter-tree space-y-3\"></div>");

            // Bottom Actions Bar
            sb.Append("<div class=\"panoptes-filter-actions pt-3 border-t border-slate-100 flex items-center justify-between text-xs\">");
            sb.Append("<div class=\"flex items-center gap-2\">");
            sb.Append("<button type=\"button\" class=\"panoptes-filter-btn-apply px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg shadow-xs transition active:scale-95 flex items-center gap-1.5\">");
            sb.Append("<svg class=\"w-3.5 h-3.5\" fill=\"none\" stroke=\"currentColor\" viewBox=\"0 0 24 24\"><path stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"2\" d=\"M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z\"/></svg>");
            sb.Append("Filtreyi Uygula");
            sb.Append("</button>");

            sb.Append("<button type=\"button\" class=\"panoptes-filter-btn-clear px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg border border-slate-200 transition active:scale-95\">");
            sb.Append("Sıfırla");
            sb.Append("</button>");
            sb.Append("</div>");

            sb.Append("<div class=\"text-[11px] text-slate-400 font-mono panoptes-filter-summary\">Tüm kayıtlar listeleniyor</div>");
            sb.Append("</div>");

            output.Content.SetHtmlContent(sb.ToString());
        }
    }
}
