using System.Text.Json;
using Microsoft.AspNetCore.Razor.TagHelpers;

namespace Panoptes.AspNetCore.TagHelpers;

[HtmlTargetElement("panoptes-radiogroup")]
public class RadioGroupTagHelper : TagHelper
{
    [HtmlAttributeName("id")]
    public string Id { get; set; } = $"panoptes-radiogroup-{Guid.NewGuid():N}";

    [HtmlAttributeName("name")]
    public string? Name { get; set; }

    [HtmlAttributeName("value")]
    public string? Value { get; set; }

    [HtmlAttributeName("options")]
    public string? Options { get; set; }

    [HtmlAttributeName("layout")]
    public string Layout { get; set; } = "horizontal";

    [HtmlAttributeName("disabled")]
    public bool Disabled { get; set; } = false;

    [HtmlAttributeName("class")]
    public string? Class { get; set; }

    public override void Process(TagHelperContext context, TagHelperOutput output)
    {
        output.TagName = "div";
        output.TagMode = TagMode.StartTagAndEndTag;
        output.Attributes.SetAttribute("id", Id);
        var flexClass = Layout == "vertical" ? "flex flex-col gap-2" : "flex flex-wrap items-center gap-4";
        output.Attributes.SetAttribute("class", $"panoptes-radiogroup-wrapper {flexClass} {Class}".Trim());

        var groupName = Name ?? Id;
        var opts = Options?.Split(',', System.StringSplitOptions.RemoveEmptyEntries | System.StringSplitOptions.TrimEntries) ?? System.Array.Empty<string>();
        var disabledAttr = Disabled ? "disabled" : "";
        var disabledClass = Disabled ? "cursor-not-allowed opacity-60" : "";

        var items = new System.Collections.Generic.List<string>();
        for (int idx = 0; idx < opts.Length; idx++)
        {
            var opt = opts[idx];
            var isChecked = string.Equals(opt, Value, System.StringComparison.OrdinalIgnoreCase);
            var itemId = $"{Id}-opt-{idx}";
            var checkedAttr = isChecked ? "checked" : "";
            items.Add($@"
            <label class=""inline-flex items-center gap-2 cursor-pointer select-none {disabledClass}"" for=""{itemId}"">
                <input type=""radio"" 
                       id=""{itemId}"" 
                       name=""{groupName}"" 
                       value=""{opt}"" 
                       class=""sr-only peer"" 
                       {checkedAttr} 
                       {disabledAttr} />
                <div class=""w-4 h-4 rounded-full border border-slate-300 bg-white peer-checked:border-blue-600 peer-focus:ring-2 peer-focus:ring-blue-500/20 flex items-center justify-center transition shadow-xs"">
                    <div class=""w-2 h-2 rounded-full bg-blue-600 hidden peer-checked:block transition""></div>
                </div>
                <span class=""text-sm text-slate-700 font-medium"">{opt}</span>
            </label>");
        }

        var itemsHtml = string.Join(System.Environment.NewLine, items);

        output.Content.SetHtmlContent(itemsHtml + $@"
<script>
  if (window.Panoptes && window.Panoptes.RadioGroup) {{
    window.Panoptes.RadioGroup.init('{Id}');
  }}
</script>");
    }
}
