using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc.Rendering;
using Microsoft.AspNetCore.Razor.TagHelpers;
using Panoptes.AspNetCore.Models;

namespace Panoptes.AspNetCore.TagHelpers;

/// <summary>
/// Panoptes UI TreeView bileşeni, modern, hiyerarşik ağaç/klasör görünümü TagHelper'ı.
/// </summary>
[HtmlTargetElement("panoptes-treeview")]
public class TreeViewTagHelper : TagHelper
{
    [HtmlAttributeName("id")]
    public string? Id { get; set; }

    [HtmlAttributeName("show-checkboxes")]
    public bool ShowCheckboxes { get; set; }

    [HtmlAttributeName("show-icons")]
    public bool ShowIcons { get; set; } = true;

    [HtmlAttributeName("items")]
    public IEnumerable<TreeViewItemModel>? Items { get; set; }

    [HtmlAttributeName("on-select")]
    public string? OnSelect { get; set; }

    [HtmlAttributeName("on-check")]
    public string? OnCheck { get; set; }

    [HtmlAttributeName("on-expand")]
    public string? OnExpand { get; set; }

    [HtmlAttributeName("on-collapse")]
    public string? OnCollapse { get; set; }

    [HtmlAttributeName("class")]
    public string? CssClass { get; set; }

    public override async Task ProcessAsync(TagHelperContext context, TagHelperOutput output)
    {
        var id = !string.IsNullOrWhiteSpace(Id) ? Id : $"panoptes_tree_{Guid.NewGuid():N}";
        var treeContext = new TreeViewContext
        {
            Id = id,
            ShowCheckboxes = ShowCheckboxes,
            ShowIcons = ShowIcons,
            OnSelect = OnSelect,
            OnCheck = OnCheck,
            OnExpand = OnExpand,
            OnCollapse = OnCollapse
        };

        if (Items != null)
        {
            treeContext.Items.AddRange(Items);
        }

        context.Items[typeof(TreeViewContext)] = treeContext;
        // Kök seviyesindeki çocuk koleksiyonunu temsil eden liste yığını
        var parentStack = new Stack<List<TreeViewItemModel>>();
        parentStack.Push(treeContext.Items);
        context.Items["PanoptesTreeViewParentStack"] = parentStack;

        // Çocuk <panoptes-treeview-item> etiketlerini yürüt
        await output.GetChildContentAsync();

        output.TagName = "div";
        output.TagMode = TagMode.StartTagAndEndTag;
        output.Attributes.SetAttribute("id", id);
        output.Attributes.SetAttribute("data-panoptes-treeview", "true");
        output.Attributes.SetAttribute("data-show-checkboxes", treeContext.ShowCheckboxes ? "true" : "false");

        if (!string.IsNullOrWhiteSpace(OnSelect))
            output.Attributes.SetAttribute("data-on-select", OnSelect);
        if (!string.IsNullOrWhiteSpace(OnCheck))
            output.Attributes.SetAttribute("data-on-check", OnCheck);
        if (!string.IsNullOrWhiteSpace(OnExpand))
            output.Attributes.SetAttribute("data-on-expand", OnExpand);
        if (!string.IsNullOrWhiteSpace(OnCollapse))
            output.Attributes.SetAttribute("data-on-collapse", OnCollapse);

        var treeClass = $"panoptes-treeview text-xs select-none space-y-1 {CssClass ?? ""}".Trim();
        output.Attributes.SetAttribute("class", treeClass);

        output.Content.Clear();

        var ulTag = new TagBuilder("ul");
        ulTag.AddCssClass("space-y-1");

        foreach (var item in treeContext.Items)
        {
            var liTag = RenderNode(item, treeContext);
            ulTag.InnerHtml.AppendHtml(liTag);
        }

        output.Content.AppendHtml(ulTag);
    }

