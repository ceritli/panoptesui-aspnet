using System;
using System.Collections.Generic;
using System.IO;
using System.Net;
using System.Text.Json;
using System.Text.RegularExpressions;

namespace Panoptes.AspNetCore.Demo.Services;

public static class PanoptesPageTranslator
{
    private class TranslationEntry
    {
        public string? s { get; set; }
        public string? t { get; set; }
    }

    private static readonly (string Source, string Target)[] Replacements;

    static PanoptesPageTranslator()
    {
        var list = new List<(string Source, string Target)>();
        var candidates = new[]
        {
            Path.Combine(AppContext.BaseDirectory, "PanoptesTranslations.json"),
            Path.Combine(Directory.GetCurrentDirectory(), "dotnet/samples/Panoptes.AspNetCore.Demo/PanoptesTranslations.json"),
            Path.Combine(Directory.GetCurrentDirectory(), "PanoptesTranslations.json"),
            "/Users/fatihceritli/Projects/Panoptes/dotnet/samples/Panoptes.AspNetCore.Demo/PanoptesTranslations.json"
        };

        foreach (var path in candidates)
        {
            if (File.Exists(path))
            {
                try
                {
                    var json = File.ReadAllText(path);
                    var entries = JsonSerializer.Deserialize<List<TranslationEntry>>(json);
                    if (entries != null)
                    {
                        foreach (var e in entries)
                        {
                            if (!string.IsNullOrEmpty(e.s) && !string.IsNullOrEmpty(e.t))
                            {
                                list.Add((e.s, e.t));
                            }
                        }
                    }
                    if (list.Count > 0)
                    {
                        break;
                    }
                }
                catch
                {
                }
            }
        }

        Replacements = list.ToArray();
    }

