using System.Text.Json;
using Microsoft.AspNetCore.Razor.TagHelpers;

namespace Panoptes.AspNetCore.TagHelpers;

[HtmlTargetElement("panoptes-colorpicker")]
public class ColorPickerTagHelper : TagHelper
{
    [HtmlAttributeName("id")]
    public string Id { get; set; } = $"panoptes-colorpicker-{Guid.NewGuid():N}";

    [HtmlAttributeName("name")]
    public string? Name { get; set; }

    [HtmlAttributeName("value")]
    public string Value { get; set; } = "#2563eb";

    [HtmlAttributeName("palette")]
    public string? Palette { get; set; }

    [HtmlAttributeName("disabled")]
    public bool Disabled { get; set; } = false;

    [HtmlAttributeName("class")]
    public string? Class { get; set; }

    [HtmlAttributeName("on-change")]
    public string? OnChange { get; set; }

    public override void Process(TagHelperContext context, TagHelperOutput output)
    {
        output.TagName = "div";
        output.TagMode = TagMode.StartTagAndEndTag;
        output.Attributes.SetAttribute("id", Id);
        output.Attributes.SetAttribute("class", $"panoptes-colorpicker-wrapper relative inline-block {Class}".Trim());

        var inputName = Name ?? Id;
        var config = new
        {
            id = Id,
            name = inputName,
            value = Value,
            palette = Palette?.Split(',', System.StringSplitOptions.RemoveEmptyEntries | System.StringSplitOptions.TrimEntries),
            disabled = Disabled,
            onChange = OnChange
        };

        var configJson = JsonSerializer.Serialize(config);

        output.Content.SetHtmlContent($@"
<div class=""inline-flex items-center gap-2 p-1 border border-slate-300 rounded-lg bg-white shadow-xs cursor-pointer"" id=""{Id}-trigger"">
    <div id=""{Id}-preview"" class=""w-7 h-7 rounded-md border border-slate-200 shadow-inner"" style=""background-color: {Value};""></div>
    <span id=""{Id}-label"" class=""text-xs font-mono font-medium text-slate-700 pr-2 select-none"">{Value}</span>
    <input type=""hidden"" id=""{Id}-input"" name=""{inputName}"" value=""{Value}"" />
</div>
<script type=""application/json"" data-panoptes-colorpicker-config=""{Id}"">{configJson}</script>
<script>
  if (window.Panoptes && window.Panoptes.ColorPicker) {{
    window.Panoptes.ColorPicker.init('{Id}');
  }} else {{
    document.addEventListener('DOMContentLoaded', function() {{
      if (window.Panoptes && window.Panoptes.ColorPicker) {{
        window.Panoptes.ColorPicker.init('{Id}');
      }}
    }});
  }}
</script>");
    }
}
