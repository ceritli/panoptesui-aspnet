using System.Text.Json;
using Microsoft.AspNetCore.Razor.TagHelpers;

namespace Panoptes.AspNetCore.TagHelpers;

[HtmlTargetElement("panoptes-autocomplete")]
public class AutoCompleteTagHelper : TagHelper
{
    [HtmlAttributeName("id")]
    public string Id { get; set; } = $"panoptes-autocomplete-{Guid.NewGuid():N}";

    [HtmlAttributeName("name")]
    public string? Name { get; set; }

    [HtmlAttributeName("value")]
    public string? Value { get; set; }

    [HtmlAttributeName("options")]
    public string? Options { get; set; }

    [HtmlAttributeName("url")]
    public string? Url { get; set; }

    [HtmlAttributeName("server-filtering")]
    public bool ServerFiltering { get; set; } = false;

    [HtmlAttributeName("placeholder")]
    public string Placeholder { get; set; } = "Yazmaya başlayın...";

    [HtmlAttributeName("min-length")]
    public int MinLength { get; set; } = 1;

    [HtmlAttributeName("filter")]
    public string Filter { get; set; } = "startswith"; // startswith, contains

    [HtmlAttributeName("separator")]
    public string? Separator { get; set; }

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

    [HtmlAttributeName("item-template")]
    public string? ItemTemplate { get; set; }

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
        output.Attributes.SetAttribute("class", $"panoptes-autocomplete-wrapper relative inline-block w-full {Class}".Trim());

        var inputName = Name ?? Id;
        var config = new
        {
            id = Id,
            name = inputName,
            value = Value,
            options = Options,
            dataUrl = Url,
            serverFiltering = ServerFiltering,
            minLength = MinLength,
            filter = Filter,
            separator = Separator,
            placeholder = Placeholder,
            clearable = Clearable,
            disabled = Disabled,
            @readonly = Readonly,
            size = Size,
            rounded = Rounded,
            itemTemplate = ItemTemplate,
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
            _ => "pl-3 pr-8 py-2 text-sm"
        };

        string roundedClass = Rounded switch
        {
            "none" => "rounded-none",
            "sm" => "rounded-sm",
            "lg" => "rounded-xl",
            "full" => "rounded-full",
            _ => "rounded-lg"
        };

        var disabledAttr = Disabled ? "disabled" : "";
        var readonlyAttr = Readonly ? "readonly" : "";
        var stateClass = Disabled ? "bg-slate-100 cursor-not-allowed text-slate-400 opacity-60" : (Readonly ? "bg-slate-50 cursor-default" : "bg-white text-slate-800");
        var clearBtnHidden = string.IsNullOrEmpty(Value) ? "hidden" : "";
        var clearBtnHtml = "";
        if (Clearable && !Disabled && !Readonly)
        {
            clearBtnHtml = $"<button type=\"button\" id=\"{Id}-clear\" class=\"panoptes-autocomplete-clear absolute right-2.5 text-slate-400 hover:text-slate-600 focus:outline-none transition {clearBtnHidden}\" data-action=\"clear-input\"><svg class=\"w-4 h-4\" fill=\"none\" stroke=\"currentColor\" viewBox=\"0 0 24 24\"><path stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"2\" d=\"M6 18L18 6M6 6l12 12\" /></svg></button>";
        }

        output.Content.SetHtmlContent($@"
<div class=""panoptes-input-group relative flex items-center"">
    <input type=""text"" 
           id=""{Id}-input"" 
           name=""{inputName}"" 
           value=""{Value}"" 
           placeholder=""{Placeholder}"" 
           autocomplete=""off"" 
           class=""panoptes-autocomplete-input w-full {sizePadding} {roundedClass} border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition shadow-xs {stateClass}"" 
           {disabledAttr}
           {readonlyAttr} />
    {clearBtnHtml}
</div>
<script type=""application/json"" data-panoptes-autocomplete-config=""{Id}"">{configJson}</script>
<script>
  if (window.Panoptes && window.Panoptes.AutoComplete) {{
    window.Panoptes.AutoComplete.init('{Id}');
  }} else {{
    document.addEventListener('DOMContentLoaded', function() {{
      if (window.Panoptes && window.Panoptes.AutoComplete) {{
        window.Panoptes.AutoComplete.init('{Id}');
      }}
    }});
  }}
</script>");
    }
}
