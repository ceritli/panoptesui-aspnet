using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc.Rendering;
using Microsoft.AspNetCore.Razor.TagHelpers;
using Panoptes.AspNetCore.Models;

namespace Panoptes.AspNetCore.TagHelpers;

/// <summary>
/// Panoptes UI Breadcrumb bileşeni, modern, erişilebilir yol çubuğu TagHelper bileşeni.
/// </summary>
[HtmlTargetElement("panoptes-breadcrumb")]
public class BreadcrumbTagHelper : TagHelper
{
    [HtmlAttributeName("id")]
    public string? Id { get; set; }

    /// <summary>
    /// Ayraç tipi: "chevron" (varsayılan), "slash" (bölü /), "arrow" (ok ->)
    /// </summary>
    [HtmlAttributeName("delimiter")]
    public string Delimiter { get; set; } = "chevron"; // chevron, slash, arrow

    /// <summary>
    /// Modelden gelen öğe listesi (opsiyonel).
    /// </summary>
    [HtmlAttributeName("items")]
    public IEnumerable<BreadcrumbItemModel>? Items { get; set; }

    [HtmlAttributeName("class")]
    public string? CssClass { get; set; }

    public override async Task ProcessAsync(TagHelperContext context, TagHelperOutput output)
    {
        var id = !string.IsNullOrWhiteSpace(Id) ? Id : $"panoptes_bc_{Guid.NewGuid():N}";
        var bcContext = new BreadcrumbContext
        {
            Id = id,
            Delimiter = Delimiter.ToLowerInvariant()
        };

        if (Items != null)
        {
            bcContext.Items.AddRange(Items);
        }

        context.Items[typeof(BreadcrumbContext)] = bcContext;

        // Çocuk <panoptes-breadcrumb-item> etiketlerini yürüt
        await output.GetChildContentAsync();

        output.TagName = "nav";
        output.TagMode = TagMode.StartTagAndEndTag;
        output.Attributes.SetAttribute("id", id);
        output.Attributes.SetAttribute("aria-label", "Breadcrumb");
        output.Attributes.SetAttribute("data-panoptes-breadcrumb", "true");

        var navClass = $"flex items-center text-xs font-medium text-slate-500 {CssClass ?? ""}".Trim();
        output.Attributes.SetAttribute("class", navClass);

        var olTag = new TagBuilder("ol");
        olTag.AddCssClass("inline-flex items-center space-x-1 md:space-x-2 flex-wrap gap-y-1");

        for (int i = 0; i < bcContext.Items.Count; i++)
        {
            var item = bcContext.Items[i];
            bool isLast = (i == bcContext.Items.Count - 1);
            var liTag = RenderBreadcrumbItem(item, i, isLast, bcContext.Delimiter);
            olTag.InnerHtml.AppendHtml(liTag);
        }

        output.Content.Clear();
        output.Content.AppendHtml(olTag);
    }

    private TagBuilder RenderBreadcrumbItem(BreadcrumbItemModel item, int index, bool isLast, string delimiter)
    {
        var li = new TagBuilder("li");
        li.AddCssClass("inline-flex items-center");

        // Ayraç (ilk öğe hariç)
        if (index > 0)
        {
            var delimSpan = new TagBuilder("span");
            delimSpan.AddCssClass("mx-1 text-slate-300 select-none flex items-center");
            delimSpan.InnerHtml.AppendHtml(GetDelimiterSvg(delimiter));
            li.InnerHtml.AppendHtml(delimSpan);
        }

        bool isCurrent = item.IsCurrent || isLast;

        if (isCurrent || string.IsNullOrWhiteSpace(item.Url) || item.Disabled)
        {
            var span = new TagBuilder("span");
            span.AddCssClass("flex items-center gap-1.5 " + (isCurrent ? "font-semibold text-slate-800" : "text-slate-400"));
            if (isCurrent)
            {
                span.Attributes["aria-current"] = "page";
            }

            if (!string.IsNullOrWhiteSpace(item.Icon))
            {
                span.InnerHtml.AppendHtml(GetIconSvg(item.Icon));
            }

            span.InnerHtml.Append(item.Text ?? string.Empty);
            li.InnerHtml.AppendHtml(span);
        }
        else
        {
            var link = new TagBuilder("a");
            link.Attributes["href"] = item.Url;
            link.AddCssClass("flex items-center gap-1.5 text-slate-600 hover:text-blue-600 transition");

            if (!string.IsNullOrWhiteSpace(item.Icon))
            {
                link.InnerHtml.AppendHtml(GetIconSvg(item.Icon));
            }

            link.InnerHtml.Append(item.Text ?? string.Empty);
            li.InnerHtml.AppendHtml(link);
        }

        return li;
    }

