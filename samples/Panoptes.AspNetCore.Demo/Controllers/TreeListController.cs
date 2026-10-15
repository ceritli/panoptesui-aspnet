using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Panoptes.AspNetCore.Demo.Services;
using Panoptes.AspNetCore.Models;

namespace Panoptes.AspNetCore.Demo.Controllers
{
    public class TreeListDemoViewModel
    {
        public List<TreeListColumn> OrgColumns { get; set; } = new();
        public List<TreeListItem> OrgItems { get; set; } = new();

        public List<TreeListColumn> ProjectColumns { get; set; } = new();
        public List<TreeListItem> ProjectItems { get; set; } = new();
    }

    public class TreeListController : Controller
    {
        public IActionResult Index()
        {
            ViewData["Title"] = "TreeList (Hiyerarşik Ağaç Tablosu / TreeGrid)";

            var model = new TreeListDemoViewModel();

            // 1. Şirket Organizasyon Şeması
            model.OrgColumns = new List<TreeListColumn>
            {
                new TreeListColumn { Field = "Name", Title = "Yönetici / Personel", Width = "280px", IsTreeColumn = true },
                new TreeListColumn { Field = "Role", Title = "Pozisyon / Unvan", Width = "180px" },
                new TreeListColumn { Field = "Department", Title = "Departman / Birim", Width = "160px" },
                new TreeListColumn { Field = "Location", Title = "Lokasyon", Width = "130px" },
                new TreeListColumn { Field = "Salary", Title = "Bütçe / Maaş (₺)", Align = "right", Format = "currency", Width = "140px" }
            };

            model.OrgItems = new List<TreeListItem>
            {
                // Root: CEO
                new TreeListItem {
                    Id = "1", ParentId = null, Expanded = true,
                    Values = new() {
                        { "Name", "Mehmet Kaya" }, { "Role", "Genel Müdür (CEO)" },
                        { "Department", "İcra Kurulu" }, { "Location", "İstanbul (HQ)" }, { "Salary", 250000 }
                    }
                },
                // Level 1: CTO
                new TreeListItem {
                    Id = "2", ParentId = "1", Expanded = true,
                    Values = new() {
                        { "Name", "Zeynep Arslan" }, { "Role", "Teknoloji Direktörü (CTO)" },
                        { "Department", "Ar-Ge & Yazılım" }, { "Location", "İstanbul" }, { "Salary", 180000 }
                    }
                },
                // Level 2: Backend Team Lead
                new TreeListItem {
                    Id = "3", ParentId = "2", Expanded = true,
                    Values = new() {
                        { "Name", "Burak Yılmaz" }, { "Role", "Yazılım Mimarı & Takım Lideri" },
                        { "Department", "Backend Geliştirme" }, { "Location", "Ankara" }, { "Salary", 125000 }
                    }
                },
                // Level 3: Senior Backend Dev
                new TreeListItem {
                    Id = "4", ParentId = "3", Expanded = false,
                    Values = new() {
                        { "Name", "Elif Demir" }, { "Role", "Kıdemli .NET Uzmanı" },
                        { "Department", "Backend Geliştirme" }, { "Location", "İzmir (Uzaktan)" }, { "Salary", 95000 }
                    }
                },
                new TreeListItem {
                    Id = "5", ParentId = "3", Expanded = false,
                    Values = new() {
                        { "Name", "Emre Çetin" }, { "Role", "Veri Tabanı & DevOps Müh." },
                        { "Department", "Backend Geliştirme" }, { "Location", "İstanbul" }, { "Salary", 90000 }
                    }
                },
                // Level 2: Frontend Team Lead
                new TreeListItem {
                    Id = "6", ParentId = "2", Expanded = true,
                    Values = new() {
                        { "Name", "Selin Koç" }, { "Role", "Frontend Takım Lideri" },
                        { "Department", "UI / UX Mühendisliği" }, { "Location", "İstanbul" }, { "Salary", 120000 }
                    }
                },
                new TreeListItem {
                    Id = "7", ParentId = "6", Expanded = false,
                    Values = new() {
                        { "Name", "Can Aydın" }, { "Role", "Kıdemli UI Geliştirici" },
                        { "Department", "UI / UX Mühendisliği" }, { "Location", "Ankara" }, { "Salary", 88000 }
                    }
                },
                // Level 1: CFO
                new TreeListItem {
                    Id = "8", ParentId = "1", Expanded = false,
                    Values = new() {
                        { "Name", "Ahmet Öztürk" }, { "Role", "Finans Direktörü (CFO)" },
                        { "Department", "Mali İşler" }, { "Location", "İstanbul (HQ)" }, { "Salary", 175000 }
                    }
                },
                new TreeListItem {
                    Id = "9", ParentId = "8", Expanded = false,
                    Values = new() {
                        { "Name", "Ayşe Şen" }, { "Role", "Muhasebe Müdürü" },
                        { "Department", "Finans & Muhasebe" }, { "Location", "İstanbul" }, { "Salary", 95000 }
                    }
                }
            };

            // 2. Proje İş Dağılım Kırılımı (WBS)
            model.ProjectColumns = new List<TreeListColumn>
            {
                new TreeListColumn { Field = "Task", Title = "Proje Aşaması & Görev", Width = "300px", IsTreeColumn = true },
                new TreeListColumn { Field = "Owner", Title = "Sorumlu Kişi", Width = "150px" },
                new TreeListColumn { Field = "Status", Title = "Durum", Format = "badge", Width = "120px" },
                new TreeListColumn { Field = "Progress", Title = "Tamamlanma", Align = "center", Width = "110px" },
                new TreeListColumn { Field = "Hours", Title = "Efor (Saat)", Align = "right", Width = "100px" }
            };

            model.ProjectItems = new List<TreeListItem>
            {
                new TreeListItem {
                    Id = "p1", ParentId = null, Expanded = true,
                    Values = new() {
                        { "Task", "Panoptes v2.0 Kurumsal Çekirdek Sürüm" },
                        { "Owner", "Çekirdek Çerçeve Ekibi" }, { "Status", "Devam Ediyor" },
                        { "Progress", "%85" }, { "Hours", "640 sa" }
                    }
                },
                new TreeListItem {
                    Id = "p2", ParentId = "p1", Expanded = true,
                    Values = new() {
                        { "Task", "1. Mimari & TagHelper Altyapısı" },
                        { "Owner", "Mehmet Kaya" }, { "Status", "Tamamlandı" },
                        { "Progress", "%100" }, { "Hours", "120 sa" }
                    }
                },
                new TreeListItem {
                    Id = "p3", ParentId = "p2", Expanded = false,
                    Values = new() {
                        { "Task", "1.1 TagHelperContext & Pipeline" },
                        { "Owner", "Burak Yılmaz" }, { "Status", "Tamamlandı" },
                        { "Progress", "%100" }, { "Hours", "50 sa" }
                    }
                },
                new TreeListItem {
                    Id = "p4", ParentId = "p2", Expanded = false,
                    Values = new() {
                        { "Task", "1.2 Model Bağlama & Razor Motoru" },
                        { "Owner", "Elif Demir" }, { "Status", "Tamamlandı" },
                        { "Progress", "%100" }, { "Hours", "70 sa" }
                    }
                },
                new TreeListItem {
                    Id = "p5", ParentId = "p1", Expanded = true,
                    Values = new() {
                        { "Task", "2. Görsel Bileşenler & UI Vitrini" },
                        { "Owner", "Selin Koç" }, { "Status", "Devam Ediyor" },
                        { "Progress", "%90" }, { "Hours", "380 sa" }
                    }
                },
                new TreeListItem {
                    Id = "p6", ParentId = "p5", Expanded = false,
                    Values = new() {
                        { "Task", "2.1 TreeList, PivotGrid & Diagram" },
                        { "Owner", "Can Aydın" }, { "Status", "Devam Ediyor" },
                        { "Progress", "%80" }, { "Hours", "140 sa" }
                    }
                },
                new TreeListItem {
                    Id = "p7", ParentId = "p1", Expanded = false,
                    Values = new() {
                        { "Task", "3. Test, Dağıtım & Dokümantasyon" },
                        { "Owner", "Zeynep Arslan" }, { "Status", "Planlandı" },
                        { "Progress", "%40" }, { "Hours", "140 sa" }
                    }
                }
            };

            return View(model);
        }

