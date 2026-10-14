using System;
using System.Collections.Generic;
using System.Globalization;
using System.Linq;
using Panoptes.AspNetCore.Models;

namespace Panoptes.AspNetCore.Demo.Controllers
{
    public static partial class SpreadsheetDemoData
    {
        private static readonly CultureInfo Inv = CultureInfo.InvariantCulture;
        private const string HeaderBg = "#e0f2fe";

        public static string Serial(int y, int m, int d) =>
            ((int)(new DateTime(y, m, d) - new DateTime(1899, 12, 30)).TotalDays).ToString(Inv);

        private static SpreadsheetCell Cell(int r, int c, string? v = null, string? f = null, bool b = false, string? bg = null, string? fmt = null,
            string? al = null, string? color = null, string? comment = null, bool enabled = true) =>
            new() { Row = r, Col = c, Value = v, Formula = f, Bold = b, Background = bg, Format = fmt, Align = al, Color = color, Comment = comment, Enabled = enabled };

        private static void Header(SpreadsheetSheet s, params string[] titles)
        {
            for (int i = 0; i < titles.Length; i++)
                s.Cells.Add(Cell(1, i + 1, titles[i], b: true, bg: HeaderBg, color: "#0c4a6e"));
        }

        private static readonly (string Name, string Dept, string Role, int Y, int M, int D, int Salary, int Score)[] People =
        {
            ("Mehmet Kaya", "Yönetim", "Genel Müdür", 2015, 3, 2, 250000, 5),
            ("Zeynep Arslan", "Teknoloji", "CTO", 2017, 6, 12, 180000, 5),
            ("Burak Yılmaz", "Teknoloji", "Yazılım Mimarı", 2018, 9, 3, 125000, 4),
            ("Elif Demir", "Teknoloji", "Kıdemli Geliştirici", 2020, 1, 20, 95000, 4),
            ("Can Öztürk", "Teknoloji", "Geliştirici", 2022, 4, 11, 72000, 3),
            ("Ayşe Şahin", "Pazarlama", "Pazarlama Müdürü", 2019, 2, 25, 110000, 4),
            ("Mert Aydın", "Pazarlama", "Dijital Uzman", 2021, 8, 30, 68000, 3),
            ("Selin Çelik", "Satış", "Satış Direktörü", 2016, 11, 7, 140000, 5),
            ("Oğuz Kurt", "Satış", "Bölge Müdürü", 2018, 5, 14, 98000, 4),
            ("Deniz Aksoy", "Satış", "Satış Temsilcisi", 2023, 3, 6, 54000, 3),
            ("Gamze Polat", "İnsan Kaynakları", "İK Müdürü", 2017, 10, 9, 105000, 4),
            ("Tolga Erdem", "İnsan Kaynakları", "İK Uzmanı", 2022, 12, 1, 58000, 3),
            ("Hakan Yıldız", "Finans", "Finans Müdürü", 2016, 7, 18, 135000, 5),
            ("Buse Karaca", "Finans", "Muhasebe Uzmanı", 2021, 2, 15, 62000, 3),
            ("Emre Güneş", "Destek", "Destek Mühendisi", 2024, 1, 8, 49000, 2)
        };

