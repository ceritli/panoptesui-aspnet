using System.Text.Json;
using Microsoft.AspNetCore.Razor.TagHelpers;

namespace Panoptes.AspNetCore.TagHelpers;

[HtmlTargetElement("panoptes-datepicker")]
public class DatePickerTagHelper : TagHelper
{
    [HtmlAttributeName("id")]
    public string Id { get; set; } = $"panoptes-datepicker-{Guid.NewGuid():N}";

    [HtmlAttributeName("name")]
    public string? Name { get; set; }

    [HtmlAttributeName("value")]
    public string? Value { get; set; }

    [HtmlAttributeName("format")]
    public string Format { get; set; } = "DD.MM.YYYY";

    [HtmlAttributeName("min")]
    public string? Min { get; set; }

    [HtmlAttributeName("max")]
    public string? Max { get; set; }

    [HtmlAttributeName("disable-dates")]
    public string? DisableDates { get; set; } // "weekend", comma-separated dates or JS function name

    [HtmlAttributeName("week-number")]
    public bool WeekNumber { get; set; } = false;

    [HtmlAttributeName("size")]
    public string Size { get; set; } = "md"; // sm, md, lg

    [HtmlAttributeName("rounded")]
    public string Rounded { get; set; } = "md"; // none, sm, md, lg, full

    [HtmlAttributeName("fill-mode")]
    public string FillMode { get; set; } = "outline"; // outline, solid, flat

    [HtmlAttributeName("clearable")]
    public bool Clearable { get; set; } = true;

    [HtmlAttributeName("placeholder")]
    public string Placeholder { get; set; } = "GG.AA.YYYY";

    [HtmlAttributeName("disabled")]
    public bool Disabled { get; set; } = false;

    [HtmlAttributeName("readonly")]
    public bool Readonly { get; set; } = false;

    [HtmlAttributeName("class")]
    public string? Class { get; set; }

    [HtmlAttributeName("on-change")]
    public string? OnChange { get; set; }

    [HtmlAttributeName("on-open")]
    public string? OnOpen { get; set; }

    [HtmlAttributeName("on-close")]
    public string? OnClose { get; set; }

    public override void Process(TagHelperContext context, TagHelperOutput output)
    {
        output.TagName = "div";
        output.TagMode = TagMode.StartTagAndEndTag;
        output.Attributes.SetAttribute("id", Id);
        output.Attributes.SetAttribute("class", $"panoptes-datepicker-wrapper relative inline-block w-full {Class}".Trim());

        var inputName = Name ?? Id;
        var config = new
        {
            id = Id,
            name = inputName,
            value = Value,
            format = Format,
            min = Min,
            max = Max,
            disableDates = DisableDates,
            weekNumber = WeekNumber,
            size = Size,
            rounded = Rounded,
            fillMode = FillMode,
            clearable = Clearable,
            placeholder = Placeholder,
            disabled = Disabled,
            readonlyMode = Readonly,
            onChange = OnChange,
            onOpen = OnOpen,
            onClose = OnClose
        };

        var configJson = JsonSerializer.Serialize(config);

        string sizePadding = Size switch
        {
            "sm" => "pl-2.5 pr-8 py-1.5 text-xs",
            "lg" => "pl-4 pr-11 py-2.5 text-base",
            _ => "pl-3 pr-10 py-2 text-sm"
        };

        string roundedClass = Rounded switch
        {
            "none" => "rounded-none",
            "sm" => "rounded-sm",
            "lg" => "rounded-xl",
            "full" => "rounded-full",
            _ => "rounded-lg"
        };

        string fillClass = FillMode switch
        {
            "solid" => "bg-slate-100 border border-transparent hover:bg-slate-200/80",
            "flat" => "bg-transparent border-b border-slate-300 hover:border-slate-500 rounded-none",
            _ => "bg-white border border-slate-300 hover:border-slate-400 shadow-xs"
        };

        output.Content.SetHtmlContent($@"
<div class=""panoptes-input-group relative flex items-center"">
    <input type=""text"" 
           id=""{Id}-input"" 
           name=""{inputName}"" 
           value=""{Value}"" 
           placeholder=""{Placeholder}"" 
           class=""panoptes-input w-full {sizePadding} {roundedClass} {fillClass} text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition {(Disabled ? "bg-slate-100 cursor-not-allowed opacity-60" : "")}""
           {(Disabled ? "disabled" : "")} 
           {(Readonly ? "readonly" : "")} />
    <div class=""absolute right-2.5 flex items-center gap-1"">
        {(Clearable && !Disabled ? $@"<button type=""button"" class=""panoptes-datepicker-clear text-slate-400 hover:text-slate-600 focus:outline-none p-0.5 rounded-full hover:bg-slate-100 transition"" style=""{(string.IsNullOrWhiteSpace(Value) ? "display:none;" : "")}""><svg class=""w-3.5 h-3.5"" fill=""none"" stroke=""currentColor"" viewBox=""0 0 24 24""><path stroke-linecap=""round"" stroke-linejoin=""round"" stroke-width=""2"" d=""M6 18L18 6M6 6l12 12"" /></svg></button>" : "")}
        <button type=""button"" 
                class=""panoptes-datepicker-toggle text-slate-400 hover:text-blue-600 focus:outline-none transition p-0.5"" 
                data-action=""toggle-calendar""
                {(Disabled ? "disabled" : "")}>
            <svg class=""w-4 h-4"" fill=""none"" stroke=""currentColor"" viewBox=""0 0 24 24"">
                <path stroke-linecap=""round"" stroke-linejoin=""round"" stroke-width=""2"" d=""M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"" />
            </svg>
        </button>
    </div>
</div>
<script type=""application/json"" data-panoptes-datepicker-config=""{Id}"">{configJson}</script>
<script>
  if (window.Panoptes && window.Panoptes.DatePicker) {{
    window.Panoptes.DatePicker.init('{Id}');
  }} else {{
    document.addEventListener('DOMContentLoaded', function() {{
      if (window.Panoptes && window.Panoptes.DatePicker) {{
        window.Panoptes.DatePicker.init('{Id}');
      }}
    }});
  }}
</script>");
    }
}
