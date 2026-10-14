using Microsoft.AspNetCore.Razor.TagHelpers;
using Panoptes.AspNetCore.Models;

namespace Panoptes.AspNetCore.TagHelpers;

[HtmlTargetElement("panoptes-grid-columns")]
[HtmlTargetElement("panoptes-columns")]
[HtmlTargetElement("columns")]
public class GridColumnsTagHelper : TagHelper
{
    public override async Task ProcessAsync(TagHelperContext context, TagHelperOutput output)
    {
        await output.GetChildContentAsync();
        output.SuppressOutput();
    }
}

[HtmlTargetElement("panoptes-grid-column")]
[HtmlTargetElement("panoptes-column")]
[HtmlTargetElement("column")]
public class GridColumnTagHelper : TagHelper
{
    [HtmlAttributeName("field")]
    public string? Field { get; set; }

    [HtmlAttributeName("title")]
    public string? Title { get; set; }

    [HtmlAttributeName("width")]
    public string? Width { get; set; }

    [HtmlAttributeName("sortable")]
    public bool? Sortable { get; set; }

    [HtmlAttributeName("filterable")]
    public bool? Filterable { get; set; }

    [HtmlAttributeName("frozen")]
    public bool? Frozen { get; set; }

    [HtmlAttributeName("editable")]
    public bool? Editable { get; set; }

    [HtmlAttributeName("editor-type")]
    public string? EditorType { get; set; }

    [HtmlAttributeName("editor-options")]
    public string? EditorOptions { get; set; }

    [HtmlAttributeName("format")]
    public string? Format { get; set; }

    [HtmlAttributeName("align")]
    public string? Align { get; set; } = "left";

    [HtmlAttributeName("aggregates")]
    public string? Aggregates { get; set; }

    [HtmlAttributeName("template")]
    public string? Template { get; set; }

    [HtmlAttributeName("class")]
    public string? Class { get; set; }

    [HtmlAttributeName("header-class")]
    public string? HeaderClass { get; set; }

    [HtmlAttributeName("hidden")]
    public bool Hidden { get; set; } = false;

    [HtmlAttributeName("selectable")]
    public bool? Selectable { get; set; }

    [HtmlAttributeName("group-header-template")]
    public string? GroupHeaderTemplate { get; set; }

    public override async Task ProcessAsync(TagHelperContext context, TagHelperOutput output)
    {
        var childContent = await output.GetChildContentAsync();
        var inlineTemplate = childContent.GetContent();

        if (context.Items.TryGetValue(typeof(GridContext), out var item) && item is GridContext gridContext)
        {
            gridContext.Columns.Add(new GridColumn
            {
                Field = Field,
                Title = Title ?? Field,
                Width = Width,
                Sortable = Sortable,
                Filterable = Filterable,
                Frozen = Frozen,
                Editable = Editable,
                EditorType = EditorType,
                EditorOptions = EditorOptions,
                Format = Format,
                Align = Align,
                Aggregates = Aggregates,
                Template = !string.IsNullOrWhiteSpace(inlineTemplate) ? inlineTemplate : Template,
                Class = Class,
                HeaderClass = HeaderClass,
                Hidden = Hidden,
                Selectable = Selectable,
                GroupHeaderTemplate = GroupHeaderTemplate
            });
        }

        output.SuppressOutput();
    }
}
