using System;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc.Rendering;
using Microsoft.AspNetCore.Razor.TagHelpers;
using Panoptes.AspNetCore.Models;

namespace Panoptes.AspNetCore.TagHelpers;

/// <summary>
/// Panoptes UI Window bileşeni, modern, sürüklenebilir (draggable), boyutlandırılabilir (resizable) ve modal/non-modal pencere TagHelper'ı.
/// </summary>
[HtmlTargetElement("panoptes-window")]
public class WindowTagHelper : TagHelper
{
    [HtmlAttributeName("id")]
    public string? Id { get; set; }

    [HtmlAttributeName("title")]
    public string? Title { get; set; }

    [HtmlAttributeName("width")]
    public string Width { get; set; } = "540px";

    [HtmlAttributeName("height")]
    public string Height { get; set; } = "360px";

    [HtmlAttributeName("modal")]
    public bool Modal { get; set; } = true;

    [HtmlAttributeName("draggable")]
    public bool Draggable { get; set; } = true;

    [HtmlAttributeName("resizable")]
    public bool Resizable { get; set; } = true;

    [HtmlAttributeName("closable")]
    public bool Closable { get; set; } = true;

    [HtmlAttributeName("maximizable")]
    public bool Maximizable { get; set; } = true;

    [HtmlAttributeName("minimizable")]
    public bool Minimizable { get; set; } = true;

    [HtmlAttributeName("visible")]
    public bool Visible { get; set; }

    public override async Task ProcessAsync(TagHelperContext context, TagHelperOutput output)
    {
        var id = !string.IsNullOrWhiteSpace(Id) ? Id : $"panoptes_win_{Guid.NewGuid():N}";
        var childContent = await output.GetChildContentAsync();
        var content = childContent.GetContent();

        output.TagName = "div";
        output.TagMode = TagMode.StartTagAndEndTag;
        output.Attributes.SetAttribute("id", id);
        output.Attributes.SetAttribute("data-panoptes-window", "true");
        output.Attributes.SetAttribute("data-title", Title ?? "");
        output.Attributes.SetAttribute("data-width", Width);
        output.Attributes.SetAttribute("data-height", Height);
        output.Attributes.SetAttribute("data-modal", Modal ? "true" : "false");
        output.Attributes.SetAttribute("data-draggable", Draggable ? "true" : "false");
        output.Attributes.SetAttribute("data-resizable", Resizable ? "true" : "false");
        output.Attributes.SetAttribute("data-closable", Closable ? "true" : "false");
        output.Attributes.SetAttribute("data-maximizable", Maximizable ? "true" : "false");
        output.Attributes.SetAttribute("data-minimizable", Minimizable ? "true" : "false");
        output.Attributes.SetAttribute("data-visible", Visible ? "true" : "false");

        output.Attributes.SetAttribute("style", "display: none;");
        output.Content.SetHtmlContent(content);
    }
}
