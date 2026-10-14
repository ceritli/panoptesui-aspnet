using System;
using System.Text.Encodings.Web;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc.Rendering;
using Microsoft.AspNetCore.Razor.TagHelpers;
using Panoptes.AspNetCore.Models;

namespace Panoptes.AspNetCore.TagHelpers;

/// <summary>
/// ActionSheet içindeki tekil eylem düğmesini render eden TagHelper.
/// </summary>
[HtmlTargetElement("panoptes-actionsheet-item")]
public class ActionSheetItemTagHelper : TagHelper
{
    [HtmlAttributeName("id")]
    public string? Id { get; set; }

    [HtmlAttributeName("text")]
    public string Text { get; set; } = string.Empty;

    [HtmlAttributeName("title")]
    public string Title { get => Text; set => Text = value; }

    [HtmlAttributeName("description")]
    public string? Description { get; set; }

    [HtmlAttributeName("subtitle")]
    public string? Subtitle { get => Description; set => Description = value; }

    [HtmlAttributeName("icon")]
    public string? Icon { get; set; }

    [HtmlAttributeName("icon-class")]
    public string? IconClass { get => Icon; set => Icon = value; }

    [HtmlAttributeName("image-url")]
    public string? ImageUrl { get; set; }

    [HtmlAttributeName("group")]
    public string? Group { get; set; }

    [HtmlAttributeName("disabled")]
    public bool Disabled { get; set; } = false;

    [HtmlAttributeName("theme-color")]
    public string ThemeColor { get; set; } = "default"; // default, primary, danger, warning, success

    [HtmlAttributeName("click")]
    public string? Click { get; set; }

    [HtmlAttributeName("onclick")]
    public string? OnClick { get => Click; set => Click = value; }

    [HtmlAttributeName("url")]
    public string? Url { get; set; }

    [HtmlAttributeName("class")]
    public string? CssClass { get; set; }

    public override async Task ProcessAsync(TagHelperContext context, TagHelperOutput output)
    {
        var childContent = await output.GetChildContentAsync();
        var id = !string.IsNullOrWhiteSpace(Id) ? Id : $"as_item_{Guid.NewGuid():N}";

        output.TagName = !string.IsNullOrWhiteSpace(Url) ? "a" : "div";
        output.TagMode = TagMode.StartTagAndEndTag;

        if (!string.IsNullOrWhiteSpace(Url))
        {
            output.Attributes.SetAttribute("href", Url);
        }

        output.Attributes.SetAttribute("id", id);
        output.Attributes.SetAttribute("data-item-id", id);
        output.Attributes.SetAttribute("data-theme", ThemeColor.ToLowerInvariant());
        output.Attributes.SetAttribute("role", "button");
        output.Attributes.SetAttribute("tabindex", Disabled ? "-1" : "0");

        if (Disabled)
        {
            output.Attributes.SetAttribute("aria-disabled", "true");
        }

        if (!string.IsNullOrWhiteSpace(Click))
        {
            output.Attributes.SetAttribute("onclick", Click);
        }

        if (!string.IsNullOrWhiteSpace(Group))
        {
            output.Attributes.SetAttribute("data-group", Group);
        }

        var themeClass = ThemeColor.ToLowerInvariant() switch
        {
            "primary" => "theme-primary text-indigo-600 hover:bg-indigo-50",
            "danger" or "destructive" => "theme-danger text-rose-600 hover:bg-rose-50",
            "warning" => "theme-warning text-amber-600 hover:bg-amber-50",
            "success" => "theme-success text-emerald-600 hover:bg-emerald-50",
            _ => "theme-default text-slate-700 hover:bg-slate-50"
        };

        var disabledClass = Disabled ? "opacity-40 cursor-not-allowed pointer-events-none" : "cursor-pointer active:scale-[0.99]";
        var existingClass = output.Attributes["class"]?.Value?.ToString() ?? "";
        output.Attributes.SetAttribute("class", $"panoptes-actionsheet-item k-actionsheet-item {themeClass} {disabledClass} {existingClass} {CssClass}".Trim());

        // Icon HTML
        var iconHtml = "";
        if (!string.IsNullOrWhiteSpace(Icon))
        {
            if (Icon.StartsWith("<svg"))
            {
                iconHtml = $@"<span class=""panoptes-actionsheet-item-icon shrink-0 w-5 h-5 flex items-center justify-center"">{Icon}</span>";
            }
            else
            {
                iconHtml = $@"<span class=""panoptes-actionsheet-item-icon shrink-0 w-5 h-5 flex items-center justify-center {Icon}""></span>";
            }
        }
        else if (!string.IsNullOrWhiteSpace(ImageUrl))
        {
            iconHtml = $@"<img src=""{ImageUrl}"" alt="""" class=""panoptes-actionsheet-item-image shrink-0 w-6 h-6 rounded-full object-cover"" />";
        }

        // Text & Description HTML
        var descHtml = !string.IsNullOrWhiteSpace(Description)
            ? $@"<span class=""panoptes-actionsheet-item-desc text-[11px] text-slate-400 block mt-0.5 leading-tight"">{HtmlEncoder.Default.Encode(Description)}</span>"
            : "";

        var textContent = !string.IsNullOrWhiteSpace(Text) ? HtmlEncoder.Default.Encode(Text) : "";

        var bodyHtml = $@"
            {iconHtml}
            <div class=""panoptes-actionsheet-item-text-wrapper min-w-0 flex-1"">
                <span class=""panoptes-actionsheet-item-title text-sm font-semibold block leading-tight truncate"">{textContent}</span>
                {descHtml}
            </div>
            {childContent.GetContent()}
        ";

        output.Content.SetHtmlContent(bodyHtml);
    }
}
