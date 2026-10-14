using System.Text.Json;
using Microsoft.AspNetCore.Razor.TagHelpers;

namespace Panoptes.AspNetCore.TagHelpers;

[HtmlTargetElement("panoptes-numerictextbox")]
public class NumericTextBoxTagHelper : TagHelper
{
    [HtmlAttributeName("id")]
    public string Id { get; set; } = $"panoptes-numeric-{Guid.NewGuid():N}";

    [HtmlAttributeName("name")]
    public string? Name { get; set; }

    [HtmlAttributeName("value")]
    public double? Value { get; set; }

    [HtmlAttributeName("min")]
    public double? Min { get; set; }

    [HtmlAttributeName("max")]
    public double? Max { get; set; }

    [HtmlAttributeName("step")]
    public double Step { get; set; } = 1;

    [HtmlAttributeName("format")]
    public string Format { get; set; } = "n2"; // "currency", "percent", "n0", "n2"

    [HtmlAttributeName("decimals")]
    public int Decimals { get; set; } = 2;

    [HtmlAttributeName("prefix")]
    public string? Prefix { get; set; }

    [HtmlAttributeName("suffix")]
    public string? Suffix { get; set; }

    [HtmlAttributeName("spinners")]
    public bool Spinners { get; set; } = true;

    [HtmlAttributeName("size")]
    public string Size { get; set; } = "md"; // sm, md, lg

    [HtmlAttributeName("rounded")]
    public string Rounded { get; set; } = "md"; // none, sm, md, lg, full

    [HtmlAttributeName("placeholder")]
    public string Placeholder { get; set; } = "0.00";

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
        output.Attributes.SetAttribute("class", $"panoptes-numeric-wrapper relative inline-block w-full {Class}".Trim());

        var inputName = Name ?? Id;
        var effectivePrefix = Prefix ?? (Format == "currency" ? "₺" : null);
        var effectiveSuffix = Suffix ?? (Format == "percent" ? "%" : null);

        var config = new
        {
            id = Id,
            name = inputName,
            value = Value,
            min = Min,
            max = Max,
            step = Step,
            format = Format,
            decimals = Decimals,
            prefix = effectivePrefix,
            suffix = effectiveSuffix,
            spinners = Spinners,
            size = Size,
            rounded = Rounded,
            placeholder = Placeholder,
            disabled = Disabled,
            readonlyMode = Readonly,
            onChange = OnChange
        };

        var configJson = JsonSerializer.Serialize(config);

        string sizePadding = Size switch
        {
            "sm" => $"{(effectivePrefix != null ? "pl-6" : "pl-2.5")} {(Spinners ? "pr-7" : "pr-2.5")} py-1 text-xs",
            "lg" => $"{(effectivePrefix != null ? "pl-9" : "pl-4")} {(Spinners ? "pr-10" : "pr-4")} py-2.5 text-base",
            _ => $"{(effectivePrefix != null ? "pl-7" : "pl-3")} {(Spinners ? "pr-8" : "pr-3")} py-2 text-sm"
        };

        string roundedClass = Rounded switch
        {
            "none" => "rounded-none",
            "sm" => "rounded-sm",
            "lg" => "rounded-xl",
            "full" => "rounded-full",
            _ => "rounded-lg"
        };

        output.Content.SetHtmlContent($@"
<div class=""panoptes-numeric-group relative flex items-center"">
    {(effectivePrefix != null ? $@"<span class=""absolute left-3 text-slate-400 font-bold text-xs pointer-events-none select-none"">{effectivePrefix}</span>" : "")}
    <input type=""text"" 
           id=""{Id}-display"" 
           class=""panoptes-numeric-input w-full {sizePadding} {roundedClass} border border-slate-300 text-slate-800 text-right font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition shadow-xs {(Disabled ? "bg-slate-100 cursor-not-allowed opacity-60" : "bg-white")}""
           placeholder=""{Placeholder}""
           {(Disabled ? "disabled" : "")} 
           {(Readonly ? "readonly" : "")} />
    {(effectiveSuffix != null ? $@"<span class=""absolute right-8 text-slate-400 font-bold text-xs pointer-events-none select-none"">{effectiveSuffix}</span>" : "")}
    <input type=""hidden"" 
           id=""{Id}-value"" 
           name=""{inputName}"" 
           value=""{Value}"" />
    {(Spinners && !Disabled && !Readonly ? $@"
    <div class=""panoptes-spin-buttons absolute right-1 top-1 bottom-1 flex flex-col justify-center border-l border-slate-200 pl-1"">
        <button type=""button"" 
                class=""panoptes-spin-up text-slate-400 hover:text-blue-600 focus:outline-none p-0.5 transition"" 
                data-action=""spin-up"">
            <svg class=""w-3 h-3"" fill=""none"" stroke=""currentColor"" viewBox=""0 0 24 24""><path stroke-linecap=""round"" stroke-linejoin=""round"" stroke-width=""2.5"" d=""M5 15l7-7 7 7"" /></svg>
        </button>
        <button type=""button"" 
                class=""panoptes-spin-down text-slate-400 hover:text-blue-600 focus:outline-none p-0.5 transition"" 
                data-action=""spin-down"">
            <svg class=""w-3 h-3"" fill=""none"" stroke=""currentColor"" viewBox=""0 0 24 24""><path stroke-linecap=""round"" stroke-linejoin=""round"" stroke-width=""2.5"" d=""M19 9l-7 7-7-7"" /></svg>
        </button>
    </div>" : "")}
</div>
<script type=""application/json"" data-panoptes-numeric-config=""{Id}"">{configJson}</script>
<script>
  if (window.Panoptes && window.Panoptes.NumericTextBox) {{
    window.Panoptes.NumericTextBox.init('{Id}');
  }} else {{
    document.addEventListener('DOMContentLoaded', function() {{
      if (window.Panoptes && window.Panoptes.NumericTextBox) {{
        window.Panoptes.NumericTextBox.init('{Id}');
      }}
    }});
  }}
</script>");
    }
}