        /// <summary>Çalışan listesi: sıralama/filtreleme, boyutlandırma ve PDF demoları için.</summary>
        public static SpreadsheetSheet Employees(string name = "Çalışanlar", bool filter = false, bool freeze = true)
        {
            var s = new SpreadsheetSheet { Name = name, Rows = 30, Cols = 8 };
            Header(s, "Ad Soyad", "Departman", "Pozisyon", "İşe Giriş", "Maaş (₺)", "Performans");
            for (int i = 0; i < People.Length; i++)
            {
                var p = People[i]; var r = i + 2;
                s.Cells.Add(Cell(r, 1, p.Name));
                s.Cells.Add(Cell(r, 2, p.Dept));
                s.Cells.Add(Cell(r, 3, p.Role));
                s.Cells.Add(Cell(r, 4, Serial(p.Y, p.M, p.D), fmt: "date", al: "center"));
                s.Cells.Add(Cell(r, 5, p.Salary.ToString(Inv), fmt: "currency"));
                s.Cells.Add(Cell(r, 6, p.Score.ToString(Inv), al: "center"));
            }
            var last = People.Length + 1;
            s.Cells.Add(Cell(last + 2, 4, "Ortalama", b: true, al: "right"));
            s.Cells.Add(Cell(last + 2, 5, f: $"=AVERAGE(E2:E{last})", b: true, fmt: "currency"));
            s.Cells.Add(Cell(last + 2, 6, f: $"=AVERAGE(F2:F{last})", b: true, fmt: "0.0", al: "center"));
            s.ColumnWidths = new() { [1] = 150, [2] = 130, [3] = 160, [4] = 100, [5] = 120, [6] = 100 };
            if (freeze) s.FrozenRows = 1;
            if (filter) s.Filter = $"A1:F{last}";
            return s;
        }

        /// <summary>DataSource demoları için sipariş kayıtları (alan adları sütun alanlarıyla eşleşir).</summary>
        public static List<Dictionary<string, object?>> Orders(int count = 12)
        {
            var customers = new[] { "Akdeniz Gıda", "Bosphorus Tekstil", "Anadolu Makina", "Ege Lojistik", "Marmara Yazılım", "Karadeniz Çay", "Toros Enerji" };
            var products = new[] { "Endüstriyel Sensör", "Güç Kaynağı", "Barkod Okuyucu", "Termal Yazıcı", "Endüstriyel Tablet", "Ağ Anahtarı" };
            var status = new[] { "Beklemede", "Hazırlanıyor", "Kargoda", "Teslim Edildi" };
            var rnd = new Random(42);
            var list = new List<Dictionary<string, object?>>();
            for (int i = 0; i < count; i++)
            {
                list.Add(new Dictionary<string, object?>
                {
                    ["orderId"] = 1000 + i,
                    ["customer"] = customers[i % customers.Length],
                    ["product"] = products[(i * 2) % products.Length],
                    ["quantity"] = rnd.Next(1, 40),
                    ["unitPrice"] = Math.Round(150 + rnd.NextDouble() * 1800, 2),
                    ["orderDate"] = DateTime.Today.AddDays(-rnd.Next(1, 90)).ToString("yyyy-MM-dd"),
                    ["status"] = status[rnd.Next(status.Length)],
                    ["approved"] = rnd.Next(2) == 1
                });
            }
            return list;
        }

        public static List<SpreadsheetDataColumn> OrderColumns() => new()
        {
            new() { Field = "orderId", Title = "Sipariş No", Width = 90 },
            new() { Field = "customer", Title = "Müşteri", Width = 160 },
            new() { Field = "product", Title = "Ürün", Width = 170 },
            new() { Field = "quantity", Title = "Adet", Width = 70, Format = "integer" },
            new() { Field = "unitPrice", Title = "Birim Fiyat", Width = 110, Format = "currency" },
            new() { Field = "orderDate", Title = "Sipariş Tarihi", Width = 110, Format = "date", Editor = "date" },
            new() { Field = "status", Title = "Durum", Width = 120, Editor = "list", Items = new() { "Beklemede", "Hazırlanıyor", "Kargoda", "Teslim Edildi" } },
            new() { Field = "approved", Title = "Onaylı", Width = 80, Editor = "checkbox" }
        };

        public static SpreadsheetSheet OrdersSheet(string name = "Siparişler", int count = 12) => new()
        {
            Name = name, Rows = 40, Cols = 10, FrozenRows = 1,
            DataSource = new SpreadsheetDataSource { Columns = OrderColumns(), Items = Orders(count) }
        };

