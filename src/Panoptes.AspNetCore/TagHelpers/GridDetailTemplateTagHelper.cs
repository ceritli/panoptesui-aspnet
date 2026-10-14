using Microsoft.AspNetCore.Razor.TagHelpers;
using Panoptes.AspNetCore.Models;

namespace Panoptes.AspNetCore.TagHelpers;

[HtmlTargetElement("panoptes-grid-detail-template")]
[HtmlTargetElement("panoptes-detail-template")]
[HtmlTargetElement("detail-template")]
public class GridDetailTemplateTagHelper : TagHelper
{
    public override async Task ProcessAsync(TagHelperContext context, TagHelperOutput output)
    {
        var childContent = await output.GetChildContentAsync();
        var templateHtml = childContent.GetContent();

        if (context.Items.TryGetValue(typeof(GridContext), out var item) && item is GridContext gridContext)
        {
            gridContext.DetailTemplate = templateHtml;
        }

        output.SuppressOutput();
    }
}