    private TagBuilder RenderNode(TreeViewItemModel item, TreeViewContext treeContext)
    {
        var li = new TagBuilder("li");
        li.AddCssClass("panoptes-treeview-node");
        li.Attributes["data-node-id"] = item.Id ?? string.Empty;

        // 1. Düğüm Başlık Satırı
        var rowDiv = new TagBuilder("div");
        rowDiv.AddCssClass("panoptes-treeview-row flex items-center gap-1.5 py-1 px-2 rounded-lg hover:bg-slate-100 transition cursor-pointer " +
            (item.Disabled ? "opacity-50 pointer-events-none" : "text-slate-700"));
        rowDiv.Attributes["data-tree-row"] = "true";

        bool hasChildren = item.Children != null && item.Children.Count > 0;

        // Chevron Butonu (çocuk düğüm varsa)
        if (hasChildren)
        {
            var toggleBtn = new TagBuilder("button");
            toggleBtn.Attributes["type"] = "button";
            toggleBtn.Attributes["data-tree-toggle"] = "true";
            toggleBtn.AddCssClass("w-4 h-4 flex items-center justify-center text-slate-400 hover:text-slate-700 transition-transform duration-200 " +
                (item.Expanded ? "rotate-90 text-blue-600" : ""));
            toggleBtn.InnerHtml.AppendHtml(@"<svg class=""w-3 h-3"" fill=""none"" stroke=""currentColor"" viewBox=""0 0 24 24""><path stroke-linecap=""round"" stroke-linejoin=""round"" stroke-width=""2"" d=""M9 5l7 7-7 7""/></svg>");
            rowDiv.InnerHtml.AppendHtml(toggleBtn);
        }
        else
        {
            // Hizalamayı korumak için boşluk
            var spacer = new TagBuilder("span");
            spacer.AddCssClass("w-4 h-4 inline-block");
            rowDiv.InnerHtml.AppendHtml(spacer);
        }

        // Checkbox (varsa)
        if (treeContext.ShowCheckboxes)
        {
            var chk = new TagBuilder("input");
            chk.Attributes["type"] = "checkbox";
            chk.Attributes["data-tree-checkbox"] = "true";
            chk.AddCssClass("w-3.5 h-3.5 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer");
            if (item.Checked)
            {
                chk.Attributes["checked"] = "checked";
            }
            if (item.Disabled)
            {
                chk.Attributes["disabled"] = "disabled";
            }
            rowDiv.InnerHtml.AppendHtml(chk);
        }

        // İkon (varsa)
        if (treeContext.ShowIcons && !string.IsNullOrWhiteSpace(item.Icon))
        {
            var iconHtml = GetIconSvg(item.Icon, hasChildren, item.Expanded);
            rowDiv.InnerHtml.AppendHtml(iconHtml);
        }

        // Metin (Label)
        var labelSpan = new TagBuilder("span");
        labelSpan.AddCssClass("panoptes-tree-text flex-1 truncate font-medium");
        labelSpan.InnerHtml.Append(item.Text ?? string.Empty);
        rowDiv.InnerHtml.AppendHtml(labelSpan);

        // Rozet (Badge)
        if (!string.IsNullOrWhiteSpace(item.Badge))
        {
            var badgeSpan = new TagBuilder("span");
            var badgeClass = item.BadgeColor.ToLowerInvariant() switch
            {
                "emerald" => "bg-emerald-100 text-emerald-800",
                "amber" => "bg-amber-100 text-amber-800",
                "red" => "bg-red-100 text-red-800",
                _ => "bg-blue-100 text-blue-800"
            };
            badgeSpan.AddCssClass($"text-[10px] font-bold px-1.5 py-0.2 rounded-full {badgeClass}");
            badgeSpan.InnerHtml.Append(item.Badge);
            rowDiv.InnerHtml.AppendHtml(badgeSpan);
        }

        li.InnerHtml.AppendHtml(rowDiv);

        // 2. Alt Çocuklar (Recursive Children List)
        if (hasChildren)
        {
            var childrenUl = new TagBuilder("ul");
            childrenUl.AddCssClass("panoptes-treeview-group pl-4 ml-2 border-l border-slate-200 mt-0.5 space-y-1 " +
                (item.Expanded ? "" : "hidden"));
            childrenUl.Attributes["data-tree-group"] = "true";

            foreach (var child in item.Children!)
            {
                var childLi = RenderNode(child, treeContext);
                childrenUl.InnerHtml.AppendHtml(childLi);
            }

            li.InnerHtml.AppendHtml(childrenUl);
        }

        return li;
    }

