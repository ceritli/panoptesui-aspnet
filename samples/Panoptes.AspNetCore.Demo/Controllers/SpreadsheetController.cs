using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Text.Json;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Panoptes.AspNetCore.Demo.Services;
using Panoptes.AspNetCore.Export;
using Panoptes.AspNetCore.Models;

namespace Panoptes.AspNetCore.Demo.Controllers
{
    public class SpreadsheetPageModel
    {
        public string Title { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public string[] Highlights { get; set; } = Array.Empty<string>();
        public string RazorCode { get; set; } = string.Empty;
        public string ScriptCode { get; set; } = string.Empty;
        public List<SpreadsheetSheet> Sheets { get; set; } = new();
    }

    public record SpreadsheetDemoInfo(string Action, string Title, string Description, string Slug, string EnTitle, string EnDescription);

    public class SpreadsheetController : Controller
    {
        public static readonly SpreadsheetDemoInfo[] Pages =
        {
            new("TagHelper", "TagHelper Kullanımı", "<panoptes-spreadsheet> etiketi ve öznitelikleri.", "tag-helper", "TagHelper Usage", "The <panoptes-spreadsheet> tag and its attributes."),
            new("SortingFiltering", "Sıralama ve Filtreleme", "Aralık sıralama ve başlık filtresi.", "sorting-filtering", "Sorting & Filtering", "Range sorting and header filters."),
            new("ServerImportExport", "Sunucu Taraflı İçe/Dışa Aktarma", "Sunucuda .xlsx okuma ve yazma.", "server-side-import-export", "Server Import & Export", "Server-side .xlsx read and write."),
            new("PdfExport", "PDF'e Aktarma", "Yazdırma görünümünden PDF.", "server-side-pdf-export", "PDF Export", "PDF via print view."),
            new("DataSource", "Veri Kaynağına Bağlama", "JSON kayıt listesine bağlama.", "datasource", "Data Source Binding", "Bind to a JSON record list."),
            new("Resize", "Boyutlandırma", "Sütun, satır ve bileşen boyutu.", "resize", "Resizing", "Column, row, and widget sizing."),
            new("DisabledCells", "Devre Dışı Hücreler", "Kilitli aralık ve hücreler.", "disabled-cells", "Disabled Cells", "Locked ranges and cells."),
            new("CustomEditors", "Özel Hücre Düzenleyicileri", "Liste, tarih ve özel düzenleyiciler.", "custom-editors", "Custom Editors", "List, date, and custom editors."),
            new("Images", "Resimler", "Hücre içi resimler.", "images", "Images", "In-cell images."),
            new("CellComments", "Hücre Yorumları", "Hücre yorumları.", "cell-comments", "Cell Comments", "Cell comments."),
            new("Events", "Olaylar", "Olay günlüğü ve geri çağırma.", "events", "Events", "Event log and callbacks."),
            new("Validation", "Veri Doğrulama", "Doğrulama kuralları.", "validation", "Validation", "Validation rules."),
            new("KeyboardNavigation", "Klavye Gezinmesi", "Excel uyumlu kısayollar.", "keyboard-navigation", "Keyboard Navigation", "Excel-compatible shortcuts.")
        };

        public IActionResult Index()
        {
            ViewData["Title"] = "Spreadsheet (Hesap Tablosu)";
            return View(new SpreadsheetPageModel
            {
                Title = "Temel Kullanım",
                Sheets = SpreadsheetDemoData.FinanceSheets()
            });
        }

        // ============================================================
        //  Demo sayfaları
        // ============================================================

        private IActionResult Show(string title, string description, string[] highlights,
            string enTitle, string enDescription, string[] enHighlights,
            string razor, string script, List<SpreadsheetSheet> sheets)
        {
            var isEn = DemoTranslations.IsEnglish(HttpContext);
            var viewTitle = isEn ? enTitle : title;
            ViewData["Title"] = viewTitle + " - Spreadsheet";
            return View(new SpreadsheetPageModel
            {
                Title = viewTitle,
                Description = isEn ? enDescription : description,
                Highlights = isEn ? enHighlights : highlights,
                RazorCode = razor,
                ScriptCode = script,
                Sheets = sheets
            });
        }