        /// <summary>Kilitli hücre demosu: başlıklar, toplam formülleri ve ilk sütun kilitli.</summary>
        public static SpreadsheetSheet LockedSheet()
        {
            var s = new SpreadsheetSheet { Name = "Bütçe Formu", Rows = 20, Cols = 7 };
            Header(s, "Kalem", "Ocak", "Şubat", "Mart", "Toplam");
            var items = new[] { "Kira", "Elektrik", "İnternet", "Pazarlama", "Ulaşım", "Eğitim" };
            for (int i = 0; i < items.Length; i++)
            {
                int r = i + 2;
                s.Cells.Add(Cell(r, 1, items[i], bg: "#f1f5f9"));
                s.Cells.Add(Cell(r, 2, (1000 + i * 350).ToString(Inv), fmt: "currency"));
                s.Cells.Add(Cell(r, 3, (1100 + i * 300).ToString(Inv), fmt: "currency"));
                s.Cells.Add(Cell(r, 4, (900 + i * 420).ToString(Inv), fmt: "currency"));
                s.Cells.Add(Cell(r, 5, f: $"=SUM(B{r}:D{r})", b: true, fmt: "currency", bg: "#f1f5f9", enabled: false));
            }
            int last = items.Length + 1;
            s.Cells.Add(Cell(last + 1, 1, "TOPLAM", b: true, bg: "#dbeafe"));
            foreach (var (c, l) in new[] { (2, "B"), (3, "C"), (4, "D"), (5, "E") })
                s.Cells.Add(Cell(last + 1, c, f: $"=SUM({l}2:{l}{last})", b: true, fmt: "currency", bg: "#dbeafe"));
            s.DisabledRanges = new() { "A1:E1", $"A2:A{last}", $"A{last + 1}:E{last + 1}" };
            s.ColumnWidths = new() { [1] = 130, [2] = 110, [3] = 110, [4] = 110, [5] = 120 };
            return s;
        }

        /// <summary>Özel hücre düzenleyicileri: liste, tarih, sayı, onay kutusu, renk ve puanlama.</summary>
        public static SpreadsheetSheet EditorsSheet()
        {
            var s = new SpreadsheetSheet { Name = "Görev Takibi", Rows = 25, Cols = 8, FrozenRows = 1 };
            Header(s, "Görev", "Öncelik", "Termin", "Tamamlanma (%)", "Aktif", "Etiket Rengi", "Memnuniyet");
            var tasks = new (string T, string P, int M, int D, int Pct, bool A, string C, int Rt)[]
            {
                ("API tasarımı", "Yüksek", 11, 14, 80, true, "#ef4444", 4),
                ("Arayüz prototipi", "Orta", 11, 28, 45, true, "#3b82f6", 3),
                ("Test senaryoları", "Düşük", 12, 5, 10, false, "#22c55e", 2),
                ("Yayın hazırlığı", "Yüksek", 12, 20, 0, true, "#f59e0b", 5),
                ("Dokümantasyon", "Orta", 12, 30, 25, false, "#8b5cf6", 3)
            };
            for (int i = 0; i < tasks.Length; i++)
            {
                var t = tasks[i]; int r = i + 2;
                s.Cells.Add(Cell(r, 1, t.T));
                s.Cells.Add(Cell(r, 2, t.P));
                s.Cells.Add(Cell(r, 3, Serial(2025, t.M, t.D), fmt: "date", al: "center"));
                s.Cells.Add(Cell(r, 4, t.Pct.ToString(Inv)));
                s.Cells.Add(Cell(r, 5, t.A ? "TRUE" : "FALSE"));
                s.Cells.Add(Cell(r, 6, t.C, al: "center"));
                s.Cells.Add(Cell(r, 7, t.Rt.ToString(Inv)));
            }
            s.Editors = new()
            {
                new() { Range = "B2:B25", Type = "list", Items = new() { "Düşük", "Orta", "Yüksek" } },
                new() { Range = "C2:C25", Type = "date" },
                new() { Range = "D2:D25", Type = "number", Min = 0, Max = 100, Step = 5 },
                new() { Range = "E2:E25", Type = "checkbox" },
                new() { Range = "F2:F25", Type = "color" },
                new() { Range = "G2:G25", Type = "rating", Max = 5 }
            };
            s.ColumnWidths = new() { [1] = 170, [2] = 100, [3] = 110, [4] = 130, [5] = 70, [6] = 110, [7] = 130 };
            return s;
        }

