using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Text.Json;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
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

    public record SpreadsheetDemoInfo(string Action, string Title, string Description, string Slug);

    public class SpreadsheetController : Controller
    {
        public static readonly SpreadsheetDemoInfo[] Pages =
        {
            new("TagHelper", "TagHelper Kullanımı", "<panoptes-spreadsheet> etiketi ve tüm öznitelikleri; sayfa, hücre ve seçenek tanımları.", "tag-helper"),
            new("SortingFiltering", "Sıralama ve Filtreleme", "Seçili aralığı artan/azalan sıralayın, başlık satırına filtre menüsü ekleyin.", "sorting-filtering"),
            new("ServerImportExport", "Sunucu Taraflı İçe/Dışa Aktarma", "Excel (.xlsx) dosyasını sunucu üzerinden okuyun ve yazın; CSV ve JSON istemci tarafında.", "server-side-import-export"),
            new("PdfExport", "PDF'e Aktarma", "Etkin sayfayı yazdırma/PDF penceresine gönderin; biçimler ve birleştirmeler korunur.", "server-side-pdf-export"),
            new("DataSource", "Veri Kaynağına Bağlama", "Sayfayı JSON kayıt listesine bağlayın; sunucudan yenileyin, değişiklikleri geri okuyun.", "datasource"),
            new("Resize", "Boyutlandırma", "Sütun/satır sınırlarını sürükleyin, çift tıkla otomatik sığdırın, bileşeni köşeden büyütün.", "resize"),
            new("DisabledCells", "Devre Dışı Hücreler", "Aralıkları ve tek hücreleri kilitleyin; kilitli hücreler düzenlenemez, silinemez, yapıştırılamaz.", "disabled-cells"),
            new("CustomEditors", "Özel Hücre Düzenleyicileri", "Liste, tarih, sayı, onay kutusu, renk ve puanlama düzenleyicileri.", "custom-editors"),
            new("Images", "Resimler", "Hücrelere sabitlenen, taşınabilir ve boyutlandırılabilir resimler.", "images"),
            new("CellComments", "Hücre Yorumları", "Hücrelere yorum ekleyin, üzerine gelince okuyun, düzenleyin ve silin.", "cell-comments"),
            new("Events", "Olaylar", "Değişiklik, seçim, sıralama, filtre, boyutlandırma ve daha fazlası için olay günlüğü.", "events"),
            new("Validation", "Veri Doğrulama", "Liste, tam sayı, ondalık, tarih, metin uzunluğu ve özel formül kuralları.", "validation"),
            new("KeyboardNavigation", "Klavye Gezinmesi", "Excel ile uyumlu kısayollar; oklar, Tab, Enter, F2, Ctrl+oklar, Shift ile seçim.", "keyboard-navigation")
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

        private IActionResult Show(string title, string description, string[] highlights, string razor, string script, List<SpreadsheetSheet> sheets)
        {
            ViewData["Title"] = title + " - Spreadsheet";
            return View(new SpreadsheetPageModel
            {
                Title = title,
                Description = description,
                Highlights = highlights,
                RazorCode = razor,
                ScriptCode = script,
                Sheets = sheets
            });
        }

        public IActionResult TagHelper() => Show(
            "TagHelper Kullanımı",
            "Bileşen tek bir Razor etiketiyle eklenir. Sayfalar, hücreler, biçimler, birleştirmeler, dondurulmuş bölmeler, doğrulama kuralları ve düzenleyiciler C# modelleriyle (SpreadsheetSheet / SpreadsheetCell) tanımlanır; şerit menü sekmeleri toolbar özniteliğiyle seçilir.",
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
            "Bir aralık seçip Veri sekmesinden A→Z / Z→A sıralayın (başlık satırı otomatik algılanır). Filtre ile başlık hücrelerine açılır menü eklenir: değerleri işaretleyerek veya metin/sayı koşullarıyla süzün. Sayfa filter=\"A1:F16\" ile süzme açık gelir.",
            new[] { "Veri › Artan/Azalan Sırala", "Veri › Filtre", "Ctrl+Shift+L", "Alt+↓ filtre menüsü", "Filter = \"A1:F16\"" },
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
            "export-url ve import-url öznitelikleri tanımlandığında Dosya sekmesinde Excel (.xlsx) düğmeleri belirir. Tablo JSON olarak sunucuya gönderilir, sunucu geçerli bir .xlsx üretir (değerler, formüller, biçimler, birleştirmeler, sütun genişlikleri, dondurulmuş bölmeler, filtre ve doğrulama kuralları). İçe aktarmada .xlsx dosyası sunucuda okunup tabloya yüklenir. CSV ve JSON istemcide işlenir.",
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
            "Dosya › PDF / Yazdır, etkin sayfayı (kullanılan aralık, sütun genişlikleri, biçimler, renkler, birleştirmeler) temiz bir yazdırma görünümüne dönüştürür ve tarayıcının \"PDF olarak kaydet\" seçeneğini açar. Sunucuda PDF üretimi gerekmez; kütüphane bağımlılığı yoktur.",
            new[] { "Dosya › PDF / Yazdır", "instance.exportPdf()", "yatay A4", "biçimler korunur" },
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
            "Sayfa bir DataSource (sütun tanımları + kayıtlar) ile doldurulur: ilk satır başlık olur, her kayıt bir satırdır. Sütunlar biçim ve düzenleyici (liste, tarih, onay kutusu) alabilir. Hücre düzenlemeleri kayıtlara yazılır; getData() ile geri okunur, fetchData() ile sunucudan yenilenir.",
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
            "Sütun ve satır başlıklarının kenarlıklarını sürükleyerek boyutlandırın; kenarlığa çift tıklamak içeriğe göre otomatik sığdırır. resizable=\"true\" ile bileşenin kendisi sağ alt köşeden de büyütülüp küçültülebilir. Boyutlar sayfa modelinde ColumnWidths / RowHeights ile verilir.",
            new[] { "resizable=\"true\"", "ColumnWidths", "RowHeights", "resizeColumn(i, px)", "resizeRow(i, px)", "çift tık: otomatik sığdır", "resize olayı" },
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
            "Kilitli hücreler düzenlenemez; silme, yapıştırma ve doldurma işlemleri de bunları atlar. Kilitler sayfa modelinde (DisabledRanges, Enabled = false) tanımlanır, kullanıcı Veri › Hücreleri Kilitle / Kilidi Aç ile ya da enable()/disable() API'siyle değiştirir.",
            new[] { "DisabledRanges", "SpreadsheetCell.Enabled", "disable('A1:A5')", "enable('A1:A5')", "setReadonly(true)", "blocked olayı" },
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
            "Aralıklara özel düzenleyici atayın: açılır liste, tarih seçici, sınırlı sayı alanı, onay kutusu, renk seçici ve yıldız puanlama. Hücreyi çift tıklayın veya F2 / yazmaya başlayın; onay kutusu tek tıkla veya Boşluk tuşuyla değişir.",
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
            "Ekle › Resim ile bir görsel yükleyin ya da sayfa modelinde Images ile tanımlayın. Resimler bir hücreye sabitlenir (satır/sütun eklenince birlikte kayar), sürüklenerek taşınır, köşe tutamacıyla boyutlandırılır, Delete ile silinir.",
            new[] { "Images", "Ekle › Resim", "sürükle / boyutlandır", "Delete", "addImage({...})", "imageAdd / imageChange / imageRemove" },
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
            "Yorumlu hücrelerin köşesinde işaret görünür; üzerine gelince yorum açılır. Sağ tık menüsü veya Shift+F2 ile yorum ekleyin, düzenleyin, silin. Yorumlar SpreadsheetCell.Comment ile tanımlanır, setCommentAt()/getComment() ile yönetilir.",
            new[] { "SpreadsheetCell.Comment", "Shift+F2", "sağ tık › Yorum ekle", "setCommentAt(ref, text)", "getComment(ref)", "comment olayı" },
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
            "Tüm kullanıcı ve API etkileşimleri tek bir on-event geri çağırmasıyla veya instance.on(tür, fn) ile yakalanır: select, change, changeFormat, copy / cut / paste, clear, undo / redo, insertRow / deleteRow, sort, filter, validation, comment, imageAdd, resize, merge, freeze, enable / disable, import / export ve daha fazlası.",
            new[] { "on-event", "instance.on(tür, fn)", "on('*', fn)", "30+ olay", "on-cell-change" },
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
            "Aralıklara doğrulama kuralı verin: liste, tam sayı, ondalık, tarih, metin uzunluğu ya da özel formül; karşılaştırma (arasında, büyük, eşit…), giriş mesajı, hata mesajı ve Reddet / Uyar modu. Veri › Veri Doğrulama penceresinden de düzenlenebilir. Geçersiz giriş engellenir ya da onay istenir. Liste kurallı hücrelerde açılır liste çıkar.",
            new[] { "Validations", "list", "whole / decimal", "date", "textLength", "custom", "Reject / Uyar", "setValidationRule(ref, def)" },
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
            "Bileşen Excel'deki tuş atamalarını izler. Izgaraya tıklayın ve aşağıdaki kısayolları deneyin. Düzenleme sırasında Enter değeri onaylar, Esc iptal eder, Tab onaylayıp sağ hücreye geçer.",
            new[] { "Oklar", "Tab / Shift+Tab", "Enter / Shift+Enter", "F2", "Ctrl+Oklar", "Shift+Oklar", "Ctrl+A / Ctrl+Z" },
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
