using System;
using System.Collections.Generic;
using System.Text.Json;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Razor.TagHelpers;
using Panoptes.AspNetCore.Models;

namespace Panoptes.AspNetCore.TagHelpers;

/// <summary>
/// Panoptes DropDownTree bileşeni, kurumsal düzeyde hiyerarşik ağaç yapılı açılır seçim bileşeni.
/// </summary>
[HtmlTargetElement("panoptes-dropdowntree")]
[HtmlTargetElement("panoptes-ddt")]
public class DropDownTreeTagHelper : TagHelper
{
    [HtmlAttributeName("id")]
    public string Id { get; set; } = $"panoptes-ddt-{Guid.NewGuid():N}";

    [HtmlAttributeName("name")]
    public string? Name { get; set; }

    [HtmlAttributeName("value")]
    public string? Value { get; set; }

    [HtmlAttributeName("text")]
    public string? Text { get; set; }

    [HtmlAttributeName("placeholder")]
    public string Placeholder { get; set; } = "Seçiniz...";

    [HtmlAttributeName("items")]
    public IEnumerable<DropDownTreeItemModel>? Items { get; set; }

    [HtmlAttributeName("data")]
    public object? Data { get; set; }

    [HtmlAttributeName("url")]
    public string? Url { get; set; }

    [HtmlAttributeName("text-field")]
    public string TextField { get; set; } = "text";

    [HtmlAttributeName("value-field")]
    public string ValueField { get; set; } = "value";

    [HtmlAttributeName("checkboxes")]
    public bool Checkboxes { get; set; } = false;

    [HtmlAttributeName("check-children")]
    public bool CheckChildren { get; set; } = true;

    [HtmlAttributeName("auto-close")]
    public bool? AutoClose { get; set; }

    [HtmlAttributeName("filter")]
    public string? Filter { get; set; } // contains, startswith

    [HtmlAttributeName("filter-placeholder")]
    public string FilterPlaceholder { get; set; } = "Ağaçta ara...";

    [HtmlAttributeName("clearable")]
    public bool Clearable { get; set; } = true;

    [HtmlAttributeName("disabled")]
    public bool Disabled { get; set; } = false;

    [HtmlAttributeName("readonly")]
    public bool Readonly { get; set; } = false;

    [HtmlAttributeName("size")]
    public string Size { get; set; } = "md"; // sm, md, lg

    [HtmlAttributeName("rounded")]
    public string Rounded { get; set; } = "lg"; // none, sm, md, lg, full

    [HtmlAttributeName("fill-mode")]
    public string FillMode { get; set; } = "outline"; // outline, solid, flat

    [HtmlAttributeName("floating-label")]
    public string? FloatingLabel { get; set; }

    [HtmlAttributeName("adaptive-mode")]
    public string? AdaptiveMode { get; set; } // auto, none

    [HtmlAttributeName("dropdown-width")]
    public string DropdownWidth { get; set; } = "360px";

    [HtmlAttributeName("dropdown-height")]
    public string DropdownHeight { get; set; } = "320px";

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

    [HtmlAttributeName("dir")]
    public string? Dir { get; set; } // ltr, rtl

    [HtmlAttributeName("class")]
    public string? Class { get; set; }

    [HtmlAttributeName("on-change")]
    public string? OnChange { get; set; }

    [HtmlAttributeName("on-select")]
    public string? OnSelect { get; set; }

    [HtmlAttributeName("on-check")]
    public string? OnCheck { get; set; }

    [HtmlAttributeName("on-open")]
    public string? OnOpen { get; set; }

    [HtmlAttributeName("on-close")]
    public string? OnClose { get; set; }

    [HtmlAttributeName("on-data-bound")]
    public string? OnDataBound { get; set; }

    [HtmlAttributeName("on-filtering")]
    public string? OnFiltering { get; set; }

