using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc.Rendering;
using Microsoft.AspNetCore.Razor.TagHelpers;
using Panoptes.AspNetCore.Models;

namespace Panoptes.AspNetCore.TagHelpers;

/// <summary>
/// Panoptes UI Stepper & Wizard bileşeni, modern, çok adımlı form sihirbazı TagHelper'ı.
/// </summary>
[HtmlTargetElement("panoptes-stepper")]
public class StepperTagHelper : TagHelper
{
    [HtmlAttributeName("id")]
    public string? Id { get; set; }

    [HtmlAttributeName("orientation")]
    public string Orientation { get; set; } = "horizontal"; // horizontal, vertical

    [HtmlAttributeName("linear")]
    public bool Linear { get; set; } = true;

    [HtmlAttributeName("on-select")]
    public string? OnSelect { get; set; }

    [HtmlAttributeName("on-change")]
    public string? OnChange { get; set; }

    [HtmlAttributeName("class")]
    public string? CssClass { get; set; }

    public override async Task ProcessAsync(TagHelperContext context, TagHelperOutput output)
    {
        var id = !string.IsNullOrWhiteSpace(Id) ? Id : $"panoptes_stepper_{Guid.NewGuid():N}";
        var stepperContext = new StepperContext
        {
            Id = id,
            Orientation = Orientation.ToLowerInvariant(),
            Linear = Linear,
            OnSelect = OnSelect,
            OnChange = OnChange
        };

        context.Items[typeof(StepperContext)] = stepperContext;

        // Çocuk <panoptes-step> etiketlerini yürüt
        await output.GetChildContentAsync();

        // Eğer hiçbir adım seçili değilse ilk adımı seç
        if (stepperContext.Steps.Count > 0 && !stepperContext.Steps.Any(s => s.Selected))
        {
            stepperContext.Steps[0].Selected = true;
        }

        output.TagName = "div";
        output.TagMode = TagMode.StartTagAndEndTag;
        output.Attributes.SetAttribute("id", id);
        output.Attributes.SetAttribute("data-panoptes-stepper", "true");
        output.Attributes.SetAttribute("data-orientation", stepperContext.Orientation);
        output.Attributes.SetAttribute("data-linear", stepperContext.Linear ? "true" : "false");

        if (!string.IsNullOrWhiteSpace(OnSelect))
            output.Attributes.SetAttribute("data-on-select", OnSelect);
        if (!string.IsNullOrWhiteSpace(OnChange))
            output.Attributes.SetAttribute("data-on-change", OnChange);

        var isVertical = stepperContext.Orientation == "vertical";
        var wrapperClass = $"panoptes-stepper flex {(isVertical ? "flex-row gap-8" : "flex-col gap-6")} w-full {CssClass ?? ""}".Trim();
        output.Attributes.SetAttribute("class", wrapperClass);

        output.Content.Clear();

        // 1. Stepper Header Bar (Adım Göstergeleri)
        var navBar = RenderStepperNav(stepperContext);
        output.Content.AppendHtml(navBar);

        // 2. Step Contents Wrapper (Her adımın form / içerik alanı)
        var contentsContainer = new TagBuilder("div");
        contentsContainer.AddCssClass("panoptes-stepper-contents flex-1 bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs space-y-6");

        for (int i = 0; i < stepperContext.Steps.Count; i++)
        {
            var step = stepperContext.Steps[i];
            var stepPane = new TagBuilder("div");
            stepPane.AddCssClass("panoptes-step-pane " + (step.Selected ? "" : "hidden"));
            stepPane.Attributes["data-step-index"] = i.ToString();
            stepPane.Attributes["data-step-id"] = step.Id ?? $"step_{i}";

            stepPane.InnerHtml.AppendHtml(step.ContentHtml ?? string.Empty);
            contentsContainer.InnerHtml.AppendHtml(stepPane);
        }

        // 3. Navigation Buttons Bar (Geri / İleri)
        var navButtons = new TagBuilder("div");
        navButtons.AddCssClass("flex items-center justify-between pt-4 border-t border-slate-100");

        var prevBtn = new TagBuilder("button");
        prevBtn.Attributes["type"] = "button";
        prevBtn.Attributes["data-stepper-prev"] = "true";
        prevBtn.AddCssClass("px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition disabled:opacity-40 disabled:cursor-not-allowed");
        prevBtn.InnerHtml.Append("← Geri");
        navButtons.InnerHtml.AppendHtml(prevBtn);

        var nextBtn = new TagBuilder("button");
        nextBtn.Attributes["type"] = "button";
        nextBtn.Attributes["data-stepper-next"] = "true";
        nextBtn.AddCssClass("px-5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs transition disabled:opacity-40 disabled:cursor-not-allowed");
        nextBtn.InnerHtml.Append("İleri →");
        navButtons.InnerHtml.AppendHtml(nextBtn);

        contentsContainer.InnerHtml.AppendHtml(navButtons);
        output.Content.AppendHtml(contentsContainer);
    }