        // ============================================================
        //  Panoptes TreeList demo sayfaları
        // ============================================================

        private IActionResult Show(string title, string description, string[] highlights,
            string enTitle, string enDescription, string[] enHighlights,
            string razor, string script,
            List<TreeListColumn>? columns = null, List<TreeListItem>? items = null)
        {
            var isEn = DemoTranslations.IsEnglish(HttpContext);
            var viewTitle = isEn ? enTitle : title;
            ViewData["Title"] = viewTitle + " - TreeList";
            return View(new TreeListPageModel
            {
                Title = viewTitle,
                Description = isEn ? enDescription : description,
                Highlights = isEn ? enHighlights : highlights,
                RazorCode = razor,
                ScriptCode = script,
                Columns = columns ?? TreeListDemoData.EmployeeColumns(),
                Items = items ?? TreeListDemoData.Employees()
            });
        }

        public IActionResult Aggregates() => Show(
            "Toplamlar (Aggregates)",
            "Bütçe ve prim gibi özetleri sütuna tanımla: üst düğümler alt kayıtları toplar, en alt satır genel toplamı verir. Hücre düzenlenince toplamlar canlı güncellenir.",
            new[] { "aggregates=\"both\"", "Üst düğüm toplamı (Σ)", "Genel toplam satırı", "sum / avg" },
            "Totals (Aggregates)",
            "Define sum, average, count, min, and max on columns: parents roll up children, a footer row shows grand totals. Totals refresh live as cells edit.",
            new[] { "aggregates=\"both\"", "Parent rollups (Σ)", "Grand total row", "sum / avg" },
            """
            <panoptes-treelist id="budgetTree" title="Departman Bütçeleri"
                columns="@Model.Columns" items="@Model.Items"
                aggregates="both" editable="incell" show-search="false" />
            """,
            """
            new TreeListColumn { Field = "Budget", Title = "Planlanan (₺)", Format = "currency", Aggregate = "sum" },
            new TreeListColumn { Field = "Score",  Title = "Performans",     Format = "number",   Aggregate = "avg" }
            """,
            TreeListDemoData.BudgetColumns(), TreeListDemoData.Budget());