        public IActionResult TagHelper() => Show(
            "TagHelper Kullanımı",
            "Bileşen tek Razor etiketiyle eklenir; sayfa, hücre ve doğrulama C# modeliyle tanımlanır. Bütçe tablosu kod tekrarı olmadan kurulur.",
            new[] { "<panoptes-spreadsheet>", "sheets=\"@Model.Sheets\"", "toolbar=\"home,data\"", "formula-bar", "sheets-bar", "editable", "show-grid-lines" },
            "TagHelper Usage",
            "Drop the component in with one Razor tag; sheets, cells, and validation come from C# models. Budget tables without repetitive code.",
            new[] { "<panoptes-spreadsheet>", "sheets=\"@Model.Sheets\"", "toolbar=\"home,data\"", "formula-bar", "sheets-bar", "editable", "show-grid-lines" },
            """
            <panoptes-spreadsheet id="sheet" title="Satış Tablosu" height="420"
                sheets="@Model.Sheets"
                toolbar="home,insert,data,view,file"
                formula-bar="true" sheets-bar="true" editable="true"
                show-grid-lines="true" file-name="Satis" />
            """,
            """
            var sheet = new SpreadsheetSheet { Name = "Satış", Rows = 30, Cols = 8, FrozenRows = 1 };
            sheet.Cells.Add(new SpreadsheetCell { Row = 1, Col = 1, Value = "Ürün", Bold = true, Background = "#e0f2fe" });
            sheet.Cells.Add(new SpreadsheetCell { Row = 2, Col = 2, Value = "40" });
            sheet.Cells.Add(new SpreadsheetCell { Row = 2, Col = 4, Formula = "=B2*C2", Format = "currency" });
            sheet.MergedCells = new() { "A8:C8" };
            """,
            new() { SpreadsheetDemoData.Practice("Satış") });

        public IActionResult SortingFiltering() => Show(
            "Sıralama ve Filtreleme",
            "Aralığı seç, Veri sekmesinden sırala; başlığa filtre menüsü ekle. Personel listesi maaşa göre dizilir, departmana göre süzülür.",
            new[] { "Veri › Artan/Azalan Sırala", "Veri › Filtre", "Ctrl+Shift+L", "Alt+↓ filtre menüsü", "Filter = \"A1:F16\"" },
            "Sorting & Filtering",
            "Select a range, sort from the Data tab, add filter menus to headers. Staff lists order by salary and filter by department.",
            new[] { "Data › Sort Asc/Desc", "Data › Filter", "Ctrl+Shift+L", "Alt+Down filter menu", "Filter = \"A1:F16\"" },
            """
            <panoptes-spreadsheet id="sheet" sheets="@Model.Sheets" height="460" on-event="pssOnEvent" />
            """,
            """
            // Sayfa modelinde filtre aralığını verin
            new SpreadsheetSheet { Name = "Çalışanlar", Filter = "A1:F16", FrozenRows = 1 };

            // JavaScript API
            var sh = Panoptes.Spreadsheet.getInstance('sheet');
            sh.sort('A2:F16', 5, 'desc');   // maaşa göre azalan
            sh.filter('A1:F16');            // filtreyi aç
            sh.clearFilters();
            """,
            new() { SpreadsheetDemoData.Employees(filter: true) });