        /// <summary>Veri doğrulama kuralları: liste, tam sayı, ondalık, tarih, metin uzunluğu, özel formül.</summary>
        public static SpreadsheetSheet ValidationSheet()
        {
            var s = new SpreadsheetSheet { Name = "Sipariş Formu", Rows = 20, Cols = 8, FrozenRows = 1 };
            Header(s, "Müşteri Kodu", "Ülke", "Adet (1-100)", "İndirim (0-0,5)", "Teslim Tarihi (2025)", "Not (en çok 20)", "Fiyat", "Fiyat ≥ Adet");
            s.Cells.Add(Cell(2, 1, "MUS-001")); s.Cells.Add(Cell(2, 2, "Türkiye")); s.Cells.Add(Cell(2, 3, "12"));
            s.Cells.Add(Cell(2, 4, "0.1", fmt: "percent")); s.Cells.Add(Cell(2, 5, Serial(2025, 6, 15), fmt: "date")); s.Cells.Add(Cell(2, 6, "Hızlı teslimat"));
            s.Cells.Add(Cell(2, 7, "250", fmt: "currency")); s.Cells.Add(Cell(2, 8, "20"));
            s.Cells.Add(Cell(4, 1, "Geçersiz değer girmeyi deneyin: örn. C sütununa 500, B sütununa 'Mars' yazın.", color: "#64748b"));
            s.Validations = new()
            {
                new() { Range = "B2:B20", Type = "list", Items = new() { "Türkiye", "Almanya", "Fransa", "İtalya", "İspanya" }, Title = "Ülke", Message = "Listeden bir ülke seçin.", Error = "Yalnızca listedeki ülkeler girilebilir." },
                new() { Range = "C2:C20", Type = "whole", Comparer = "between", From = "1", To = "100", Title = "Adet", Message = "1 ile 100 arasında tam sayı girin.", Error = "Adet 1-100 arasında tam sayı olmalıdır." },
                new() { Range = "D2:D20", Type = "decimal", Comparer = "between", From = "0", To = "0.5", Title = "İndirim", Message = "0 ile 0,5 arasında oran girin.", Error = "İndirim oranı 0 - 0,5 aralığında olmalıdır." },
                new() { Range = "E2:E20", Type = "date", Comparer = "between", From = "2025-01-01", To = "2025-12-31", Title = "Teslim tarihi", Message = "2025 yılı içinde bir tarih girin.", Error = "Tarih 2025 yılı içinde olmalıdır." },
                new() { Range = "F2:F20", Type = "textLength", Comparer = "lessThanOrEqualTo", From = "20", Title = "Not", Message = "En fazla 20 karakter.", Error = "Not 20 karakteri aşamaz." },
                new() { Range = "G2:G20", Type = "decimal", Comparer = "greaterThan", From = "0", Reject = false, Title = "Fiyat", Message = "0'dan büyük olmalıdır (uyarı modu).", Error = "Fiyat 0'dan büyük olmalıdır. Yine de devam edilsin mi?" },
                new() { Range = "H2:H20", Type = "custom", Formula = "=H2>=C2", Title = "Özel formül", Message = "Bu değer Adet sütunundan küçük olamaz.", Error = "Değer, aynı satırdaki Adet değerinden küçük olamaz." }
            };
            s.ColumnWidths = new() { [1] = 110, [2] = 100, [3] = 110, [4] = 120, [5] = 150, [6] = 140, [7] = 100, [8] = 110 };
            return s;
        }

