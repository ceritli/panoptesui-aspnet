using System.Text.Json;
using System.Text.Json.Serialization;
using Microsoft.AspNetCore.Razor.TagHelpers;
using Panoptes.AspNetCore.Models;

namespace Panoptes.AspNetCore.TagHelpers;

public class ListViewContext
{
    public string Id { get; set; } = string.Empty;
    public string? Template { get; set; }
    public string? AltTemplate { get; set; }
    public string? EditTemplate { get; set; }
    public GridDataSourceConfig DataSource { get; set; } = new();
}

[HtmlTargetElement("panoptes-listview")]
public class ListViewTagHelper : TagHelper
{
    [HtmlAttributeName("id")]
    public string Id { get; set; } = $"panoptes-listview-{Guid.NewGuid():N}";

    [HtmlAttributeName("url")]
    public string? Url { get; set; }

    [HtmlAttributeName("read-url")]
    public string? ReadUrl { get; set; }

    [HtmlAttributeName("create-url")]
    public string? CreateUrl { get; set; }

    [HtmlAttributeName("update-url")]
    public string? UpdateUrl { get; set; }

    [HtmlAttributeName("delete-url")]
    public string? DeleteUrl { get; set; }

    [HtmlAttributeName("method")]
    public string Method { get; set; } = "POST";

    [HtmlAttributeName("page-size")]
    public int PageSize { get; set; } = 8;

    [HtmlAttributeName("page-sizes")]
    public string PageSizes { get; set; } = "4,8,12,24,48";

    [HtmlAttributeName("pageable")]
    public bool Pageable { get; set; } = true;

    [HtmlAttributeName("sortable")]
    public bool Sortable { get; set; } = true;

    [HtmlAttributeName("searchable")]
    public bool Searchable { get; set; } = true;

    [HtmlAttributeName("selectable")]
    public string Selectable { get; set; } = "none"; // "single", "multiple", "none"

    [HtmlAttributeName("editable")]
    public bool Editable { get; set; } = false;

    [HtmlAttributeName("client-template-id")]
    public string? ClientTemplateId { get; set; }

    [HtmlAttributeName("client-alt-template-id")]
    public string? ClientAltTemplateId { get; set; }

    [HtmlAttributeName("client-edit-template-id")]
    public string? ClientEditTemplateId { get; set; }

    [HtmlAttributeName("layout")]
    public string Layout { get; set; } = "grid"; // "grid", "list"

    [HtmlAttributeName("columns")]
    public int Columns { get; set; } = 3; // 1, 2, 3, 4

    [HtmlAttributeName("class")]
    public string? Class { get; set; }

    [HtmlAttributeName("item-class")]
    public string? ItemClass { get; set; }

    [HtmlAttributeName("on-change")]
    public string? OnChange { get; set; }

    [HtmlAttributeName("on-data-bound")]
    public string? OnDataBound { get; set; }

    [HtmlAttributeName("on-edit")]
    public string? OnEdit { get; set; }

    [HtmlAttributeName("on-save")]
    public string? OnSave { get; set; }

    [HtmlAttributeName("on-cancel")]
    public string? OnCancel { get; set; }

    [HtmlAttributeName("on-remove")]
    public string? OnRemove { get; set; }

    public override async Task ProcessAsync(TagHelperContext context, TagHelperOutput output)
    {
        var lvContext = new ListViewContext { Id = Id };
        context.Items[typeof(ListViewContext)] = lvContext;

        await output.GetChildContentAsync();

        output.TagName = "div";
        output.TagMode = TagMode.StartTagAndEndTag;
        output.Attributes.SetAttribute("id", Id);
        output.Attributes.SetAttribute("class", $"panoptes-listview-wrapper {Class}".Trim());

        var readUrl = ReadUrl ?? Url;
        var pageSizesList = PageSizes.Split(',', StringSplitOptions.RemoveEmptyEntries)
            .Select(s => int.TryParse(s.Trim(), out var n) ? n : 8)
            .ToList();

        var config = new
        {
            id = Id,
            dataSource = new
            {
                readUrl,
                readMethod = Method,
                createUrl = CreateUrl,
                updateUrl = UpdateUrl,
                destroyUrl = DeleteUrl
            },
            pageSize = PageSize,
            pageSizes = pageSizesList,
            pageable = Pageable,
            sortable = Sortable,
            searchable = Searchable,
            selectable = Selectable,
            editable = Editable,
            layout = Layout,
            columns = Columns,
            itemClass = ItemClass,
            clientTemplateId = ClientTemplateId,
            clientAltTemplateId = ClientAltTemplateId,
            clientEditTemplateId = ClientEditTemplateId,
            templateHtml = lvContext.Template,
            altTemplateHtml = lvContext.AltTemplate,
            editTemplateHtml = lvContext.EditTemplate,
            onChange = OnChange,
            onDataBound = OnDataBound,
            onEdit = OnEdit,
            onSave = OnSave,
            onCancel = OnCancel,
            onRemove = OnRemove
        };

        var jsonOptions = new JsonSerializerOptions
        {
            PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
            DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull
        };

        var configJson = JsonSerializer.Serialize(config, jsonOptions);

        output.Content.SetHtmlContent($@"
<div class=""panoptes-listview-container""></div>
<script type=""application/json"" data-panoptes-config=""{Id}"">{configJson}</script>
<script>
  if (window.Panoptes && window.Panoptes.ListView) {{
    window.Panoptes.ListView.init('{Id}');
  }} else {{
    document.addEventListener('DOMContentLoaded', function() {{
      if (window.Panoptes && window.Panoptes.ListView) {{
        window.Panoptes.ListView.init('{Id}');
      }}
    }});
  }}
</script>");
    }
}

[HtmlTargetElement("panoptes-listview-template", ParentTag = "panoptes-listview")]
public class ListViewTemplateTagHelper : TagHelper
{
    public override async Task ProcessAsync(TagHelperContext context, TagHelperOutput output)
    {
        output.SuppressOutput();
        if (context.Items.TryGetValue(typeof(ListViewContext), out var item) && item is ListViewContext lvContext)
        {
            var content = await output.GetChildContentAsync();
            lvContext.Template = content.GetContent();
        }
    }
}

[HtmlTargetElement("panoptes-listview-alt-template", ParentTag = "panoptes-listview")]
public class ListViewAltTemplateTagHelper : TagHelper
{
    public override async Task ProcessAsync(TagHelperContext context, TagHelperOutput output)
    {
        output.SuppressOutput();
        if (context.Items.TryGetValue(typeof(ListViewContext), out var item) && item is ListViewContext lvContext)
        {
            var content = await output.GetChildContentAsync();
            lvContext.AltTemplate = content.GetContent();
        }
    }
}

[HtmlTargetElement("panoptes-listview-edit-template", ParentTag = "panoptes-listview")]
public class ListViewEditTemplateTagHelper : TagHelper
{
    public override async Task ProcessAsync(TagHelperContext context, TagHelperOutput output)
    {
        output.SuppressOutput();
        if (context.Items.TryGetValue(typeof(ListViewContext), out var item) && item is ListViewContext lvContext)
        {
            var content = await output.GetChildContentAsync();
            lvContext.EditTemplate = content.GetContent();
        }
    }
}