        public IActionResult ServerImportExport() => Show(
            "Sunucu Taraflı İçe/Dışa Aktarma",
            "Excel dosyasını sunucuda oku ve yaz; formüller korunur. Muhasebeden gelen .xlsx doğrudan tabloya açılır.",
            new[] { "export-url", "import-url", "POST /Spreadsheet/ExportXlsx", "POST /Spreadsheet/ImportXlsx", ".xlsx", "CSV / JSON" },
            "Server Import & Export",
            "Read and write Excel on the server with formulas intact. Open the .xlsx from accounting straight into the grid.",
            new[] { "export-url", "import-url", "POST /Spreadsheet/ExportXlsx", "POST /Spreadsheet/ImportXlsx", ".xlsx", "CSV / JSON" },
            """
            <panoptes-spreadsheet id="sheet" sheets="@Model.Sheets" height="480"
                export-url="@Url.Action("ExportXlsx", "Spreadsheet")"
                import-url="@Url.Action("ImportXlsx", "Spreadsheet")"
                file-name="Butce" on-event="pssOnEvent" />
            """,
            """
            [HttpPost]
            public IActionResult ExportXlsx([FromBody] JsonElement body)
            {
                var bytes = SpreadsheetXlsx.Write(body);
                return File(bytes, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", "Butce.xlsx");
            }

            [HttpPost]
            public IActionResult ImportXlsx(IFormFile file)
            {
                using var s = file.OpenReadStream();
                return Json(new { sheets = SpreadsheetXlsx.Read(s) });
            }
            """,
            SpreadsheetDemoData.FinanceSheets());

        public IActionResult PdfExport() => Show(
            "PDF'e Aktarma",
            "Sayfayı temiz yazdırma görünümüne çevir, tarayıcıdan PDF al; biçimler ve birleştirmeler korunur. Fiyat listesi müşteriye gönderime hazır.",
            new[] { "Dosya › PDF / Yazdır", "instance.exportPdf()", "yatay A4", "biçimler korunur" },
            "PDF Export",
            "Render a clean print view for browser PDF export with formats and merges intact. Price lists ready to send.",
            new[] { "File › PDF / Print", "instance.exportPdf()", "landscape A4", "formats preserved" },
            """
            <panoptes-spreadsheet id="sheet" sheets="@Model.Sheets" height="460" file-name="Calisanlar" />
            <button onclick="Panoptes.Spreadsheet.getInstance('sheet').exportPdf()">PDF olarak aktar</button>
            """,
            """
            // Tüm sayfaları sırayla yazdırmak için sayfayı değiştirip tekrar çağırın
            var sh = Panoptes.Spreadsheet.getInstance('sheet');
            sh.activateSheet(0);
            sh.exportPdf();
            """,
            new() { SpreadsheetDemoData.Employees(), SpreadsheetDemoData.Practice("Alıştırma") });

        public IActionResult DataSource() => Show(
            "Veri Kaynağına Bağlama",
            "Sayfayı JSON kayıt listesine bağla; sunucudan yenile, değişeni geri oku. Canlı stok verisi tabloya akar.",
            new[] { "DataSource.Columns", "DataSource.Items", "getData()", "bindData(cols, items)", "fetchData(url)", "dataBound / dataChange" },
            "Data Source Binding",
            "Bind the sheet to a JSON record list; refresh from the server, read changes back. Live stock data flows in.",
            new[] { "DataSource.Columns", "DataSource.Items", "getData()", "bindData(cols, items)", "fetchData(url)", "dataBound / dataChange" },
            """
            <panoptes-spreadsheet id="sheet" sheets="@Model.Sheets" height="460" on-event="pssOnEvent" />
            """,
            """
            new SpreadsheetSheet {
                Name = "Siparişler", FrozenRows = 1,
                DataSource = new SpreadsheetDataSource {
                    Columns = { new() { Field = "customer", Title = "Müşteri" },
                                new() { Field = "status", Title = "Durum", Editor = "list", Items = { "Beklemede", "Kargoda" } } },
                    Items = orders
                }
            };

            // JavaScript
            var sh = Panoptes.Spreadsheet.getInstance('sheet');
            sh.fetchData('/Spreadsheet/Orders');
            console.log(sh.getData());
            """,
            new() { SpreadsheetDemoData.OrdersSheet() });