    private TagBuilder RenderStepperNav(StepperContext context)
    {
        var isVertical = context.Orientation == "vertical";
        var ol = new TagBuilder("ol");
        ol.AddCssClass($"panoptes-stepper-nav flex {(isVertical ? "flex-col space-y-6 w-64 shrink-0" : "flex-row items-center justify-between w-full relative")} select-none");

        for (int i = 0; i < context.Steps.Count; i++)
        {
            var step = context.Steps[i];
            bool isLast = (i == context.Steps.Count - 1);
            var li = RenderStepNavItem(step, i, isLast, isVertical);
            ol.InnerHtml.AppendHtml(li);
        }

        return ol;
    }

    private TagBuilder RenderStepNavItem(StepperStepModel step, int index, bool isLast, bool isVertical)
    {
        var li = new TagBuilder("li");
        li.AddCssClass($"panoptes-step-nav-item flex {(isVertical ? "items-start" : "items-center flex-1")} relative group");
        li.Attributes["data-step-index"] = index.ToString();

        // Buton veya Bağlantı
        var btn = new TagBuilder("button");
        btn.Attributes["type"] = "button";
        btn.Attributes["data-step-trigger"] = "true";
        btn.AddCssClass($"flex {(isVertical ? "flex-row" : "flex-col sm:flex-row")} items-center gap-3 text-left transition " +
            (step.Disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"));

        // Adım Çemberi (Indicator Circle)
        var circle = new TagBuilder("span");
        var circleStateClass = step.Completed
            ? "bg-emerald-600 text-white border-emerald-600 shadow-xs"
            : (step.Selected
                ? "bg-blue-600 text-white border-blue-600 ring-4 ring-blue-100 shadow-xs"
                : "bg-white text-slate-500 border-slate-300 hover:border-slate-400");

        circle.AddCssClass($"panoptes-step-circle w-8 h-8 rounded-full border-2 flex items-center justify-center font-bold text-xs shrink-0 transition-all {circleStateClass}");

        if (step.Completed)
        {
            // Tik simgesi
            circle.InnerHtml.AppendHtml(@"<svg class=""w-4 h-4"" fill=""none"" stroke=""currentColor"" viewBox=""0 0 24 24""><path stroke-linecap=""round"" stroke-linejoin=""round"" stroke-width=""2.5"" d=""M5 13l4 4L19 7""/></svg>");
        }
        else if (!string.IsNullOrWhiteSpace(step.Icon))
        {
            circle.InnerHtml.AppendHtml(GetIconSvg(step.Icon));
        }
        else
        {
            circle.InnerHtml.Append((index + 1).ToString());
        }

        btn.InnerHtml.AppendHtml(circle);

        // Metin Bilgileri (Title & Subtitle)
        var textDiv = new TagBuilder("div");
        textDiv.AddCssClass("min-w-0");

        var labelSpan = new TagBuilder("div");
        labelSpan.AddCssClass($"panoptes-step-label text-xs font-bold truncate " +
            (step.Selected ? "text-blue-700" : (step.Completed ? "text-slate-800" : "text-slate-500")));
        labelSpan.InnerHtml.Append(step.Label ?? $"Adım {index + 1}");
        textDiv.InnerHtml.AppendHtml(labelSpan);

        if (!string.IsNullOrWhiteSpace(step.Subtitle))
        {
            var subSpan = new TagBuilder("div");
            subSpan.AddCssClass("text-[11px] text-slate-400 truncate hidden sm:block");
            subSpan.InnerHtml.Append(step.Subtitle);
            textDiv.InnerHtml.AppendHtml(subSpan);
        }

        btn.InnerHtml.AppendHtml(textDiv);
        li.InnerHtml.AppendHtml(btn);

        // Ara Bağlantı Çizgisi (Connector Line)
        if (!isLast && !isVertical)
        {
            var line = new TagBuilder("div");
            var lineClass = step.Completed ? "bg-emerald-500" : "bg-slate-200";
            line.AddCssClass($"panoptes-step-line flex-1 h-0.5 mx-4 transition-colors {lineClass}");
            li.InnerHtml.AppendHtml(line);
        }

        return li;
    }

    private static string GetIconSvg(string iconName)
    {
        return iconName.ToLowerInvariant() switch
        {
            "user" => @"<svg class=""w-4 h-4"" fill=""none"" stroke=""currentColor"" viewBox=""0 0 24 24""><path stroke-linecap=""round"" stroke-linejoin=""round"" stroke-width=""2"" d=""M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z""/></svg>",
            "card" or "payment" => @"<svg class=""w-4 h-4"" fill=""none"" stroke=""currentColor"" viewBox=""0 0 24 24""><path stroke-linecap=""round"" stroke-linejoin=""round"" stroke-width=""2"" d=""M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z""/></svg>",
            "check" or "confirm" => @"<svg class=""w-4 h-4"" fill=""none"" stroke=""currentColor"" viewBox=""0 0 24 24""><path stroke-linecap=""round"" stroke-linejoin=""round"" stroke-width=""2"" d=""M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z""/></svg>",
            "settings" => @"<svg class=""w-4 h-4"" fill=""none"" stroke=""currentColor"" viewBox=""0 0 24 24""><path stroke-linecap=""round"" stroke-linejoin=""round"" stroke-width=""2"" d=""M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z""/><path stroke-linecap=""round"" stroke-linejoin=""round"" stroke-width=""2"" d=""M15 12a3 3 0 11-6 0 3 3 0 016 0z""/></svg>",
            _ => @"<svg class=""w-4 h-4"" fill=""none"" stroke=""currentColor"" viewBox=""0 0 24 24""><path stroke-linecap=""round"" stroke-linejoin=""round"" stroke-width=""2"" d=""M13 10V3L4 14h7v7l9-11h-7z""/></svg>"
        };
    }
}

/// <summary>
/// Sihirbaz adımı çocuk TagHelper.
/// </summary>
[HtmlTargetElement("panoptes-step", ParentTag = "panoptes-stepper")]
public class StepperStepTagHelper : TagHelper
{
    [HtmlAttributeName("id")]
    public string? Id { get; set; }

    [HtmlAttributeName("label")]
    public string? Label { get; set; }

    [HtmlAttributeName("subtitle")]
    public string? Subtitle { get; set; }

    [HtmlAttributeName("icon")]
    public string? Icon { get; set; }

    [HtmlAttributeName("selected")]
    public bool Selected { get; set; }

    [HtmlAttributeName("completed")]
    public bool Completed { get; set; }

    [HtmlAttributeName("disabled")]
    public bool Disabled { get; set; }

    public override async Task ProcessAsync(TagHelperContext context, TagHelperOutput output)
    {
        if (!context.Items.TryGetValue(typeof(StepperContext), out var obj) || obj is not StepperContext stepperContext)
        {
            output.SuppressOutput();
            return;
        }

        var childContent = await output.GetChildContentAsync();
        var html = childContent.GetContent();

        stepperContext.Steps.Add(new StepperStepModel
        {
            Id = !string.IsNullOrWhiteSpace(Id) ? Id : $"step_{stepperContext.Steps.Count}",
            Label = Label,
            Subtitle = Subtitle,
            Icon = Icon,
            Selected = Selected,
            Completed = Completed,
            Disabled = Disabled,
            ContentHtml = html
        });

        output.SuppressOutput();
    }
}
