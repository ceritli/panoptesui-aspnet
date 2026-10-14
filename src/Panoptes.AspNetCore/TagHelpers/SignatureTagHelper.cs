using System;
using System.Text.Encodings.Web;
using Microsoft.AspNetCore.Razor.TagHelpers;

namespace Panoptes.AspNetCore.TagHelpers
{
    [HtmlTargetElement("panoptes-signature")]
    public class SignatureTagHelper : TagHelper
    {
        [HtmlAttributeName("id")]
        public string? Id { get; set; }

        [HtmlAttributeName("name")]
        public string? Name { get; set; }

        [HtmlAttributeName("width")]
        public int Width { get; set; } = 600;

        [HtmlAttributeName("height")]
        public int Height { get; set; } = 220;

        [HtmlAttributeName("stroke-color")]
        public string StrokeColor { get; set; } = "#0f172a";

        [HtmlAttributeName("stroke-width")]
        public double StrokeWidth { get; set; } = 2.5;

        [HtmlAttributeName("background-color")]
        public string BackgroundColor { get; set; } = "#ffffff";

        [HtmlAttributeName("show-controls")]
        public bool ShowControls { get; set; } = true;

        [HtmlAttributeName("readonly")]
        public bool ReadOnly { get; set; } = false;

        [HtmlAttributeName("value")]
        public string? Value { get; set; }

        [HtmlAttributeName("on-change")]
        public string? OnChange { get; set; }

        [HtmlAttributeName("placeholder")]
        public string Placeholder { get; set; } = "Buraya imzanızı atın...";

        [HtmlAttributeName("class")]
        public string? CssClass { get; set; }

        public override void Process(TagHelperContext context, TagHelperOutput output)
        {
            var sigId = string.IsNullOrWhiteSpace(Id) ? "panoptes-sig-" + Guid.NewGuid().ToString("N")[..8] : Id;
            var inputName = string.IsNullOrWhiteSpace(Name) ? sigId : Name;

            output.TagName = "div";
            output.TagMode = TagMode.StartTagAndEndTag;
            output.Attributes.SetAttribute("id", sigId);
            output.Attributes.SetAttribute("data-panoptes-signature", "true");
            output.Attributes.SetAttribute("data-stroke-color", StrokeColor);
            output.Attributes.SetAttribute("data-stroke-width", StrokeWidth.ToString(System.Globalization.CultureInfo.InvariantCulture));
            output.Attributes.SetAttribute("data-bg-color", BackgroundColor);
            output.Attributes.SetAttribute("data-readonly", ReadOnly ? "true" : "false");

            if (!string.IsNullOrWhiteSpace(OnChange))
                output.Attributes.SetAttribute("data-on-change", OnChange);

            output.Attributes.SetAttribute("class", $"panoptes-signature-box rounded-xl border border-slate-300 bg-white overflow-hidden shadow-xs relative flex flex-col {CssClass}".Trim());

            var sb = new System.Text.StringBuilder();

            // Hidden input for form binding
            var valEscaped = !string.IsNullOrWhiteSpace(Value) ? HtmlEncoder.Default.Encode(Value) : "";
            sb.Append($"<input type=\"hidden\" name=\"{HtmlEncoder.Default.Encode(inputName)}\" id=\"{sigId}_input\" value=\"{valEscaped}\" />");

            // Canvas Container
            sb.Append("<div class=\"relative w-full overflow-hidden bg-slate-50/30 flex items-center justify-center select-none\">");
            
            // Placeholder guide line and text
            sb.Append("<div class=\"panoptes-signature-placeholder absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-slate-300 transition-opacity duration-200 select-none\">");
            sb.Append($"<div class=\"text-xs font-semibold tracking-wide uppercase\">{HtmlEncoder.Default.Encode(Placeholder)}</div>");
            sb.Append("<div class=\"w-3/4 h-[1px] bg-slate-200 mt-6 border-b border-dashed border-slate-300\"></div>");
            sb.Append("</div>");

            // HTML5 Canvas
            var cursorStyle = ReadOnly ? "cursor-default" : "cursor-crosshair";
            sb.Append($"<canvas class=\"panoptes-signature-canvas w-full max-w-full block {cursorStyle}\" width=\"{Width}\" height=\"{Height}\" style=\"aspect-ratio: {Width}/{Height};\"></canvas>");
            sb.Append("</div>");

            // Controls Toolbar (Temizle, Geri Al, Durum)
            if (ShowControls && !ReadOnly)
            {
                sb.Append("<div class=\"panoptes-signature-toolbar px-3 py-2 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs\">");
                sb.Append("<div class=\"flex items-center gap-1.5\">");
                sb.Append("<button type=\"button\" class=\"panoptes-sig-clear-btn px-2.5 py-1 text-slate-700 bg-white hover:bg-slate-100 rounded-md border border-slate-200 font-medium transition active:scale-95 flex items-center gap-1\">");
                sb.Append("<svg class=\"w-3.5 h-3.5 text-slate-500\" fill=\"none\" stroke=\"currentColor\" viewBox=\"0 0 24 24\"><path stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"2\" d=\"M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16\"/></svg>");
                sb.Append("Temizle</button>");

                sb.Append("<button type=\"button\" class=\"panoptes-sig-undo-btn px-2.5 py-1 text-slate-700 bg-white hover:bg-slate-100 rounded-md border border-slate-200 font-medium transition active:scale-95 flex items-center gap-1\">");
                sb.Append("<svg class=\"w-3.5 h-3.5 text-slate-500\" fill=\"none\" stroke=\"currentColor\" viewBox=\"0 0 24 24\"><path stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"2\" d=\"M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6\"/></svg>");
                sb.Append("Geri Al</button>");
                sb.Append("</div>");

                sb.Append("<div class=\"panoptes-sig-status text-[11px] text-slate-400 font-medium flex items-center gap-1\">");
                sb.Append("<span class=\"w-2 h-2 rounded-full bg-slate-300\"></span>");
                sb.Append("<span>İmza bekleniyor</span>");
                sb.Append("</div>");

                sb.Append("</div>");
            }

            output.Content.SetHtmlContent(sb.ToString());
        }
    }
}