        public IActionResult Resize() => Show(
            "Boyutlandırma",
            "Sınırları sürükle, çift tıkla otomatik sığdır; bileşeni köşeden büyüt. Uzun açıklamalar tek hamlede görünür.",
            new[] { "resizable=\"true\"", "ColumnWidths", "RowHeights", "resizeColumn(i, px)", "resizeRow(i, px)", "çift tık: otomatik sığdır", "resize olayı" },
            "Resizing",
            "Drag borders, double-click to autofit, grow the component from the corner. Long notes visible in one move.",
            new[] { "resizable=\"true\"", "ColumnWidths", "RowHeights", "resizeColumn(i, px)", "resizeRow(i, px)", "double-click autofit", "resize event" },
            """
            <panoptes-spreadsheet id="sheet" sheets="@Model.Sheets" height="420" resizable="true" on-event="pssOnEvent" />
            """,
            """
            new SpreadsheetSheet {
                ColumnWidths = new() { [1] = 150, [2] = 130 },   // 1 tabanlı sütun → piksel
                RowHeights   = new() { [1] = 36 }
            };

            // JavaScript
            var sh = Panoptes.Spreadsheet.getInstance('sheet');
            sh.resizeColumn(3, 240);
            sh.resizeRow(1, 44);
            """,
            new() { SpreadsheetDemoData.Employees(freeze: false) });

        public IActionResult DisabledCells() => Show(
            "Devre Dışı Hücreler",
            "Aralıkları ve hücreleri kilitle: düzenleme, silme ve yapıştırma atlar. Formül ve toplam satırları kullanıcıdan korunur.",
            new[] { "DisabledRanges", "SpreadsheetCell.Enabled", "disable('A1:A5')", "enable('A1:A5')", "setReadonly(true)", "blocked olayı" },
            "Disabled Cells",
            "Lock ranges and cells against edit, delete, and paste. Formula and total rows stay user-proof.",
            new[] { "DisabledRanges", "SpreadsheetCell.Enabled", "disable('A1:A5')", "enable('A1:A5')", "setReadonly(true)", "blocked event" },
            """
            <panoptes-spreadsheet id="sheet" sheets="@Model.Sheets" height="420" on-event="pssOnEvent" />
            """,
            """
            new SpreadsheetSheet {
                DisabledRanges = new() { "A1:E1", "A2:A7" },
                Cells = { new SpreadsheetCell { Row = 2, Col = 5, Formula = "=SUM(B2:D2)", Enabled = false } }
            };

            // JavaScript
            var sh = Panoptes.Spreadsheet.getInstance('sheet');
            sh.disable('B2:D7');
            sh.enable('B2:D7');
            sh.setReadonly(true);   // tüm tabloyu salt okunur yap
            """,
            new() { SpreadsheetDemoData.LockedSheet() });

        public IActionResult CustomEditors() => Show(
            "Özel Hücre Düzenleyicileri",
            "Aralığa özel düzenleyici ata: liste, tarih, sayı, onay, renk ve puan. Stok sayımında hücre hücre hızlı ve hatasız giriş.",
            new[] { "Editors", "list", "date", "number (min/max/step)", "checkbox", "color", "rating", "setEditor(ref, def)" },
            "Custom Editors",
            "Assign list, date, number, checkbox, color, and rating editors to ranges. Fast, error-free stock-count entry.",
            new[] { "Editors", "list", "date", "number (min/max/step)", "checkbox", "color", "rating", "setEditor(ref, def)" },
            """
            <panoptes-spreadsheet id="sheet" sheets="@Model.Sheets" height="420" on-event="pssOnEvent" />
            """,
            """
            new SpreadsheetSheet {
                Editors = new() {
                    new() { Range = "B2:B25", Type = "list", Items = new() { "Düşük", "Orta", "Yüksek" } },
                    new() { Range = "C2:C25", Type = "date" },
                    new() { Range = "D2:D25", Type = "number", Min = 0, Max = 100, Step = 5 },
                    new() { Range = "E2:E25", Type = "checkbox" },
                    new() { Range = "F2:F25", Type = "color" },
                    new() { Range = "G2:G25", Type = "rating", Max = 5 }
                }
            };

            // JavaScript
            Panoptes.Spreadsheet.getInstance('sheet').setEditor('H2:H20', { type: 'list', items: ['A','B'] });
            """,
            new() { SpreadsheetDemoData.EditorsSheet() });

