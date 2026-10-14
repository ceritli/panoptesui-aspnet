using Microsoft.AspNetCore.Razor.TagHelpers;
using System.Text.Json;
using System.Collections.Generic;

namespace Panoptes.AspNetCore.TagHelpers
{
    [HtmlTargetElement("panoptes-filemanager")]
    public class FileManagerTagHelper : TagHelper
    {
        [HtmlAttributeName("id")]
        public string Id { get; set; }

        [HtmlAttributeName("read-url")]
        public string ReadUrl { get; set; }

        [HtmlAttributeName("upload-url")]
        public string UploadUrl { get; set; }

        [HtmlAttributeName("destroy-url")]
        public string DestroyUrl { get; set; }

        [HtmlAttributeName("create-url")]
        public string CreateUrl { get; set; }

        [HtmlAttributeName("update-url")]
        public string UpdateUrl { get; set; }

        [HtmlAttributeName("height")]
        public string Height { get; set; } = "600px";

        public override void Process(TagHelperContext context, TagHelperOutput output)
        {
            output.TagName = "div";
            output.Attributes.SetAttribute("id", Id);
            output.Attributes.SetAttribute("class", "panoptes-filemanager relative flex flex-col bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm");
            if (!string.IsNullOrEmpty(Height))
            {
                output.Attributes.SetAttribute("style", $"height: {Height}");
            }

            var config = new
            {
                id = Id,
                urls = new
                {
                    read = ReadUrl,
                    upload = UploadUrl,
                    destroy = DestroyUrl,
                    create = CreateUrl,
                    update = UpdateUrl
                }
            };

            var script = $@"
                <script type='application/json' data-panoptes-filemanager-config='{Id}'>
                    {JsonSerializer.Serialize(config)}
                </script>";

            // HTML skeleton
            var html = $@"
                <div class='pfm-toolbar bg-slate-50 border-b border-slate-200 p-2 flex items-center justify-between gap-2 shrink-0'></div>
                <div class='pfm-body flex flex-1 min-h-0 relative'>
                    <div class='pfm-treeview-pane w-64 shrink-0 border-r border-slate-200 overflow-y-auto bg-slate-50/50 p-2'></div>
                    <div class='pfm-content-pane flex-1 min-w-0 flex flex-col bg-white'>
                        <div class='pfm-breadcrumb bg-white border-b border-slate-100 px-3 py-2 text-sm text-slate-600 flex items-center shrink-0 shadow-sm z-10'></div>
                        <div class='pfm-grid-pane flex-1 min-h-0 overflow-auto p-2 relative'>
                           <div class='pfm-empty-state hidden absolute inset-0 flex flex-col items-center justify-center text-slate-400'>
                                <svg class='w-16 h-16 mb-4 opacity-50' fill='none' stroke='currentColor' viewBox='0 0 24 24'><path stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2h8m4-4l-4-4m0 0l-4 4m4-4v12'/></svg>
                                <div class='text-sm font-semibold'>Klasör boş</div>
                                <div class='text-xs mt-1'>Dosyaları buraya sürükleyebilirsiniz</div>
                           </div>
                        </div>
                    </div>
                    <div class='pfm-preview-pane w-72 shrink-0 border-l border-slate-200 bg-slate-50/80 p-4 overflow-y-auto hidden'></div>
                </div>
                {script}
            ";

            output.Content.SetHtmlContent(html);
        }
    }
}
