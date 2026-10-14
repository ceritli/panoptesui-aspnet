using System;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc.Rendering;
using Microsoft.AspNetCore.Razor.TagHelpers;
using Panoptes.AspNetCore.Models;

namespace Panoptes.AspNetCore.TagHelpers;

/// <summary>
/// Panoptes UI Dialog bileşeni, modern Alert, Confirm ve Prompt modal TagHelper'ı.
/// </summary>
[HtmlTargetElement("panoptes-dialog")]
public class DialogTagHelper : TagHelper
{
    [HtmlAttributeName("id")]
    public string? Id { get; set; }

    [HtmlAttributeName("title")]
    public string? Title { get; set; }

    [HtmlAttributeName("type")]
    public string Type { get; set; } = "alert"; // alert, confirm, prompt

    [HtmlAttributeName("ok-text")]
    public string OkText { get; set; } = "Tamam";

    [HtmlAttributeName("cancel-text")]
    public string CancelText { get; set; } = "İptal";

    [HtmlAttributeName("width")]
    public string Width { get; set; } = "440px";

    [HtmlAttributeName("closable")]
    public bool Closable { get; set; } = true;

    [HtmlAttributeName("on-ok")]
    public string? OnOk { get; set; }

    [HtmlAttributeName("on-cancel")]
    public string? OnCancel { get; set; }

    public override async Task ProcessAsync(TagHelperContext context, TagHelperOutput output)
    {
        var id = !string.IsNullOrWhiteSpace(Id) ? Id : $"panoptes_dlg_{Guid.NewGuid():N}";
        var childContent = await output.GetChildContentAsync();
        var content = childContent.GetContent();

        output.TagName = "div";
        output.TagMode = TagMode.StartTagAndEndTag;
        output.Attributes.SetAttribute("id", id);
        output.Attributes.SetAttribute("data-panoptes-dialog", "true");
        output.Attributes.SetAttribute("data-type", Type.ToLowerInvariant());
        output.Attributes.SetAttribute("data-title", Title ?? "");
        output.Attributes.SetAttribute("data-ok-text", OkText);
        output.Attributes.SetAttribute("data-cancel-text", CancelText);
        output.Attributes.SetAttribute("data-width", Width);
        output.Attributes.SetAttribute("data-closable", Closable ? "true" : "false");

        if (!string.IsNullOrWhiteSpace(OnOk))
            output.Attributes.SetAttribute("data-on-ok", OnOk);
        if (!string.IsNullOrWhiteSpace(OnCancel))
            output.Attributes.SetAttribute("data-on-cancel", OnCancel);

        output.Attributes.SetAttribute("style", "display: none;");
        output.Content.SetHtmlContent(content);
    }
}
