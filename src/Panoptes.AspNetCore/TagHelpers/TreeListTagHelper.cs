using System;
using System.Collections.Generic;
using System.Linq;
using System.Text.Json;
using System.Text.Json.Serialization;
using Microsoft.AspNetCore.Razor.TagHelpers;
using Panoptes.AspNetCore.Models;

namespace Panoptes.AspNetCore.TagHelpers
{
    /// <summary>
    /// Panoptes ASP.NET Core TreeList bileşeni. Yapılandırma JSON olarak sayfaya gömülür,
    /// bileşen istemci tarafında (panoptes-treelist.js) çizilir.
    /// </summary>
    [HtmlTargetElement("panoptes-treelist")]
    public class TreeListTagHelper : TagHelper
    {
        private static readonly JsonSerializerOptions JsonOptions = new()
        {
            PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
            DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull
        };

        [HtmlAttributeName("id")]
        public string? Id { get; set; }

        [HtmlAttributeName("title")]
        public string? Title { get; set; }

        [HtmlAttributeName("columns")]
        public List<TreeListColumn>? Columns { get; set; }

        [HtmlAttributeName("items")]
        public List<TreeListItem>? Items { get; set; }

        [HtmlAttributeName("height")]
        public string? Height { get; set; }

        [HtmlAttributeName("show-search")]
        public bool ShowSearch { get; set; } = true;

        [HtmlAttributeName("show-toolbar")]
        public bool ShowToolbar { get; set; } = true;

        /// <summary>Arama paneli için aranacak alanlar (virgülle ayrılmış). Boşsa tüm görünür sütunlar.</summary>
        [HtmlAttributeName("search-fields")]
        public string? SearchFields { get; set; }

        /// <summary>Sütun başlığına tıklayarak sıralama (Shift ile çoklu sıralama).</summary>
        [HtmlAttributeName("sortable")]
        public bool Sortable { get; set; }

        /// <summary>Başlığın altında filtre satırı.</summary>
        [HtmlAttributeName("filterable")]
        public bool Filterable { get; set; }

        [HtmlAttributeName("column-menu")]
        public bool ColumnMenu { get; set; }

        [HtmlAttributeName("resizable")]
        public bool Resizable { get; set; }

        [HtmlAttributeName("reorderable")]
        public bool Reorderable { get; set; }

        /// <summary>Sütun menüsünde "Sütunu Kilitle" seçeneği.</summary>
        [HtmlAttributeName("lockable")]
        public bool Lockable { get; set; }

        /// <summary>none | single | multiple | checkbox</summary>
        [HtmlAttributeName("selectable")]
        public string Selectable { get; set; } = "single";

        /// <summary>none | inline | incell | popup</summary>
        [HtmlAttributeName("editable")]
        public string Editable { get; set; } = "none";

        /// <summary>Satırları sürükleyip bırakarak yeniden düzenleme / ebeveyn değiştirme.</summary>
        [HtmlAttributeName("draggable")]
        public bool Draggable { get; set; }

        [HtmlAttributeName("pageable")]
        public bool Pageable { get; set; }

        [HtmlAttributeName("page-size")]
        public int PageSize { get; set; } = 10;

        [HtmlAttributeName("page-sizes")]
        public string? PageSizes { get; set; }

        /// <summary>none | parent | footer | both</summary>
        [HtmlAttributeName("aggregates")]
        public string Aggregates { get; set; } = "none";

        /// <summary>Araç çubuğu düğmeleri: create, expandAll, collapseAll, excel, pdf, saveState, loadState, resetState</summary>
        [HtmlAttributeName("tools")]
        public string? Tools { get; set; }

        [HtmlAttributeName("export-name")]
        public string? ExportName { get; set; }

        [HtmlAttributeName("persist-key")]
        public string? PersistKey { get; set; }

        /// <summary>Durum değiştikçe otomatik kaydet ve sayfa açılışında geri yükle.</summary>
        [HtmlAttributeName("persist-auto")]
        public bool PersistAuto { get; set; }

        /// <summary>Uzak veri bağlama: GET url?parentId=...&amp;sort=...&amp;filter=...&amp;skip=...&amp;take=...</summary>
        [HtmlAttributeName("remote-url")]
        public string? RemoteUrl { get; set; }

        /// <summary>OData bağlama: $filter, $orderby, $top, $skip, $count parametreleri kullanılır.</summary>
        [HtmlAttributeName("odata-url")]
        public string? ODataUrl { get; set; }

        /// <summary>Satır şablonu: window üzerindeki bir JS fonksiyonunun adı (&lt;td&gt; HTML'i döndürür).</summary>
        [HtmlAttributeName("row-template")]
        public string? RowTemplate { get; set; }

        /// <summary>Araç çubuğu şablonu: bir &lt;template&gt; öğesinin id değeri.</summary>
        [HtmlAttributeName("toolbar-template")]
        public string? ToolbarTemplate { get; set; }