    public static string TranslateHtml(string html)
    {
        if (string.IsNullOrEmpty(html)) return html;

        // 1. Protect code blocks, pre tags, styles, and scripts
        var protectedBlocks = new List<string>();
        html = Regex.Replace(html, @"<(pre|script|style)\b[^>]*>.*?</\1>", m =>
        {
            var token = $"<!--__PROTECTED_BLOCK_{protectedBlocks.Count}__-->";
            protectedBlocks.Add(m.Value);
            return token;
        }, RegexOptions.Singleline | RegexOptions.IgnoreCase);

        // 2. Rewrite internal links safely without duplicating /en
        html = Regex.Replace(html, @"(href\s*=\s*[""'])/(?!en(?:/|[""']|\?|#|$)|_content/|panoptes/|api/|lib/|css/|js/|images/|favicon|#|http|mailto|tel)([^""'#\s?]*)", "$1/en/$2");
        html = Regex.Replace(html, @"(href\s*=\s*[""'])/(?=[""']|\?)", "$1/en");
        html = html.Replace("/en/en/", "/en/").Replace("/en/en\"", "/en\"").Replace("/en/en'", "/en'");

        // 3. Normalize common Turkish hex entities so dictionary matches reliably
        html = html.Replace("&#xFC;", "ü")
                   .Replace("&#xDC;", "Ü")
                   .Replace("&#x131;", "ı")
                   .Replace("&#x130;", "İ")
                   .Replace("&#x15F;", "ş")
                   .Replace("&#x15E;", "Ş")
                   .Replace("&#xE7;", "ç")
                   .Replace("&#xC7;", "Ç")
                   .Replace("&#xF6;", "ö")
                   .Replace("&#xD6;", "Ö")
                   .Replace("&#x11F;", "ğ")
                   .Replace("&#x11E;", "Ğ");

        // 4. Fast Dictionary Phrase Replacements (Longest matches first)
        foreach (var (src, target) in Replacements)
        {
            if (html.Contains(src))
            {
                html = html.Replace(src, target);
            }
        }

        // 5. Translate and clean <title>
        html = Regex.Replace(html, @"<title>(.*?)</title>", m =>
        {
            var title = WebUtility.HtmlDecode(m.Groups[1].Value);
            foreach (var (src, target) in Replacements)
            {
                if (title.Contains(src))
                {
                    title = title.Replace(src, target);
                }
            }
            title = title.Replace("Panoptes Kurumsal UI", "Panoptes Enterprise UI");
            title = title.Replace("Kurumsal UI Bileşeni", "Enterprise UI Component");
            title = title.Replace("Kurumsal Bileşen & Yetenek Kataloğu", "Enterprise Component & Capability Catalog");
            title = title.Replace("52 Kurumsal Bileşen Kataloğu", "52 Enterprise Components Catalog");

            // Strip redundant Turkish parentheticals from title if present
            title = Regex.Replace(title, @"\((?:Otomatik Tamamlama|Barkod ve Karekod Çizici|Barkod ve Karekod|Video ve Ses Oynatıcı|Yan Çekmece / Offcanvas|Yan Çekmece|Puanlama & Değerlendirme|Dokunmatik İmza|Yol Çubuğu|Özel Onay Kutusu|Renk Seçici|Açılır Metin Kutusu|Maskeli Metin Girişi|SMS & Doğrulama Kodu|Aç/Kapa Anahtarı|Çok Satırlı Metin|Saat Seçici|Araç Çubuğu|Klasör / Ağaç Yapısı|Çoklu Seçim|Sayısal Giriş|SMS & Doğrulama|İş & Raporlama Grafikleri|Tarih & Saat Seçici|İş Akış Şeması ve Organizasyon Ağacı|Proje Çizelgesi & Zaman Tüneli|İbreli & Kadranlı Göstergeler|Pencere Modalı & Masaüstü Penceresi|Panel Bölücü & Boyutlandırıcı|Sürgü ve Aralık Seçici|Çok Boyutlu Küp Analizi & Çapraz Tablo / OLAP|Çok Seviyeli Açılır Menü ve Sağ Tık Bağlam Menüsü|Satır|Hesap Tablosu)\)", "");

            while (title.Contains("- Panoptes Enterprise UI - Panoptes Enterprise UI"))
            {
                title = title.Replace("- Panoptes Enterprise UI - Panoptes Enterprise UI", "- Panoptes Enterprise UI");
            }
            title = Regex.Replace(title, @"\s+", " ").Trim();
            return $"<title>{WebUtility.HtmlEncode(title)}</title>";
        }, RegexOptions.Singleline | RegexOptions.IgnoreCase);

        // 5. Clean up duplicate H1 suffixes like AutoComplete (AutoComplete)
        html = Regex.Replace(html, @"<h1([^>]*)>\s*AutoComplete\s*\(AutoComplete\)\s*</h1>", "<h1$1>AutoComplete</h1>", RegexOptions.IgnoreCase);
        html = Regex.Replace(html, @"<h1([^>]*)>\s*([^<]+?)\s*\(\2\)\s*</h1>", "<h1$1>$2</h1>", RegexOptions.IgnoreCase);

        // 6. Targeted polish for remaining H2 and paragraph descriptions
        html = html.Replace("1. Dikey Column Grafigi (Aylık Finansal Gelir & Gider Analizi)", "1. Vertical Column Chart (Monthly Financial Income & Expense Analysis)")
                   .Replace("1. Standart Product & Katalog Filter Tree (Default Alanlar & VE/VEYA Operatörleri)", "1. Standard Product & Catalog Filter Tree (Default Fields & AND/OR Operators)")
                   .Replace("1. Kurumsal Sales Performansı (Region x Category x Yıl Çapraz Analizi)", "1. Enterprise Sales Performance (Region x Category x Year Cross-Tab Analysis)")
                   .Replace("1. Standart 5 Starlı Product & Hizmet Puanlama", "1. Standard 5-Star Product & Service Rating")
                   .Replace("2. Yarım Puan Hassasiyeti ve Kalp Iconu (Customer Satisfaction)", "2. Half-Star Precision & Heart Icon (Customer Satisfaction)")
                   .Replace("Customer Yorumları (Testimonial Slider)", "Customer Reviews (Testimonial Slider)")
                   .Replace("E-ticaret Product Resim Önizleme (HoverGallery)", "E-commerce Product Image Preview (HoverGallery)")
                   .Replace("2. BIST:ASELS Aselsan & Programatik JavaScript API (Aralık Selectioni & PNG İndirme)", "2. BIST:ASELS Aselsan & Programmatic JavaScript API (Range Selection & PNG Download)")
                   .Replace("1. Kurumsal Şirket Management & Organization Chart", "1. Corporate Management & Organization Chart")
                   .Replace("ActionSheet acilirken and kapanirken kullanilacak gecis efektini", "Customize open and close transition effects with the")
                   .Replace("parametresiyle belirleyebilirsiniz.", "parameter.")
                   .Replace("Default olarak akıcı bir", "By default, a smooth")
                   .Replace("secenekleri de mevcuttur.", "options are also available.")
                   .Replace("Fade (Belirme)", "Fade")
                   .Replace("None (Animasyonsuz)", "None")
                   .Replace("Sayfa yüklenirken verileri HTML içine gömmek yerine, arka plandaki bir REST API or Controller JSON uç noktasından", "Instead of embedding data inside HTML during page load, it fetches data asynchronously from a backend REST API or Controller JSON endpoint")
                   .Replace("Controller'dan gonderilen <code>List&lt;FilterFieldDefinition&gt;</code> alanları (Customer Adı, Şehir, Yıllık Ciro, Kredi Skoru, Uyelik Datei, VIP Statüsü) ile dinamik sorgu oluşturma ve programatik kontrol.", "Dynamic query building and programmatic control with <code>List&lt;FilterFieldDefinition&gt;</code> fields (Customer Name, City, Annual Revenue, Credit Score, Membership Date, VIP Status) passed from the Controller.")
                   .Replace("alanları (Customer Adı, Şehir, Yıllık Ciro, Kredi Skoru, Uyelik Datei, VIP Statüsü) ile dinamik sorgu oluşturma ve programatik kontrol.", "fields (Customer Name, City, Annual Revenue, Credit Score, Membership Date, VIP Status).")
                   .Replace("cift yonlu veri baglama", "two-way data binding")
                   .Replace("sunucu motoru, sayfalama, çoklu seçim ve tam CRUD (Ekle/Edit/Delete) yönetimi.", "server engine, pagination, multi-selection, and full CRUD management.")
                   .Replace("Kilitli hücreler düzenlenemez; silme, yapıştırma ve doldurma işlemleri de bunları atlar. Kilitler sayfa modelinde (DisabledRanges, Enabled = false) tanımlanır, kullanıcı Veri &#x203A; Hücreleri Kilitle / Unlock ile ya da enable()/disable() API&#x27;siyle değiştirir.", "Locked cells cannot be edited; delete, paste, and auto-fill operations also skip them. Locks are defined in the sheet model (DisabledRanges, Enabled = false), and users can toggle them via Data &#x203A; Lock / Unlock Cells or the enable()/disable() API.")
                   .Replace("Kilitler sayfa modelinde (DisabledRanges, Enabled = false) tanımlanır, kullanıcı Veri &#x203A; Hücreleri Kilitle / Unlock ile ya da enable()/disable() API&#x27;siyle değiştirir.", "Locks are defined in the sheet model (DisabledRanges, Enabled = false), and users can toggle them via Data &#x203A; Lock / Unlock Cells or the enable()/disable() API.")
                   .Replace("Aralıklara doğrulama kuralı verin: liste, tam sayı, ondalık, tarih, metin uzunluğu ya da özel formül; karşılaştırma (arasında, büyük, eşit&#x2026;), giriş mesajı, hata mesajı ve Reddet / Uyar modu. Veri &#x203A; Data Validation penceresinden de düzenlenebilir. Geçersiz giriş engellenir ya da onay istenir. Liste kurallı hücrelerde açılır liste çıkar.", "Set validation rules for ranges: list, integer, decimal, date, text length, or custom formula; comparison (between, greater than, equal&#x2026;), input message, error message, and Reject / Warn mode. Can also be configured from Data &#x203A; Data Validation dialog. Invalid input is rejected or requires confirmation. A dropdown list appears in cells with list rules.")
                   .Replace("Kartlarin right bottom kosesinde bulunan boyutlandirma tutamaci sayesinde users karti hem yatayda", "The resizing handle in the bottom-right corner of cards allows users to dynamically resize the card horizontally")
                   .Replace("dinamik olarak büyütebilir or küçültebilir.", "dynamically resize.")
                   .Replace("Operation sırasında kart boyutları otomatik olarak arka plandaki CSS Grid hücrelerine hizalanır (snap-to-grid) and anlık boyut rozeti (örn: <code>2 x 1</code>) gosterilir.", "During resizing, card dimensions automatically snap to background CSS Grid cells, and a real-time size badge (e.g.: <code>2 x 1</code>) is displayed.")
                   .Replace("Sorting, filtre, sütun sırası/genişliği/görünürlüğü, açık düğümler ve sayfa tarayıcıda (localStorage) saklanır. Statusu değiştirin, &#x27;Save State&#x27;e basın, sayfayı yenileyip &#x27;Load State&#x27; deyin.", "Sorting, filters, column order/width/visibility, expanded nodes, and pagination are stored in the browser (localStorage). Change the state, click &#x27;Save State&#x27;, then refresh the page and click &#x27;Load State\'.")
                   .Replace("Task Yeri / Departman Seçiniz", "Select Task Location / Department")
                   .Replace("Product aramak için yazın (min 2 harf)...", "Type to search products (min 2 chars)...")
                   .Replace("Sütun Sorting", "Column Sorting")
                   .Replace("Fixed on horizontal scrolling sütunlar", "Fixed columns on horizontal scrolling")
                   .Replace("Sorting, filtre, sütun ve açık düğümler", "Sorting, filters, columns, and expanded nodes")
                   .Replace("Araliklara custom duzenleyici atayin: dropdown liste, date selector, sinirli sayi alani, confirmation kutusu, renk selector and star rating. Hucreyi cift tiklayin or F2 / yazmaya baslayin; confirmation kutusu tek tikla or Space tusuyla degisir.", "Assign custom editors to cell ranges: dropdown list, date picker, bounded numeric field, checkbox, color picker, and star rating. Double-click the cell or press F2 / start typing; checkboxes toggle with a single click or the Space key.")
                   .Replace("Yorumlu hucrelerin kosesinde isaret gorunur; uzerine gelince comment dropdown. Right tik menu or Shift+F2 with comment ekleyin, duzenleyin, silin. Comments SpreadsheetCell.Comment with tanimlanir, setCommentAt()/getComment() with yonetilir.", "Cells with comments display an indicator mark in the corner; hovering opens the comment popup. Add, edit, or delete comments via the right-click context menu or Shift+F2. Comments are defined via SpreadsheetCell.Comment and managed using setCommentAt()/getComment().")
                   .Replace("Panoptes TileLayout, fare kullanmadan yalnizca klavye tuslariyla kartlar between gezinmeyi, kartlarin sirasini degistirmeyi and boyutlarini guncellemeyi full olarak destekler.", "Panoptes TileLayout fully supports navigating between cards, reordering cards, and updating card sizes using only keyboard arrow keys without a mouse.")
                   .Replace("Gelismis ASP.NET Core Grid Aggregates mimarisiyle; grup basliklarinda, grup altlarinda (Group Footer) and genel tablo tabaninda (Grid Footer) automatic", "With the advanced ASP.NET Core Grid Aggregates architecture; automatically calculate totals in group headers, group footers, and table-wide grid footers")
                   .Replace("with bulusturur. Folder, category, departman or organizasyon semasi gibi derin iliskili verilerde tekil selection imkâni saglar.", "provides single selection capability for deeply structured data such as folders, categories, departments, or organization charts.")
                   .Replace("Asagidaki dropdown tree tamamen Razor etiketleri with hiyerarsik olarak olusturulmustur. Dugumlerde", "The dropdown tree below is built entirely hierarchically with Razor tags. Nodes include")
                   .Replace("Harici butonlarla panelleri programatik olarak expand/kapatma and", "Programmatically expand/collapse panels using external buttons and")
                   .Replace("Lutfen teslimattan 30 dakika once telefon with haber veriniz.", "Please notify by phone 30 minutes before delivery.")
                   .Replace("1. Kurumsal E-Fatura Onay ve ERP Entegrasyon Workflow Chart", "1. Enterprise E-Invoice Approval and ERP Integration Workflow Chart")
                   .Replace("1. C# Model Binding ile Software Development Kanban Panosu", "1. Software Development Kanban Board with C# Model Binding")
                   .Replace("4. Programatik JavaScript API ve Live Event Log", "4. Programmatic JavaScript API and Live Event Log")
                   .Replace("3. Programatik JavaScript API ve Live Event Log", "3. Programmatic JavaScript API and Live Event Log")
                   .Replace("All row edit, bottom record ekle, delete", "Edit all rows, add child record, delete")
                   .Replace("Type sensitive column filtreleri", "Type-sensitive column filters")
                   .Replace("25+ olay, tek geri cagirma", "25+ events, single callback")
                   .Replace("right tik › Comment ekle", "Right click › Add Comment")
                   .Replace("and bottom ogesi olan", "and child element")
                   .Replace("Sirket &amp; Vergi No", "Company &amp; Tax ID")
                   .Replace("Onay Kutulu Selection", "Checkbox Selection")
                   .Replace("Kalici Olarak Delete", "Permanently Delete")
                   .Replace("Selected Onay Kutusu", "Selected Checkbox")
                   .Replace("Onay &amp; Tamamlama", "Confirmation &amp; Completion")
                   .Replace("Bottom record ekle", "Add child record")
                   .Replace("Arama & Filterleme", "Search & Filtering")
                   .Replace("Onayla and Submit", "Confirm and Submit")
                   .Replace("Search alanlari:", "Search fields:")
                   .Replace("Bottom Aciklama", "Footer Description")
                   .Replace("Slide Ile Open", "Open with Slide")
                   .Replace("Region & Adres", "Region & Address")
                   .Replace("Column Grafigi", "Column Chart")
                   .Replace("Fade Ile Open", "Open with Fade")
                   .Replace("Ekle › Resim", "Insert › Image")
                   .Replace("Arama &amp; Filterleme", "Search &amp; Filtering")
                   .Replace("right tik &#x203A; Comment ekle", "Right click &#x203A; Add Comment")
                   .Replace("Ekle &#x203A; Resim", "Insert &#x203A; Image")
                   .Replace("Sirket &amp;amp; Vergi No", "Company &amp;amp; Tax ID")
                   .Replace("Onay &amp;amp; Tamamlama", "Confirmation &amp;amp; Completion")
                   .Replace("30&#x2B; olay", "30&#x2B; events")
                   .Replace("25&#x2B; olay, tek geri cagirma", "25&#x2B; events, single callback")
                   .Replace("25&#x2B; olay", "25&#x2B; events")
                   .Replace("Yorumlu hucrelerin kosesinde isaret gorunur; uzerine gelince comment dropdown. Right tik menu or Shift&#x2B;F2 with comment ekleyin, duzenleyin, silin. Comments SpreadsheetCell.Comment with tanimlanir, setCommentAt()/getComment() with yonetilir.", "Cells with comments display an indicator mark in the corner; hovering opens the comment popup. Add, edit, or delete comments via the right-click menu or Shift&#x2B;F2. Comments are defined via SpreadsheetCell.Comment and managed with setCommentAt()/getComment().")
                   .Replace("25+ olay", "25+ events")
                   .Replace("30+ olay", "30+ events");




        // 6. Restore protected blocks
        for (int i = 0; i < protectedBlocks.Count; i++)
        {
            html = html.Replace($"<!--__PROTECTED_BLOCK_{i}__-->", protectedBlocks[i]);
        }

        return html;
    }
}
