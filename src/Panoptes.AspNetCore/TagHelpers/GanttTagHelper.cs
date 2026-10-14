using System;
using System.Collections.Generic;
using System.Globalization;
using System.Linq;
using System.Text.Json;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc.Rendering;
using Microsoft.AspNetCore.Razor.TagHelpers;
using Panoptes.AspNetCore.Models;

namespace Panoptes.AspNetCore.TagHelpers;

/// <summary>
/// Panoptes UI Gantt bileşeni, modern, görev ağacı ve zaman çizelgesi (Timeline) destekli Gantt şeması TagHelper'ı.
/// </summary>
[HtmlTargetElement("panoptes-gantt")]
public class GanttTagHelper : TagHelper
{
    [HtmlAttributeName("id")]
    public string? Id { get; set; }

    [HtmlAttributeName("tasks")]
    public List<GanttTaskModel>? Tasks { get; set; }

    [HtmlAttributeName("on-task-click")]
    public string? OnTaskClick { get; set; }

    [HtmlAttributeName("class")]
    public string? CssClass { get; set; }

    public override async Task ProcessAsync(TagHelperContext context, TagHelperOutput output)
    {
        var id = !string.IsNullOrWhiteSpace(Id) ? Id : $"panoptes_gantt_{Guid.NewGuid():N}";
        var ganttContext = new GanttContext
        {
            Id = id,
            Tasks = Tasks ?? new List<GanttTaskModel>(),
            OnTaskClick = OnTaskClick
        };

        context.Items[typeof(GanttContext)] = ganttContext;
        await output.GetChildContentAsync();

        output.TagName = "div";
        output.TagMode = TagMode.StartTagAndEndTag;
        output.Attributes.SetAttribute("id", id);
        output.Attributes.SetAttribute("data-panoptes-gantt", "true");

        if (!string.IsNullOrWhiteSpace(OnTaskClick))
            output.Attributes.SetAttribute("data-on-task-click", OnTaskClick);

        var tasksJson = JsonSerializer.Serialize(ganttContext.Tasks.Select(t => new
        {
            id = t.Id ?? Guid.NewGuid().ToString("N"),
            parentId = t.ParentId,
            title = t.Title,
            start = t.Start.ToString("yyyy-MM-dd"),
            end = t.End.ToString("yyyy-MM-dd"),
            percentComplete = t.PercentComplete,
            summary = t.Summary,
            colorClass = t.ColorClass
        }));
        output.Attributes.SetAttribute("data-tasks", tasksJson);

        var baseClass = $"panoptes-gantt bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden flex flex-col w-full select-none {CssClass ?? ""}".Trim();
        output.Attributes.SetAttribute("class", baseClass);

        output.Content.Clear();

        // 1. Gantt Başlık & İstatistik Çubuğu
        var header = RenderHeader(ganttContext);
        output.Content.AppendHtml(header);

        // 2. İki Panelli Çalışma Alanı (Sol: Görev Listesi, Sağ: Zaman Çizelgesi)
        var body = RenderBody(ganttContext);
        output.Content.AppendHtml(body);
    }

    private TagBuilder RenderHeader(GanttContext ctx)
    {
        var header = new TagBuilder("div");
        header.AddCssClass("px-6 py-4 bg-slate-50/70 border-b border-slate-200 flex flex-wrap items-center justify-between gap-4");

        var left = new TagBuilder("div");
        left.AddCssClass("flex items-center gap-3");

        var icon = new TagBuilder("div");
        icon.AddCssClass("w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center");
        icon.InnerHtml.AppendHtml(@"<svg class=""w-4 h-4"" fill=""none"" stroke=""currentColor"" viewBox=""0 0 24 24""><path stroke-linecap=""round"" stroke-linejoin=""round"" stroke-width=""2"" d=""M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z""/></svg>");
        left.InnerHtml.AppendHtml(icon);

        var titleBox = new TagBuilder("div");
        titleBox.InnerHtml.AppendHtml(@"<h3 class=""text-xs font-bold text-slate-800"">Proje Çizelgesi & İlerleme</h3>");
        var completedCount = ctx.Tasks.Count(t => t.PercentComplete >= 100);
        titleBox.InnerHtml.AppendHtml($@"<p class=""text-[11px] text-slate-500"">Toplam {ctx.Tasks.Count} görevden {completedCount} tanesi tamamlandı.</p>");
        left.InnerHtml.AppendHtml(titleBox);

        header.InnerHtml.AppendHtml(left);

        var right = new TagBuilder("div");
        right.AddCssClass("flex items-center gap-3 text-xs");

        var badge = new TagBuilder("span");
        badge.AddCssClass("inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-100");
        badge.InnerHtml.AppendHtml(@"<span class=""w-2 h-2 rounded-full bg-blue-600 animate-pulse""></span> Günlük Görünüm");
        right.InnerHtml.AppendHtml(badge);

        header.InnerHtml.AppendHtml(right);
        return header;
    }

