using Microsoft.AspNetCore.Razor.TagHelpers;
using System.Threading.Tasks;

namespace Panoptes.AspNetCore.TagHelpers
{
    [HtmlTargetElement("panoptes-form-group", ParentTag = "panoptes-form")]
    public class FormGroupTagHelper : TagHelper
    {
        [HtmlAttributeName("label")]
        public string Label { get; set; }

        public override async Task ProcessAsync(TagHelperContext context, TagHelperOutput output)
        {
            output.TagName = "fieldset";
            output.Attributes.SetAttribute("class", "col-span-full bg-slate-50/50 p-6 rounded-xl border border-slate-200 mb-6");

            var childContent = await output.GetChildContentAsync();

            if (!string.IsNullOrEmpty(Label))
            {
                var legend = $"<legend class=\"text-sm font-bold text-slate-800 px-3 py-1 bg-white border border-slate-200 rounded-md shadow-2xs mb-4\">{Label}</legend>";
                output.PreContent.SetHtmlContent(legend);
            }

            // A container for the fields
            output.Content.SetHtmlContent($"<div class=\"grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5\">{childContent.GetContent()}</div>");
        }
    }
}
