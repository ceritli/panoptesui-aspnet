using System;
using System.Text.Encodings.Web;
using Microsoft.AspNetCore.Razor.TagHelpers;
using Panoptes.AspNetCore.Models;

namespace Panoptes.AspNetCore.TagHelpers
{
    [HtmlTargetElement("panoptes-slider")]
    [HtmlTargetElement("panoptes-range-slider")]
    public class SliderTagHelper : TagHelper
    {
        [HtmlAttributeName("id")]
        public string? Id { get; set; }

        [HtmlAttributeName("name")]
        public string? Name { get; set; }

        [HtmlAttributeName("min")]
        public decimal Min { get; set; } = 0;

        [HtmlAttributeName("max")]
        public decimal Max { get; set; } = 100;

        [HtmlAttributeName("step")]
        public decimal Step { get; set; } = 1;

        [HtmlAttributeName("value")]
        public decimal Value { get; set; } = 50;

        [HtmlAttributeName("value-start")]
        public decimal? ValueStart { get; set; }

        [HtmlAttributeName("value-end")]
        public decimal? ValueEnd { get; set; }

        [HtmlAttributeName("name-start")]
        public string? NameStart { get; set; }

        [HtmlAttributeName("name-end")]
        public string? NameEnd { get; set; }

        [HtmlAttributeName("orientation")]
        public SliderOrientation Orientation { get; set; } = SliderOrientation.Horizontal;

        [HtmlAttributeName("show-tooltip")]
        public bool ShowTooltip { get; set; } = true;

        [HtmlAttributeName("show-ticks")]
        public bool ShowTicks { get; set; } = true;

        [HtmlAttributeName("show-buttons")]
        public bool ShowButtons { get; set; } = false;

        [HtmlAttributeName("disabled")]
        public bool Disabled { get; set; } = false;

        [HtmlAttributeName("color")]
        public string Color { get; set; } = "blue"; // blue, emerald, indigo, amber, purple

        [HtmlAttributeName("on-change")]
        public string? OnChange { get; set; }

        [HtmlAttributeName("on-slide")]
        public string? OnSlide { get; set; }

        [HtmlAttributeName("class")]
        public string? CssClass { get; set; }