        /// <summary>Hücre yorumları demosu.</summary>
        public static SpreadsheetSheet CommentsSheet()
        {
            var s = new SpreadsheetSheet { Name = "Satış Raporu", Rows = 20, Cols = 6, FrozenRows = 1 };
            Header(s, "Ürün", "Q1", "Q2", "Q3", "Q4", "Toplam");
            var rows = new (string P, int a, int b, int c, int d)[]
            {
                ("Endüstriyel Sensör", 120, 135, 90, 160),
                ("Güç Kaynağı", 80, 85, 140, 110),
                ("Barkod Okuyucu", 200, 190, 210, 260),
                ("Termal Yazıcı", 60, 75, 70, 95)
            };
            for (int i = 0; i < rows.Length; i++)
            {
                int r = i + 2; var x = rows[i];
                s.Cells.Add(Cell(r, 1, x.P));
                s.Cells.Add(Cell(r, 2, x.a.ToString(Inv))); s.Cells.Add(Cell(r, 3, x.b.ToString(Inv)));
                s.Cells.Add(Cell(r, 4, x.c.ToString(Inv))); s.Cells.Add(Cell(r, 5, x.d.ToString(Inv)));
                s.Cells.Add(Cell(r, 6, f: $"=SUM(B{r}:E{r})", b: true));
            }
            s.Cells.First(c => c.Row == 3 && c.Col == 4).Comment = "Q3'te tedarik sorunu yaşandı, satış düştü.";
            s.Cells.First(c => c.Row == 3 && c.Col == 4).Background = "#fef9c3";
            s.Cells.First(c => c.Row == 4 && c.Col == 5).Comment = "Yıl sonu kampanyası etkisi (%25 indirim).";
            s.Cells.First(c => c.Row == 4 && c.Col == 5).Background = "#dcfce7";
            s.Cells.First(c => c.Row == 1 && c.Col == 6).Comment = "Dört çeyreğin toplamı (=SUM).";
            s.ColumnWidths = new() { [1] = 170, [2] = 80, [3] = 80, [4] = 80, [5] = 80, [6] = 100 };
            return s;
        }

        private static string SvgUri(string svg) => "data:image/svg+xml;utf8," + Uri.EscapeDataString(svg);