    private static string GetDelimiterSvg(string delimiter)
    {
        return delimiter switch
        {
            "slash" => @"<span class=""text-slate-300 font-light mx-0.5"">/</span>",
            "arrow" => @"<svg class=""w-3 h-3 text-slate-400"" fill=""none"" stroke=""currentColor"" viewBox=""0 0 24 24""><path stroke-linecap=""round"" stroke-linejoin=""round"" stroke-width=""2"" d=""M14 5l7 7m0 0l-7 7m7-7H3""/></svg>",
            _ => @"<svg class=""w-3.5 h-3.5 text-slate-400"" fill=""none"" stroke=""currentColor"" viewBox=""0 0 24 24""><path stroke-linecap=""round"" stroke-linejoin=""round"" stroke-width=""2"" d=""M9 5l7 7-7 7""/></svg>"
        };
    }

    private static string GetIconSvg(string iconName)
    {
        return iconName.ToLowerInvariant() switch
        {
            "home" => @"<svg class=""w-3.5 h-3.5 text-slate-400"" fill=""none"" stroke=""currentColor"" viewBox=""0 0 24 24""><path stroke-linecap=""round"" stroke-linejoin=""round"" stroke-width=""2"" d=""M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6""/></svg>",
            "folder" => @"<svg class=""w-3.5 h-3.5 text-slate-400"" fill=""none"" stroke=""currentColor"" viewBox=""0 0 24 24""><path stroke-linecap=""round"" stroke-linejoin=""round"" stroke-width=""2"" d=""M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z""/></svg>",
            "document" or "file" => @"<svg class=""w-3.5 h-3.5 text-slate-400"" fill=""none"" stroke=""currentColor"" viewBox=""0 0 24 24""><path stroke-linecap=""round"" stroke-linejoin=""round"" stroke-width=""2"" d=""M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z""/></svg>",
            "settings" => @"<svg class=""w-3.5 h-3.5 text-slate-400"" fill=""none"" stroke=""currentColor"" viewBox=""0 0 24 24""><path stroke-linecap=""round"" stroke-linejoin=""round"" stroke-width=""2"" d=""M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z""/><path stroke-linecap=""round"" stroke-linejoin=""round"" stroke-width=""2"" d=""M15 12a3 3 0 11-6 0 3 3 0 016 0z""/></svg>",
            "user" => @"<svg class=""w-3.5 h-3.5 text-slate-400"" fill=""none"" stroke=""currentColor"" viewBox=""0 0 24 24""><path stroke-linecap=""round"" stroke-linejoin=""round"" stroke-width=""2"" d=""M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z""/></svg>",
            _ => string.Empty
        };
    }
}

/// <summary>
/// Breadcrumb içindeki tek bir yol öğesini temsil eden çocuk TagHelper.
/// </summary>
[HtmlTargetElement("panoptes-breadcrumb-item", ParentTag = "panoptes-breadcrumb")]
public class BreadcrumbItemTagHelper : TagHelper
{
    [HtmlAttributeName("text")]
    public string? Text { get; set; }

    [HtmlAttributeName("url")]
    public string? Url { get; set; }

    [HtmlAttributeName("icon")]
    public string? Icon { get; set; }

    [HtmlAttributeName("is-current")]
    public bool IsCurrent { get; set; }

    [HtmlAttributeName("disabled")]
    public bool Disabled { get; set; }

    public override async Task ProcessAsync(TagHelperContext context, TagHelperOutput output)
    {
        if (!context.Items.TryGetValue(typeof(BreadcrumbContext), out var obj) || obj is not BreadcrumbContext bcContext)
        {
            output.SuppressOutput();
            return;
        }

        var childContent = await output.GetChildContentAsync();
        var innerText = childContent.GetContent().Trim();

        var itemText = !string.IsNullOrWhiteSpace(Text) ? Text : innerText;

        bcContext.Items.Add(new BreadcrumbItemModel
        {
            Text = itemText,
            Url = Url,
            Icon = Icon,
            IsCurrent = IsCurrent,
            Disabled = Disabled
        });

        output.SuppressOutput();
    }
}
