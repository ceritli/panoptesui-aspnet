using System.Text.Json;
using Microsoft.AspNetCore.Razor.TagHelpers;

namespace Panoptes.AspNetCore.TagHelpers;

[HtmlTargetElement("panoptes-checkbox")]
public class CheckBoxTagHelper : TagHelper
{
    [HtmlAttributeName("id")]
    public string Id { get; set; } = $"panoptes-checkbox-{Guid.NewGuid():N}";

    [HtmlAttributeName("name")]
    public string? Name { get; set; }

    [HtmlAttributeName("checked")]
    public bool Checked { get; set; } = false;

    [HtmlAttributeName("label")]
    public string? Label { get; set; }

    [HtmlAttributeName("disabled")]
    public bool Disabled { get; set; } = false;

    [HtmlAttributeName("class")]
    public string? Class { get; set; }

    [HtmlAttributeName("on-change")]
    public string? OnChange { get; set; }

    public override void Process(TagHelperContext context, TagHelperOutput output)
    {
        output.TagName = "label";
        output.TagMode = TagMode.StartTagAndEndTag;
        output.Attributes.SetAttribute("id", Id);
        var disabledClass = Disabled ? "cursor-not-allowed opacity-60" : "";
        output.Attributes.SetAttribute("class", $"panoptes-checkbox-wrapper inline-flex items-center gap-2.5 select-none cursor-pointer {disabledClass} {Class}".Trim());

        var inputName = Name ?? Id;
        var checkedAttr = Checked ? "checked" : "";
        var disabledAttr = Disabled ? "disabled" : "";
        var labelHtml = string.IsNullOrEmpty(Label) ? "" : $"<span class=\"text-sm text-slate-700 font-medium\">{Label}</span>";

        output.Content.SetHtmlContent($@"
    <input type=""checkbox"" 
           id=""{Id}-input"" 
           name=""{inputName}"" 
           class=""sr-only peer"" 
           {checkedAttr} 
           {disabledAttr} />
    <div class=""w-4 h-4 rounded border border-slate-300 bg-white peer-checked:bg-blue-600 peer-checked:border-blue-600 peer-focus:ring-2 peer-focus:ring-blue-500/20 flex items-center justify-center transition shadow-xs"">
        <svg class=""w-3 h-3 text-white hidden peer-checked:block pointer-events-none"" fill=""none"" stroke=""currentColor"" viewBox=""0 0 24 24"">
            <path stroke-linecap=""round"" stroke-linejoin=""round"" stroke-width=""3"" d=""M5 13l4 4L19 7"" />
        </svg>
    </div>
    {labelHtml}
<script>
  if (window.Panoptes && window.Panoptes.CheckBox) {{
    window.Panoptes.CheckBox.init('{Id}');
  }}
</script>");
    }
}
