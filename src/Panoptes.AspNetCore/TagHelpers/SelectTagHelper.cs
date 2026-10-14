using System.Text.Json;
using Microsoft.AspNetCore.Razor.TagHelpers;

namespace Panoptes.AspNetCore.TagHelpers;

[HtmlTargetElement("panoptes-select")]
public class SelectTagHelper : TagHelper
{
    [HtmlAttributeName("id")]
    public string Id { get; set; } = $"panoptes-select-{Guid.NewGuid():N}";

    [HtmlAttributeName("name")]
    public string? Name { get; set; }

    [HtmlAttributeName("value")]
    public string? Value { get; set; }

    [HtmlAttributeName("placeholder")]
    public string Placeholder { get; set; } = "Seçiniz...";

    [HtmlAttributeName("options")]
    public string? Options { get; set; } // Comma-separated, JSON array or object

    [HtmlAttributeName("url")]
    public string? Url { get; set; }

    [HtmlAttributeName("server-filtering")]
    public bool ServerFiltering { get; set; } = false;

    [HtmlAttributeName("min-filter-length")]
    public int MinFilterLength { get; set; } = 0;

    [HtmlAttributeName("searchable")]
    public bool Searchable { get; set; } = true;

    [HtmlAttributeName("filter")]
    public string Filter { get; set; } = "contains"; // contains, startswith, none

    [HtmlAttributeName("clearable")]
    public bool Clearable { get; set; } = true;

    [HtmlAttributeName("disabled")]
    public bool Disabled { get; set; } = false;

    [HtmlAttributeName("readonly")]
    public bool Readonly { get; set; } = false;

    [HtmlAttributeName("size")]
    public string Size { get; set; } = "md"; // sm, md, lg

    [HtmlAttributeName("rounded")]
    public string Rounded { get; set; } = "md"; // none, sm, md, lg, full

    [HtmlAttributeName("fill-mode")]
    public string FillMode { get; set; } = "outline"; // outline, solid, flat

    [HtmlAttributeName("group-by")]
    public string? GroupBy { get; set; }

    [HtmlAttributeName("header-template")]
    public string? HeaderTemplate { get; set; }

    [HtmlAttributeName("footer-template")]
    public string? FooterTemplate { get; set; }

    [HtmlAttributeName("item-template")]
    public string? ItemTemplate { get; set; }

    [HtmlAttributeName("value-template")]
    public string? ValueTemplate { get; set; }

    [HtmlAttributeName("no-data-template")]
    public string? NoDataTemplate { get; set; }

    [HtmlAttributeName("cascade-from")]
    public string? CascadeFrom { get; set; }

    [HtmlAttributeName("cascade-from-field")]
    public string? CascadeFromField { get; set; }

    [HtmlAttributeName("text-field")]
    public string DataTextField { get; set; } = "text";

    [HtmlAttributeName("value-field")]
    public string DataValueField { get; set; } = "value";

    [HtmlAttributeName("class")]
    public string? Class { get; set; }

    [HtmlAttributeName("on-change")]
    public string? OnChange { get; set; }

    [HtmlAttributeName("on-select")]
    public string? OnSelect { get; set; }

    [HtmlAttributeName("on-open")]
    public string? OnOpen { get; set; }

    [HtmlAttributeName("on-close")]
    public string? OnClose { get; set; }

    public override void Process(TagHelperContext context, TagHelperOutput output)
    {
        output.TagName = "div";
        output.TagMode = TagMode.StartTagAndEndTag;
        output.Attributes.SetAttribute("id", Id);
        output.Attributes.SetAttribute("class", $"panoptes-select-wrapper relative inline-block w-full {Class}".Trim());

        var inputName = Name ?? Id;
        var config = new
        {
            id = Id,
            name = inputName,
            value = Value,
            placeholder = Placeholder,
            options = Options,
            url = Url,
            serverFiltering = ServerFiltering,
            minFilterLength = MinFilterLength,
            searchable = Searchable,
            filter = Filter,
            clearable = Clearable,
            disabled = Disabled,
            @readonly = Readonly,
            size = Size,
            rounded = Rounded,
            fillMode = FillMode,
            groupBy = GroupBy,
            headerTemplate = HeaderTemplate,
            footerTemplate = FooterTemplate,
            itemTemplate = ItemTemplate,
            valueTemplate = ValueTemplate,
            noDataTemplate = NoDataTemplate,
            cascadeFrom = CascadeFrom,
            cascadeFromField = CascadeFromField,
            dataTextField = DataTextField,
            dataValueField = DataValueField,
            onChange = OnChange,
            onSelect = OnSelect,
            onOpen = OnOpen,
            onClose = OnClose
        };

        var configJson = JsonSerializer.Serialize(config);

        string sizePadding = Size switch
        {
            "sm" => "px-2.5 py-1.5 text-xs",
            "lg" => "px-4 py-2.5 text-base",
            _ => "px-3 py-2 text-sm"
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
<input type=""hidden"" id=""{Id}-value"" name=""{inputName}"" value=""{Value}"" />
<div tabindex=""0"" class=""panoptes-select-control relative flex items-center justify-between w-full {sizePadding} {roundedClass} {fillClass} cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition select-none {(Disabled ? "bg-slate-100 cursor-not-allowed opacity-60 pointer-events-none" : "text-slate-800")}"">
    <span class=""panoptes-select-display truncate font-normal text-slate-700"">{(!string.IsNullOrWhiteSpace(Value) ? Value : Placeholder)}</span>
    <div class=""flex items-center space-x-1 shrink-0 ml-2"">
        {(Clearable && !Disabled ? $@"<button type=""button"" class=""panoptes-select-clear text-slate-400 hover:text-slate-600 focus:outline-none p-0.5 rounded-full hover:bg-slate-100 transition"" style=""{(string.IsNullOrWhiteSpace(Value) ? "display:none;" : "")}""><svg class=""w-3.5 h-3.5"" fill=""none"" stroke=""currentColor"" viewBox=""0 0 24 24""><path stroke-linecap=""round"" stroke-linejoin=""round"" stroke-width=""2"" d=""M6 18L18 6M6 6l12 12"" /></svg></button>" : "")}
        <svg class=""w-4 h-4 text-slate-400 pointer-events-none transition duration-150 transform"" fill=""none"" stroke=""currentColor"" viewBox=""0 0 24 24"">
            <path stroke-linecap=""round"" stroke-linejoin=""round"" stroke-width=""2"" d=""M19 9l-7 7-7-7"" />
        </svg>
    </div>
</div>
<script type=""application/json"" data-panoptes-select-config=""{Id}"">{configJson}</script>
<script>
  if (window.Panoptes && window.Panoptes.Select) {{
    window.Panoptes.Select.init('{Id}');
  }} else {{
    document.addEventListener('DOMContentLoaded', function() {{
      if (window.Panoptes && window.Panoptes.Select) {{
        window.Panoptes.Select.init('{Id}');
      }}
    }});
  }}
</script>");
    }
}
