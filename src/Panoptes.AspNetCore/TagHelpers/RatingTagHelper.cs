using System;
using System.Text.Json;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc.Rendering;
using Microsoft.AspNetCore.Razor.TagHelpers;
using Panoptes.AspNetCore.Models;

namespace Panoptes.AspNetCore.TagHelpers;

/// <summary>
/// Panoptes UI Rating bileşeni,, yıldız, kalp ve yarım puan destekli etkileşimli puanlama TagHelper'ı.
/// </summary>
[HtmlTargetElement("panoptes-rating")]
public class RatingTagHelper : TagHelper
{
    [HtmlAttributeName("id")]
    public string? Id { get; set; }

    [HtmlAttributeName("value")]
    public decimal Value { get; set; } = 0;

    [HtmlAttributeName("max")]
    public int Max { get; set; } = 5;

    [HtmlAttributeName("precision")]
    public decimal Precision { get; set; } = 1;

    [HtmlAttributeName("readonly")]
    public bool Readonly { get; set; } = false;

    [HtmlAttributeName("disabled")]
    public bool Disabled { get; set; } = false;

    [HtmlAttributeName("icon")]
    public RatingIcon Icon { get; set; } = RatingIcon.Star;

    [HtmlAttributeName("show-label")]
    public bool ShowLabel { get; set; } = true;

    [HtmlAttributeName("on-change")]
    public string? OnChange { get; set; }

    [HtmlAttributeName("class")]
    public string? CssClass { get; set; }

    public override async Task ProcessAsync(TagHelperContext context, TagHelperOutput output)
    {
        var id = !string.IsNullOrWhiteSpace(Id) ? Id : $"panoptes_rating_{Guid.NewGuid():N}";

        output.TagName = "div";
        output.TagMode = TagMode.StartTagAndEndTag;
        output.Attributes.SetAttribute("id", id);
        output.Attributes.SetAttribute("data-panoptes-rating", "true");

        var config = new
        {
            id = id,
            value = Value,
            max = Max,
            precision = Precision,
            isReadonly = Readonly,
            disabled = Disabled,
            icon = Icon.ToString().ToLowerInvariant(),
            showLabel = ShowLabel,
            onChange = OnChange
        };

        output.Attributes.SetAttribute("data-config", JsonSerializer.Serialize(config));

        var baseClass = $"panoptes-rating inline-flex items-center gap-2 select-none {(Disabled ? "opacity-50 cursor-not-allowed" : "")} {CssClass ?? ""}".Trim();
        output.Attributes.SetAttribute("class", baseClass);

        output.Content.Clear();

        // 1. İkon Kutuları Kapsayıcısı
        var iconsWrapper = new TagBuilder("div");
        iconsWrapper.AddCssClass("panoptes-rating-items flex items-center gap-1");
        output.Content.AppendHtml(iconsWrapper);

        // 2. Etiket (Varsa)
        if (ShowLabel)
        {
            var label = new TagBuilder("span");
            label.AddCssClass("panoptes-rating-label text-xs font-bold font-mono text-slate-700 ml-1.5");
            label.InnerHtml.Append($"{Value:0.#} / {Max}");
            output.Content.AppendHtml(label);
        }

        // 3. Form gönderimi için gizli input
        var hiddenInput = new TagBuilder("input");
        hiddenInput.Attributes["type"] = "hidden";
        hiddenInput.Attributes["name"] = id;
        hiddenInput.Attributes["value"] = Value.ToString(System.Globalization.CultureInfo.InvariantCulture);
        output.Content.AppendHtml(hiddenInput);

        await output.GetChildContentAsync();
    }
}