        public override void Process(TagHelperContext context, TagHelperOutput output)
        {
            var isRange = context.TagName.Equals("panoptes-range-slider", StringComparison.OrdinalIgnoreCase);
            var sliderId = string.IsNullOrWhiteSpace(Id) ? "panoptes-slider-" + Guid.NewGuid().ToString("N")[..8] : Id;
            var inputName = string.IsNullOrWhiteSpace(Name) ? sliderId : Name;

            var valStart = ValueStart ?? Min;
            var valEnd = ValueEnd ?? Max;

            output.TagName = "div";
            output.TagMode = TagMode.StartTagAndEndTag;
            output.Attributes.SetAttribute("id", sliderId);
            output.Attributes.SetAttribute("data-panoptes-slider", "true");
            output.Attributes.SetAttribute("data-is-range", isRange ? "true" : "false");
            output.Attributes.SetAttribute("data-min", Min.ToString(System.Globalization.CultureInfo.InvariantCulture));
            output.Attributes.SetAttribute("data-max", Max.ToString(System.Globalization.CultureInfo.InvariantCulture));
            output.Attributes.SetAttribute("data-step", Step.ToString(System.Globalization.CultureInfo.InvariantCulture));
            output.Attributes.SetAttribute("data-orientation", Orientation.ToString().ToLowerInvariant());
            output.Attributes.SetAttribute("data-show-tooltip", ShowTooltip ? "true" : "false");
            output.Attributes.SetAttribute("data-color", Color);

            if (!string.IsNullOrWhiteSpace(OnChange))
                output.Attributes.SetAttribute("data-on-change", OnChange);

            if (!string.IsNullOrWhiteSpace(OnSlide))
                output.Attributes.SetAttribute("data-on-slide", OnSlide);

            var activeColorClass = Color switch
            {
                "emerald" => "bg-emerald-500",
                "indigo" => "bg-indigo-600",
                "amber" => "bg-amber-500",
                "purple" => "bg-purple-600",
                _ => "bg-blue-600"
            };

            var thumbColorClass = Color switch
            {
                "emerald" => "border-emerald-500 text-emerald-600 focus:ring-emerald-400",
                "indigo" => "border-indigo-600 text-indigo-600 focus:ring-indigo-400",
                "amber" => "border-amber-500 text-amber-600 focus:ring-amber-400",
                "purple" => "border-purple-600 text-purple-600 focus:ring-purple-400",
                _ => "border-blue-600 text-blue-600 focus:ring-blue-400"
            };

            var disabledAttr = Disabled ? "opacity-60 pointer-events-none select-none" : "";
            output.Attributes.SetAttribute("class", $"panoptes-slider-container relative select-none w-full py-4 {disabledAttr} {CssClass}".Trim());

            var sb = new System.Text.StringBuilder();

            // Hidden inputs for form submit
            if (isRange)
            {
                var nStart = string.IsNullOrWhiteSpace(NameStart) ? $"{inputName}_start" : NameStart;
                var nEnd = string.IsNullOrWhiteSpace(NameEnd) ? $"{inputName}_end" : NameEnd;
                output.Attributes.SetAttribute("data-val-start", valStart.ToString(System.Globalization.CultureInfo.InvariantCulture));
                output.Attributes.SetAttribute("data-val-end", valEnd.ToString(System.Globalization.CultureInfo.InvariantCulture));

                sb.Append($"<input type=\"hidden\" name=\"{HtmlEncoder.Default.Encode(nStart)}\" id=\"{sliderId}_input_start\" value=\"{valStart.ToString(System.Globalization.CultureInfo.InvariantCulture)}\" />");
                sb.Append($"<input type=\"hidden\" name=\"{HtmlEncoder.Default.Encode(nEnd)}\" id=\"{sliderId}_input_end\" value=\"{valEnd.ToString(System.Globalization.CultureInfo.InvariantCulture)}\" />");
            }
            else
            {
                output.Attributes.SetAttribute("data-val", Value.ToString(System.Globalization.CultureInfo.InvariantCulture));
                sb.Append($"<input type=\"hidden\" name=\"{HtmlEncoder.Default.Encode(inputName)}\" id=\"{sliderId}_input\" value=\"{Value.ToString(System.Globalization.CultureInfo.InvariantCulture)}\" />");
            }

            // Başlangıç yüzdelerini hesapla (FOUC ve CSS uyumu için)
            var range = Max - Min != 0 ? Max - Min : 1;
            decimal initialLeft = 0;
            decimal initialWidth = 0;
            decimal thumb1Left = 0;
            decimal thumb2Left = 0;

            if (isRange)
            {
                var pStart = Math.Clamp((valStart - Min) / range * 100, 0, 100);
                var pEnd = Math.Clamp((valEnd - Min) / range * 100, 0, 100);
                initialLeft = pStart;
                initialWidth = Math.Max(0, pEnd - pStart);
                thumb1Left = pStart;
                thumb2Left = pEnd;
            }
            else
            {
                var pSingle = Math.Clamp((Value - Min) / range * 100, 0, 100);
                initialLeft = 0;
                initialWidth = pSingle;
                thumb1Left = pSingle;
            }

            var leftStr = initialLeft.ToString("0.##", System.Globalization.CultureInfo.InvariantCulture);
            var widthStr = initialWidth.ToString("0.##", System.Globalization.CultureInfo.InvariantCulture);
            var thumb1Str = thumb1Left.ToString("0.##", System.Globalization.CultureInfo.InvariantCulture);
            var thumb2Str = thumb2Left.ToString("0.##", System.Globalization.CultureInfo.InvariantCulture);

            // Controls Wrapper
            sb.Append("<div class=\"flex items-center gap-3 w-full\">");

            // Minus button if show-buttons is true
            if (ShowButtons && !isRange)
            {
                sb.Append($"<button type=\"button\" class=\"panoptes-slider-btn-minus w-8 h-8 rounded-lg bg-slate-100 hover:bg-slate-200 active:scale-95 text-slate-700 font-bold flex items-center justify-center transition border border-slate-200\" title=\"Azalt\">-</button>");
            }

            // Track wrapper
            sb.Append("<div class=\"panoptes-slider-track-wrap relative flex-1 h-3 flex items-center cursor-pointer select-none touch-none\">");
            // Base track
            sb.Append("<div class=\"panoptes-slider-base-track w-full h-2 bg-slate-200 rounded-full relative overflow-hidden\">");
            // Highlight track - absolute zorunlu!
            sb.Append($"<div class=\"panoptes-slider-highlight-track absolute top-0 bottom-0 h-full {activeColorClass} rounded-full transition-none pointer-events-none\" style=\"left: {leftStr}%; width: {widthStr}%;\"></div>");
            sb.Append("</div>");

            // Thumb 1 (or single thumb)
            sb.Append($"<div class=\"panoptes-slider-thumb panoptes-slider-thumb-1 absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-6 h-6 bg-white border-2 {thumbColorClass} rounded-full shadow-md hover:scale-110 transition-transform cursor-grab active:cursor-grabbing z-10 flex items-center justify-center select-none touch-none\" style=\"left: {thumb1Str}%;\" tabindex=\"0\">");
            if (ShowTooltip)
            {
                sb.Append("<div class=\"panoptes-slider-tooltip absolute -top-8 left-1/2 -translate-x-1/2 px-2 py-0.5 bg-slate-900 text-white text-[11px] font-bold rounded shadow-lg opacity-0 pointer-events-none transition-opacity duration-150 whitespace-nowrap\"></div>");
            }
            sb.Append("</div>");

            // Thumb 2 (if isRange)
            if (isRange)
            {
                sb.Append($"<div class=\"panoptes-slider-thumb panoptes-slider-thumb-2 absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-6 h-6 bg-white border-2 {thumbColorClass} rounded-full shadow-md hover:scale-110 transition-transform cursor-grab active:cursor-grabbing z-10 flex items-center justify-center select-none touch-none\" style=\"left: {thumb2Str}%;\" tabindex=\"0\">");
                if (ShowTooltip)
                {
                    sb.Append("<div class=\"panoptes-slider-tooltip absolute -top-8 left-1/2 -translate-x-1/2 px-2 py-0.5 bg-slate-900 text-white text-[11px] font-bold rounded shadow-lg opacity-0 pointer-events-none transition-opacity duration-150 whitespace-nowrap\"></div>");
                }
                sb.Append("</div>");
            }

            sb.Append("</div>"); // end track wrapper

            // Plus button if show-buttons is true
            if (ShowButtons && !isRange)
            {
                sb.Append($"<button type=\"button\" class=\"panoptes-slider-btn-plus w-8 h-8 rounded-lg bg-slate-100 hover:bg-slate-200 active:scale-95 text-slate-700 font-bold flex items-center justify-center transition border border-slate-200 select-none\" title=\"Artır\">+</button>");
            }

            // Value badge indicator - Sabit genişlik (shrink-0) ile layout kaymasını ve bg titremesini önler
            if (!isRange)
            {
                sb.Append($"<div class=\"panoptes-slider-value-display w-16 shrink-0 px-2 py-1 text-center font-mono font-bold text-xs bg-slate-100 text-slate-800 rounded-lg border border-slate-200 select-none\">{Value}</div>");
            }
            else
            {
                sb.Append($"<div class=\"panoptes-slider-value-display w-36 shrink-0 px-2 py-1 text-center font-mono font-bold text-xs bg-slate-100 text-slate-800 rounded-lg border border-slate-200 select-none\">{valStart} - {valEnd}</div>");
            }

            sb.Append("</div>"); // end Controls Wrapper

            // Ticks if enabled
            if (ShowTicks)
            {
                sb.Append("<div class=\"panoptes-slider-ticks flex justify-between items-center text-[10px] font-semibold text-slate-400 mt-1.5 px-3\">");
                sb.Append($"<span>{Min}</span>");
                var mid = Min + (Max - Min) / 2;
                sb.Append($"<span>{mid:0.##}</span>");
                sb.Append($"<span>{Max}</span>");
                sb.Append("</div>");
            }

            output.Content.SetHtmlContent(sb.ToString());
        }
    }
}
