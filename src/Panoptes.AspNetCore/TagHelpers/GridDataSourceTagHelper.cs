using Microsoft.AspNetCore.Razor.TagHelpers;
using Panoptes.AspNetCore.Models;

namespace Panoptes.AspNetCore.TagHelpers;

[HtmlTargetElement("panoptes-grid-datasource", ParentTag = "panoptes-grid")]
[HtmlTargetElement("panoptes-datasource", ParentTag = "panoptes-grid")]
[HtmlTargetElement("datasource", ParentTag = "panoptes-grid")]
public class GridDataSourceTagHelper : TagHelper
{
    [HtmlAttributeName("type")]
    public string Type { get; set; } = "ajax";

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

    [HtmlAttributeName("destroy-url")]
    public string? DestroyUrl { get; set; }

    [HtmlAttributeName("batch-url")]
    public string? BatchUrl { get; set; }

    [HtmlAttributeName("method")]
    public string Method { get; set; } = "POST";

    public override async Task ProcessAsync(TagHelperContext context, TagHelperOutput output)
    {
        if (context.Items.TryGetValue(typeof(GridContext), out var item) && item is GridContext gridContext)
        {
            gridContext.DataSource.Type = Type;
            if (!string.IsNullOrEmpty(Url)) gridContext.DataSource.ReadUrl = Url;
            if (!string.IsNullOrEmpty(ReadUrl)) gridContext.DataSource.ReadUrl = ReadUrl;
            if (!string.IsNullOrEmpty(CreateUrl)) gridContext.DataSource.CreateUrl = CreateUrl;
            if (!string.IsNullOrEmpty(UpdateUrl)) gridContext.DataSource.UpdateUrl = UpdateUrl;
            if (!string.IsNullOrEmpty(DeleteUrl)) gridContext.DataSource.DestroyUrl = DeleteUrl;
            if (!string.IsNullOrEmpty(DestroyUrl)) gridContext.DataSource.DestroyUrl = DestroyUrl;
            if (!string.IsNullOrEmpty(BatchUrl)) gridContext.DataSource.BatchUrl = BatchUrl;
            if (!string.IsNullOrEmpty(Method)) gridContext.DataSource.ReadMethod = Method;
        }

        await output.GetChildContentAsync();
        output.SuppressOutput();
    }
}

[HtmlTargetElement("panoptes-read", ParentTag = "panoptes-datasource")]
[HtmlTargetElement("read", ParentTag = "panoptes-datasource")]
public class GridReadTagHelper : TagHelper
{
    [HtmlAttributeName("url")]
    public string? Url { get; set; }

    [HtmlAttributeName("method")]
    public string Method { get; set; } = "POST";

    public override void Process(TagHelperContext context, TagHelperOutput output)
    {
        if (context.Items.TryGetValue(typeof(GridContext), out var item) && item is GridContext gridContext)
        {
            gridContext.DataSource.ReadUrl = Url;
            gridContext.DataSource.ReadMethod = Method;
        }
        output.SuppressOutput();
    }
}

[HtmlTargetElement("panoptes-create", ParentTag = "panoptes-datasource")]
[HtmlTargetElement("create", ParentTag = "panoptes-datasource")]
public class GridCreateTagHelper : TagHelper
{
    [HtmlAttributeName("url")]
    public string? Url { get; set; }

    [HtmlAttributeName("method")]
    public string Method { get; set; } = "POST";

    public override void Process(TagHelperContext context, TagHelperOutput output)
    {
        if (context.Items.TryGetValue(typeof(GridContext), out var item) && item is GridContext gridContext)
        {
            gridContext.DataSource.CreateUrl = Url;
            gridContext.DataSource.CreateMethod = Method;
        }
        output.SuppressOutput();
    }
}

[HtmlTargetElement("panoptes-update", ParentTag = "panoptes-datasource")]
[HtmlTargetElement("update", ParentTag = "panoptes-datasource")]
public class GridUpdateTagHelper : TagHelper
{
    [HtmlAttributeName("url")]
    public string? Url { get; set; }

    [HtmlAttributeName("method")]
    public string Method { get; set; } = "POST";

    public override void Process(TagHelperContext context, TagHelperOutput output)
    {
        if (context.Items.TryGetValue(typeof(GridContext), out var item) && item is GridContext gridContext)
        {
            gridContext.DataSource.UpdateUrl = Url;
            gridContext.DataSource.UpdateMethod = Method;
        }
        output.SuppressOutput();
    }
}

[HtmlTargetElement("panoptes-destroy", ParentTag = "panoptes-datasource")]
[HtmlTargetElement("destroy", ParentTag = "panoptes-datasource")]
public class GridDestroyTagHelper : TagHelper
{
    [HtmlAttributeName("url")]
    public string? Url { get; set; }

    [HtmlAttributeName("method")]
    public string Method { get; set; } = "POST";

    public override void Process(TagHelperContext context, TagHelperOutput output)
    {
        if (context.Items.TryGetValue(typeof(GridContext), out var item) && item is GridContext gridContext)
        {
            gridContext.DataSource.DestroyUrl = Url;
            gridContext.DataSource.DestroyMethod = Method;
        }
        output.SuppressOutput();
    }
}

[HtmlTargetElement("panoptes-batch", ParentTag = "panoptes-datasource")]
[HtmlTargetElement("batch", ParentTag = "panoptes-datasource")]
public class GridBatchTagHelper : TagHelper
{
    [HtmlAttributeName("url")]
    public string? Url { get; set; }

    [HtmlAttributeName("method")]
    public string Method { get; set; } = "POST";

    public override void Process(TagHelperContext context, TagHelperOutput output)
    {
        if (context.Items.TryGetValue(typeof(GridContext), out var item) && item is GridContext gridContext)
        {
            gridContext.DataSource.BatchUrl = Url;
            gridContext.DataSource.BatchMethod = Method;
        }
        output.SuppressOutput();
    }
}
