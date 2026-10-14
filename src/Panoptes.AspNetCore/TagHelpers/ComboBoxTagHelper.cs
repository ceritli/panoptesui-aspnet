using System.Text.Json;
using Microsoft.AspNetCore.Razor.TagHelpers;

namespace Panoptes.AspNetCore.TagHelpers;

[HtmlTargetElement("panoptes-combobox")]
public class ComboBoxTagHelper : TagHelper
{
    [HtmlAttributeName("id")]
    public string Id { get; set; } = $"panoptes-combobox-{Guid.NewGuid():N}";

    [HtmlAttributeName("name")]
    public string? Name { get; set; }

    [HtmlAttributeName("value")]
    public string? Value { get; set; }

    [HtmlAttributeName("placeholder")]
    public string Placeholder { get; set; } = "Seçin veya yazın...";

    [HtmlAttributeName("options")]
    public string? Options { get; set; }

    [HtmlAttributeName("url")]
    public string? Url { get; set; }

    [HtmlAttributeName("server-filtering")]
    public bool ServerFiltering { get; set; } = false;

    [HtmlAttributeName("min-filter-length")]
    public int MinFilterLength { get; set; } = 0;

    [HtmlAttributeName("suggest")]
    public bool Suggest { get; set; } = true;

    [HtmlAttributeName("filter")]
    public string Filter { get; set; } = "contains"; // contains, startswith

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

    [HtmlAttributeName("group-by")]
    public string? GroupBy { get; set; }

    [HtmlAttributeName("cascade-from")]
    public string? CascadeFrom { get; set; }

    [HtmlAttributeName("cascade-from-field")]
    public string? CascadeFromField { get; set; }

    [HtmlAttributeName("item-template")]
    public string? ItemTemplate { get; set; }

    [HtmlAttributeName("header-template")]
    public string? HeaderTemplate { get; set; }

    [HtmlAttributeName("footer-template")]
    public string? FooterTemplate { get; set; }

    [HtmlAttributeName("no-data-template")]
    public string? NoDataTemplate { get; set; }

    [HtmlAttributeName("text-field")]
    public string TextField { get; set; } = "text";

    [HtmlAttributeName("value-field")]
    public string ValueField { get; set; } = "value";

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
        output.Attributes.SetAttribute("class", $"panoptes-combobox-wrapper relative inline-block w-full {Class}".Trim());

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
            suggest = Suggest,
            filter = Filter,
            clearable = Clearable,
            disabled = Disabled,
            @readonly = Readonly,
            size = Size,
            rounded = Rounded,
            groupBy = GroupBy,
            cascadeFrom = CascadeFrom,
            cascadeFromField = CascadeFromField,
            itemTemplate = ItemTemplate,
            headerTemplate = HeaderTemplate,
            footerTemplate = FooterTemplate,
            noDataTemplate = NoDataTemplate,
            dataTextField = TextField,
            dataValueField = ValueField,
            onChange = OnChange,
            onSelect = OnSelect,
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

        string stateClass = Disabled ? "bg-slate-100 cursor-not-allowed opacity-60" : (Readonly ? "bg-slate-50 cursor-default" : "bg-white text-slate-800");
        string disabledAttr = Disabled ? "disabled" : "";
        string readonlyAttr = Readonly ? "readonly" : "";
        string clearStyle = string.IsNullOrWhiteSpace(Value) ? "display:none;" : "";
        string clearBtnHtml = "";
        if (Clearable && !Disabled && !Readonly)
        {
            clearBtnHtml = $"<button type=\"button\" class=\"panoptes-combobox-clear text-slate-400 hover:text-slate-600 focus:outline-none p-0.5 rounded-full hover:bg-slate-100 transition\" style=\"{clearStyle}\" data-action=\"clear-combobox\"><svg class=\"w-3.5 h-3.5\" fill=\"none\" stroke=\"currentColor\" viewBox=\"0 0 24 24\"><path stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"2\" d=\"M6 18L18 6M6 6l12 12\" /></svg></button>";
        }

        output.Content.SetHtmlContent($@"
<div class=""panoptes-combobox-group relative flex items-center"">
    <input type=""text"" 
           id=""{Id}-input"" 
           name=""{inputName}"" 
           value=""{Value}"" 
           placeholder=""{Placeholder}"" 
           autocomplete=""off""
           class=""panoptes-combobox-input w-full {sizePadding} {roundedClass} border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition shadow-xs {stateClass}""
           {disabledAttr} 
           {readonlyAttr} />
    <div class=""absolute right-2 flex items-center gap-1"">
        {clearBtnHtml}
        <button type=""button"" 
                class=""panoptes-combobox-toggle text-slate-400 hover:text-blue-600 focus:outline-none p-1 transition"" 
                data-action=""toggle-combobox""
                {disabledAttr}>
            <svg class=""w-4 h-4"" fill=""none"" stroke=""currentColor"" viewBox=""0 0 24 24"">
                <path stroke-linecap=""round"" stroke-linejoin=""round"" stroke-width=""2"" d=""M19 9l-7 7-7-7"" />
            </svg>
        </button>
    </div>
</div>
<script type=""application/json"" data-panoptes-combobox-config=""{Id}"">{configJson}</script>
<script>
  if (window.Panoptes && window.Panoptes.ComboBox) {{
    window.Panoptes.ComboBox.init('{Id}');
  }} else {{
    document.addEventListener('DOMContentLoaded', function() {{
      if (window.Panoptes && window.Panoptes.ComboBox) {{
        window.Panoptes.ComboBox.init('{Id}');
      }}
    }});
  }}
</script>");
    }
}
