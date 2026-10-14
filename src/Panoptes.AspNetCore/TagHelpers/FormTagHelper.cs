using Microsoft.AspNetCore.Razor.TagHelpers;
using Microsoft.AspNetCore.Mvc.ViewFeatures;
using System.Threading.Tasks;
using System.Text;

namespace Panoptes.AspNetCore.TagHelpers
{
    [HtmlTargetElement("panoptes-form")]
    public class FormTagHelper : TagHelper
    {
        [HtmlAttributeName("id")]
        public string Id { get; set; }

        [HtmlAttributeName("action")]
        public string Action { get; set; }

        [HtmlAttributeName("method")]
        public string Method { get; set; } = "POST";

        [HtmlAttributeName("layout")]
        public string Layout { get; set; } = "grid"; // "grid" or "stack"

        [HtmlAttributeName("orientation")]
        public string Orientation { get; set; } = "vertical"; // "vertical" or "horizontal" labels

        public override async Task ProcessAsync(TagHelperContext context, TagHelperOutput output)
        {
            output.TagName = "form";
            output.Attributes.SetAttribute("id", Id);
            output.Attributes.SetAttribute("action", Action);
            output.Attributes.SetAttribute("method", Method);
            
            // Layout classes
            var layoutClass = Layout == "grid" ? "grid grid-cols-1 md:grid-cols-2 gap-6" : "space-y-6";
            output.Attributes.SetAttribute("class", $"panoptes-form {layoutClass}");

            // Pass orientation to children
            context.Items["FormOrientation"] = Orientation;

            // Wait for children to render
            var childContent = await output.GetChildContentAsync();

            output.Content.SetHtmlContent(childContent);

            // Add bottom action buttons (Submit / Clear)
            var actionButtons = $@"
                <div class=""col-span-full mt-8 pt-5 border-t border-slate-200 flex items-center justify-end gap-3"">
                    <button type=""reset"" class=""px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-200 transition"">Temizle</button>
                    <button type=""submit"" class=""px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition shadow-sm"">Gönder</button>
                </div>
            ";

            output.Content.AppendHtml(actionButtons);
        }
    }
}
