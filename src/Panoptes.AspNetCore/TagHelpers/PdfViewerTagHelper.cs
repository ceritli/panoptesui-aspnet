using System;
using System.Text.Encodings.Web;
using Microsoft.AspNetCore.Razor.TagHelpers;

namespace Panoptes.AspNetCore.TagHelpers
{
    [HtmlTargetElement("panoptes-pdfviewer")]
    public class PdfViewerTagHelper : TagHelper
    {
        [HtmlAttributeName("id")]
        public string? Id { get; set; }

        [HtmlAttributeName("src")]
        public string? Source { get; set; }

        [HtmlAttributeName("title")]
        public string? Title { get; set; }

        [HtmlAttributeName("height")]
        public int Height { get; set; } = 650;

        [HtmlAttributeName("total-pages")]
        public int TotalPages { get; set; } = 3;

        [HtmlAttributeName("enable-download")]
        public bool EnableDownload { get; set; } = true;

        [HtmlAttributeName("enable-print")]
        public bool EnablePrint { get; set; } = true;

        [HtmlAttributeName("on-page-change")]
        public string? OnPageChange { get; set; }

        [HtmlAttributeName("class")]
        public string? CssClass { get; set; }

        public override void Process(TagHelperContext context, TagHelperOutput output)
        {
            var viewerId = string.IsNullOrWhiteSpace(Id) ? "panoptes-pdf-" + Guid.NewGuid().ToString("N")[..8] : Id;

            output.TagName = "div";
            output.TagMode = TagMode.StartTagAndEndTag;
            output.Attributes.SetAttribute("id", viewerId);
            output.Attributes.SetAttribute("data-panoptes-pdfviewer", "true");
            output.Attributes.SetAttribute("data-total-pages", TotalPages.ToString());

            if (!string.IsNullOrWhiteSpace(Source))
                output.Attributes.SetAttribute("data-src", Source);

            if (!string.IsNullOrWhiteSpace(OnPageChange))
                output.Attributes.SetAttribute("data-on-page-change", OnPageChange);

            output.Attributes.SetAttribute("class", $"panoptes-pdfviewer-container rounded-2xl border border-slate-300 bg-slate-100 overflow-hidden shadow-sm flex flex-col w-full {CssClass}".Trim());

            var sb = new System.Text.StringBuilder();

            // Toolbar
            sb.Append("<div class=\"panoptes-pdf-toolbar px-4 py-2.5 bg-slate-900 text-white flex flex-wrap items-center justify-between gap-3 select-none text-xs border-b border-slate-800\">");

            // Left Section: Title & Document Icon
            sb.Append("<div class=\"flex items-center gap-2 min-w-0\">");
            sb.Append("<div class=\"w-6 h-6 rounded bg-rose-600 flex items-center justify-center text-white shrink-0 font-bold text-[10px]\">PDF</div>");
            sb.Append($"<span class=\"font-bold truncate text-slate-200 max-w-[200px] sm:max-w-xs\" title=\"{HtmlEncoder.Default.Encode(Title ?? "Döküman Önizleme")}\">{HtmlEncoder.Default.Encode(Title ?? "Döküman Önizleme")}</span>");
            sb.Append("</div>");

            // Center Section: Page Navigation (Prev, Page 1/X, Next)
            sb.Append("<div class=\"flex items-center gap-1.5 bg-slate-800/80 px-2 py-1 rounded-lg border border-slate-700/60\">");
            
            // Prev Page
            sb.Append("<button type=\"button\" class=\"panoptes-pdf-btn-prev w-6 h-6 rounded hover:bg-slate-700 disabled:opacity-30 disabled:pointer-events-none flex items-center justify-center transition\" title=\"Önceki Sayfa\">");
            sb.Append("<svg class=\"w-3.5 h-3.5\" fill=\"none\" stroke=\"currentColor\" viewBox=\"0 0 24 24\"><path stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"2\" d=\"M15 19l-7-7 7-7\"/></svg>");
            sb.Append("</button>");

            // Page Input / Display
            sb.Append("<div class=\"flex items-center gap-1 font-mono text-[11px]\">");
            sb.Append("<input type=\"number\" min=\"1\" max=\"" + TotalPages + "\" value=\"1\" class=\"panoptes-pdf-page-input w-10 text-center bg-slate-900 border border-slate-700 rounded text-white py-0.5 outline-none focus:border-blue-500 font-bold\" />");
            sb.Append($"<span class=\"text-slate-400\">/ {TotalPages}</span>");
            sb.Append("</div>");

            // Next Page
            sb.Append("<button type=\"button\" class=\"panoptes-pdf-btn-next w-6 h-6 rounded hover:bg-slate-700 disabled:opacity-30 disabled:pointer-events-none flex items-center justify-center transition\" title=\"Sonraki Sayfa\">");
            sb.Append("<svg class=\"w-3.5 h-3.5\" fill=\"none\" stroke=\"currentColor\" viewBox=\"0 0 24 24\"><path stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"2\" d=\"M9 5l7 7-7 7\"/></svg>");
            sb.Append("</button>");

            sb.Append("</div>"); // end center

            // Right Section: Zoom In, Zoom Out, Zoom % Badge, Print, Download
            sb.Append("<div class=\"flex items-center gap-2\">");

            // Zoom controls
            sb.Append("<div class=\"flex items-center gap-1 bg-slate-800/80 px-2 py-1 rounded-lg border border-slate-700/60\">");
            sb.Append("<button type=\"button\" class=\"panoptes-pdf-btn-zoom-out w-6 h-6 rounded hover:bg-slate-700 flex items-center justify-center transition\" title=\"Küçült (Zoom Out)\">-</button>");
            sb.Append("<span class=\"panoptes-pdf-zoom-label font-mono text-[11px] min-w-[3rem] text-center text-slate-300 font-bold\">100%</span>");
            sb.Append("<button type=\"button\" class=\"panoptes-pdf-btn-zoom-in w-6 h-6 rounded hover:bg-slate-700 flex items-center justify-center transition\" title=\"Büyüt (Zoom In)\">+</button>");
            sb.Append("<button type=\"button\" class=\"panoptes-pdf-btn-zoom-fit px-1.5 py-0.5 rounded hover:bg-slate-700 text-[10px] text-slate-400 font-medium transition\" title=\"Genişliğe Sığdır\">Sığdır</button>");
            sb.Append("</div>");

            // Print
            if (EnablePrint)
            {
                sb.Append("<button type=\"button\" class=\"panoptes-pdf-btn-print p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition\" title=\"Yazdır\">");
                sb.Append("<svg class=\"w-4 h-4\" fill=\"none\" stroke=\"currentColor\" viewBox=\"0 0 24 24\"><path stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"2\" d=\"M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z\"/></svg>");
                sb.Append("</button>");
            }

            // Download
            if (EnableDownload)
            {
                sb.Append("<button type=\"button\" class=\"panoptes-pdf-btn-download p-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white transition\" title=\"İndir\">");
                sb.Append("<svg class=\"w-4 h-4\" fill=\"none\" stroke=\"currentColor\" viewBox=\"0 0 24 24\"><path stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"2\" d=\"M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4\"/></svg>");
                sb.Append("</button>");
            }

            sb.Append("</div>"); // end right

            sb.Append("</div>"); // end toolbar

            // Document Viewport / Canvas Stage
            sb.Append($"<div class=\"panoptes-pdf-viewport flex-1 overflow-auto p-6 flex justify-center items-start bg-slate-200/80\" style=\"height: {Height}px;\">");
            
            // Scalable Document Sheet
            sb.Append("<div class=\"panoptes-pdf-stage origin-top transition-transform duration-150 shadow-2xl rounded-sm\">");
            sb.Append("<div class=\"panoptes-pdf-sheet bg-white text-slate-800 w-[600px] min-h-[850px] p-10 relative select-text border border-slate-300\">");
            
            // Dynamic page content will be injected by panoptes-pdfviewer.js
            sb.Append("<div class=\"panoptes-pdf-page-content h-full flex flex-col justify-between\">");
            sb.Append("<div class=\"animate-pulse space-y-4\"><div class=\"h-6 bg-slate-200 rounded w-1/3\"></div><div class=\"h-4 bg-slate-100 rounded w-full\"></div><div class=\"h-4 bg-slate-100 rounded w-5/6\"></div></div>");
            sb.Append("</div>");

            sb.Append("</div>"); // end sheet
            sb.Append("</div>"); // end stage

            sb.Append("</div>"); // end viewport

            output.Content.SetHtmlContent(sb.ToString());
        }
    }
}
