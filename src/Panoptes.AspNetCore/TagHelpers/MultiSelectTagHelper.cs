using System.Text.Json;
using Microsoft.AspNetCore.Razor.TagHelpers;

namespace Panoptes.AspNetCore.TagHelpers;

[HtmlTargetElement("panoptes-multiselect")]
public class MultiSelectTagHelper : TagHelper
{
    [HtmlAttributeName("id")]
    public string Id { get; set; } = $"panoptes-multiselect-{Guid.NewGuid():N}";

    [HtmlAttributeName("name")]
    public string? Name { get; set; }

    [HtmlAttributeName("values")]
    public string? Values { get; set; } // Comma-separated initial values

    [HtmlAttributeName("placeholder")]
    public string Placeholder { get; set; } = "Birden fazla seçin...";

    [HtmlAttributeName("options")]
    public string? Options { get; set; }

    [HtmlAttributeName("url")]
    public string? Url { get; set; }

    [HtmlAttributeName("tag-mode")]
    public string TagMode { get; set; } = "multiple"; // "multiple" or "single"

    [HtmlAttributeName("clearable")]
    public bool Clearable { get; set; } = true;

    [HtmlAttributeName("disabled")]
    public bool Disabled { get; set; } = false;

    [HtmlAttributeName("max-selected")]
    public int? MaxSelected { get; set; }

    [HtmlAttributeName("size")]
    public string Size { get; set; } = "md"; // sm, md, lg

    [HtmlAttributeName("rounded")]
    public string Rounded { get; set; } = "md"; // none, sm, md, lg, full

    [HtmlAttributeName("group-by")]
    public string? GroupBy { get; set; }

    [HtmlAttributeName("text-field")]
    public string TextField { get; set; } = "text";

    [HtmlAttributeName("value-field")]
    public string ValueField { get; set; } = "value";

    [HtmlAttributeName("class")]
    public string? Class { get; set; }

    [HtmlAttributeName("on-change")]
    public string? OnChange { get; set; }

    public override void Process(TagHelperContext context, TagHelperOutput output)
    {
        output.TagName = "div";
        output.TagMode = Microsoft.AspNetCore.Razor.TagHelpers.TagMode.StartTagAndEndTag;
        output.Attributes.SetAttribute("id", Id);
        output.Attributes.SetAttribute("class", $"panoptes-multiselect-wrapper relative inline-block w-full {Class}".Trim());

        var inputName = Name ?? Id;
        var config = new
        {
            id = Id,
            name = inputName,
            values = Values,
            placeholder = Placeholder,
            options = Options,
            url = Url,
            tagMode = TagMode,
            clearable = Clearable,
            disabled = Disabled,
            maxSelected = MaxSelected,
            size = Size,
            rounded = Rounded,
            groupBy = GroupBy,
            dataTextField = TextField,
            dataValueField = ValueField,
            onChange = OnChange
        };

        var configJson = JsonSerializer.Serialize(config);

        string roundedClass = Rounded switch
        {
            "none" => "rounded-none",
            "sm" => "rounded-sm",
            "lg" => "rounded-xl",
            "full" => "rounded-full",
            _ => "rounded-lg"
        };

        string sizeMinH = Size switch
        {
            "sm" => "min-h-[32px] text-xs py-1 px-2",
            "lg" => "min-h-[46px] text-base py-2 px-3.5",
            _ => "min-h-[40px] text-sm py-1.5 px-2.5"
        };

        output.Content.SetHtmlContent($@"
<input type=""hidden"" id=""{Id}-values"" name=""{inputName}"" value=""{Values}"" />
<div class=""panoptes-multiselect-control relative flex flex-wrap items-center gap-1.5 {sizeMinH} {roundedClass} border border-slate-300 bg-white cursor-pointer hover:border-slate-400 focus-within:ring-2 focus-within:ring-blue-500/20 focus-within:border-blue-500 shadow-xs transition {(Disabled ? "bg-slate-100 cursor-not-allowed opacity-60 pointer-events-none" : "")}"">
    <div class=""panoptes-multiselect-chips flex flex-wrap items-center gap-1.5""></div>
    <input type=""text"" 
           class=""panoptes-multiselect-input border-0 p-0 text-inherit focus:outline-none focus:ring-0 flex-1 min-w-[70px] bg-transparent text-slate-800 placeholder-slate-400"" 
           placeholder=""{Placeholder}"" 
           autocomplete=""off""
           {(Disabled ? "disabled" : "")} />
    <div class=""flex items-center gap-1 shrink-0 ml-auto"">
        {(Clearable && !Disabled ? $@"<button type=""button"" class=""panoptes-multiselect-clear text-slate-400 hover:text-slate-600 focus:outline-none p-0.5 rounded-full hover:bg-slate-100 transition"" style=""display:none;""><svg class=""w-3.5 h-3.5"" fill=""none"" stroke=""currentColor"" viewBox=""0 0 24 24""><path stroke-linecap=""round"" stroke-linejoin=""round"" stroke-width=""2"" d=""M6 18L18 6M6 6l12 12"" /></svg></button>" : "")}
        <svg class=""w-4 h-4 text-slate-400 pointer-events-none transition duration-150 transform"" fill=""none"" stroke=""currentColor"" viewBox=""0 0 24 24"">
            <path stroke-linecap=""round"" stroke-linejoin=""round"" stroke-width=""2"" d=""M19 9l-7 7-7-7"" />
        </svg>
    </div>
</div>
<script type=""application/json"" data-panoptes-multiselect-config=""{Id}"">{configJson}</script>
<script>
  if (window.Panoptes && window.Panoptes.MultiSelect) {{
    window.Panoptes.MultiSelect.init('{Id}');
  }} else {{
    document.addEventListener('DOMContentLoaded', function() {{
      if (window.Panoptes && window.Panoptes.MultiSelect) {{
        window.Panoptes.MultiSelect.init('{Id}');
      }}
    }});
  }}
</script>");
    }
}