        public IActionResult Api() => Show(
            "API (Programatik Kontrol)",
            "Ağacı JavaScript'ten sür: genişlet, seç, sırala, filtrele, ekle ve dışa aktar. Özel araç çubukları ve otomasyon buradan bağlanır.",
            new[] { "expand / collapse", "select / getSelected", "sortBy / filter", "addItem / updateItem / removeItem", "exportExcel" },
            "API (Programmatic Control)",
            "Drive the tree from JavaScript: expand, select, sort, filter, add, and export. Custom toolbars and automation plug in here.",
            new[] { "expand / collapse", "select / getSelected", "sortBy / filter", "addItem / updateItem / removeItem", "exportExcel" },
            """
            <panoptes-treelist id="apiTree" columns="@Model.Columns" items="@Model.Items"
                selectable="multiple" sortable="true" on-event="ptlOnEvent" />
            """,
            """
            const tree = Panoptes.TreeList.getInstance('apiTree');
            tree.expandAll();  tree.collapse('2');  tree.select('6');
            tree.sortBy('Salary', 'desc');  tree.filter('Teknoloji');
            tree.addItem({ Name: 'Yeni Personel' }, '2');
            tree.updateItem('4', { Salary: 99000 });  tree.removeItem('5');
            tree.getSelectedItems();  tree.exportExcel();
            """);

        public IActionResult CheckboxSelection() => Show(
            "Onay Kutulu Seçim",
            "Her satırda onay kutusu; üst düğüm tüm alt kayıtları seçer, kısmi seçim belirsiz gösterilir. Toplu işlem öncesi güvenli seçim.",
            new[] { "selectable=\"checkbox\"", "Alt kayıtlara yayılan seçim", "Belirsiz (indeterminate) durum", "Tümünü seç" },
            "Checkbox Selection",
            "A checkbox per row; parents select all children, partial selection shows indeterminate. Safe selection before bulk actions.",
            new[] { "selectable=\"checkbox\"", "Cascading selection", "Indeterminate state", "Select all" },
            """
            <panoptes-treelist id="chkTree" columns="@Model.Columns" items="@Model.Items"
                selectable="checkbox" on-change="onChk" />
            """,
            """
            function onChk(e) { console.log(e.selected); }   // seçili kayıt kimlikleri
            Panoptes.TreeList.getInstance('chkTree').getSelectedItems();
            """);

