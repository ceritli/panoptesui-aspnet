using System;
using System.Collections.Generic;
using System.Text.Json;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Razor.TagHelpers;
using Panoptes.AspNetCore.Models;

namespace Panoptes.AspNetCore.TagHelpers;

[HtmlTargetElement("panoptes-multicolumncombobox")]
[HtmlTargetElement("panoptes-mccb")]
public class MultiColumnComboBoxTagHelper : TagHelper
{
    [HtmlAttributeName("id")]
    public string Id { get; set; } = $"panoptes-mccb-{Guid.NewGuid():N}";

    [HtmlAttributeName("name")]
    public string? Name { get; set; }

    [HtmlAttributeName("value")]
    public string? Value { get; set; }

    [HtmlAttributeName("text")]
    public string? Text { get; set; }

    [HtmlAttributeName("placeholder")]
    public string Placeholder { get; set; } = "Seçin veya arayın...";

    [HtmlAttributeName("data")]
    public object? Data { get; set; }

    [HtmlAttributeName("options")]
    public string? Options { get; set; }

    [HtmlAttributeName("url")]
    public string? Url { get; set; }

    [HtmlAttributeName("text-field")]
    public string TextField { get; set; } = "text";

    [HtmlAttributeName("value-field")]
    public string ValueField { get; set; } = "value";

    [HtmlAttributeName("columns")]
    public string? Columns { get; set; }

    [HtmlAttributeName("filter-fields")]
    public string? FilterFields { get; set; }

    [HtmlAttributeName("filter")]
    public string Filter { get; set; } = "contains"; // contains, startswith

    [HtmlAttributeName("min-filter-length")]
    public int MinFilterLength { get; set; } = 0;

    [HtmlAttributeName("clearable")]
    public bool Clearable { get; set; } = true;

    [HtmlAttributeName("disabled")]
    public bool Disabled { get; set; } = false;

    [HtmlAttributeName("readonly")]
    public bool Readonly { get; set; } = false;

    [HtmlAttributeName("dropdown-width")]
    public string DropdownWidth { get; set; } = "560px";

    [HtmlAttributeName("dropdown-height")]
    public string DropdownHeight { get; set; } = "320px";

    [HtmlAttributeName("size")]
    public string Size { get; set; } = "md"; // sm, md, lg

    [HtmlAttributeName("rounded")]
    public string Rounded { get; set; } = "lg"; // none, sm, md, lg, full

    [HtmlAttributeName("header-template")]
    public string? HeaderTemplate { get; set; }

    [HtmlAttributeName("footer-template")]
    public string? FooterTemplate { get; set; }

    [HtmlAttributeName("no-data-template")]
    public string? NoDataTemplate { get; set; }

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

