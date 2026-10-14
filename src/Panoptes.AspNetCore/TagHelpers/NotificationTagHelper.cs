using System;
using System.Text.Encodings.Web;
using Microsoft.AspNetCore.Mvc.Rendering;
using Microsoft.AspNetCore.Razor.TagHelpers;
using Panoptes.AspNetCore.Models;

namespace Panoptes.AspNetCore.TagHelpers;

/// <summary>
/// Panoptes UI Notification bileşeni, modern, Toast tarzı açılır bildirim TagHelper'ı.
/// </summary>
[HtmlTargetElement("panoptes-notification")]
public class NotificationTagHelper : TagHelper
{
    [HtmlAttributeName("id")]
    public string? Id { get; set; }

    [HtmlAttributeName("title")]
    public string? Title { get; set; }

    [HtmlAttributeName("message")]
    public string? Message { get; set; }

    [HtmlAttributeName("type")]
    public string Type { get; set; } = "info"; // success, error, warning, info

    [HtmlAttributeName("position")]
    public string Position { get; set; } = "top-right"; // top-right, top-left, bottom-right, bottom-left, top-center, bottom-center

    [HtmlAttributeName("auto-hide-after")]
    public int AutoHideAfter { get; set; } = 5000;

    [HtmlAttributeName("closable")]
    public bool Closable { get; set; } = true;

    [HtmlAttributeName("show-icon")]
    public bool ShowIcon { get; set; } = true;

    [HtmlAttributeName("auto-show")]
    public bool AutoShow { get; set; } = true;

    public override void Process(TagHelperContext context, TagHelperOutput output)
    {
        var id = !string.IsNullOrWhiteSpace(Id) ? Id : $"panoptes_notif_{Guid.NewGuid():N}";

        output.TagName = "div";
        output.TagMode = TagMode.StartTagAndEndTag;
        output.Attributes.SetAttribute("id", id);
        output.Attributes.SetAttribute("data-panoptes-notification", "true");
        output.Attributes.SetAttribute("data-type", Type.ToLowerInvariant());
        output.Attributes.SetAttribute("data-position", Position.ToLowerInvariant());
        output.Attributes.SetAttribute("data-auto-hide", AutoHideAfter.ToString());
        output.Attributes.SetAttribute("data-closable", Closable ? "true" : "false");
        output.Attributes.SetAttribute("data-show-icon", ShowIcon ? "true" : "false");
        output.Attributes.SetAttribute("data-auto-show", AutoShow ? "true" : "false");

        if (!string.IsNullOrWhiteSpace(Title))
            output.Attributes.SetAttribute("data-title", Title);

        if (!string.IsNullOrWhiteSpace(Message))
            output.Attributes.SetAttribute("data-message", Message);

        output.Attributes.SetAttribute("style", "display: none;");
    }
}