        public IActionResult Images() => Show(
            "Resimler",
            "Hücrelere sabitlenen, taşınabilir resimler; ürün fotoğrafı stok kartında görünür.",
            new[] { "Images", "Ekle › Resim", "sürükle / boyutlandır", "Delete", "addImage({...})", "imageAdd / imageChange / imageRemove" },
            "Images",
            "Pinned, movable cell images; product photos visible on stock cards.",
            new[] { "Images", "Insert › Image", "drag / resize", "Delete", "addImage({...})", "imageAdd / imageChange / imageRemove" },
            """
            <panoptes-spreadsheet id="sheet" sheets="@Model.Sheets" height="460" on-event="pssOnEvent" />
            """,
            """
            new SpreadsheetSheet {
                Images = new() { new() { Src = "/img/logo.png", Row = 5, Col = 1, X = 4, Y = 4, Width = 160, Height = 90 } }
            };

            // JavaScript
            Panoptes.Spreadsheet.getInstance('sheet').addImage({ src: '/img/logo.png', row: 2, col: 4, width: 120, height: 80 });
            """,
            new() { SpreadsheetDemoData.ImagesSheet() });

        public IActionResult CellComments() => Show(
            "Hücre Yorumları",
            "Hücreye yorum ekle, üzerine gelince oku; denetim notları tablonun içinde yaşar.",
            new[] { "SpreadsheetCell.Comment", "Shift+F2", "sağ tık › Yorum ekle", "setCommentAt(ref, text)", "getComment(ref)", "comment olayı" },
            "Cell Comments",
            "Comment on cells, read on hover; audit notes live inside the sheet.",
            new[] { "SpreadsheetCell.Comment", "Shift+F2", "right-click › Add comment", "setCommentAt(ref, text)", "getComment(ref)", "comment event" },
            """
            <panoptes-spreadsheet id="sheet" sheets="@Model.Sheets" height="420" on-event="pssOnEvent" />
            """,
            """
            new SpreadsheetCell { Row = 3, Col = 4, Value = "90", Comment = "Q3'te tedarik sorunu yaşandı." };

            // JavaScript
            var sh = Panoptes.Spreadsheet.getInstance('sheet');
            sh.setCommentAt('B2', 'Rakam tahminidir');
            console.log(sh.getComment('B2'));
            sh.setCommentAt('B2', '');   // yorumu sil
            """,
            new() { SpreadsheetDemoData.CommentsSheet() });

        public IActionResult Events() => Show(
            "Olaylar",
            "Değişiklik, seçim ve yapıştırma dahil 30+ olay tek geri çağırmada; stok hareket günlüğü buradan beslenir.",
            new[] { "on-event", "instance.on(tür, fn)", "on('*', fn)", "30+ olay", "on-cell-change" },
            "Events",
            "30+ events including change, select, and paste in one callback; feeds the stock movement log.",
            new[] { "on-event", "instance.on(type, fn)", "on('*', fn)", "30+ events", "on-cell-change" },
            """
            <panoptes-spreadsheet id="sheet" sheets="@Model.Sheets" height="420" on-event="pssOnEvent" />
            """,
            """
            function pssOnEvent(e) { console.log(e.type, e); }

            var sh = Panoptes.Spreadsheet.getInstance('sheet');
            sh.on('change', e => console.log('Değişti', e.ref, e.oldValue, '→', e.value));
            sh.on('*', e => console.log(e.type));   // tüm olaylar
            """,
            new() { SpreadsheetDemoData.Practice() });

