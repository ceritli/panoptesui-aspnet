using System.Text.Json;
using Microsoft.AspNetCore.Razor.TagHelpers;

namespace Panoptes.AspNetCore.TagHelpers;

[HtmlTargetElement("panoptes-textbox")]
public class TextBoxTagHelper : TagHelper
{
    [HtmlAttributeName("id")]
    public string Id { get; set; } = $"panoptes-textbox-{Guid.NewGuid():N}";

    [HtmlAttributeName("name")]
    public string? Name { get; set; }

    [HtmlAttributeName("value")]
    public string? Value { get; set; }

    [HtmlAttributeName("placeholder")]
    public string? Placeholder { get; set; }

    [HtmlAttributeName("type")]
    public string Type { get; set; } = "text"; // text, password, email, tel

    [HtmlAttributeName("clearable")]
    public bool Clearable { get; set; } = true;

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
        output.Attributes.SetAttribute("class", $"panoptes-textbox-wrapper relative inline-block w-full {Class}".Trim());

        var inputName = Name ?? Id;
        var config = new
        {
            id = Id,
            name = inputName,
            value = Value,
            placeholder = Placeholder,
            type = Type,
            clearable = Clearable,
            disabled = Disabled,
            readonlyMode = Readonly,
            onChange = OnChange
        };

        var configJson = JsonSerializer.Serialize(config);

        output.Content.SetHtmlContent($@"
<div class=""panoptes-input-group relative flex items-center"">
    <input type=""{Type}"" 
           id=""{Id}-input"" 
           name=""{inputName}"" 
           value=""{Value}"" 
           placeholder=""{Placeholder}"" 
           class=""panoptes-input w-full pl-3 pr-8 py-2 border border-slate-300 rounded-lg text-sm text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition shadow-sm {(Disabled ? "bg-slate-100 cursor-not-allowed text-slate-400" : "")}""
           {(Disabled ? "disabled" : "")} 
           {(Readonly ? "readonly" : "")} />
    {(Clearable && !Disabled ? $@"<button type=""button"" class=""panoptes-textbox-clear absolute right-2.5 text-slate-400 hover:text-slate-600 focus:outline-none p-0.5 rounded-full hover:bg-slate-100 transition"" style=""{(string.IsNullOrWhiteSpace(Value) ? "display:none;" : "")}"" data-action=""clear-text""><svg class=""w-3.5 h-3.5"" fill=""none"" stroke=""currentColor"" viewBox=""0 0 24 24""><path stroke-linecap=""round"" stroke-linejoin=""round"" stroke-width=""2"" d=""M6 18L18 6M6 6l12 12"" /></svg></button>" : "")}
</div>
<script type=""application/json"" data-panoptes-textbox-config=""{Id}"">{configJson}</script>
<script>
  if (window.Panoptes && window.Panoptes.TextBox) {{
    window.Panoptes.TextBox.init('{Id}');
  }} else {{
    document.addEventListener('DOMContentLoaded', function() {{
      if (window.Panoptes && window.Panoptes.TextBox) {{
        window.Panoptes.TextBox.init('{Id}');
      }}
    }});
  }}
</script>");
    }
}
