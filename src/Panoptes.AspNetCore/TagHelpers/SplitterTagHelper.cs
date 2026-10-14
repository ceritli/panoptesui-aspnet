using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc.Rendering;
using Microsoft.AspNetCore.Razor.TagHelpers;
using Panoptes.AspNetCore.Models;

namespace Panoptes.AspNetCore.TagHelpers;

/// <summary>
/// Panoptes UI Splitter bileşeni, modern, yeniden boyutlandırılabilir ve katlanabilir panel bölücü TagHelper'ı.
/// </summary>
[HtmlTargetElement("panoptes-splitter")]
public class SplitterTagHelper : TagHelper
{
    [HtmlAttributeName("id")]
    public string? Id { get; set; }

    [HtmlAttributeName("orientation")]
    public string Orientation { get; set; } = "horizontal"; // horizontal, vertical

    [HtmlAttributeName("on-resize")]
    public string? OnResize { get; set; }

    [HtmlAttributeName("on-collapse")]
    public string? OnCollapse { get; set; }

    [HtmlAttributeName("on-expand")]
    public string? OnExpand { get; set; }

    [HtmlAttributeName("class")]
    public string? CssClass { get; set; }

    public override async Task ProcessAsync(TagHelperContext context, TagHelperOutput output)
    {
        var id = !string.IsNullOrWhiteSpace(Id) ? Id : $"panoptes_spl_{Guid.NewGuid():N}";
        var splitterContext = new SplitterContext
        {
            Id = id,
            Orientation = Orientation.ToLowerInvariant(),
            OnResize = OnResize,
            OnCollapse = OnCollapse,
            OnExpand = OnExpand
        };

        context.Items[typeof(SplitterContext)] = splitterContext;

        // Çocuk <panoptes-splitter-pane> etiketlerini yürüt
        await output.GetChildContentAsync();

        output.TagName = "div";
        output.TagMode = TagMode.StartTagAndEndTag;
        output.Attributes.SetAttribute("id", id);
        output.Attributes.SetAttribute("data-panoptes-splitter", "true");
        output.Attributes.SetAttribute("data-orientation", splitterContext.Orientation);

        if (!string.IsNullOrWhiteSpace(OnResize))
            output.Attributes.SetAttribute("data-on-resize", OnResize);
        if (!string.IsNullOrWhiteSpace(OnCollapse))
            output.Attributes.SetAttribute("data-on-collapse", OnCollapse);
        if (!string.IsNullOrWhiteSpace(OnExpand))
            output.Attributes.SetAttribute("data-on-expand", OnExpand);

        var isVertical = splitterContext.Orientation == "vertical";
        var baseClass = $"panoptes-splitter flex {(isVertical ? "flex-col" : "flex-row")} w-full border border-slate-200 rounded-2xl bg-white shadow-2xs overflow-hidden select-none {CssClass ?? ""}".Trim();
        output.Attributes.SetAttribute("class", baseClass);

        output.Content.Clear();

        for (int i = 0; i < splitterContext.Panes.Count; i++)
        {
            var pane = splitterContext.Panes[i];
            var paneDiv = RenderPane(pane, i, isVertical);
            output.Content.AppendHtml(paneDiv);

            // Son pane değilse araya SplitBar (Ayırıcı Çubuk) yerleştir
            if (i < splitterContext.Panes.Count - 1)
            {
                var splitBar = RenderSplitBar(i, isVertical);
                output.Content.AppendHtml(splitBar);
            }
        }
    }

