using System.Text.Json;
using Microsoft.AspNetCore.Razor.TagHelpers;

namespace Panoptes.AspNetCore.TagHelpers;

[HtmlTargetElement("panoptes-maskedtextbox")]
public class MaskedTextBoxTagHelper : TagHelper
{
    [HtmlAttributeName("id")]
    public string Id { get; set; } = $"panoptes-maskedtextbox-{Guid.NewGuid():N}";

    [HtmlAttributeName("name")]
    public string? Name { get; set; }

    [HtmlAttributeName("value")]
    public string? Value { get; set; }

    [HtmlAttributeName("mask")]
    public string Mask { get; set; } = "(000) 000-0000";

    [HtmlAttributeName("placeholder")]
    public string Placeholder { get; set; } = "(0___) ___-____";

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
        output.Attributes.SetAttribute("class", $"panoptes-maskedtextbox-wrapper relative inline-block w-full {Class}".Trim());

        var inputName = Name ?? Id;
        var config = new
        {
            id = Id,
            name = inputName,
            value = Value,
            mask = Mask,
            placeholder = Placeholder,
            disabled = Disabled,
            readonlyMode = Readonly,
            onChange = OnChange
        };

        var configJson = JsonSerializer.Serialize(config);
        var disabledAttr = Disabled ? "disabled" : "";
        var readonlyAttr = Readonly ? "readonly" : "";
        var stateClass = Disabled ? "bg-slate-100 cursor-not-allowed text-slate-400" : "bg-white";

        output.Content.SetHtmlContent($@"
<input type=""text"" 
       id=""{Id}-input"" 
       name=""{inputName}"" 
       value=""{Value}"" 
       placeholder=""{Placeholder}"" 
       class=""panoptes-input w-full px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-800 font-mono focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition shadow-sm {stateClass}"" 
       {disabledAttr} 
       {readonlyAttr} />
<script type=""application/json"" data-panoptes-maskedtextbox-config=""{Id}"">{configJson}</script>
<script>
  if (window.Panoptes && window.Panoptes.MaskedTextBox) {{
    window.Panoptes.MaskedTextBox.init('{Id}');
  }} else {{
    document.addEventListener('DOMContentLoaded', function() {{
      if (window.Panoptes && window.Panoptes.MaskedTextBox) {{
        window.Panoptes.MaskedTextBox.init('{Id}');
      }}
    }});
  }}
</script>");
    }
}