        public IActionResult ClientSidePaging() => Show(
            "İstemci Tarafı Sayfalama",
            "Kök düğümler sayfalanır, açık alt kayıtlar kökle birlikte kalır. On binlerce satırlık ağaçlarda hızlı açılış.",
            new[] { "pageable=\"true\"", "page-size / page-sizes", "Kök düğüm bazlı sayfalama" },
            "Client-Side Paging",
            "Root nodes page while open children stay with their root. Fast startup for ten-thousand-row staff and product trees.",
            new[] { "pageable=\"true\"", "page-size / page-sizes", "Root-based paging" },
            """
            <panoptes-treelist id="pagingTree" columns="@Model.Columns" items="@Model.Items"
                pageable="true" page-size="5" page-sizes="5,10,20" sortable="true" />
            """,
            """
            const tree = Panoptes.TreeList.getInstance('pagingTree');
            tree.goToPage(2);
            """,
            TreeListDemoData.RegionColumns(), TreeListDemoData.Regions());

        public IActionResult ColumnMenu() => Show(
            "Sütun Menüsü",
            "Her başlıkta menü: sıralama, filtre, göster/gizle ve kilitle. Kullanıcı tabloyu kendine göre düzenler.",
            new[] { "column-menu=\"true\"", "Sıralama", "Filtre", "Sütun göster/gizle", "Sütunu kilitle" },
            "Column Menu",
            "A menu per header: sort, filter, show/hide, and lock. Users shape the table themselves; fewer support tickets.",
            new[] { "column-menu=\"true\"", "Sorting", "Filtering", "Show/hide columns", "Lock column" },
            """
            <panoptes-treelist id="menuTree" columns="@Model.Columns" items="@Model.Items"
                column-menu="true" sortable="true" filterable="true" lockable="true" />
            """,
            "",
            TreeListDemoData.EmployeeColumns(true));

        public IActionResult ColumnReordering() => Show(
            "Sütun Sıralama (Sürükle)",
            "Sütun başlıklarını sürükleyip bırakarak yeniden sırala; muhasebe ve depo farklı dizilimle çalışır.",
            new[] { "reorderable=\"true\"", "Başlığı sürükle-bırak", "columnReorder olayı" },
            "Column Reordering",
            "Drag headers to reorder; accounting and warehouse work with different column orders.",
            new[] { "reorderable=\"true\"", "Drag-and-drop headers", "columnReorder event" },
            """
            <panoptes-treelist id="reorderTree" columns="@Model.Columns" items="@Model.Items"
                reorderable="true" on-event="ptlOnEvent" />
            """,
            "");

        public IActionResult ColumnResizing() => Show(
            "Sütun Boyutlandırma",
            "Başlık kenarını sürükleyerek genişliği ayarla; uzun metin sütunları tek hamlede sığar.",
            new[] { "resizable=\"true\"", "Sürükleyerek boyutlandır", "columnResize olayı" },
            "Column Resizing",
            "Drag the edge for width; long text columns fit in one move.",
            new[] { "resizable=\"true\"", "Drag to resize", "columnResize event" },
            """
            <panoptes-treelist id="resizeTree" columns="@Model.Columns" items="@Model.Items"
                resizable="true" on-event="ptlOnEvent" />
            """,
            "");

        public IActionResult DragDrop() => Show(
            "Sürükle & Bırak (Satır)",
            "Satırları sürükleyerek ağacı yeniden kur: üste ve alta bırakma kardeş, ortaya bırakma alt kayıt yapar. Organizasyon şeması fareyle düzenlenir.",
            new[] { "draggable=\"true\"", "Önce / içine / sonra bırakma", "drop olayı" },
            "Row Drag & Drop",
            "Restructure the tree by dragging rows: drop above/below for siblings, onto for children. Rearrange org charts with the mouse.",
            new[] { "draggable=\"true\"", "Drop before / into / after", "drop event" },
            """
            <panoptes-treelist id="dragTree" columns="@Model.Columns" items="@Model.Items"
                draggable="true" on-event="ptlOnEvent" />
            """,
            """
            Panoptes.TreeList.getInstance('dragTree').on('drop', e => {
              // e.id, e.targetId, e.zone ('before'|'inside'|'after'), e.oldParentId, e.newParentId
              fetch('/api/move', { method: 'POST', body: JSON.stringify(e) });
            });
            """);