    public override async Task ProcessAsync(TagHelperContext context, TagHelperOutput output)
    {
        var ddtContext = new DropDownTreeContext { Id = Id };
        context.Items[typeof(DropDownTreeContext)] = ddtContext;

        var parentStack = new Stack<List<DropDownTreeItemModel>>();
        parentStack.Push(ddtContext.Items);
        context.Items["PanoptesDropDownTreeParentStack"] = parentStack;

        // Çocuk bildirimsel tag'leri çalıştır
        await output.GetChildContentAsync();

        // Eğer items parametresinden veri geldiyse bağlama ekle
        if (Items != null)
        {
            ddtContext.Items.AddRange(Items);
        }

        output.TagName = "div";
        output.TagMode = TagMode.StartTagAndEndTag;
        output.Attributes.SetAttribute("id", Id);

        // Styling based on size
        var sizeClasses = Size switch
        {
            "sm" => "py-1 px-2.5 text-xs min-h-[32px]",
            "lg" => "py-2.5 px-4 text-base min-h-[46px]",
            _ => "py-2 px-3 text-sm min-h-[38px]"
        };

        // Styling based on rounded
        var roundedClasses = Rounded switch
        {
            "none" => "rounded-none",
            "sm" => "rounded-sm",
            "md" => "rounded-md",
            "full" => "rounded-full",
            _ => "rounded-xl"
        };

        // Styling based on fill-mode
        var fillModeClasses = FillMode switch
        {
            "solid" => "bg-slate-100 border-transparent hover:bg-slate-200/80 focus-within:bg-white focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500",
            "flat" => "bg-transparent border-b-2 border-slate-300 rounded-none hover:border-slate-400 focus-within:border-blue-600 shadow-none px-1",
            _ => "bg-white border border-slate-300 hover:border-slate-400 focus-within:ring-2 focus-within:ring-blue-500/20 focus-within:border-blue-600 shadow-2xs"
        };

        var dirAttr = !string.IsNullOrWhiteSpace(Dir) ? $"dir=\"{Dir}\"" : "";
        var isRtl = Dir?.Equals("rtl", StringComparison.OrdinalIgnoreCase) == true;

        output.Attributes.SetAttribute("class", $"panoptes-ddt-wrapper relative inline-block w-full text-left {Class}".Trim());
        if (isRtl)
        {
            output.Attributes.SetAttribute("dir", "rtl");
        }

        object? resolvedData = null;
        if (ddtContext.Items.Count > 0)
        {
            resolvedData = ddtContext.Items;
        }
        else if (Data != null)
        {
            resolvedData = Data;
        }

        var config = new
        {
            id = Id,
            name = Name ?? Id,
            value = Value,
            text = Text,
            placeholder = Placeholder,
            data = resolvedData,
            url = Url,
            dataTextField = TextField,
            dataValueField = ValueField,
            checkboxes = Checkboxes,
            checkChildren = CheckChildren,
            autoClose = AutoClose ?? (!Checkboxes),
            filter = Filter,
            filterPlaceholder = FilterPlaceholder,
            clearable = Clearable,
            disabled = Disabled,
            readonlyMode = Readonly,
            size = Size,
            rounded = Rounded,
            fillMode = FillMode,
            floatingLabel = FloatingLabel,
            adaptiveMode = AdaptiveMode ?? "auto",
            dropdownWidth = DropdownWidth,
            dropdownHeight = DropdownHeight,
            headerTemplate = HeaderTemplate,
            footerTemplate = FooterTemplate,
            itemTemplate = ItemTemplate,
            valueTemplate = ValueTemplate,
            noDataTemplate = NoDataTemplate,
            dir = Dir ?? "ltr",
            onChange = OnChange,
            onSelect = OnSelect,
            onCheck = OnCheck,
            onOpen = OnOpen,
            onClose = OnClose,
            onDataBound = OnDataBound,
            onFiltering = OnFiltering
        };

        var configJson = JsonSerializer.Serialize(config);

        var floatingLabelHtml = !string.IsNullOrWhiteSpace(FloatingLabel)
            ? $@"<label class=""panoptes-ddt-floating-label absolute left-3 top-2.5 text-slate-400 text-xs transition-all pointer-events-none origin-top-left"">{FloatingLabel}</label>"
            : "";

        output.Content.SetHtmlContent($@"
<input type=""hidden"" id=""{Id}-value"" name=""{Name ?? Id}"" value=""{Value ?? ""}"" />
<div class=""panoptes-ddt-trigger relative flex items-center justify-between w-full cursor-pointer transition select-none {sizeClasses} {roundedClasses} {fillModeClasses} {(Disabled ? "bg-slate-100 cursor-not-allowed opacity-60" : "")} {(Readonly ? "bg-slate-50 cursor-default" : "")}"" tabindex=""0"" role=""combobox"" aria-expanded=""false"" aria-haspopup=""tree"">
    {floatingLabelHtml}
    <div class=""panoptes-ddt-selection flex items-center flex-wrap gap-1 flex-1 overflow-hidden pr-2"">
        <span class=""panoptes-ddt-placeholder text-slate-400 select-none truncate"">{Placeholder}</span>
    </div>
    <div class=""flex items-center gap-1 shrink-0 ml-1 text-slate-400"">
        <button type=""button"" class=""panoptes-ddt-clear p-0.5 rounded hover:text-rose-500 focus:outline-none transition hidden"" data-action=""clear-ddt"" title=""Temizle"">
            <svg class=""w-3.5 h-3.5"" fill=""none"" stroke=""currentColor"" viewBox=""0 0 24 24""><path stroke-linecap=""round"" stroke-linejoin=""round"" stroke-width=""2"" d=""M6 18L18 6M6 6l12 12"" /></svg>
        </button>
        <div class=""panoptes-ddt-arrow p-0.5 rounded transition duration-200"">
            <svg class=""w-4 h-4 transition-transform duration-200"" fill=""none"" stroke=""currentColor"" viewBox=""0 0 24 24""><path stroke-linecap=""round"" stroke-linejoin=""round"" stroke-width=""2"" d=""M19 9l-7 7-7-7"" /></svg>
        </div>
    </div>
</div>
<script type=""application/json"" data-panoptes-ddt-config=""{Id}"">{configJson}</script>
<script>
  if (window.Panoptes && window.Panoptes.DropDownTree) {{
    window.Panoptes.DropDownTree.init('{Id}');
  }} else {{
    document.addEventListener('DOMContentLoaded', function() {{
      if (window.Panoptes && window.Panoptes.DropDownTree) {{
        window.Panoptes.DropDownTree.init('{Id}');
      }}
    }});
  }}
</script>
");
    }
}