    private TagBuilder RenderPane(SplitterPaneModel pane, int index, bool isVertical)
    {
        var div = new TagBuilder("div");
        div.AddCssClass("panoptes-splitter-pane relative " + (pane.Scrollable ? "overflow-auto" : "overflow-hidden"));
        div.Attributes["data-pane-index"] = index.ToString();
        div.Attributes["data-pane-id"] = pane.Id ?? $"pane_{index}";

        if (!string.IsNullOrWhiteSpace(pane.MinSize))
            div.Attributes["data-min-size"] = pane.MinSize;
        if (!string.IsNullOrWhiteSpace(pane.MaxSize))
            div.Attributes["data-max-size"] = pane.MaxSize;
        if (!string.IsNullOrWhiteSpace(pane.Size))
            div.Attributes["data-default-size"] = pane.Size;

        div.Attributes["data-collapsible"] = pane.Collapsible ? "true" : "false";
        div.Attributes["data-resizable"] = pane.Resizable ? "true" : "false";

        // Stil (Size)
        var style = string.Empty;
        if (!string.IsNullOrWhiteSpace(pane.Size))
        {
            if (isVertical)
            {
                style = $"height: {pane.Size}; flex-shrink: 0;";
            }
            else
            {
                style = $"width: {pane.Size}; flex-shrink: 0;";
            }
        }
        else
        {
            style = "flex: 1 1 0%; min-width: 0;";
        }

        if (pane.Collapsed)
        {
            style += isVertical ? " height: 0px !important; display: none;" : " width: 0px !important; display: none;";
        }

        div.Attributes["style"] = style;
        div.InnerHtml.AppendHtml(pane.ContentHtml ?? string.Empty);
        return div;
    }

    private TagBuilder RenderSplitBar(int index, bool isVertical)
    {
        var bar = new TagBuilder("div");
        bar.Attributes["data-splitbar-index"] = index.ToString();
        bar.Attributes["data-splitbar"] = "true";

        if (isVertical)
        {
            bar.AddCssClass("panoptes-splitbar h-2 w-full bg-slate-100 hover:bg-blue-100 active:bg-blue-200 transition-colors flex items-center justify-center cursor-row-resize border-y border-slate-200 relative group z-10");
            bar.InnerHtml.AppendHtml(@"<div class=""w-8 h-1 rounded-full bg-slate-300 group-hover:bg-blue-500 transition-colors""></div>");
        }
        else
        {
            bar.AddCssClass("panoptes-splitbar w-2 h-full bg-slate-100 hover:bg-blue-100 active:bg-blue-200 transition-colors flex items-center justify-center cursor-col-resize border-x border-slate-200 relative group z-10");
            bar.InnerHtml.AppendHtml(@"<div class=""h-8 w-1 rounded-full bg-slate-300 group-hover:bg-blue-500 transition-colors""></div>");
        }

        return bar;
    }
}

/// <summary>
/// Splitter içerisindeki tek bir bölme (pane).
/// </summary>
[HtmlTargetElement("panoptes-splitter-pane", ParentTag = "panoptes-splitter")]
public class SplitterPaneTagHelper : TagHelper
{
    [HtmlAttributeName("id")]
    public string? Id { get; set; }

    [HtmlAttributeName("size")]
    public string? Size { get; set; }

    [HtmlAttributeName("min-size")]
    public string? MinSize { get; set; }

    [HtmlAttributeName("max-size")]
    public string? MaxSize { get; set; }

    [HtmlAttributeName("resizable")]
    public bool Resizable { get; set; } = true;

    [HtmlAttributeName("collapsible")]
    public bool Collapsible { get; set; } = true;

    [HtmlAttributeName("collapsed")]
    public bool Collapsed { get; set; }

    [HtmlAttributeName("scrollable")]
    public bool Scrollable { get; set; } = true;

    public override async Task ProcessAsync(TagHelperContext context, TagHelperOutput output)
    {
        if (!context.Items.TryGetValue(typeof(SplitterContext), out var obj) || obj is not SplitterContext splitterContext)
        {
            output.SuppressOutput();
            return;
        }

        var childContent = await output.GetChildContentAsync();
        var html = childContent.GetContent();

        splitterContext.Panes.Add(new SplitterPaneModel
        {
            Id = Id,
            Size = Size,
            MinSize = MinSize,
            MaxSize = MaxSize,
            Resizable = Resizable,
            Collapsible = Collapsible,
            Collapsed = Collapsed,
            Scrollable = Scrollable,
            ContentHtml = html
        });

        output.SuppressOutput();
    }
}
