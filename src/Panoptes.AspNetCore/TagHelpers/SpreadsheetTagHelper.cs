using System;
using System.Collections.Generic;
using System.Text.Json;
using System.Text.Json.Serialization;
using Microsoft.AspNetCore.Razor.TagHelpers;
using Panoptes.AspNetCore.Models;

namespace Panoptes.AspNetCore.TagHelpers
{
    /// <summary>
    /// Excel benzeri gelişmiş kurumsal hesap tablosu (Panoptes Spreadsheet).
    /// Arayüzün tamamı (şerit menü, formül çubuğu, ızgara, sayfa sekmeleri) panoptes-spreadsheet.js tarafından üretilir.
    /// </summary>
    [HtmlTargetElement("panoptes-spreadsheet")]
    public class SpreadsheetTagHelper : TagHelper
    {
        private static readonly JsonSerializerOptions JsonOpts = new()
        {
            PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
            DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull
        };

        [HtmlAttributeName("id")]
        public string? Id { get; set; }

        [HtmlAttributeName("title")]
        public string? Title { get; set; }

        [HtmlAttributeName("sheets")]
        public List<SpreadsheetSheet>? Sheets { get; set; }

        [HtmlAttributeName("height")]
        public int Height { get; set; } = 520;

        /// <summary>"true", "false" ya da virgülle ayrılmış sekme listesi: home,insert,data,view,file</summary>
        [HtmlAttributeName("toolbar")]
        public string? Toolbar { get; set; }

        [HtmlAttributeName("formula-bar")]
        public bool FormulaBar { get; set; } = true;

        [HtmlAttributeName("sheets-bar")]
        public bool SheetsBar { get; set; } = true;

        [HtmlAttributeName("editable")]
        public bool Editable { get; set; } = true;

        /// <summary>Bileşenin sağ alt köşesinden yeniden boyutlandırılmasına izin verir.</summary>
        [HtmlAttributeName("resizable")]
        public bool Resizable { get; set; }

        [HtmlAttributeName("export-url")]
        public string? ExportUrl { get; set; }

        [HtmlAttributeName("import-url")]
        public string? ImportUrl { get; set; }

        [HtmlAttributeName("file-name")]
        public string? FileName { get; set; }

        [HtmlAttributeName("show-grid-lines")]
        public bool ShowGridLines { get; set; } = true;

        [HtmlAttributeName("on-event")]
        public string? OnEvent { get; set; }

        [HtmlAttributeName("on-cell-change")]
        public string? OnCellChange { get; set; }

        [HtmlAttributeName("class")]
        public string? CssClass { get; set; }

        public override void Process(TagHelperContext context, TagHelperOutput output)
        {
            var sheetId = string.IsNullOrWhiteSpace(Id) ? "panoptes-sheet-" + Guid.NewGuid().ToString("N")[..8] : Id;

            output.TagName = "div";
            output.TagMode = TagMode.StartTagAndEndTag;
            output.Attributes.SetAttribute("id", sheetId);
            output.Attributes.SetAttribute("data-panoptes-spreadsheet", "true");

            if (!string.IsNullOrWhiteSpace(OnEvent))
                output.Attributes.SetAttribute("data-on-event", OnEvent);
            if (!string.IsNullOrWhiteSpace(OnCellChange))
                output.Attributes.SetAttribute("data-on-cell-change", OnCellChange);
            if (!string.IsNullOrWhiteSpace(CssClass))
                output.Attributes.SetAttribute("class", CssClass);

            object toolbar = true;
            if (!string.IsNullOrWhiteSpace(Toolbar))
            {
                if (bool.TryParse(Toolbar, out var b)) toolbar = b;
                else toolbar = Toolbar!;
            }

            var sheetList = Sheets ?? new List<SpreadsheetSheet>
            {
                new SpreadsheetSheet { Name = "Sayfa 1", Rows = 30, Cols = 12 }
            };

            var payload = new
            {
                options = new
                {
                    title = Title,
                    height = Height,
                    toolbar,
                    formulaBar = FormulaBar,
                    sheetsBar = SheetsBar,
                    editable = Editable,
                    resizable = Resizable,
                    exportUrl = ExportUrl,
                    importUrl = ImportUrl,
                    fileName = FileName,
                    showGridLines = ShowGridLines
                },
                sheets = sheetList
            };

            var json = JsonSerializer.Serialize(payload, JsonOpts);
            output.Content.SetHtmlContent($"<script type=\"application/json\" class=\"panoptes-sheet-data\">{json}</script>");
        }
    }
}
