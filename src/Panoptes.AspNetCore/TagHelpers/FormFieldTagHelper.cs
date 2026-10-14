using Microsoft.AspNetCore.Razor.TagHelpers;
using Microsoft.AspNetCore.Mvc.ViewFeatures;
using System.Threading.Tasks;
using System.Text;

namespace Panoptes.AspNetCore.TagHelpers
{
    [HtmlTargetElement("panoptes-form-field")]
    public class FormFieldTagHelper : TagHelper
    {
        [HtmlAttributeName("asp-for")]
        public ModelExpression For { get; set; }

        [HtmlAttributeName("editor")]
        public string Editor { get; set; }

        [HtmlAttributeName("label")]
        public string Label { get; set; }

        [HtmlAttributeName("col-span")]
        public int ColSpan { get; set; } = 1;

        public override void Process(TagHelperContext context, TagHelperOutput output)
        {
            output.TagName = "div";
            output.TagMode = TagMode.StartTagAndEndTag;
            
            // Layout orientation
            var orientation = context.Items["FormOrientation"]?.ToString() ?? "vertical";
            var baseClass = orientation == "horizontal" ? "flex items-center gap-4" : "flex flex-col gap-1.5";
            
            // Grid spanning
            if (ColSpan == 2)
            {
                baseClass += " md:col-span-2";
            }
            output.Attributes.SetAttribute("class", baseClass);

            if (For == null)
            {
                output.SuppressOutput();
                return;
            }

            var propName = For.Name;
            var displayLabel = Label ?? For.Metadata.DisplayName ?? propName;
            var isRequired = For.Metadata.IsRequired;
            var requiredMark = isRequired ? "<span class=\"text-red-500 ml-1\">*</span>" : "";

            // Determine editor type
            var editorType = Editor?.ToLowerInvariant();
            if (string.IsNullOrEmpty(editorType))
            {
                var type = For.Metadata.ModelType;
                if (type == typeof(bool) || type == typeof(bool?))
                    editorType = "checkbox";
                else if (type == typeof(int) || type == typeof(decimal) || type == typeof(double))
                    editorType = "numeric";
                else if (type == typeof(System.DateTime) || type == typeof(System.DateTime?))
                    editorType = "date";
                else
                    editorType = "text";
            }

            var labelClass = orientation == "horizontal" ? "text-sm font-semibold text-slate-700 w-1/3 shrink-0" : "text-sm font-semibold text-slate-700";
            var wrapperClass = orientation == "horizontal" ? "w-2/3" : "w-full";

            var sb = new StringBuilder();

            if (editorType != "checkbox") // Checkboxes usually have label after the box
            {
                sb.AppendLine($"<label for=\"{propName}\" class=\"{labelClass}\">{displayLabel}{requiredMark}</label>");
            }

            sb.AppendLine($"<div class=\"{wrapperClass}\">");

            var inputClass = "w-full bg-white border border-slate-300 text-slate-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2.5 transition shadow-2xs";

            // Render different editors
            switch (editorType)
            {
                case "password":
                    sb.AppendLine($"<input type=\"password\" id=\"{propName}\" name=\"{propName}\" class=\"{inputClass}\" {(isRequired ? "required" : "")} />");
                    break;
                case "email":
                    sb.AppendLine($"<input type=\"email\" id=\"{propName}\" name=\"{propName}\" class=\"{inputClass}\" {(isRequired ? "required" : "")} />");
                    break;
                case "textarea":
                    sb.AppendLine($"<textarea id=\"{propName}\" name=\"{propName}\" rows=\"3\" class=\"{inputClass}\" {(isRequired ? "required" : "")}></textarea>");
                    break;
                case "checkbox":
                    // Use panoptes-checkbox style manually for now or standard tailwind
                    sb.AppendLine($@"
                    <div class=""flex items-center gap-2 mt-1"">
                        <input type=""checkbox"" id=""{propName}"" name=""{propName}"" value=""true"" class=""w-4 h-4 text-blue-600 bg-white border-slate-300 rounded focus:ring-blue-500"" {(isRequired ? "required" : "")} />
                        <label for=""{propName}"" class=""text-sm font-semibold text-slate-700"">{displayLabel}{requiredMark}</label>
                    </div>");
                    break;
                case "numeric":
                    sb.AppendLine($"<input type=\"number\" id=\"{propName}\" name=\"{propName}\" class=\"{inputClass}\" {(isRequired ? "required" : "")} />");
                    break;
                case "date":
                    sb.AppendLine($"<input type=\"date\" id=\"{propName}\" name=\"{propName}\" class=\"{inputClass}\" {(isRequired ? "required" : "")} />");
                    break;
                default: // text
                    sb.AppendLine($"<input type=\"text\" id=\"{propName}\" name=\"{propName}\" class=\"{inputClass}\" {(isRequired ? "required" : "")} />");
                    break;
            }

            // Validation message placeholder
            sb.AppendLine($"<span class=\"field-validation-valid text-xs text-red-500 font-medium mt-1 block\" data-valmsg-for=\"{propName}\" data-valmsg-replace=\"true\"></span>");
            sb.AppendLine("</div>");

            output.Content.SetHtmlContent(sb.ToString());
        }
    }
}
