using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc.Rendering;
using Microsoft.AspNetCore.Razor.TagHelpers;
using Panoptes.AspNetCore.Models;

namespace Panoptes.AspNetCore.TagHelpers;

/// <summary>
/// Panoptes UI TaskBoard bileşeni, modern, HTML5 Drag & Drop destekli Kanban panosu TagHelper'ı.
/// </summary>
[HtmlTargetElement("panoptes-taskboard")]
public class TaskBoardTagHelper : TagHelper
{
    [HtmlAttributeName("id")]
    public string? Id { get; set; }

    [HtmlAttributeName("columns")]
    public List<TaskBoardColumnModel>? Columns { get; set; }

    [HtmlAttributeName("on-card-moved")]
    public string? OnCardMoved { get; set; }

    [HtmlAttributeName("class")]
    public string? CssClass { get; set; }

    public override async Task ProcessAsync(TagHelperContext context, TagHelperOutput output)
    {
        var id = !string.IsNullOrWhiteSpace(Id) ? Id : $"panoptes_tb_{Guid.NewGuid():N}";
        var tbContext = new TaskBoardContext
        {
            Id = id,
            OnCardMoved = OnCardMoved,
            Columns = Columns ?? new List<TaskBoardColumnModel>()
        };

        context.Items[typeof(TaskBoardContext)] = tbContext;

        // Çocuk <panoptes-taskboard-column> etiketlerini yürüt
        await output.GetChildContentAsync();

        output.TagName = "div";
        output.TagMode = TagMode.StartTagAndEndTag;
        output.Attributes.SetAttribute("id", id);
        output.Attributes.SetAttribute("data-panoptes-taskboard", "true");

        if (!string.IsNullOrWhiteSpace(OnCardMoved))
            output.Attributes.SetAttribute("data-on-card-moved", OnCardMoved);

        var baseClass = $"panoptes-taskboard flex items-start gap-4 overflow-x-auto pb-4 select-none {CssClass ?? ""}".Trim();
        output.Attributes.SetAttribute("class", baseClass);

        output.Content.Clear();

        foreach (var col in tbContext.Columns)
        {
            var colDiv = RenderColumn(col);
            output.Content.AppendHtml(colDiv);
        }
    }

    private TagBuilder RenderColumn(TaskBoardColumnModel col)
    {
        var colId = col.Id ?? $"col_{Guid.NewGuid():N}";
        var div = new TagBuilder("div");
        div.AddCssClass("panoptes-tb-column w-72 shrink-0 bg-slate-100/80 rounded-2xl p-3 border border-slate-200 flex flex-col max-h-[700px]");
        div.Attributes["data-column-id"] = colId;

        // Kolon Başlığı
        var header = new TagBuilder("div");
        header.AddCssClass("flex items-center justify-between pb-3 px-1 border-b border-slate-200/60 mb-3");

        var titleWrap = new TagBuilder("div");
        titleWrap.AddCssClass("flex items-center gap-2");

        var badge = new TagBuilder("span");
        badge.AddCssClass($"w-2.5 h-2.5 rounded-full {col.BadgeColor ?? "bg-blue-500"}");
        titleWrap.InnerHtml.AppendHtml(badge);

        var titleSpan = new TagBuilder("span");
        titleSpan.AddCssClass("text-xs font-bold text-slate-800");
        titleSpan.InnerHtml.Append(col.Title ?? "Sütun");
        titleWrap.InnerHtml.AppendHtml(titleSpan);

        var countBadge = new TagBuilder("span");
        countBadge.AddCssClass("text-[10px] font-mono font-bold bg-white text-slate-600 px-2 py-0.5 rounded-full border border-slate-200");
        countBadge.InnerHtml.Append(col.Cards.Count.ToString());

        header.InnerHtml.AppendHtml(titleWrap);
        header.InnerHtml.AppendHtml(countBadge);
        div.InnerHtml.AppendHtml(header);

        // Kartlar Konteyneri (Drop Zone)
        var cardsContainer = new TagBuilder("div");
        cardsContainer.AddCssClass("panoptes-tb-cards flex-1 overflow-y-auto space-y-2.5 pr-1 min-h-[100px]");
        cardsContainer.Attributes["data-drop-zone"] = "true";

        foreach (var card in col.Cards)
        {
            cardsContainer.InnerHtml.AppendHtml(RenderCard(card, colId));
        }

        div.InnerHtml.AppendHtml(cardsContainer);
        return div;
    }