        /// <summary>Resimler demosu: satır içi SVG veri URI'leri (harici dosya gerekmez).</summary>
        public static SpreadsheetSheet ImagesSheet()
        {
            var logo = SvgUri("<svg xmlns='http://www.w3.org/2000/svg' width='160' height='90' viewBox='0 0 160 90'><defs><linearGradient id='g' x1='0' y1='0' x2='1' y2='1'><stop offset='0' stop-color='#0ea5e9'/><stop offset='1' stop-color='#6366f1'/></linearGradient></defs><rect width='160' height='90' rx='12' fill='url(#g)'/><circle cx='42' cy='45' r='20' fill='white' fill-opacity='.9'/><rect x='72' y='30' width='72' height='9' rx='4' fill='white'/><rect x='72' y='48' width='52' height='9' rx='4' fill='white' fill-opacity='.7'/></svg>");
            var chart = SvgUri("<svg xmlns='http://www.w3.org/2000/svg' width='220' height='130' viewBox='0 0 220 130'><rect width='220' height='130' rx='10' fill='#f8fafc' stroke='#cbd5e1'/><rect x='24' y='70' width='26' height='40' fill='#38bdf8'/><rect x='62' y='46' width='26' height='64' fill='#6366f1'/><rect x='100' y='28' width='26' height='82' fill='#10b981'/><rect x='138' y='56' width='26' height='54' fill='#f59e0b'/><rect x='176' y='36' width='26' height='74' fill='#ef4444'/></svg>");
            var badge = SvgUri("<svg xmlns='http://www.w3.org/2000/svg' width='90' height='90' viewBox='0 0 90 90'><circle cx='45' cy='45' r='42' fill='#10b981'/><path d='M26 46l13 13 25-28' fill='none' stroke='white' stroke-width='9' stroke-linecap='round' stroke-linejoin='round'/></svg>");
            var s = new SpreadsheetSheet { Name = "Rapor", Rows = 30, Cols = 10 };
            s.Cells.Add(Cell(1, 1, "AYLIK PERFORMANS RAPORU", b: true, color: "#0c4a6e"));
            s.Cells.Add(Cell(3, 1, "Resimler hücrelere sabitlenir; sürükleyerek taşıyın, köşeden boyutlandırın, Delete ile silin.", color: "#64748b"));
            s.Cells.Add(Cell(14, 1, "Yukarıdaki resimler sayfa içeriğiyle birlikte kaydırılır.", color: "#64748b"));
            s.Images = new()
            {
                new() { Src = logo, Row = 5, Col = 1, X = 4, Y = 4, Width = 160, Height = 90 },
                new() { Src = chart, Row = 5, Col = 3, X = 10, Y = 4, Width = 220, Height = 130 },
                new() { Src = badge, Row = 5, Col = 6, X = 10, Y = 4, Width = 90, Height = 90 }
            };
            s.ColumnWidths = new() { [1] = 120, [2] = 80, [3] = 100, [4] = 100, [5] = 100, [6] = 100 };
            return s;
        }

        public static string SampleImage(int variant) => SvgUri(variant % 2 == 0
            ? "<svg xmlns='http://www.w3.org/2000/svg' width='140' height='100' viewBox='0 0 140 100'><rect width='140' height='100' rx='10' fill='#f43f5e'/><circle cx='40' cy='42' r='16' fill='#fff' fill-opacity='.85'/><path d='M10 90l40-34 28 22 22-16 30 28z' fill='#fff' fill-opacity='.7'/></svg>"
            : "<svg xmlns='http://www.w3.org/2000/svg' width='140' height='100' viewBox='0 0 140 100'><rect width='140' height='100' rx='10' fill='#0ea5e9'/><circle cx='100' cy='30' r='14' fill='#fde68a'/><path d='M0 85l36-40 30 28 24-18 50 34v11H0z' fill='#fff' fill-opacity='.8'/></svg>");

        /// <summary>Olaylar / klavye / TagHelper demoları için küçük, formüllü bir tablo.</summary>
        public static SpreadsheetSheet Practice(string name = "Alıştırma")
        {
            var s = new SpreadsheetSheet { Name = name, Rows = 30, Cols = 10 };
            Header(s, "Ürün", "Adet", "Birim Fiyat", "Tutar");
            var items = new (string P, int Q, int U)[] { ("Kalem", 40, 12), ("Defter", 25, 45), ("Silgi", 60, 6), ("Dosya", 15, 30), ("Zımba", 10, 85) };
            for (int i = 0; i < items.Length; i++)
            {
                int r = i + 2;
                s.Cells.Add(Cell(r, 1, items[i].P));
                s.Cells.Add(Cell(r, 2, items[i].Q.ToString(Inv)));
                s.Cells.Add(Cell(r, 3, items[i].U.ToString(Inv), fmt: "currency"));
                s.Cells.Add(Cell(r, 4, f: $"=B{r}*C{r}", fmt: "currency", b: true));
            }
            s.Cells.Add(Cell(items.Length + 2, 3, "Toplam", b: true, al: "right"));
            s.Cells.Add(Cell(items.Length + 2, 4, f: $"=SUM(D2:D{items.Length + 1})", b: true, fmt: "currency", bg: "#dcfce7"));
            s.ColumnWidths = new() { [1] = 130, [2] = 80, [3] = 110, [4] = 120 };
            return s;
        }
    }
}