    private TagBuilder RenderBody(GanttContext ctx)
    {
        var container = new TagBuilder("div");
        container.AddCssClass("panoptes-gantt-container flex flex-col md:flex-row overflow-x-auto min-h-[380px]");

        // Sol Panel: Görev Listesi
        var leftTable = new TagBuilder("div");
        leftTable.AddCssClass("panoptes-gantt-tree w-full md:w-96 shrink-0 border-r border-slate-200 bg-white");

        var thead = @"
            <div class=""flex items-center border-b border-slate-200 bg-slate-50 text-[11px] font-bold text-slate-500 py-2.5 px-4"">
                <div class=""flex-1"">GÖREV ADI</div>
                <div class=""w-20 text-center"">BAŞLANGIÇ</div>
                <div class=""w-20 text-center"">BİTİŞ</div>
                <div class=""w-14 text-right"">%</div>
            </div>
        ";
        leftTable.InnerHtml.AppendHtml(thead);

        var rowsContainer = new TagBuilder("div");
        rowsContainer.AddCssClass("divide-y divide-slate-100 text-xs");

        foreach (var task in ctx.Tasks)
        {
            var isChild = !string.IsNullOrWhiteSpace(task.ParentId);
            var row = new TagBuilder("div");
            row.AddCssClass($"flex items-center py-2.5 px-4 hover:bg-slate-50 transition cursor-pointer {(task.Summary ? "font-bold text-slate-800 bg-slate-50/30" : "text-slate-600")}");
            row.Attributes["data-task-id"] = task.Id ?? "";

            var titleCol = new TagBuilder("div");
            titleCol.AddCssClass($"flex-1 truncate {(isChild ? "pl-5" : "")}");
            titleCol.InnerHtml.Append(task.Title ?? "");
            row.InnerHtml.AppendHtml(titleCol);

            var startCol = new TagBuilder("div");
            startCol.AddCssClass("w-20 text-center text-[11px] text-slate-400 font-mono");
            startCol.InnerHtml.Append(task.Start.ToString("dd MMM", new CultureInfo("tr-TR")));
            row.InnerHtml.AppendHtml(startCol);

            var endCol = new TagBuilder("div");
            endCol.AddCssClass("w-20 text-center text-[11px] text-slate-400 font-mono");
            endCol.InnerHtml.Append(task.End.ToString("dd MMM", new CultureInfo("tr-TR")));
            row.InnerHtml.AppendHtml(endCol);

            var pctCol = new TagBuilder("div");
            pctCol.AddCssClass($"w-14 text-right text-[11px] font-bold font-mono {(task.PercentComplete >= 100 ? "text-emerald-600" : "text-blue-600")}");
            pctCol.InnerHtml.Append($"%{task.PercentComplete:0}");
            row.InnerHtml.AppendHtml(pctCol);

            rowsContainer.InnerHtml.AppendHtml(row);
        }

        leftTable.InnerHtml.AppendHtml(rowsContainer);
        container.InnerHtml.AppendHtml(leftTable);

        // Sağ Panel: Zaman Çizelgesi (Timeline Gantt Bar Canvas)
        var rightTimeline = new TagBuilder("div");
        rightTimeline.AddCssClass("panoptes-gantt-timeline flex-1 overflow-x-auto bg-slate-50/20 relative min-w-[500px]");

        container.InnerHtml.AppendHtml(rightTimeline);
        return container;
    }
}
