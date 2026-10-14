using System.Text.Json;
using Microsoft.AspNetCore.Razor.TagHelpers;

namespace Panoptes.AspNetCore.TagHelpers;

[HtmlTargetElement("panoptes-datetimepicker")]
public class DateTimePickerTagHelper : TagHelper
{
    [HtmlAttributeName("id")]
    public string Id { get; set; } = $"panoptes-datetimepicker-{Guid.NewGuid():N}";

    [HtmlAttributeName("name")]
    public string? Name { get; set; }

    [HtmlAttributeName("value")]
    public string? Value { get; set; }

    [HtmlAttributeName("format")]
    public string Format { get; set; } = "DD.MM.YYYY HH:mm";

    [HtmlAttributeName("placeholder")]
    public string Placeholder { get; set; } = "Tarih ve saat seçin...";

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
        output.Attributes.SetAttribute("class", $"panoptes-datetimepicker-wrapper relative inline-block w-full {Class}".Trim());

        var inputName = Name ?? Id;
        var config = new
        {
            id = Id,
            name = inputName,
            value = Value,
            format = Format,
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
<div class=""panoptes-input-group relative flex items-center"">
    <input type=""text"" 
           id=""{Id}-input"" 
           name=""{inputName}"" 
           value=""{Value}"" 
           placeholder=""{Placeholder}"" 
           class=""panoptes-input w-full pl-3 pr-10 py-2 border border-slate-300 rounded-lg text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition shadow-sm {stateClass}"" 
           {disabledAttr} 
           {readonlyAttr} />
    <button type=""button"" 
            class=""panoptes-datetimepicker-toggle absolute right-2.5 text-slate-400 hover:text-blue-600 focus:outline-none transition"" 
            data-action=""toggle-datetime"" 
            {disabledAttr}>
        <svg class=""w-4 h-4"" fill=""none"" stroke=""currentColor"" viewBox=""0 0 24 24"">
            <path stroke-linecap=""round"" stroke-linejoin=""round"" stroke-width=""2"" d=""M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"" />
        </svg>
    </button>
</div>
<script type=""application/json"" data-panoptes-datetimepicker-config=""{Id}"">{configJson}</script>
<script>
  if (window.Panoptes && window.Panoptes.DateTimePicker) {{
    window.Panoptes.DateTimePicker.init('{Id}');
  }} else {{
    document.addEventListener('DOMContentLoaded', function() {{
      if (window.Panoptes && window.Panoptes.DateTimePicker) {{
        window.Panoptes.DateTimePicker.init('{Id}');
      }}
    }});
  }}
</script>");
    }
}
