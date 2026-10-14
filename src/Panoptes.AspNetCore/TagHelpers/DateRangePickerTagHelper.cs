using System.Text.Json;
using Microsoft.AspNetCore.Razor.TagHelpers;

namespace Panoptes.AspNetCore.TagHelpers;

[HtmlTargetElement("panoptes-daterangepicker")]
public class DateRangePickerTagHelper : TagHelper
{
    [HtmlAttributeName("id")]
    public string Id { get; set; } = $"panoptes-daterangepicker-{Guid.NewGuid():N}";

    [HtmlAttributeName("start-name")]
    public string StartName { get; set; } = "StartDate";

    [HtmlAttributeName("end-name")]
    public string EndName { get; set; } = "EndDate";

    [HtmlAttributeName("start-date")]
    public string? StartDate { get; set; }

    [HtmlAttributeName("end-date")]
    public string? EndDate { get; set; }

    [HtmlAttributeName("format")]
    public string Format { get; set; } = "DD.MM.YYYY";

    [HtmlAttributeName("separator")]
    public string Separator { get; set; } = " - ";

    [HtmlAttributeName("placeholder")]
    public string Placeholder { get; set; } = "Tarih aralığı seçin...";

    [HtmlAttributeName("presets")]
    public bool Presets { get; set; } = true;

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
        output.Attributes.SetAttribute("class", $"panoptes-daterangepicker-wrapper relative inline-block w-full {Class}".Trim());

        var displayVal = (!string.IsNullOrWhiteSpace(StartDate) && !string.IsNullOrWhiteSpace(EndDate))
            ? $"{StartDate}{Separator}{EndDate}"
            : (StartDate ?? EndDate ?? "");

        var config = new
        {
            id = Id,
            startName = StartName,
            endName = EndName,
            startDate = StartDate,
            endDate = EndDate,
            format = Format,
            separator = Separator,
            presets = Presets,
            disabled = Disabled,
            onChange = OnChange
        };

        var configJson = JsonSerializer.Serialize(config);

        output.Content.SetHtmlContent($@"
<input type=""hidden"" id=""{Id}-start"" name=""{StartName}"" value=""{StartDate}"" />
<input type=""hidden"" id=""{Id}-end"" name=""{EndName}"" value=""{EndDate}"" />
<div class=""panoptes-input-group relative flex items-center"">
    <input type=""text"" 
           id=""{Id}-input"" 
           value=""{displayVal}"" 
           placeholder=""{Placeholder}"" 
           readonly
           class=""panoptes-input w-full pl-3 pr-10 py-2 border border-slate-300 rounded-lg text-sm text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition shadow-sm cursor-pointer {(Disabled ? "bg-slate-100 cursor-not-allowed text-slate-400" : "")}""
           {(Disabled ? "disabled" : "")} />
    <button type=""button"" 
            class=""panoptes-daterangepicker-toggle absolute right-2.5 text-slate-400 hover:text-blue-600 focus:outline-none transition"" 
            data-action=""toggle-rangepicker""
            {(Disabled ? "disabled" : "")}>
        <svg class=""w-4 h-4"" fill=""none"" stroke=""currentColor"" viewBox=""0 0 24 24"">
            <path stroke-linecap=""round"" stroke-linejoin=""round"" stroke-width=""2"" d=""M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"" />
        </svg>
    </button>
</div>
<script type=""application/json"" data-panoptes-daterangepicker-config=""{Id}"">{configJson}</script>
<script>
  if (window.Panoptes && window.Panoptes.DateRangePicker) {{
    window.Panoptes.DateRangePicker.init('{Id}');
  }} else {{
    document.addEventListener('DOMContentLoaded', function() {{
      if (window.Panoptes && window.Panoptes.DateRangePicker) {{
        window.Panoptes.DateRangePicker.init('{Id}');
      }}
    }});
  }}
</script>");
    }
}
