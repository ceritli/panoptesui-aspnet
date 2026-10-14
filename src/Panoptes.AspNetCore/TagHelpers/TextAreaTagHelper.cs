using System.Text.Json;
using Microsoft.AspNetCore.Razor.TagHelpers;

namespace Panoptes.AspNetCore.TagHelpers;

[HtmlTargetElement("panoptes-textarea")]
public class TextAreaTagHelper : TagHelper
{
    [HtmlAttributeName("id")]
    public string Id { get; set; } = $"panoptes-textarea-{Guid.NewGuid():N}";

    [HtmlAttributeName("name")]
    public string? Name { get; set; }

    [HtmlAttributeName("value")]
    public string? Value { get; set; }

    [HtmlAttributeName("placeholder")]
    public string Placeholder { get; set; } = "Metin giriniz...";

    [HtmlAttributeName("rows")]
    public int Rows { get; set; } = 3;

    [HtmlAttributeName("max-length")]
    public int? MaxLength { get; set; }

    [HtmlAttributeName("auto-resize")]
    public bool AutoResize { get; set; } = true;

    [HtmlAttributeName("disabled")]
    public bool Disabled { get; set; } = false;

    [HtmlAttributeName("readonly")]
    public bool Readonly { get; set; } = false;

    [HtmlAttributeName("class")]
    public string? Class { get; set; }

    [HtmlAttributeName("on-change")]
    public string? OnChange { get; set; }

    public override void Process(TagHelperContext context, TagHelperOutput output)
    {
        output.TagName = "div";
        output.TagMode = TagMode.StartTagAndEndTag;
        output.Attributes.SetAttribute("id", Id);
        output.Attributes.SetAttribute("class", $"panoptes-textarea-wrapper relative block w-full {Class}".Trim());

        var inputName = Name ?? Id;
        var config = new
        {
            id = Id,
            name = inputName,
            value = Value,
            placeholder = Placeholder,
            rows = Rows,
            maxLength = MaxLength,
            autoResize = AutoResize,
            disabled = Disabled,
            readonlyMode = Readonly,
            onChange = OnChange
        };

        var configJson = JsonSerializer.Serialize(config);
        var disabledAttr = Disabled ? "disabled" : "";
        var readonlyAttr = Readonly ? "readonly" : "";
        var stateClass = Disabled ? "bg-slate-100 cursor-not-allowed text-slate-400" : "bg-white";
        var maxLenAttr = MaxLength.HasValue ? $"maxlength=\"{MaxLength.Value}\"" : "";
        var counterHtml = MaxLength.HasValue ? $"<div class=\"flex justify-end mt-1 text-xs text-slate-400\"><span id=\"{Id}-counter\">{Value?.Length ?? 0}</span>/{MaxLength.Value}</div>" : "";

        output.Content.SetHtmlContent($@"
<div class=""relative"">
    <textarea id=""{Id}-input"" 
              name=""{inputName}"" 
              rows=""{Rows}"" 
              placeholder=""{Placeholder}"" 
              {maxLenAttr} 
              class=""panoptes-textarea w-full px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition shadow-sm resize-none {stateClass}"" 
              {disabledAttr} 
              {readonlyAttr}>{Value}</textarea>
    {counterHtml}
</div>
<script type=""application/json"" data-panoptes-textarea-config=""{Id}"">{configJson}</script>
<script>
  if (window.Panoptes && window.Panoptes.TextArea) {{
    window.Panoptes.TextArea.init('{Id}');
  }} else {{
    document.addEventListener('DOMContentLoaded', function() {{
      if (window.Panoptes && window.Panoptes.TextArea) {{
        window.Panoptes.TextArea.init('{Id}');
      }}
    }});
  }}
</script>");
    }
}