        public IActionResult Editing() => Show(
            "Satır İçi Düzenleme",
            "Kalem düğmesi satırı forma çevirir; kaydet ve vazgeç ile güvenli düzenleme, onaylı silme ve alt kayıt ekleme desteklenir.",
            new[] { "editable=\"inline\"", "Alt kayıt ekle", "Silme onayı", "save / add / remove olayları" },
            "In-Line Editing",
            "The pencil button turns the row into a form with save and cancel. Staff card fixes without leaving the page.",
            new[] { "editable=\"inline\"", "Add child record", "Delete confirmation", "save / add / remove events" },
            """
            <panoptes-treelist id="inlineTree" columns="@Model.Columns" items="@Model.Items"
                editable="inline" on-event="ptlOnEvent" />
            """,
            """
            // Değişiklikler istemcide yapılır; kalıcılık için olayları dinleyin:
            Panoptes.TreeList.getInstance('inlineTree').on('save', e => fetch('/api/employees/' + e.id, { method: 'PUT', body: JSON.stringify(e.values) }));
            """);

        public IActionResult EditingInCell() => Show(
            "Hücre İçi Düzenleme",
            "Hücreye tıkla, yaz, Enter ile kaydet; maaş ve stok gibi tek alan düzeltmeleri ışık hızında.",
            new[] { "editable=\"incell\"", "Tek hücre düzenleme", "Enter / Esc", "save olayı (oldValue → value)" },
            "In-Cell Editing",
            "Click, type, Enter: single-field fixes like salary and stock at full speed.",
            new[] { "editable=\"incell\"", "Single-cell edit", "Enter / Esc", "save event (oldValue → value)" },
            """
            <panoptes-treelist id="incellTree" columns="@Model.Columns" items="@Model.Items"
                editable="incell" on-event="ptlOnEvent" />
            """,
            "");

        public IActionResult EditingPopup() => Show(
            "Popup Düzenleme",
            "Düzenleme düğmesi modal form açar; sütun tipine uygun alan ve zorunlu kontrol ile hatasız kayıt.",
            new[] { "editable=\"popup\"", "Tipine göre form alanları", "Zorunlu alan doğrulaması", "Esc ile kapatma" },
            "PopUp Editing",
            "The edit button opens a modal form with type-matched fields and required validation.",
            new[] { "editable=\"popup\"", "Type-matched fields", "Required validation", "Esc to close" },
            """
            <panoptes-treelist id="popupTree" columns="@Model.Columns" items="@Model.Items"
                editable="popup" on-event="ptlOnEvent" />
            """,
            "");

        public IActionResult Events() => Show(
            "Olaylar (Events)",
            "Seçim, genişletme ve düzenleme dahil 25+ olay tek geri çağırmada yakalanır; denetim kaydı ve canlı sayaçlar buradan beslenir.",
            new[] { "on-event", "instance.on(name, fn)", "CustomEvent 'ptl:<ad>'", "25+ olay" },
            "Events",
            "25+ events including select, expand, and edit in one callback; feeds audit logs and live counters.",
            new[] { "on-event", "instance.on(name, fn)", "CustomEvent 'ptl:<name>'", "25+ events" },
            """
            <panoptes-treelist id="eventsTree" columns="@Model.Columns" items="@Model.Items"
                selectable="multiple" sortable="true" filterable="true" pageable="true" page-size="3"
                editable="inline" draggable="true" on-event="ptlOnEvent" />
            """,
            """
            function ptlOnEvent(e) { console.log(e.type, e); }
            document.getElementById('eventsTree').addEventListener('ptl:select', ev => console.log(ev.detail));
            """);

        public IActionResult ExcelExport() => Show(
            "Excel Dışa Aktarım",
            "Görünen satırlar hiyerarşi girintisiyle .xlsx iner; aylık personel ve bütçe raporu tek tıkla.",
            new[] { "tools=\"excel\"", "export-name", "exportExcel() API" },
            "Excel Export",
            "Visible rows download as .xlsx with hierarchy indentation; monthly staff and budget reports in one click.",
            new[] { "tools=\"excel\"", "export-name", "exportExcel() API" },
            """
            <panoptes-treelist id="excelTree" columns="@Model.Columns" items="@Model.Items"
                tools="excel,expandAll,collapseAll" export-name="calisanlar" sortable="true" filterable="true" />
            """,
            "Panoptes.TreeList.getInstance('excelTree').exportExcel();");

