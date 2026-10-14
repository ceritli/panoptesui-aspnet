using System.Threading.Tasks;
using Microsoft.AspNetCore.Razor.TagHelpers;
using Panoptes.AspNetCore.Models;

namespace Panoptes.AspNetCore.TagHelpers;

[HtmlTargetElement("panoptes-multicolumncombobox-columns")]
[HtmlTargetElement("panoptes-mccb-columns")]
[HtmlTargetElement("mccb-columns")]
public class MultiColumnComboBoxColumnsTagHelper : TagHelper
{
    public override async Task ProcessAsync(TagHelperContext context, TagHelperOutput output)
    {
        await output.GetChildContentAsync();
        output.SuppressOutput();
    }
}

[HtmlTargetElement("panoptes-multicolumncombobox-column")]
[HtmlTargetElement("panoptes-mccb-column")]
[HtmlTargetElement("mccb-column")]
public class MultiColumnComboBoxColumnTagHelper : TagHelper
{
    [HtmlAttributeName("field")]
    public string? Field { get; set; }

    [HtmlAttributeName("title")]
    public string? Title { get; set; }

    [HtmlAttributeName("width")]
    public string? Width { get; set; }

    [HtmlAttributeName("template")]
    public string? Template { get; set; }

    [HtmlAttributeName("align")]
    public string? Align { get; set; } = "left";

    [HtmlAttributeName("class")]
    public string? Class { get; set; }

    [HtmlAttributeName("header-class")]
    public string? HeaderClass { get; set; }

    [HtmlAttributeName("format")]
    public string? Format { get; set; }

    public override async Task ProcessAsync(TagHelperContext context, TagHelperOutput output)
    {
        var childContent = await output.GetChildContentAsync();
        var inlineTemplate = childContent.GetContent();

        if (context.Items.TryGetValue(typeof(MultiColumnComboBoxContext), out var item) && item is MultiColumnComboBoxContext mccbContext)
        {
            mccbContext.Columns.Add(new MultiColumnComboBoxColumn
            {
                Field = Field,
                Title = Title ?? Field,
                Width = Width,
                Template = !string.IsNullOrWhiteSpace(inlineTemplate) ? inlineTemplate : Template,
                Align = Align,
                Class = Class,
                HeaderClass = HeaderClass,
                Format = Format
            });
        }

        output.SuppressOutput();
    }
}