    private static string GetIconSvg(string iconName, bool hasChildren, bool expanded)
    {
        return iconName.ToLowerInvariant() switch
        {
            "folder" => expanded
                ? @"<svg class=""w-4 h-4 text-amber-500"" fill=""none"" stroke=""currentColor"" viewBox=""0 0 24 24""><path stroke-linecap=""round"" stroke-linejoin=""round"" stroke-width=""2"" d=""M5 19a2 2 0 01-2-2V7a2 2 0 012-2h4l2 2h4a2 2 0 012 2v1M5 19h14a2 2 0 002-2v-5a2 2 0 00-2-2H9a2 2 0 00-2 2v5a2 2 0 01-2 2z""/></svg>"
                : @"<svg class=""w-4 h-4 text-amber-500"" fill=""none"" stroke=""currentColor"" viewBox=""0 0 24 24""><path stroke-linecap=""round"" stroke-linejoin=""round"" stroke-width=""2"" d=""M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z""/></svg>",
            "file" or "document" => @"<svg class=""w-4 h-4 text-blue-500"" fill=""none"" stroke=""currentColor"" viewBox=""0 0 24 24""><path stroke-linecap=""round"" stroke-linejoin=""round"" stroke-width=""2"" d=""M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z""/></svg>",
            "code" => @"<svg class=""w-4 h-4 text-purple-500"" fill=""none"" stroke=""currentColor"" viewBox=""0 0 24 24""><path stroke-linecap=""round"" stroke-linejoin=""round"" stroke-width=""2"" d=""M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4""/></svg>",
            "image" => @"<svg class=""w-4 h-4 text-emerald-500"" fill=""none"" stroke=""currentColor"" viewBox=""0 0 24 24""><path stroke-linecap=""round"" stroke-linejoin=""round"" stroke-width=""2"" d=""M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z""/></svg>",
            "database" => @"<svg class=""w-4 h-4 text-indigo-500"" fill=""none"" stroke=""currentColor"" viewBox=""0 0 24 24""><path stroke-linecap=""round"" stroke-linejoin=""round"" stroke-width=""2"" d=""M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4""/></svg>",
            _ => @"<svg class=""w-4 h-4 text-slate-400"" fill=""none"" stroke=""currentColor"" viewBox=""0 0 24 24""><path stroke-linecap=""round"" stroke-linejoin=""round"" stroke-width=""2"" d=""M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z""/></svg>"
        };
    }
}

/// <summary>
/// TreeView içindeki tek bir düğümü (ve onun alt çocuklarını) temsil eden çocuk TagHelper.
/// </summary>
[HtmlTargetElement("panoptes-treeview-item")]
public class TreeViewItemTagHelper : TagHelper
{
    [HtmlAttributeName("id")]
    public string? Id { get; set; }

    [HtmlAttributeName("text")]
    public string? Text { get; set; }

    [HtmlAttributeName("icon")]
    public string? Icon { get; set; }

    [HtmlAttributeName("url")]
    public string? Url { get; set; }

    [HtmlAttributeName("expanded")]
    public bool Expanded { get; set; }

    [HtmlAttributeName("checked")]
    public bool Checked { get; set; }

    [HtmlAttributeName("disabled")]
    public bool Disabled { get; set; }

    [HtmlAttributeName("badge")]
    public string? Badge { get; set; }

    [HtmlAttributeName("badge-color")]
    public string BadgeColor { get; set; } = "blue";

    public override async Task ProcessAsync(TagHelperContext context, TagHelperOutput output)
    {
        if (!context.Items.TryGetValue("PanoptesTreeViewParentStack", out var stackObj) || stackObj is not Stack<List<TreeViewItemModel>> parentStack)
        {
            output.SuppressOutput();
            return;
        }

        var currentParentList = parentStack.Peek();
        var node = new TreeViewItemModel
        {
            Id = !string.IsNullOrWhiteSpace(Id) ? Id : $"node_{Guid.NewGuid():N}",
            Text = Text,
            Icon = Icon,
            Url = Url,
            Expanded = Expanded,
            Checked = Checked,
            Disabled = Disabled,
            Badge = Badge,
            BadgeColor = BadgeColor,
            Children = new List<TreeViewItemModel>()
        };

        currentParentList.Add(node);

        // Bu düğümün çocukları için yeni listeyi yığına it
        parentStack.Push(node.Children);

        // İçerideki çocuk etiketleri yürüt
        await output.GetChildContentAsync();

        // Bu düğümün çocukları işlendi, yığından çek
        parentStack.Pop();

        output.SuppressOutput();
    }
}
