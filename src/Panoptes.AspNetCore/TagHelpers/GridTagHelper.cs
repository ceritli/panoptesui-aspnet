using System.Text.Json;
using System.Text.Json.Serialization;
using Microsoft.AspNetCore.Razor.TagHelpers;
using Panoptes.AspNetCore.Models;

namespace Panoptes.AspNetCore.TagHelpers;

[HtmlTargetElement("panoptes-grid")]
public class GridTagHelper : TagHelper
{
    [HtmlAttributeName("id")]
    public string Id { get; set; } = $"panoptes-grid-{Guid.NewGuid():N}";

    // Direct url shortcut or datasource
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

    [HtmlAttributeName("batch-url")]
    public string? BatchUrl { get; set; }

    [HtmlAttributeName("method")]
    public string Method { get; set; } = "POST";

    [HtmlAttributeName("page-size")]
    public int PageSize { get; set; } = 10;

    [HtmlAttributeName("page-sizes")]
    public string PageSizes { get; set; } = "5,10,25,50,100";

    [HtmlAttributeName("sortable")]
    public bool Sortable { get; set; } = true;

    [HtmlAttributeName("filterable")]
    public bool Filterable { get; set; } = true;

    [HtmlAttributeName("groupable")]
    public bool Groupable { get; set; } = true;

    [HtmlAttributeName("resizable")]
    public bool Resizable { get; set; } = true;

    [HtmlAttributeName("reorderable")]
    public bool Reorderable { get; set; } = true;

    [HtmlAttributeName("column-menu")]
    public bool ColumnMenu { get; set; } = true;

    [HtmlAttributeName("selectable")]
    public bool Selectable { get; set; } = false;

    [HtmlAttributeName("exportable")]
    public bool Exportable { get; set; } = true;

    [HtmlAttributeName("pdf-export")]
    public bool PdfExport { get; set; } = true;

    [HtmlAttributeName("searchable")]
    public bool Searchable { get; set; } = true;

    [HtmlAttributeName("editable")]
    public string? Editable { get; set; } // "inline", "popup", "incell"

    [HtmlAttributeName("client-detail-template-id")]
    public string? ClientDetailTemplateId { get; set; }

    [HtmlAttributeName("class")]
    public string? Class { get; set; }

    [HtmlAttributeName("on-row-click")]
    public string? OnRowClick { get; set; }

    [HtmlAttributeName("on-data-bound")]
    public string? OnDataBound { get; set; }

    [HtmlAttributeName("persist-state")]
    public bool PersistState { get; set; } = false;

    [HtmlAttributeName("context-menu")]
    public bool ContextMenu { get; set; } = false;

    [HtmlAttributeName("filter-mode")]
    public string FilterMode { get; set; } = "menu"; // "menu" or "row"

    public override async Task ProcessAsync(TagHelperContext context, TagHelperOutput output)
    {
        var gridContext = new GridContext { Id = Id };
        context.Items[typeof(GridContext)] = gridContext;

        // Process all child tags (<panoptes-datasource>, <panoptes-column>, <panoptes-detail-template>)
        await output.GetChildContentAsync();

        output.TagName = "div";
        output.TagMode = TagMode.StartTagAndEndTag;
        output.Attributes.SetAttribute("id", Id);
        output.Attributes.SetAttribute("class", $"panoptes-grid-wrapper {Class}".Trim());

        var ds = gridContext.DataSource;
        var readUrl = ds.ReadUrl ?? ReadUrl ?? Url;
        var readMethod = ds.ReadMethod ?? Method;
        var createUrl = ds.CreateUrl ?? CreateUrl;
        var updateUrl = ds.UpdateUrl ?? UpdateUrl;
        var destroyUrl = ds.DestroyUrl ?? DeleteUrl;
        var batchUrl = ds.BatchUrl ?? BatchUrl;

        var config = new
        {
            id = Id,
            dataSource = new
            {
                type = ds.Type,
                readUrl,
                readMethod,
                createUrl,
                updateUrl,
                destroyUrl,
                batchUrl
            },
            persistState = PersistState,
            contextMenu = ContextMenu,
            filterMode = FilterMode,
            pageSize = PageSize,
            pageSizes = PageSizes.Split(',', StringSplitOptions.RemoveEmptyEntries).Select(int.Parse).ToList(),
            sortable = Sortable,
            filterable = Filterable,
            groupable = Groupable,
            resizable = Resizable,
            reorderable = Reorderable,
            columnMenu = ColumnMenu,
            selectable = Selectable,
            exportable = Exportable,
            pdfExport = PdfExport,
            searchable = Searchable,
            editable = Editable,
            detailTemplate = gridContext.DetailTemplate,
            clientDetailTemplateId = ClientDetailTemplateId,
            onRowClick = OnRowClick,
            onDataBound = OnDataBound,
            columns = gridContext.Columns
        };

        var jsonOptions = new JsonSerializerOptions
        {
            PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
            DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull
        };

        var configJson = JsonSerializer.Serialize(config, jsonOptions);

        output.Content.SetHtmlContent($@"
<div class=""panoptes-grid-container""></div>
<script type=""application/json"" data-panoptes-config=""{Id}"">{configJson}</script>
<script>
  if (window.Panoptes && window.Panoptes.Grid) {{
    window.Panoptes.Grid.init('{Id}');
  }} else {{
    document.addEventListener('DOMContentLoaded', function() {{
      if (window.Panoptes && window.Panoptes.Grid) {{
        window.Panoptes.Grid.init('{Id}');
      }}
    }});
  }}
</script>");
    }
}