        public IActionResult Validation() => Show(
            "Veri Doğrulama",
            "Aralığa kural ver: liste, sayı, tarih veya formül; reddet ya da uyar. Hatalı fiyat girişi kaynağında engellenir.",
            new[] { "Validations", "list", "whole / decimal", "date", "textLength", "custom", "Reject / Uyar", "setValidationRule(ref, def)" },
            "Validation",
            "Rule ranges with list, number, date, or formula; reject or warn. Bad price entries stop at the source.",
            new[] { "Validations", "list", "whole / decimal", "date", "textLength", "custom", "Reject / Warn", "setValidationRule(ref, def)" },
            """
            <panoptes-spreadsheet id="sheet" sheets="@Model.Sheets" height="420" on-event="pssOnEvent" />
            """,
            """
            new SpreadsheetSheet {
                Validations = new() {
                    new() { Range = "B2:B20", Type = "list", Items = new() { "Türkiye", "Almanya" }, Error = "Listeden seçin." },
                    new() { Range = "C2:C20", Type = "whole", Comparer = "between", From = "1", To = "100" },
                    new() { Range = "E2:E20", Type = "date", Comparer = "between", From = "2025-01-01", To = "2025-12-31" },
                    new() { Range = "H2:H20", Type = "custom", Formula = "=H2>=C2", Reject = false }
                }
            };

            // JavaScript
            Panoptes.Spreadsheet.getInstance('sheet').setValidationRule('A2:A9', { type: 'textLength', comparer: 'lessThan', from: 10 });
            """,
            new() { SpreadsheetDemoData.ValidationSheet() });

        public IActionResult KeyboardNavigation() => Show(
            "Klavye Gezinmesi",
            "Excel kısayollarıyla çalış: oklar, F2, Ctrl+oklar. Yoğun veri girişi fare aramaz.",
            new[] { "Oklar", "Tab / Shift+Tab", "Enter / Shift+Enter", "F2", "Ctrl+Oklar", "Shift+Oklar", "Ctrl+A / Ctrl+Z" },
            "Keyboard Navigation",
            "Excel-compatible shortcuts: arrows, F2, Ctrl+arrows. Heavy data entry never reaches for the mouse.",
            new[] { "Arrows", "Tab / Shift+Tab", "Enter / Shift+Enter", "F2", "Ctrl+Arrows", "Shift+Arrows", "Ctrl+A / Ctrl+Z" },
            """
            <panoptes-spreadsheet id="sheet" sheets="@Model.Sheets" height="420" on-event="pssOnEvent" />
            """,
            "",
            new() { SpreadsheetDemoData.Practice() });

        // ============================================================
        //  Sunucu uçları
        // ============================================================

        /// <summary>İstemcideki tabloyu (JSON) geçerli bir .xlsx dosyasına dönüştürür.</summary>
        [HttpPost]
        public IActionResult ExportXlsx([FromBody] JsonElement body)
        {
            try
            {
                var bytes = SpreadsheetXlsx.Write(body);
                var name = body.ValueKind == JsonValueKind.Object && body.TryGetProperty("fileName", out var fn) && fn.ValueKind == JsonValueKind.String
                    ? fn.GetString() : null;
                name = string.IsNullOrWhiteSpace(name) ? "Panoptes" : string.Concat(name!.Where(c => !Path.GetInvalidFileNameChars().Contains(c)));
                return File(bytes, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", name + ".xlsx");
            }
            catch (Exception ex) when (ex is InvalidOperationException or JsonException)
            {
                return BadRequest(new { error = ex.Message });
            }
        }

        /// <summary>Yüklenen .xlsx dosyasını okuyup sayfa JSON'una çevirir.</summary>
        [HttpPost]
        [RequestSizeLimit(10_000_000)]
        public async Task<IActionResult> ImportXlsx(IFormFile file)
        {
            if (file == null || file.Length == 0) return BadRequest(new { error = "Dosya seçilmedi." });
            try
            {
                using var ms = new MemoryStream();
                await file.CopyToAsync(ms);
                ms.Position = 0;
                var sheets = SpreadsheetXlsx.Read(ms);
                return Json(new { sheets });
            }
            catch (Exception ex) when (ex is InvalidDataException or System.Xml.XmlException or FormatException)
            {
                return BadRequest(new { error = "Geçerli bir .xlsx dosyası değil: " + ex.Message });
            }
        }

        /// <summary>DataSource demosu için örnek sipariş kayıtları.</summary>
        [HttpGet]
        public IActionResult Orders(int count = 12) => Json(SpreadsheetDemoData.Orders(Math.Clamp(count, 1, 200)));
    }
}