    private TagBuilder RenderCard(TaskBoardCardModel card, string colId)
    {
        var cardId = card.Id ?? $"card_{Guid.NewGuid():N}";
        var div = new TagBuilder("div");
        div.AddCssClass("panoptes-tb-card bg-white rounded-xl p-3.5 border border-slate-200/90 shadow-2xs hover:shadow-md transition-all cursor-grab active:cursor-grabbing group");
        div.Attributes["draggable"] = "true";
        div.Attributes["data-card-id"] = cardId;
        div.Attributes["data-column-id"] = colId;

        // Üst Kısım: Kategori ve Öncelik
        var topRow = new TagBuilder("div");
        topRow.AddCssClass("flex items-center justify-between gap-2 mb-2");

        if (!string.IsNullOrWhiteSpace(card.Category))
        {
            var cat = new TagBuilder("span");
            cat.AddCssClass("text-[10px] font-bold text-slate-400 uppercase tracking-wider");
            cat.InnerHtml.Append(card.Category);
            topRow.InnerHtml.AppendHtml(cat);
        }

        // Öncelik Rozeti
        var priorityBadge = RenderPriorityBadge(card.Priority);
        topRow.InnerHtml.AppendHtml(priorityBadge);
        div.InnerHtml.AppendHtml(topRow);

        // Başlık
        var title = new TagBuilder("div");
        title.AddCssClass("text-xs font-bold text-slate-800 mb-1 leading-snug group-hover:text-blue-600 transition-colors");
        title.InnerHtml.Append(card.Title ?? "");
        div.InnerHtml.AppendHtml(title);

        // Açıklama
        if (!string.IsNullOrWhiteSpace(card.Description))
        {
            var desc = new TagBuilder("div");
            desc.AddCssClass("text-[11px] text-slate-500 mb-3 line-clamp-2 leading-relaxed");
            desc.InnerHtml.Append(card.Description);
            div.InnerHtml.AppendHtml(desc);
        }

        // Alt Kısım: Tarih ve Atanan Kişi
        var bottomRow = new TagBuilder("div");
        bottomRow.AddCssClass("flex items-center justify-between pt-2 border-t border-slate-100 text-[10px] text-slate-400");

        if (card.DueDate.HasValue)
        {
            var dateWrap = new TagBuilder("div");
            dateWrap.AddCssClass("flex items-center gap-1");
            dateWrap.InnerHtml.AppendHtml(@"<svg class=""w-3 h-3 text-slate-400"" fill=""none"" stroke=""currentColor"" viewBox=""0 0 24 24""><path stroke-linecap=""round"" stroke-linejoin=""round"" stroke-width=""2"" d=""M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z""/></svg>");
            var dateSpan = new TagBuilder("span");
            dateSpan.InnerHtml.Append(card.DueDate.Value.ToString("dd MMM"));
            dateWrap.InnerHtml.AppendHtml(dateSpan);
            bottomRow.InnerHtml.AppendHtml(dateWrap);
        }
        else
        {
            bottomRow.InnerHtml.AppendHtml("<span></span>");
        }

        if (!string.IsNullOrWhiteSpace(card.AssigneeName))
        {
            var userWrap = new TagBuilder("div");
            userWrap.AddCssClass("flex items-center gap-1.5");
            var avatar = new TagBuilder("span");
            avatar.AddCssClass("w-5 h-5 rounded-full bg-blue-100 text-blue-700 font-bold flex items-center justify-center text-[9px]");
            var initials = card.AssigneeName.Length > 2 ? card.AssigneeName.Substring(0, 2).ToUpper() : card.AssigneeName.ToUpper();
            avatar.InnerHtml.Append(initials);
            userWrap.InnerHtml.AppendHtml(avatar);

            var nameSpan = new TagBuilder("span");
            nameSpan.AddCssClass("font-medium text-slate-600");
            nameSpan.InnerHtml.Append(card.AssigneeName);
            userWrap.InnerHtml.AppendHtml(nameSpan);

            bottomRow.InnerHtml.AppendHtml(userWrap);
        }

        div.InnerHtml.AppendHtml(bottomRow);
        return div;
    }

