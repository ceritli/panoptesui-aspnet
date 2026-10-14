using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
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

        private IActionResult Show(string title, string description, string[] highlights, string razor, string script,
            List<TreeListColumn>? columns = null, List<TreeListItem>? items = null)
        {
            ViewData["Title"] = title + " - TreeList";
            return View(new TreeListPageModel
            {
                Title = title,
                Description = description,
                Highlights = highlights,
                RazorCode = razor,
                ScriptCode = script,
                Columns = columns ?? TreeListDemoData.EmployeeColumns(),
                Items = items ?? TreeListDemoData.Employees()
            });
        }

        public IActionResult Aggregates() => Show(
            "Toplamlar (Aggregates)",
            "Sütunlara sum / avg / count / min / max tanımlayın. Üst düğümler alt kayıtlarının toplamını gösterir, alt bilgi satırı genel toplamı verir. Değerleri hücre içi düzenleyince toplamlar canlı güncellenir.",
            new[] { "aggregates=\"both\"", "Üst düğüm toplamı (Σ)", "Genel toplam satırı", "sum / avg" },
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
            "Panoptes.TreeList.getInstance(id) ile tüm işlemler JavaScript'ten yönetilebilir: genişlet/daralt, seç, sırala, filtrele, kayıt ekle/güncelle/sil, dışa aktar.",
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
            "Her satırda onay kutusu bulunur. Üst düğümü işaretlemek tüm alt kayıtları seçer; kısmen seçili üst düğümler 'belirsiz' durumda gösterilir. Başlıktaki kutu tümünü seçer.",
            new[] { "selectable=\"checkbox\"", "Alt kayıtlara yayılan seçim", "Belirsiz (indeterminate) durum", "Tümünü seç" },
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
            "Kök düğümler sayfalanır; açılan alt kayıtlar bağlı oldukları kökle birlikte kalır. Sayfa boyutu seçilebilir.",
            new[] { "pageable=\"true\"", "page-size / page-sizes", "Kök düğüm bazlı sayfalama" },
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
            "Her başlıkta bir menü: artan/azalan sıralama, o sütuna filtre, sütunları gösterme/gizleme ve sütunu kilitleme.",
            new[] { "column-menu=\"true\"", "Sıralama", "Filtre", "Sütun göster/gizle", "Sütunu kilitle" },
            """
            <panoptes-treelist id="menuTree" columns="@Model.Columns" items="@Model.Items"
                column-menu="true" sortable="true" filterable="true" lockable="true" />
            """,
            "",
            TreeListDemoData.EmployeeColumns(true));

        public IActionResult ColumnReordering() => Show(
            "Sütun Sıralama (Sürükle)",
            "Sütun başlıklarını sürükleyip bırakarak yerlerini değiştirin.",
            new[] { "reorderable=\"true\"", "Başlığı sürükle-bırak", "columnReorder olayı" },
            """
            <panoptes-treelist id="reorderTree" columns="@Model.Columns" items="@Model.Items"
                reorderable="true" on-event="ptlOnEvent" />
            """,
            "");

        public IActionResult ColumnResizing() => Show(
            "Sütun Boyutlandırma",
            "Başlıkların sağ kenarını sürükleyerek sütun genişliğini değiştirin.",
            new[] { "resizable=\"true\"", "Sürükleyerek boyutlandır", "columnResize olayı" },
            """
            <panoptes-treelist id="resizeTree" columns="@Model.Columns" items="@Model.Items"
                resizable="true" on-event="ptlOnEvent" />
            """,
            "");

        public IActionResult DragDrop() => Show(
            "Sürükle & Bırak (Satır)",
            "Satırları sürükleyerek ağaç yapısını değiştirin. Bir satırın üstüne/altına bırakınca kardeş olur, ortasına bırakınca alt kaydı olur. Bir düğüm kendi torununa taşınamaz.",
            new[] { "draggable=\"true\"", "Önce / içine / sonra bırakma", "drop olayı" },
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
            "Satırdaki kalem düğmesiyle tüm satır düzenlenebilir hale gelir; kaydet/iptal düğmeleri görünür. Alt kayıt ekleme ve silme (onaylı) desteklenir.",
            new[] { "editable=\"inline\"", "Alt kayıt ekle", "Silme onayı", "save / add / remove olayları" },
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
            "Bir hücreye tıklayınca yalnızca o hücre düzenlenir; Enter / odak kaybı kaydeder, Esc iptal eder.",
            new[] { "editable=\"incell\"", "Tek hücre düzenleme", "Enter / Esc", "save olayı (oldValue → value)" },
            """
            <panoptes-treelist id="incellTree" columns="@Model.Columns" items="@Model.Items"
                editable="incell" on-event="ptlOnEvent" />
            """,
            "");

        public IActionResult EditingPopup() => Show(
            "Popup Düzenleme",
            "Düzenleme düğmesi modal bir form açar. Sütun tipine göre uygun giriş alanı (metin, sayı, tarih, liste, onay kutusu) oluşturulur; zorunlu alanlar doğrulanır.",
            new[] { "editable=\"popup\"", "Tipine göre form alanları", "Zorunlu alan doğrulaması", "Esc ile kapatma" },
            """
            <panoptes-treelist id="popupTree" columns="@Model.Columns" items="@Model.Items"
                editable="popup" on-event="ptlOnEvent" />
            """,
            "");

        public IActionResult Events() => Show(
            "Olaylar (Events)",
            "Seçim, genişletme, sıralama, filtre, sayfa, düzenleme, sürükleme, sütun ve dışa aktarma dahil tüm olaylar tek bir on-event geri çağırmasıyla veya instance.on(...) ile yakalanabilir.",
            new[] { "on-event", "instance.on(name, fn)", "CustomEvent 'ptl:<ad>'", "25+ olay" },
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
            "Görünen (filtrelenmiş / sıralanmış) satırlar hiyerarşi girintisiyle Excel dosyası olarak indirilir.",
            new[] { "tools=\"excel\"", "export-name", "exportExcel() API" },
            """
            <panoptes-treelist id="excelTree" columns="@Model.Columns" items="@Model.Items"
                tools="excel,expandAll,collapseAll" export-name="calisanlar" sortable="true" filterable="true" />
            """,
            "Panoptes.TreeList.getInstance('excelTree').exportExcel();");

        public IActionResult FilterRow() => Show(
            "Filtre Satırı",
            "Başlığın altında her sütun için filtre kutusu bulunur. Metinde 'içerir', sayıda >, <, >=, <=, = operatörleri; liste ve onay kutusu sütunlarında seçim kullanılır. Eşleşen düğümlerin üst düğümleri açık kalır.",
            new[] { "filterable=\"true\"", "Tip duyarlı filtre", "Sayısal operatörler (>= 100000)", "filter olayı" },
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
                "Locked = true olan sütunlar yatay kaydırmada sabit kalır. Kilitli sütunlar en başta yer almalıdır; sütun menüsünden de kilitlenebilir.",
                new[] { "Locked = true", "Yatay kaydırmada sabit", "Sütun menüsünden kilitle" },
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
            "Tabloya tıklayın veya Tab ile odaklanın; ardından klavye ile gezin: ↑ ↓ satırlar, → aç / alt kayıt, ← kapat / üst kayıt, Boşluk seç, Enter aç-kapat, Home/End, F2 düzenle, Del sil.",
            new[] { "keyboard-hint=\"true\"", "Ok tuşları", "Boşluk / Enter", "F2 / Del" },
            """
            <panoptes-treelist id="kbTree" columns="@Model.Columns" items="@Model.Items"
                selectable="multiple" editable="inline" keyboard="true" keyboard-hint="true" />
            """,
            "");

        public IActionResult MultiColumnHeaders() => Show(
            "Çok Katmanlı Başlıklar",
            "Ardışık sütunlara aynı Group değerini verin; ortak bir üst başlık altında birleşirler.",
            new[] { "TreeListColumn.Group", "İki satırlı başlık", "Sıralama / filtre ile uyumlu" },
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
            "Veriler sunucudan OData sorgu parametreleriyle ($filter, $orderby, $top, $skip, $count) istenir. Kök düğümler sayfalanır, alt kayıtlar bir düğüm açılınca tembel (lazy) yüklenir. Üstteki 'Son istek' kutusu gönderilen isteği gösterir.",
            new[] { "odata-url", "$filter / $orderby", "$top / $skip / $count", "Tembel alt kayıt yükleme" },
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
            "Görünen satırlar yazdırma görünümünde açılır; tarayıcının 'PDF olarak kaydet' seçeneğiyle PDF üretilir.",
            new[] { "tools=\"pdf\"", "exportPdf() API", "A4 yatay yazdırma düzeni" },
            """
            <panoptes-treelist id="pdfTree" columns="@Model.Columns" items="@Model.Items"
                tools="pdf,expandAll,collapseAll" export-name="calisanlar" sortable="true" />
            """,
            "Panoptes.TreeList.getInstance('pdfTree').exportPdf();");

        public IActionResult PersistState() => Show(
            "Durumu Kaydet (Persist State)",
            "Sıralama, filtre, sütun sırası/genişliği/görünürlüğü, açık düğümler ve sayfa tarayıcıda (localStorage) saklanır. Durumu değiştirin, 'Durumu Kaydet'e basın, sayfayı yenileyip 'Durumu Yükle' deyin.",
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
            "Kök kayıtlar sunucudan yüklenir (sayfalı); bir düğüm ilk kez açıldığında alt kayıtlar tembel olarak istenir. Sıralama ve filtre sunucuda uygulanır.",
            new[] { "remote-url", "Tembel yükleme", "Sunucu tarafı sıralama / filtre", "Sunucu tarafı sayfalama" },
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
            "Satırların HTML'ini tamamen siz belirleyin: window üzerindeki bir fonksiyon her satır için <td> içeriğini üretir. Girinti ve aç/kapat oku d.toggle / d.indent ile eklenir.",
            new[] { "row-template", "Özel HTML hücreler", "d.toggle / d.indent", "d.fmt(alan, değer)" },
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
            "Araç çubuğundaki arama kutusu ağaçta canlı arama yapar, eşleşmeleri vurgular ve üst düğümleri otomatik açar. Hangi alanlarda aranacağı search-fields ile belirlenir ve çalışma zamanında değiştirilebilir.",
            new[] { "show-search", "search-fields", "Vurgulama", "setSearchFields() API" },
            """
            <panoptes-treelist id="searchTree" columns="@Model.Columns" items="@Model.Items"
                show-search="true" search-fields="Name,Role" />
            """,
            "Panoptes.TreeList.getInstance('searchTree').setSearchFields(['Name', 'Location']);");

        public IActionResult ToolbarTemplate() => Show(
            "Araç Çubuğu Şablonu",
            "Araç çubuğuna <template> ile özel HTML ekleyin. {{count}}, {{selected}} ve {{title}} belirteçleri canlı güncellenir; düğmeler instance API'sini çağırabilir.",
            new[] { "toolbar-template", "{{count}} / {{selected}}", "Özel düğmeler", "Instance API" },
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