        [HtmlAttributeName("keyboard")]
        public bool Keyboard { get; set; } = true;

        [HtmlAttributeName("keyboard-hint")]
        public bool KeyboardHint { get; set; }

        [HtmlAttributeName("empty-text")]
        public string? EmptyText { get; set; }

        [HtmlAttributeName("on-select")]
        public string? OnSelect { get; set; }

        [HtmlAttributeName("on-expand")]
        public string? OnExpand { get; set; }

        [HtmlAttributeName("on-collapse")]
        public string? OnCollapse { get; set; }

        [HtmlAttributeName("on-change")]
        public string? OnChange { get; set; }

        /// <summary>Tüm olaylar için tek geri çağırma: fn({ type, ...veri })</summary>
        [HtmlAttributeName("on-event")]
        public string? OnEvent { get; set; }

        [HtmlAttributeName("class")]
        public string? CssClass { get; set; }

        public override void Process(TagHelperContext context, TagHelperOutput output)
        {
            var treelistId = string.IsNullOrWhiteSpace(Id) ? "panoptes-treelist-" + Guid.NewGuid().ToString("N")[..8] : Id;

            output.TagName = "div";
            output.TagMode = TagMode.StartTagAndEndTag;
            output.Attributes.SetAttribute("id", treelistId);
            output.Attributes.SetAttribute("data-panoptes-treelist", "true");
            output.Attributes.SetAttribute("class", $"panoptes-treelist w-full {CssClass}".Trim());

            var cols = Columns ?? new List<TreeListColumn>
            {
                new TreeListColumn { Field = "Name", Title = "Ad / Başlık", IsTreeColumn = true },
                new TreeListColumn { Field = "Role", Title = "Pozisyon / Tür" },
                new TreeListColumn { Field = "Department", Title = "Departman / Bölüm" },
                new TreeListColumn { Field = "Budget", Title = "Bütçe / Maaş", Align = "right", Format = "currency" }
            };

            if (!cols.Any(c => c.IsTreeColumn) && cols.Count > 0)
            {
                cols[0].IsTreeColumn = true;
            }

            var editable = (Editable ?? "none").ToLowerInvariant();

            var tools = new List<string>();
            if (Tools != null)
            {
                tools.AddRange(Tools.Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries));
            }
            else
            {
                tools.Add("expandAll");
                tools.Add("collapseAll");
            }
            if (editable != "none" && !tools.Contains("create"))
            {
                tools.Insert(0, "create");
            }

            var callbacks = new Dictionary<string, string>();
            if (!string.IsNullOrWhiteSpace(OnSelect)) callbacks["select"] = OnSelect!;
            if (!string.IsNullOrWhiteSpace(OnExpand)) callbacks["expand"] = OnExpand!;
            if (!string.IsNullOrWhiteSpace(OnCollapse)) callbacks["collapse"] = OnCollapse!;
            if (!string.IsNullOrWhiteSpace(OnChange)) callbacks["change"] = OnChange!;

            var options = new Dictionary<string, object?>
            {
                ["title"] = Title,
                ["height"] = Height,
                ["showSearch"] = ShowSearch,
                ["showToolbar"] = ShowToolbar,
                ["searchFields"] = SearchFields,
                ["sortable"] = Sortable,
                ["filterable"] = Filterable,
                ["columnMenu"] = ColumnMenu,
                ["resizable"] = Resizable,
                ["reorderable"] = Reorderable,
                ["lockable"] = Lockable,
                ["selectable"] = (Selectable ?? "single").ToLowerInvariant(),
                ["editable"] = editable,
                ["draggable"] = Draggable,
                ["pageable"] = Pageable,
                ["pageSize"] = PageSize,
                ["pageSizes"] = PageSizes,
                ["aggregates"] = (Aggregates ?? "none").ToLowerInvariant(),
                ["tools"] = tools,
                ["exportName"] = ExportName,
                ["persistKey"] = PersistKey,
                ["persistAuto"] = PersistAuto,
                ["remoteUrl"] = RemoteUrl,
                ["odataUrl"] = ODataUrl,
                ["rowTemplate"] = RowTemplate,
                ["toolbarTemplate"] = ToolbarTemplate,
                ["keyboard"] = Keyboard,
                ["keyboardHint"] = KeyboardHint,
                ["emptyText"] = EmptyText,
                ["callbacks"] = callbacks,
                ["onEvent"] = OnEvent
            };

            var config = new
            {
                options,
                columns = cols,
                items = (RemoteUrl == null && ODataUrl == null) ? (Items ?? new List<TreeListItem>()) : new List<TreeListItem>()
            };

            var json = JsonSerializer.Serialize(config, JsonOptions);
            output.Content.SetHtmlContent($"<script type=\"application/json\" class=\"ptl-config\">{json}</script>");
        }
    }
}
