using System;
using System.Text.Encodings.Web;
using Microsoft.AspNetCore.Razor.TagHelpers;

namespace Panoptes.AspNetCore.TagHelpers
{
    [HtmlTargetElement("panoptes-upload")]
    public class UploadTagHelper : TagHelper
    {
        [HtmlAttributeName("id")]
        public string? Id { get; set; }

        [HtmlAttributeName("name")]
        public string? Name { get; set; }

        [HtmlAttributeName("multiple")]
        public bool Multiple { get; set; } = true;

        [HtmlAttributeName("auto-upload")]
        public bool AutoUpload { get; set; } = true;

        [HtmlAttributeName("allowed-extensions")]
        public string? AllowedExtensions { get; set; }

        [HtmlAttributeName("max-file-size")]
        public long MaxFileSize { get; set; } = 10 * 1024 * 1024; // 10MB default

        [HtmlAttributeName("save-url")]
        public string? SaveUrl { get; set; }

        [HtmlAttributeName("remove-url")]
        public string? RemoveUrl { get; set; }

        [HtmlAttributeName("drop-zone-text")]
        public string DropZoneText { get; set; } = "Dosyaları buraya sürükleyip bırakın veya bilgisayarınızdan seçin";

        [HtmlAttributeName("on-select")]
        public string? OnSelect { get; set; }

        [HtmlAttributeName("on-upload")]
        public string? OnUpload { get; set; }

        [HtmlAttributeName("on-success")]
        public string? OnSuccess { get; set; }

        [HtmlAttributeName("on-error")]
        public string? OnError { get; set; }

        [HtmlAttributeName("on-remove")]
        public string? OnRemove { get; set; }

        [HtmlAttributeName("class")]
        public string? CssClass { get; set; }

        public override void Process(TagHelperContext context, TagHelperOutput output)
        {
            var uploadId = string.IsNullOrWhiteSpace(Id) ? "panoptes-upload-" + Guid.NewGuid().ToString("N")[..8] : Id;
            var inputName = string.IsNullOrWhiteSpace(Name) ? uploadId : Name;

            output.TagName = "div";
            output.TagMode = TagMode.StartTagAndEndTag;
            output.Attributes.SetAttribute("id", uploadId);
            output.Attributes.SetAttribute("data-panoptes-upload", "true");
            output.Attributes.SetAttribute("data-multiple", Multiple ? "true" : "false");
            output.Attributes.SetAttribute("data-auto-upload", AutoUpload ? "true" : "false");
            output.Attributes.SetAttribute("data-max-size", MaxFileSize.ToString());

            if (!string.IsNullOrWhiteSpace(AllowedExtensions))
                output.Attributes.SetAttribute("data-allowed-ext", AllowedExtensions);

            if (!string.IsNullOrWhiteSpace(SaveUrl))
                output.Attributes.SetAttribute("data-save-url", SaveUrl);

            if (!string.IsNullOrWhiteSpace(RemoveUrl))
                output.Attributes.SetAttribute("data-remove-url", RemoveUrl);

            if (!string.IsNullOrWhiteSpace(OnSelect))
                output.Attributes.SetAttribute("data-on-select", OnSelect);

            if (!string.IsNullOrWhiteSpace(OnUpload))
                output.Attributes.SetAttribute("data-on-upload", OnUpload);

            if (!string.IsNullOrWhiteSpace(OnSuccess))
                output.Attributes.SetAttribute("data-on-success", OnSuccess);

            if (!string.IsNullOrWhiteSpace(OnError))
                output.Attributes.SetAttribute("data-on-error", OnError);

            if (!string.IsNullOrWhiteSpace(OnRemove))
                output.Attributes.SetAttribute("data-on-remove", OnRemove);

            output.Attributes.SetAttribute("class", $"panoptes-upload-container w-full space-y-3 {CssClass}".Trim());

            var sb = new System.Text.StringBuilder();

            // Hidden file input
            var multipleAttr = Multiple ? "multiple" : "";
            var acceptAttr = !string.IsNullOrWhiteSpace(AllowedExtensions) ? $"accept=\"{HtmlEncoder.Default.Encode(AllowedExtensions)}\"" : "";
            sb.Append($"<input type=\"file\" name=\"{HtmlEncoder.Default.Encode(inputName)}\" id=\"{uploadId}_file_input\" class=\"panoptes-upload-hidden-input hidden\" {multipleAttr} {acceptAttr} />");

            // Drop zone box
            sb.Append("<div class=\"panoptes-upload-dropzone p-6 border-2 border-dashed border-slate-300 hover:border-blue-500 rounded-2xl bg-slate-50/50 hover:bg-blue-50/30 transition-all duration-200 cursor-pointer flex flex-col items-center justify-center text-center group\">");
            
            // Icon
            sb.Append("<div class=\"w-12 h-12 rounded-2xl bg-white shadow-xs border border-slate-200 flex items-center justify-center text-blue-600 group-hover:scale-110 group-hover:border-blue-300 transition-transform mb-3\">");
            sb.Append("<svg class=\"w-6 h-6\" fill=\"none\" stroke=\"currentColor\" viewBox=\"0 0 24 24\"><path stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"2\" d=\"M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12\"/></svg>");
            sb.Append("</div>");

            // Text
            sb.Append($"<p class=\"text-xs font-semibold text-slate-700 group-hover:text-blue-600 transition mb-1\">{HtmlEncoder.Default.Encode(DropZoneText)}</p>");
            
            // Restrictions hint
            var extHint = !string.IsNullOrWhiteSpace(AllowedExtensions) ? $"İzin verilen formatlar: {AllowedExtensions}" : "Tüm dosya türleri";
            var sizeMb = (MaxFileSize / (1024.0 * 1024.0)).ToString("0.#");
            sb.Append($"<p class=\"text-[11px] text-slate-400\">{extHint} • Maksimum: {sizeMb} MB</p>");

            // Select button
            sb.Append("<button type=\"button\" class=\"panoptes-upload-select-btn mt-3 px-3 py-1.5 bg-white text-slate-700 hover:text-blue-600 hover:bg-slate-100 rounded-lg text-xs font-semibold border border-slate-200 shadow-2xs transition active:scale-95\">");
            sb.Append("Dosya Seç");
            sb.Append("</button>");

            sb.Append("</div>"); // end dropzone

            // Manual Upload Actions Bar (only when auto-upload is false)
            if (!AutoUpload)
            {
                sb.Append("<div class=\"panoptes-upload-manual-actions hidden flex items-center justify-between px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs\">");
                sb.Append("<span class=\"font-medium text-slate-600 panoptes-upload-pending-count\">0 dosya yüklemeyi bekliyor</span>");
                sb.Append("<button type=\"button\" class=\"panoptes-upload-start-all-btn px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg shadow-xs transition active:scale-95 flex items-center gap-1.5\">");
                sb.Append("<svg class=\"w-3.5 h-3.5\" fill=\"none\" stroke=\"currentColor\" viewBox=\"0 0 24 24\"><path stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"2\" d=\"M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12\"/></svg>");
                sb.Append("Tümünü Yükle");
                sb.Append("</button>");
                sb.Append("</div>");
            }

            // File items list container
            sb.Append("<div class=\"panoptes-upload-file-list space-y-2\"></div>");

            output.Content.SetHtmlContent(sb.ToString());
        }
    }
}
