using System;
using System.Text.Encodings.Web;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Razor.TagHelpers;

namespace Panoptes.AspNetCore.TagHelpers
{
    [HtmlTargetElement("panoptes-editor")]
    public class EditorTagHelper : TagHelper
    {
        [HtmlAttributeName("id")]
        public string? Id { get; set; }

        [HtmlAttributeName("name")]
        public string? Name { get; set; }

        [HtmlAttributeName("value")]
        public string? Value { get; set; }

        [HtmlAttributeName("height")]
        public int Height { get; set; } = 320;

        [HtmlAttributeName("tools")]
        public string Tools { get; set; } = "all"; // all, basic, standard

        [HtmlAttributeName("placeholder")]
        public string Placeholder { get; set; } = "İçeriğinizi buraya yazın...";

        [HtmlAttributeName("readonly")]
        public bool ReadOnly { get; set; } = false;

        [HtmlAttributeName("on-change")]
        public string? OnChange { get; set; }

        [HtmlAttributeName("class")]
        public string? CssClass { get; set; }

        public override async Task ProcessAsync(TagHelperContext context, TagHelperOutput output)
        {
            var editorId = string.IsNullOrWhiteSpace(Id) ? "panoptes-editor-" + Guid.NewGuid().ToString("N")[..8] : Id;
            var inputName = string.IsNullOrWhiteSpace(Name) ? editorId : Name;

            var childContent = (await output.GetChildContentAsync()).GetContent();
            var initialHtml = !string.IsNullOrWhiteSpace(childContent) ? childContent : (Value ?? "");

            output.TagName = "div";
            output.TagMode = TagMode.StartTagAndEndTag;
            output.Attributes.SetAttribute("id", editorId);
            output.Attributes.SetAttribute("data-panoptes-editor", "true");
            output.Attributes.SetAttribute("data-tools", Tools);
            output.Attributes.SetAttribute("data-readonly", ReadOnly ? "true" : "false");

            if (!string.IsNullOrWhiteSpace(OnChange))
                output.Attributes.SetAttribute("data-on-change", OnChange);

            output.Attributes.SetAttribute("class", $"panoptes-editor-wrapper rounded-2xl border border-slate-300 bg-white overflow-hidden shadow-xs flex flex-col {CssClass}".Trim());

            var sb = new System.Text.StringBuilder();

            // Hidden input for form submit
            sb.Append($"<input type=\"hidden\" name=\"{HtmlEncoder.Default.Encode(inputName)}\" id=\"{editorId}_input\" value=\"{HtmlEncoder.Default.Encode(initialHtml)}\" />");

            // Toolbar
            if (!ReadOnly)
            {
                sb.Append("<div class=\"panoptes-editor-toolbar px-3 py-2 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center gap-1 text-slate-700 select-none\">");

                // Headings
                sb.Append("<select class=\"panoptes-editor-cmd-format text-xs bg-white border border-slate-200 rounded-lg px-2 py-1 font-medium text-slate-700 outline-none hover:border-slate-300\">");
                sb.Append("<option value=\"p\">Paragraf</option>");
                sb.Append("<option value=\"h1\">Başlık 1 (H1)</option>");
                sb.Append("<option value=\"h2\">Başlık 2 (H2)</option>");
                sb.Append("<option value=\"h3\">Başlık 3 (H3)</option>");
                sb.Append("<option value=\"blockquote\">Alıntı</option>");
                sb.Append("<option value=\"pre\">Kod Bloğu</option>");
                sb.Append("</select>");

                sb.Append("<span class=\"w-[1px] h-5 bg-slate-200 mx-1\"></span>");

                // Inline formatting
                sb.Append(MakeBtn("bold", "Kalın (Ctrl+B)", "<span class=\"font-black\">B</span>"));
                sb.Append(MakeBtn("italic", "İtalik (Ctrl+I)", "<span class=\"italic font-serif font-bold\">I</span>"));
                sb.Append(MakeBtn("underline", "Altı Çizili (Ctrl+U)", "<span class=\"underline font-bold\">U</span>"));
                sb.Append(MakeBtn("strikeThrough", "Üstü Çizili", "<span class=\"line-through\">S</span>"));

                sb.Append("<span class=\"w-[1px] h-5 bg-slate-200 mx-1\"></span>");

                // Alignment
                sb.Append(MakeBtn("justifyLeft", "Sola Yasla", "<svg class=\"w-3.5 h-3.5\" fill=\"none\" stroke=\"currentColor\" viewBox=\"0 0 24 24\"><path stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"2\" d=\"M4 6h16M4 12h10M4 18h16\"/></svg>"));
                sb.Append(MakeBtn("justifyCenter", "Ortala", "<svg class=\"w-3.5 h-3.5\" fill=\"none\" stroke=\"currentColor\" viewBox=\"0 0 24 24\"><path stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"2\" d=\"M4 6h16M7 12h10M4 18h16\"/></svg>"));
                sb.Append(MakeBtn("justifyRight", "Sağa Yasla", "<svg class=\"w-3.5 h-3.5\" fill=\"none\" stroke=\"currentColor\" viewBox=\"0 0 24 24\"><path stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"2\" d=\"M4 6h16M10 12h10M4 18h16\"/></svg>"));

                sb.Append("<span class=\"w-[1px] h-5 bg-slate-200 mx-1\"></span>");

                // Lists
                sb.Append(MakeBtn("insertUnorderedList", "Madde İmleri", "<svg class=\"w-3.5 h-3.5\" fill=\"none\" stroke=\"currentColor\" viewBox=\"0 0 24 24\"><path stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"2\" d=\"M4 6h16M4 12h16M4 18h16M2 6h.01M2 12h.01M2 18h.01\"/></svg>"));
                sb.Append(MakeBtn("insertOrderedList", "Numaralı Liste", "<svg class=\"w-3.5 h-3.5\" fill=\"none\" stroke=\"currentColor\" viewBox=\"0 0 24 24\"><path stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"2\" d=\"M9 6h11M9 12h11M9 18h11M4 6h2v4H4m0 4h2l-2 4h3\"/></svg>"));

                if (Tools != "basic")
                {
                    sb.Append("<span class=\"w-[1px] h-5 bg-slate-200 mx-1\"></span>");

                    // Insert Link & Image & Table
                    sb.Append(MakeBtn("createLink", "Bağlantı Ekle", "<svg class=\"w-3.5 h-3.5\" fill=\"none\" stroke=\"currentColor\" viewBox=\"0 0 24 24\"><path stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"2\" d=\"M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1\"/></svg>"));
                    sb.Append(MakeBtn("insertImage", "Resim Ekle", "<svg class=\"w-3.5 h-3.5\" fill=\"none\" stroke=\"currentColor\" viewBox=\"0 0 24 24\"><path stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"2\" d=\"M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z\"/></svg>"));
                    sb.Append(MakeBtn("insertTable", "Tablo Ekle", "<svg class=\"w-3.5 h-3.5\" fill=\"none\" stroke=\"currentColor\" viewBox=\"0 0 24 24\"><path stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"2\" d=\"M3 10h18M3 14h18m-9-4v8m-7 4h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z\"/></svg>"));

                    sb.Append("<span class=\"w-[1px] h-5 bg-slate-200 mx-1\"></span>");

                    // Clear Formatting & Undo / Redo
                    sb.Append(MakeBtn("removeFormat", "Biçimlendirmeyi Temizle", "<svg class=\"w-3.5 h-3.5\" fill=\"none\" stroke=\"currentColor\" viewBox=\"0 0 24 24\"><path stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"2\" d=\"M6 18L18 6M6 6l12 12\"/></svg>"));
                    sb.Append(MakeBtn("undo", "Geri Al", "<svg class=\"w-3.5 h-3.5\" fill=\"none\" stroke=\"currentColor\" viewBox=\"0 0 24 24\"><path stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"2\" d=\"M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6\"/></svg>"));
                    sb.Append(MakeBtn("redo", "Yinele", "<svg class=\"w-3.5 h-3.5\" fill=\"none\" stroke=\"currentColor\" viewBox=\"0 0 24 24\"><path stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"2\" d=\"M21 10h-10a8 8 0 00-8 8v2M21 10l-6 6m6-6l-6-6\"/></svg>"));

                    // HTML Source Code Mode Toggle
                    sb.Append("<button type=\"button\" class=\"panoptes-editor-btn-source ml-auto px-2 py-1 text-slate-500 hover:text-slate-900 hover:bg-slate-200 rounded-md font-mono text-[11px] font-bold transition\" title=\"HTML Kaynak Kodu Görünümü\">&lt;/&gt; HTML</button>");
                }

                sb.Append("</div>"); // end toolbar
            }

            // Editable Area
            var readonlyAttr = ReadOnly ? "" : "contenteditable=\"true\"";
            sb.Append($"<div class=\"panoptes-editor-body flex-1 p-5 outline-none overflow-y-auto text-slate-800 text-sm leading-relaxed prose prose-slate max-w-none\" style=\"min-height: {Height}px; max-height: {Height * 2}px;\" {readonlyAttr} data-placeholder=\"{HtmlEncoder.Default.Encode(Placeholder)}\">");
            sb.Append(initialHtml);
            sb.Append("</div>");

            // Textarea for HTML source code view (hidden by default)
            sb.Append($"<textarea class=\"panoptes-editor-source-textarea hidden flex-1 p-5 font-mono text-xs text-slate-800 bg-slate-950 text-slate-100 outline-none resize-none\" style=\"min-height: {Height}px;\"></textarea>");

            // Footer / Status bar (words, chars)
            sb.Append("<div class=\"panoptes-editor-footer px-4 py-1.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-[11px] text-slate-400 font-medium select-none\">");
            sb.Append("<div class=\"flex items-center gap-3\">");
            sb.Append("<span class=\"panoptes-editor-word-count\">0 kelime</span>");
            sb.Append("<span>•</span>");
            sb.Append("<span class=\"panoptes-editor-char-count\">0 karakter</span>");
            sb.Append("</div>");
            sb.Append("<div class=\"text-[10px] text-slate-400 font-mono\">Panoptes Rich WYSIWYG</div>");
            sb.Append("</div>");

            output.Content.SetHtmlContent(sb.ToString());
        }

        private static string MakeBtn(string cmd, string title, string icon)
        {
            return $"<button type=\"button\" data-cmd=\"{cmd}\" class=\"panoptes-editor-btn w-7 h-7 flex items-center justify-center rounded-lg hover:bg-slate-200 active:bg-slate-300 text-slate-700 transition\" title=\"{title}\">{icon}</button>";
        }
    }
}