        public IActionResult FilterRow() => Show(
            "Filtre Satırı",
            "Başlık altında sütun bazında kutu: metinde içerir, sayıda aralık, listede seçim. Eşleşen dallar açık kalır.",
            new[] { "filterable=\"true\"", "Tip duyarlı filtre", "Sayısal operatörler (>= 100000)", "filter olayı" },
            "Filter Row",
            "A filter box per header: contains for text, ranges for numbers, picks for lists. Matching branches stay open.",
            new[] { "filterable=\"true\"", "Type-sensitive filters", "Numeric operators (>= 100000)", "filter event" },
            """
            <panoptes-treelist id="filterTree" columns="@Model.Columns" items="@Model.Items"
                filterable="true" sortable="true" />
            """,
            """
            const tree = Panoptes.TreeList.getInstance('filterTree');
            tree.filter({ Salary: '>=100000' });   tree.clearFilters();
            """);

        public IActionResult FrozenColumns()
        {
            var cols = TreeListDemoData.EmployeeColumns(true);
            cols[0].Locked = true;
            cols[1].Locked = true;
            return Show(
                "Dondurulmuş Sütunlar",
                "Ad Soyad ve Unvan gibi anahtar sütunlar yatay kaydırmada sabit kalır; geniş tabloda satır takibi kaybolmaz.",
                new[] { "Locked = true", "Yatay kaydırmada sabit", "Sütun menüsünden kilitle" },
                "Frozen Columns",
                "Key columns like name and title stay fixed on horizontal scroll; you always know which row you are on.",
                new[] { "Locked = true", "Pinned on scroll", "Lock from column menu" },
                """
                <panoptes-treelist id="frozenTree" columns="@Model.Columns" items="@Model.Items"
                    column-menu="true" lockable="true" resizable="true" />
                """,
                """
                new TreeListColumn { Field = "Name", Title = "Ad Soyad", Width = "260", IsTreeColumn = true, Locked = true },
                new TreeListColumn { Field = "Role", Title = "Unvan",    Width = "200", Locked = true },
                """,
                cols);
        }

        public IActionResult KeyboardNavigation() => Show(
            "Klavye Navigasyonu",
            "Fare yok: oklarla gezin, Boşlukla seç, F2 ile düzenle. Veri giriş operatörleri klavyeden kalkmaz.",
            new[] { "keyboard-hint=\"true\"", "Ok tuşları", "Boşluk / Enter", "F2 / Del" },
            "Keyboard Navigation",
            "No mouse needed: arrows navigate, Space selects, F2 edits. Data entry operators never leave the keyboard.",
            new[] { "keyboard-hint=\"true\"", "Arrow keys", "Space / Enter", "F2 / Del" },
            """
            <panoptes-treelist id="kbTree" columns="@Model.Columns" items="@Model.Items"
                selectable="multiple" editable="inline" keyboard="true" keyboard-hint="true" />
            """,
            "");

        public IActionResult MultiColumnHeaders() => Show(
            "Çok Katmanlı Başlıklar",
            "Ardışık sütunları ortak üst başlıkta birleştir: Kişi, Organizasyon, Ücret grupları; bordro tek bakışta okunur.",
            new[] { "TreeListColumn.Group", "İki satırlı başlık", "Sıralama / filtre ile uyumlu" },
            "Multi-Column Headers",
            "Merge adjacent columns under shared headers like Person, Organization, and Pay; payroll tables read at a glance.",
            new[] { "TreeListColumn.Group", "Two-row headers", "Works with sort / filter" },
            """
            <panoptes-treelist id="groupTree" columns="@Model.Columns" items="@Model.Items" sortable="true" />
            """,
            """
            new TreeListColumn { Field = "Salary", Title = "Maaş", Group = "Ücret" },
            new TreeListColumn { Field = "Bonus",  Title = "Prim",  Group = "Ücret" }
            """,
            TreeListDemoData.EmployeeGroupedColumns());

