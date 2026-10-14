using System;
using System.Text.Json;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc.Rendering;
using Microsoft.AspNetCore.Razor.TagHelpers;
using Panoptes.AspNetCore.Models;

namespace Panoptes.AspNetCore.TagHelpers;

/// <summary>
/// Panoptes UI Barcode bileşeni,, saf SVG çizgili barkod bileşeni (Code128, Code39, EAN13).
/// </summary>
[HtmlTargetElement("panoptes-barcode")]
public class BarcodeTagHelper : TagHelper
{
    [HtmlAttributeName("id")]
    public string? Id { get; set; }

    [HtmlAttributeName("value")]
    public string Value { get; set; } = string.Empty;

    [HtmlAttributeName("type")]
    public BarcodeType Type { get; set; } = BarcodeType.Code128;

    [HtmlAttributeName("width")]
    public int Width { get; set; } = 280;

    [HtmlAttributeName("height")]
    public int Height { get; set; } = 100;

    [HtmlAttributeName("color")]
    public string Color { get; set; } = "#0f172a";

    [HtmlAttributeName("background")]
    public string BackgroundColor { get; set; } = "#ffffff";

    [HtmlAttributeName("show-text")]
    public bool ShowText { get; set; } = true;

    [HtmlAttributeName("title")]
    public string? Title { get; set; }

    [HtmlAttributeName("class")]
    public string? CssClass { get; set; }

    public override async Task ProcessAsync(TagHelperContext context, TagHelperOutput output)
    {
        var id = !string.IsNullOrWhiteSpace(Id) ? Id : $"panoptes_bc_{Guid.NewGuid():N}";

        output.TagName = "div";
        output.TagMode = TagMode.StartTagAndEndTag;
        output.Attributes.SetAttribute("id", id);
        output.Attributes.SetAttribute("data-panoptes-barcode", "true");

        var config = new
        {
            id = id,
            type = Type.ToString().ToLowerInvariant(),
            value = Value,
            width = Width,
            height = Height,
            color = Color,
            background = BackgroundColor,
            showText = ShowText,
            title = Title
        };

        output.Attributes.SetAttribute("data-config", JsonSerializer.Serialize(config));

        var baseClass = $"panoptes-barcode-card bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden flex flex-col items-center justify-center p-6 w-full {CssClass ?? ""}".Trim();
        output.Attributes.SetAttribute("class", baseClass);

        output.Content.Clear();

        if (!string.IsNullOrWhiteSpace(Title))
        {
            var header = new TagBuilder("div");
            header.AddCssClass("text-center mb-3 w-full");
            header.InnerHtml.AppendHtml($@"<h3 class=""text-sm font-bold text-slate-800"">{Title}</h3>");
            output.Content.AppendHtml(header);
        }

        var canvas = new TagBuilder("div");
        canvas.AddCssClass("panoptes-barcode-canvas flex items-center justify-center");
        output.Content.AppendHtml(canvas);

        await output.GetChildContentAsync();
    }
}

/// <summary>
/// Panoptes UI QRCode bileşeni,, 2D karekod SVG oluşturucu bileşen.
/// </summary>
[HtmlTargetElement("panoptes-qrcode")]
public class QrCodeTagHelper : TagHelper
{
    [HtmlAttributeName("id")]
    public string? Id { get; set; }

    [HtmlAttributeName("value")]
    public string Value { get; set; } = string.Empty;

    [HtmlAttributeName("size")]
    public int Size { get; set; } = 180;

    [HtmlAttributeName("color")]
    public string Color { get; set; } = "#0f172a";

    [HtmlAttributeName("background")]
    public string BackgroundColor { get; set; } = "#ffffff";

    [HtmlAttributeName("title")]
    public string? Title { get; set; }

    [HtmlAttributeName("class")]
    public string? CssClass { get; set; }

    public override async Task ProcessAsync(TagHelperContext context, TagHelperOutput output)
    {
        var id = !string.IsNullOrWhiteSpace(Id) ? Id : $"panoptes_qr_{Guid.NewGuid():N}";

        output.TagName = "div";
        output.TagMode = TagMode.StartTagAndEndTag;
        output.Attributes.SetAttribute("id", id);
        output.Attributes.SetAttribute("data-panoptes-barcode", "true");

        var config = new
        {
            id = id,
            type = "qrcode",
            value = Value,
            width = Size,
            height = Size,
            color = Color,
            background = BackgroundColor,
            showText = false,
            title = Title
        };

        output.Attributes.SetAttribute("data-config", JsonSerializer.Serialize(config));

        var baseClass = $"panoptes-qrcode-card bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden flex flex-col items-center justify-center p-6 w-full {CssClass ?? ""}".Trim();
        output.Attributes.SetAttribute("class", baseClass);

        output.Content.Clear();

        if (!string.IsNullOrWhiteSpace(Title))
        {
            var header = new TagBuilder("div");
            header.AddCssClass("text-center mb-3 w-full");
            header.InnerHtml.AppendHtml($@"<h3 class=""text-sm font-bold text-slate-800"">{Title}</h3>");
            output.Content.AppendHtml(header);
        }

        var canvas = new TagBuilder("div");
        canvas.AddCssClass("panoptes-barcode-canvas flex items-center justify-center");
        output.Content.AppendHtml(canvas);

        await output.GetChildContentAsync();
    }
}
