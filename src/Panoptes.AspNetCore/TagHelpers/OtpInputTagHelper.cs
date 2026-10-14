using System;
using System.Text.Json;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc.Rendering;
using Microsoft.AspNetCore.Razor.TagHelpers;
using Panoptes.AspNetCore.Models;

namespace Panoptes.AspNetCore.TagHelpers;

/// <summary>
/// Panoptes UI OTP Input bileşeni,, SMS ve iki aşamalı doğrulama kutucukları TagHelper'ı.
/// Otomatik odaklanma, panodan yapıştırma (paste) ve tamamlama olaylarını destekler.
/// </summary>
[HtmlTargetElement("panoptes-otp")]
public class OtpInputTagHelper : TagHelper
{
    [HtmlAttributeName("id")]
    public string? Id { get; set; }

    [HtmlAttributeName("length")]
    public int Length { get; set; } = 6;

    [HtmlAttributeName("type")]
    public OtpInputType Type { get; set; } = OtpInputType.Number;

    [HtmlAttributeName("value")]
    public string? Value { get; set; }

    [HtmlAttributeName("mask")]
    public bool Mask { get; set; } = false;

    [HtmlAttributeName("auto-focus")]
    public bool AutoFocus { get; set; } = false;

    [HtmlAttributeName("disabled")]
    public bool Disabled { get; set; } = false;

    [HtmlAttributeName("on-complete")]
    public string? OnComplete { get; set; }

    [HtmlAttributeName("class")]
    public string? CssClass { get; set; }

    public override async Task ProcessAsync(TagHelperContext context, TagHelperOutput output)
    {
        var id = !string.IsNullOrWhiteSpace(Id) ? Id : $"panoptes_otp_{Guid.NewGuid():N}";

        output.TagName = "div";
        output.TagMode = TagMode.StartTagAndEndTag;
        output.Attributes.SetAttribute("id", id);
        output.Attributes.SetAttribute("data-panoptes-otp", "true");

        var config = new
        {
            id = id,
            length = Length,
            type = Type.ToString().ToLowerInvariant(),
            value = Value ?? "",
            mask = Mask,
            autoFocus = AutoFocus,
            disabled = Disabled,
            onComplete = OnComplete
        };

        output.Attributes.SetAttribute("data-config", JsonSerializer.Serialize(config));

        var baseClass = $"panoptes-otp-wrapper flex items-center justify-center gap-2 select-none {CssClass ?? ""}".Trim();
        output.Attributes.SetAttribute("class", baseClass);

        output.Content.Clear();

        // Kutucuklar (Inputs)
        var initVal = Value ?? "";
        for (var i = 0; i < Length; i++)
        {
            var charVal = i < initVal.Length ? initVal[i].ToString() : "";
            var input = new TagBuilder("input");
            input.Attributes["type"] = Mask ? "password" : (Type == OtpInputType.Number ? "tel" : "text");
            input.Attributes["maxlength"] = "1";
            input.Attributes["inputmode"] = Type == OtpInputType.Number ? "numeric" : "text";
            input.Attributes["data-otp-index"] = i.ToString();
            input.Attributes["value"] = charVal;
            input.Attributes["autocomplete"] = "one-time-code";

            if (Disabled)
                input.Attributes["disabled"] = "disabled";

            input.AddCssClass("w-12 h-14 text-center text-xl font-bold font-mono text-slate-800 bg-white border-2 border-slate-200 rounded-xl shadow-2xs transition-all duration-150 focus:border-blue-600 focus:ring-4 focus:ring-blue-100 focus:outline-hidden disabled:bg-slate-100 disabled:text-slate-400 disabled:cursor-not-allowed");

            output.Content.AppendHtml(input);
        }

        // Form gönderimi için gizli tam değer input'u
        var hiddenInput = new TagBuilder("input");
        hiddenInput.Attributes["type"] = "hidden";
        hiddenInput.Attributes["name"] = id;
        hiddenInput.Attributes["value"] = initVal;
        output.Content.AppendHtml(hiddenInput);

        await output.GetChildContentAsync();
    }
}