        public IActionResult OData() => Show(
            "OData Bağlama",
            "Veri OData parametreleriyle istenir; kökler sayfalanır, alt kayıtlar açılınca yüklenir. Mevcut OData servislerine doğrudan bağlanır.",
            new[] { "odata-url", "$filter / $orderby", "$top / $skip / $count", "Tembel alt kayıt yükleme" },
            "OData Binding",
            "Data arrives via OData parameters; roots page, children lazy-load on expand. Connects straight to existing OData services.",
            new[] { "odata-url", "$filter / $orderby", "$top / $skip / $count", "Lazy child loading" },
            """
            <panoptes-treelist id="odataTree" columns="@Model.Columns"
                odata-url="/TreeList/ODataProducts" pageable="true" page-size="4"
                sortable="true" filterable="true" on-event="ptlOnEvent" />
            """,
            """
            // Sunucu: GET /TreeList/ODataProducts?$filter=parentId eq null&$orderby=name asc&$top=4&$skip=0&$count=true
            // Yanıt:  { "@odata.count": 8, "value": [ { "id":"c1", "parentId":null, "hasChildren":true, "name":"Elektronik", ... } ] }
            """,
            TreeListDemoData.ProductColumns(), new List<TreeListItem>());

        public IActionResult PdfExport() => Show(
            "PDF Dışa Aktarım",
            "Görünen satırlar yazdırma görünümünde açılır, tarayıcıdan PDF alınır; resmi evrak eki hazır.",
            new[] { "tools=\"pdf\"", "exportPdf() API", "A4 yatay yazdırma düzeni" },
            "PDF Export",
            "Visible rows open in print view for browser PDF export; official attachments like signature circulars ready.",
            new[] { "tools=\"pdf\"", "exportPdf() API", "A4 landscape print layout" },
            """
            <panoptes-treelist id="pdfTree" columns="@Model.Columns" items="@Model.Items"
                tools="pdf,expandAll,collapseAll" export-name="calisanlar" sortable="true" />
            """,
            "Panoptes.TreeList.getInstance('pdfTree').exportPdf();");

        public IActionResult PersistState() => Show(
            "Durumu Kaydet (Persist State)",
            "Sıralama, filtre ve açık düğümler tarayıcıda saklanır; kullanıcı ertesi gün kaldığı ekrana döner.",
            new[] { "persist-key", "saveState / loadState / resetState", "persist-auto", "localStorage" },
            "Persist State",
            "Sorting, filters, and open nodes persist in the browser; users return to their screen the next day.",
            new[] { "persist-key", "saveState / loadState / resetState", "persist-auto", "localStorage" },
            """
            <panoptes-treelist id="stateTree" columns="@Model.Columns" items="@Model.Items"
                persist-key="demo-treelist-state" tools="saveState,loadState,resetState,expandAll,collapseAll"
                sortable="true" filterable="true" resizable="true" reorderable="true" column-menu="true" />
            """,
            """
            const tree = Panoptes.TreeList.getInstance('stateTree');
            tree.saveState();  tree.loadState();  tree.resetState();  tree.hasSavedState();
            """);

        public IActionResult RemoteDataBinding() => Show(
            "Uzak Veri Bağlama",
            "Kökler sunucudan sayfalı gelir, alt kayıtlar açılınca istenir; dev ürün ağaçları tarayıcıyı yormaz.",
            new[] { "remote-url", "Tembel yükleme", "Sunucu tarafı sıralama / filtre", "Sunucu tarafı sayfalama" },
            "Remote Data Binding",
            "Paged roots from the server, children on demand; million-row product trees never strain the browser.",
            new[] { "remote-url", "Lazy loading", "Server sorting / filtering", "Server paging" },
            """
            <panoptes-treelist id="remoteTree" columns="@Model.Columns"
                remote-url="/TreeList/RemoteProducts" pageable="true" page-size="4"
                sortable="true" filterable="true" on-event="ptlOnEvent" />
            """,
            """
            // GET /TreeList/RemoteProducts?parentId=c1&sort=price-desc&filter=[{"field":"name","op":"contains","value":"tel"}]&skip=0&take=4
            // Yanıt: { "items": [ { "id":"c1-s1", "parentId":"c1", "hasChildren":true, "name":"Telefon" } ], "total": 3 }
            """,
            TreeListDemoData.ProductColumns(), new List<TreeListItem>());