    private TagBuilder RenderPriorityBadge(TaskPriority priority)
    {
        var span = new TagBuilder("span");
        switch (priority)
        {
            case TaskPriority.Urgent:
                span.AddCssClass("text-[10px] font-bold px-1.5 py-0.5 rounded bg-rose-100 text-rose-700 border border-rose-200");
                span.InnerHtml.Append("Acil");
                break;
            case TaskPriority.High:
                span.AddCssClass("text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-100 text-amber-700 border border-amber-200");
                span.InnerHtml.Append("Yüksek");
                break;
            case TaskPriority.Low:
                span.AddCssClass("text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200");
                span.InnerHtml.Append("Düşük");
                break;
            case TaskPriority.Medium:
            default:
                span.AddCssClass("text-[10px] font-bold px-1.5 py-0.5 rounded bg-blue-100 text-blue-700 border border-blue-200");
                span.InnerHtml.Append("Normal");
                break;
        }
        return span;
    }
}

/// <summary>
/// TaskBoard içerisindeki bir sütun (column).
/// </summary>
[HtmlTargetElement("panoptes-taskboard-column", ParentTag = "panoptes-taskboard")]
public class TaskBoardColumnTagHelper : TagHelper
{
    [HtmlAttributeName("id")]
    public string? Id { get; set; }

    [HtmlAttributeName("title")]
    public string? Title { get; set; }

    [HtmlAttributeName("badge-color")]
    public string? BadgeColor { get; set; } = "bg-blue-500";

    public override async Task ProcessAsync(TagHelperContext context, TagHelperOutput output)
    {
        if (!context.Items.TryGetValue(typeof(TaskBoardContext), out var obj) || obj is not TaskBoardContext tbContext)
        {
            output.SuppressOutput();
            return;
        }

        var colModel = new TaskBoardColumnModel
        {
            Id = Id,
            Title = Title,
            BadgeColor = BadgeColor
        };

        context.Items[typeof(TaskBoardColumnModel)] = colModel;
        await output.GetChildContentAsync();

        tbContext.Columns.Add(colModel);
        output.SuppressOutput();
    }
}

/// <summary>
/// TaskBoard sütunu içindeki bir kart (card).
/// </summary>
[HtmlTargetElement("panoptes-taskboard-card", ParentTag = "panoptes-taskboard-column")]
public class TaskBoardCardTagHelper : TagHelper
{
    [HtmlAttributeName("id")]
    public string? Id { get; set; }

    [HtmlAttributeName("title")]
    public string? Title { get; set; }

    [HtmlAttributeName("description")]
    public string? Description { get; set; }

    [HtmlAttributeName("priority")]
    public TaskPriority Priority { get; set; } = TaskPriority.Medium;

    [HtmlAttributeName("category")]
    public string? Category { get; set; }

    [HtmlAttributeName("assignee")]
    public string? Assignee { get; set; }

    [HtmlAttributeName("due-date")]
    public DateTime? DueDate { get; set; }

    public override void Process(TagHelperContext context, TagHelperOutput output)
    {
        if (!context.Items.TryGetValue(typeof(TaskBoardColumnModel), out var obj) || obj is not TaskBoardColumnModel colModel)
        {
            output.SuppressOutput();
            return;
        }

        colModel.Cards.Add(new TaskBoardCardModel
        {
            Id = Id,
            Title = Title,
            Description = Description,
            Priority = Priority,
            Category = Category,
            AssigneeName = Assignee,
            DueDate = DueDate,
            ColumnId = colModel.Id
        });

        output.SuppressOutput();
    }
}