    public override async Task ProcessAsync(TagHelperContext context, TagHelperOutput output)
    {
        var mccbContext = new MultiColumnComboBoxContext();
        context.Items[typeof(MultiColumnComboBoxContext)] = mccbContext;

        await output.GetChildContentAsync();

        output.TagName = "div";
        output.TagMode = TagMode.StartTagAndEndTag;
        output.Attributes.SetAttribute("id", Id);

        // Styling based on size and rounded
        var sizeClasses = Size switch
        {
            "sm" => "py-1.5 text-xs",
            "lg" => "py-2.5 text-base",
            _ => "py-2 text-sm"
        };

        var roundedClasses = Rounded switch
        {
            "none" => "rounded-none",
            "sm" => "rounded-sm",
            "md" => "rounded-md",
            "full" => "rounded-full",
            _ => "rounded-lg"
        };

        output.Attributes.SetAttribute("class", $"panoptes-mccb-wrapper relative inline-block w-full {Class}".Trim());

        // Parse options from Data if provided
        var optionsData = Options;
        if (Data != null && string.IsNullOrWhiteSpace(optionsData))
        {
            optionsData = JsonSerializer.Serialize(Data);
        }

        // Columns resolution: check child columns first, then columns attribute
        var columnsList = new List<MultiColumnComboBoxColumn>();
        if (mccbContext.Columns.Count > 0)
        {
            columnsList.AddRange(mccbContext.Columns);
        }
        else if (!string.IsNullOrWhiteSpace(Columns))
        {
            try
            {
                var parsed = JsonSerializer.Deserialize<List<MultiColumnComboBoxColumn>>(Columns, new JsonSerializerOptions { PropertyNameCaseInsensitive = true });
                if (parsed != null) columnsList.AddRange(parsed);
            }
            catch
            {
                // Fallback: columns might be handled on JS side
            }
        }

        var config = new
        {
            id = Id,
            name = Name ?? Id,
            value = Value,
            text = Text,
            placeholder = Placeholder,
            options = optionsData,
            url = Url,
            dataTextField = TextField,
            dataValueField = ValueField,
            columns = columnsList.Count > 0 ? (object)columnsList : Columns,
            filterFields = FilterFields,
            filter = Filter,
            minFilterLength = MinFilterLength,
            clearable = Clearable,
            disabled = Disabled,
            readonlyMode = Readonly,
            dropdownWidth = DropdownWidth,
            dropdownHeight = DropdownHeight,
            headerTemplate = HeaderTemplate,
            footerTemplate = FooterTemplate,
            noDataTemplate = NoDataTemplate,
            onChange = OnChange,
            onSelect = OnSelect,
            onOpen = OnOpen,
            onClose = OnClose
        };

        var configJson = JsonSerializer.Serialize(config);

        output.Content.SetHtmlContent($@"
<input type=""hidden"" id=""{Id}-value"" name=""{Name ?? Id}"" value=""{Value ?? ""}"" />
<div class=""panoptes-input-group relative flex items-center"">
    <input type=""text"" 
           id=""{Id}-input"" 
           value=""{Text ?? ""}"" 
           placeholder=""{Placeholder}"" 
           autocomplete=""off""
           class=""panoptes-input w-full pl-3 pr-16 {sizeClasses} {roundedClasses} border border-slate-300 text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition shadow-sm {(Disabled ? "bg-slate-100 cursor-not-allowed text-slate-400" : "")} {(Readonly ? "bg-slate-50 cursor-default" : "")}""
           {(Disabled ? "disabled" : "")} 
           {(Readonly ? "readonly" : "")} />
    <div class=""absolute right-2 flex items-center gap-1"">
        <button type=""button"" 
                class=""panoptes-mccb-clear p-1 text-slate-400 hover:text-rose-500 rounded focus:outline-none transition {(string.IsNullOrEmpty(Text) || !Clearable ? "hidden" : "")}"" 
                data-action=""clear-mccb""
                title=""Temizle"">
            <svg class=""w-3.5 h-3.5"" fill=""none"" stroke=""currentColor"" viewBox=""0 0 24 24"">
                <path stroke-linecap=""round"" stroke-linejoin=""round"" stroke-width=""2"" d=""M6 18L18 6M6 6l12 12"" />
            </svg>
        </button>
        <button type=""button"" 
                class=""panoptes-mccb-toggle p-1 text-slate-400 hover:text-slate-600 focus:outline-none transition rounded"" 
                data-action=""toggle-mccb""
                {(Disabled ? "disabled" : "")}
                title=""Aç / Kapat"">
            <svg class=""w-4 h-4 transition-transform duration-200"" fill=""none"" stroke=""currentColor"" viewBox=""0 0 24 24"">
                <path stroke-linecap=""round"" stroke-linejoin=""round"" stroke-width=""2"" d=""M19 9l-7 7-7-7"" />
            </svg>
        </button>
    </div>
</div>
<script type=""application/json"" data-panoptes-mccb-config=""{Id}"">{configJson}</script>
<script>
  if (window.Panoptes && window.Panoptes.MultiColumnComboBox) {{
    window.Panoptes.MultiColumnComboBox.init('{Id}');
  }} else {{
    document.addEventListener('DOMContentLoaded', function() {{
      if (window.Panoptes && window.Panoptes.MultiColumnComboBox) {{
        window.Panoptes.MultiColumnComboBox.init('{Id}');
      }}
    }});
  }}
</script>
");
    }
}
