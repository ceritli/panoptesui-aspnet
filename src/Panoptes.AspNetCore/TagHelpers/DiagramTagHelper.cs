using System;
using System.Collections.Generic;
using System.Linq;
using System.Text.Encodings.Web;
using System.Text.Json;
using Microsoft.AspNetCore.Razor.TagHelpers;
using Panoptes.AspNetCore.Models;

namespace Panoptes.AspNetCore.TagHelpers
{
    [HtmlTargetElement("panoptes-diagram")]
    public class DiagramTagHelper : TagHelper
    {
        [HtmlAttributeName("id")]
        public string? Id { get; set; }

        [HtmlAttributeName("title")]
        public string? Title { get; set; }

        [HtmlAttributeName("layout")]
        public string Layout { get; set; } = "flowchart"; // flowchart, orgchart

        [HtmlAttributeName("nodes")]
        public List<DiagramNode>? Nodes { get; set; }

        [HtmlAttributeName("connections")]
        public List<DiagramConnection>? Connections { get; set; }

        [HtmlAttributeName("height")]
        public int Height { get; set; } = 480;

        [HtmlAttributeName("on-node-select")]
        public string? OnNodeSelect { get; set; }

        [HtmlAttributeName("class")]
        public string? CssClass { get; set; }

        public override void Process(TagHelperContext context, TagHelperOutput output)
        {
            var diagramId = string.IsNullOrWhiteSpace(Id) ? "panoptes-diag-" + Guid.NewGuid().ToString("N")[..8] : Id;

            output.TagName = "div";
            output.TagMode = TagMode.StartTagAndEndTag;
            output.Attributes.SetAttribute("id", diagramId);
            output.Attributes.SetAttribute("data-panoptes-diagram", "true");
            output.Attributes.SetAttribute("data-layout", Layout);

            if (!string.IsNullOrWhiteSpace(OnNodeSelect))
                output.Attributes.SetAttribute("data-on-node-select", OnNodeSelect);

            output.Attributes.SetAttribute("class", $"panoptes-diagram bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden flex flex-col w-full select-none {CssClass}".Trim());

            var nodeList = Nodes ?? new List<DiagramNode>();
            var connList = Connections ?? new List<DiagramConnection>();

            var nodesJson = JsonSerializer.Serialize(nodeList);
            var connsJson = JsonSerializer.Serialize(connList);

            var sb = new System.Text.StringBuilder();

            // Hidden JSON data
            sb.Append($"<script type=\"application/json\" class=\"panoptes-diag-nodes\">{nodesJson}</script>");
            sb.Append($"<script type=\"application/json\" class=\"panoptes-diag-conns\">{connsJson}</script>");

            // Toolbar
            sb.Append("<div class=\"px-4 py-3 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs\">");
            sb.Append("<div class=\"flex items-center gap-2\">");
            sb.Append("<svg class=\"w-4 h-4 text-indigo-600\" fill=\"none\" stroke=\"currentColor\" viewBox=\"0 0 24 24\"><path stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"2\" d=\"M7 11.5V14m0-2.5v-6a1.5 1.5 0 113 0m-3 6a1.5 1.5 0 00-3 0v2a7.5 7.5 0 0015 0v-5a1.5 1.5 0 00-3 0m-6-3V11m0-5.5v-1a1.5 1.5 0 013 0v1m0 0V11m0-5.5a1.5 1.5 0 013 0v3m0 0V11\"/></svg>");
            if (!string.IsNullOrWhiteSpace(Title))
            {
                sb.Append($"<span class=\"font-bold text-slate-800 text-sm\">{HtmlEncoder.Default.Encode(Title)}</span>");
            }
            var typeBadge = Layout == "orgchart" ? "Organizasyon Şeması" : "İş Akış Şeması (Flowchart)";
            sb.Append($"<span class=\"px-2 py-0.5 rounded-full text-[10px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200\">{typeBadge}</span>");
            sb.Append("</div>");

            // Zoom & Tool controls
            sb.Append("<div class=\"flex items-center gap-1.5 ml-auto\">");
            sb.Append("<button type=\"button\" class=\"panoptes-diag-btn-zoomin p-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-lg transition shadow-2xs\" title=\"Yakınlaştır\">");
            sb.Append("<svg class=\"w-3.5 h-3.5\" fill=\"none\" stroke=\"currentColor\" viewBox=\"0 0 24 24\"><path stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"2\" d=\"M12 4v16m8-8H4\"/></svg>");
            sb.Append("</button>");

            sb.Append("<button type=\"button\" class=\"panoptes-diag-btn-zoomout p-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-lg transition shadow-2xs\" title=\"Uzaklaştır\">");
            sb.Append("<svg class=\"w-3.5 h-3.5\" fill=\"none\" stroke=\"currentColor\" viewBox=\"0 0 24 24\"><path stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"2\" d=\"M20 12H4\"/></svg>");
            sb.Append("</button>");

            sb.Append("<button type=\"button\" class=\"panoptes-diag-btn-fit px-2.5 py-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-lg font-medium transition shadow-2xs\">Sığdır</button>");

            sb.Append("<button type=\"button\" class=\"panoptes-diag-btn-export px-2.5 py-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-lg font-medium transition shadow-2xs flex items-center gap-1\">");
            sb.Append("<svg class=\"w-3.5 h-3.5 text-slate-500\" fill=\"none\" stroke=\"currentColor\" viewBox=\"0 0 24 24\"><path stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"2\" d=\"M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4\"/></svg>");
            sb.Append("SVG İndir");
            sb.Append("</button>");
            sb.Append("</div>");
            sb.Append("</div>");

            // Diagram Viewport Container
            sb.Append($"<div class=\"panoptes-diag-viewport relative w-full overflow-hidden bg-slate-950 cursor-grab active:cursor-grabbing\" style=\"height: {Height}px;\">");

            // SVG Element
            sb.Append("<svg class=\"panoptes-diag-svg w-full h-full block\" xmlns=\"http://www.w3.org/2000/svg\">");
            sb.Append("<defs>");
            // Grid background pattern
            sb.Append("<pattern id=\"diag-grid\" width=\"20\" height=\"20\" patternUnits=\"userSpaceOnUse\">");
            sb.Append("<circle cx=\"10\" cy=\"10\" r=\"1\" fill=\"#334155\" opacity=\"0.5\" />");
            sb.Append("</pattern>");
            // Arrowhead marker
            sb.Append("<marker id=\"diag-arrow\" viewBox=\"0 0 10 10\" refX=\"8\" refY=\"5\" markerWidth=\"6\" markerHeight=\"6\" orient=\"auto-start-reverse\">");
            sb.Append("<path d=\"M 0 1.5 L 8 5 L 0 8.5 z\" fill=\"#94a3b8\" />");
            sb.Append("</marker>");
            sb.Append("</defs>");

            // Rect for grid pattern
            sb.Append("<rect width=\"100%\" height=\"100%\" fill=\"url(#diag-grid)\" />");

            // Zoom/Pan Transform Group
            sb.Append("<g class=\"panoptes-diag-canvas-group\"></g>");
            sb.Append("</svg>");

            // Instruction badge
            sb.Append("<div class=\"absolute bottom-3 right-3 bg-slate-900/80 backdrop-blur-xs text-slate-400 border border-slate-800 px-2.5 py-1 rounded text-[10px] pointer-events-none font-mono\">Fare ile sürükleyip kaydırın & tekerlek ile yakınlaştırın</div>");

            sb.Append("</div>");

            output.Content.SetHtmlContent(sb.ToString());
        }
    }
}