        public IActionResult RowTemplate() => Show(
            "Satır Şablonu (Row Template)",
            "Satır HTML'ini tamamen siz yazın: rozet, ilerleme çubuğu ve mini grafik hücre içinde.",
            new[] { "row-template", "Özel HTML hücreler", "d.toggle / d.indent", "d.fmt(alan, değer)" },
            "Row Template",
            "Write row HTML yourself: badges, progress bars, and mini charts inside cells. Custom presentation for dashboards.",
            new[] { "row-template", "Custom HTML cells", "d.toggle / d.indent", "d.fmt(field, value)" },
            """
            <panoptes-treelist id="tplTree" columns="@Model.Columns" items="@Model.Items" row-template="empRow" />
            """,
            """
            function empRow(d) {
              const v = d.values;
              return `<td><div style="display:flex;gap:6px;padding-left:${d.indent}px">${d.toggle}<b>${d.esc(v.Name)}</b></div></td>`
                   + `<td>${d.esc(v.Role)}</td> ...`;
            }
            """,
            new List<TreeListColumn>
            {
                new() { Field = "Name", Title = "Çalışan", Width = "320", IsTreeColumn = true },
                new() { Field = "Department", Title = "Departman", Width = "160" },
                new() { Field = "Location", Title = "Lokasyon", Width = "130" },
                new() { Field = "Salary", Title = "Maaş", Width = "130", Align = "right", Format = "currency" },
            });

        public IActionResult SearchPanel() => Show(
            "Arama Paneli",
            "Araç çubuğundaki kutu ağaçta canlı arar, eşleşmeyi vurgular, üst düğümleri açar. Binlerce kayıtta isimle bulma.",
            new[] { "show-search", "search-fields", "Vurgulama", "setSearchFields() API" },
            "Search Panel",
            "The toolbar box live-searches the tree, highlights matches, and opens parents. Find a name among thousands of staff.",
            new[] { "show-search", "search-fields", "Highlighting", "setSearchFields() API" },
            """
            <panoptes-treelist id="searchTree" columns="@Model.Columns" items="@Model.Items"
                show-search="true" search-fields="Name,Role" />
            """,
            "Panoptes.TreeList.getInstance('searchTree').setSearchFields(['Name', 'Location']);");

        public IActionResult ToolbarTemplate() => Show(
            "Araç Çubuğu Şablonu",
            "Araç çubuğuna özel HTML ve düğmeler; seçili adet ve başlık canlı güncellenir, toplu işlemler buradan tetiklenir.",
            new[] { "toolbar-template", "{{count}} / {{selected}}", "Özel düğmeler", "Instance API" },
            "Toolbar Template",
            "Custom HTML and buttons in the toolbar; live count and title, bulk actions triggered here.",
            new[] { "toolbar-template", "{{count}} / {{selected}}", "Custom buttons", "Instance API" },
            """
            <template id="myToolbar">
              <span>{{count}} kayıt, {{selected}} seçili</span>
              <button onclick="Panoptes.TreeList.getInstance('tbTree').expandAll()">Aç</button>
            </template>
            <panoptes-treelist id="tbTree" columns="@Model.Columns" items="@Model.Items"
                selectable="multiple" toolbar-template="myToolbar" />
            """,
            "");

        // ============================================================
        //  Uzak veri / OData uç noktaları (demo amaçlı bellek içi katalog)
        // ============================================================

        [HttpGet]
        public async Task<IActionResult> RemoteProducts(string? parentId, string? sort, string? filter, int skip = 0, int take = 0)
        {
            await Task.Delay(180); // ağ gecikmesi simülasyonu
            var (items, total) = TreeListDemoData.Query(parentId, TreeListDemoData.ParseJsonFilters(filter), TreeListDemoData.ParseSort(sort), skip, take > 0 ? take : null);
            return Json(new { items, total });
        }

        [HttpGet]
        public async Task<IActionResult> ODataProducts()
        {
            await Task.Delay(180);
            var q = TreeListDemoData.ParseOData(Request.Query);
            var (items, total) = TreeListDemoData.Query(q.ParentId, q.Filters, q.Sort, q.Skip, q.Top);
            return Json(new Dictionary<string, object?> { ["@odata.count"] = total, ["value"] = items });
        }
    }
}
