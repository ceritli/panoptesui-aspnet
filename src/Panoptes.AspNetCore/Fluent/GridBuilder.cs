using System.Text.Encodings.Web;
using System.Text.Json;
using System.Text.Json.Serialization;
using Microsoft.AspNetCore.Html;
using Panoptes.AspNetCore.Models;

namespace Panoptes.AspNetCore.Fluent;

public class GridBuilder<T> : IHtmlContent
{
    private readonly string _name;
    private readonly List<GridColumn> _columns = new();
    private readonly GridDataSourceConfig _dataSource = new();
    private int _pageSize = 10;
    private string _pageSizes = "5,10,25,50,100";
    private bool _sortable = true;
    private bool _filterable = true;
    private string _filterMode = "menu"; // "menu", "row", "both"
    private bool _groupable = true;
    private bool _resizable = true;
    private bool _reorderable = true;
    private bool _columnMenu = true;
    private bool _selectable = false;
    private bool _exportable = true;
    private bool _pdfExport = true;
    private bool _searchable = true;
    private string? _editable = "popup"; // "inline", "popup", "incell"
    private string? _detailTemplate;
    private string? _cssClass;

    public GridBuilder(string name)
    {
        _name = name;
    }

    public GridBuilder<T> Columns(Action<GridColumnsFactory<T>> config)
    {
        var factory = new GridColumnsFactory<T>();
        config(factory);
        _columns.AddRange(factory.Columns);
        return this;
    }

    public GridBuilder<T> DataSource(Action<DataSourceBuilder> config)
    {
        var builder = new DataSourceBuilder();
        config(builder);
        _dataSource.Type = builder.Config.Type;
        _dataSource.ReadUrl = builder.Config.ReadUrl;
        _dataSource.ReadMethod = builder.Config.ReadMethod;
        _dataSource.CreateUrl = builder.Config.CreateUrl;
        _dataSource.CreateMethod = builder.Config.CreateMethod;
        _dataSource.UpdateUrl = builder.Config.UpdateUrl;
        _dataSource.UpdateMethod = builder.Config.UpdateMethod;
        _dataSource.DestroyUrl = builder.Config.DestroyUrl;
        _dataSource.DestroyMethod = builder.Config.DestroyMethod;
        _dataSource.BatchUrl = builder.Config.BatchUrl;
        _dataSource.BatchMethod = builder.Config.BatchMethod;
        _pageSize = builder.PageSizeValue;
        return this;
    }

    public GridBuilder<T> Pageable(int pageSize = 10, string pageSizes = "5,10,25,50,100")
    {
        _pageSize = pageSize;
        _pageSizes = pageSizes;
        return this;
    }

    public GridBuilder<T> Sortable(bool sortable = true) { _sortable = sortable; return this; }
    public GridBuilder<T> Filterable(bool filterable = true, string mode = "menu") { _filterable = filterable; _filterMode = mode; return this; }
    public GridBuilder<T> Groupable(bool groupable = true) { _groupable = groupable; return this; }
    public GridBuilder<T> Resizable(bool resizable = true) { _resizable = resizable; return this; }
    public GridBuilder<T> Reorderable(bool reorderable = true) { _reorderable = reorderable; return this; }
    public GridBuilder<T> ColumnMenu(bool columnMenu = true) { _columnMenu = columnMenu; return this; }
    public GridBuilder<T> Selectable(bool selectable = true) { _selectable = selectable; return this; }
    public GridBuilder<T> Exportable(bool exportable = true) { _exportable = exportable; return this; }
    public GridBuilder<T> PdfExport(bool pdfExport = true) { _pdfExport = pdfExport; return this; }
    public GridBuilder<T> Searchable(bool searchable = true) { _searchable = searchable; return this; }
    public GridBuilder<T> Editable(string mode = "popup") { _editable = mode; return this; }
    public GridBuilder<T> DetailTemplate(string templateHtml) { _detailTemplate = templateHtml; return this; }
    public GridBuilder<T> HtmlAttributes(string cssClass) { _cssClass = cssClass; return this; }

    public void WriteTo(TextWriter writer, HtmlEncoder encoder)
    {
        var config = new
        {
            id = _name,
            dataSource = _dataSource,
            pageSize = _pageSize,
            pageSizes = _pageSizes.Split(',', StringSplitOptions.RemoveEmptyEntries).Select(int.Parse).ToList(),
            sortable = _sortable,
            filterable = _filterable,
            filterMode = _filterMode,
            groupable = _groupable,
            resizable = _resizable,
            reorderable = _reorderable,
            columnMenu = _columnMenu,
            selectable = _selectable,
            exportable = _exportable,
            pdfExport = _pdfExport,
            searchable = _searchable,
            editable = _editable,
            detailTemplate = _detailTemplate,
            columns = _columns
        };

        var jsonOptions = new JsonSerializerOptions
        {
            PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
            DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull
        };

        var configJson = JsonSerializer.Serialize(config, jsonOptions);

        writer.Write($@"
<div id=""{_name}"" class=""panoptes-grid-wrapper {_cssClass}"">
  <div class=""panoptes-grid-container""></div>
  <script type=""application/json"" data-panoptes-config=""{_name}"">{configJson}</script>
  <script>
    if (window.Panoptes && window.Panoptes.Grid) {{
      window.Panoptes.Grid.init('{_name}');
    }} else {{
      document.addEventListener('DOMContentLoaded', function() {{
        if (window.Panoptes && window.Panoptes.Grid) {{
          window.Panoptes.Grid.init('{_name}');
        }}
      }});
    }}
  </script>
</div>");
    }
}
