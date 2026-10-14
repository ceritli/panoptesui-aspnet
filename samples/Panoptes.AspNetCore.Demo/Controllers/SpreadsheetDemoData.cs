using System;
using System.Collections.Generic;
using Microsoft.AspNetCore.Mvc;
using Panoptes.AspNetCore.Models;

namespace Panoptes.AspNetCore.Demo.Controllers
{
    public class SpreadsheetDemoViewModel
    {
        public List<SpreadsheetSheet> Sheets { get; set; } = new();
    }

    /// <summary>Tüm Spreadsheet demo sayfalarının kullandığı örnek veriler.</summary>
    public static partial class SpreadsheetDemoData
    {
        public static List<SpreadsheetSheet> FinanceSheets()
        {
            var model = new SpreadsheetDemoViewModel();

            // Sayfa 1: 2025 Mali Bütçe ve Kar/Zarar Planı
            var sheet1 = new SpreadsheetSheet
            {
                Name = "Mali Bütçe 2025",
                Rows = 16,
                Cols = 8
            };

            // Headers
            sheet1.Cells.Add(new SpreadsheetCell { Row = 1, Col = 1, Value = "GELİR / GİDER KALEMİ", Bold = true, Background = "#f1f5f9" });
            sheet1.Cells.Add(new SpreadsheetCell { Row = 1, Col = 2, Value = "Q1 (Ocak-Mar)", Bold = true, Background = "#f1f5f9", Align = "right" });
            sheet1.Cells.Add(new SpreadsheetCell { Row = 1, Col = 3, Value = "Q2 (Nis-Haz)", Bold = true, Background = "#f1f5f9", Align = "right" });
            sheet1.Cells.Add(new SpreadsheetCell { Row = 1, Col = 4, Value = "Q3 (Tem-Eyl)", Bold = true, Background = "#f1f5f9", Align = "right" });
            sheet1.Cells.Add(new SpreadsheetCell { Row = 1, Col = 5, Value = "Q4 (Eki-Ara)", Bold = true, Background = "#f1f5f9", Align = "right" });
            sheet1.Cells.Add(new SpreadsheetCell { Row = 1, Col = 6, Value = "TOPLAM YIL", Bold = true, Background = "#e2e8f0", Align = "right" });

            // Row 2: Lisans & Yazılım Satışı
            sheet1.Cells.Add(new SpreadsheetCell { Row = 2, Col = 1, Value = "Yazılım Lisans Satışları" });
            sheet1.Cells.Add(new SpreadsheetCell { Row = 2, Col = 2, Value = "350000", Format = "currency", Align = "right" });
            sheet1.Cells.Add(new SpreadsheetCell { Row = 2, Col = 3, Value = "420000", Format = "currency", Align = "right" });
            sheet1.Cells.Add(new SpreadsheetCell { Row = 2, Col = 4, Value = "390000", Format = "currency", Align = "right" });
            sheet1.Cells.Add(new SpreadsheetCell { Row = 2, Col = 5, Value = "510000", Format = "currency", Align = "right" });
            sheet1.Cells.Add(new SpreadsheetCell { Row = 2, Col = 6, Formula = "=SUM(B2:E2)", Format = "currency", Bold = true, Align = "right" });

            // Row 3: Bulut & SaaS Abonelikleri
            sheet1.Cells.Add(new SpreadsheetCell { Row = 3, Col = 1, Value = "Bulut & SaaS Abonelik Geliri" });
            sheet1.Cells.Add(new SpreadsheetCell { Row = 3, Col = 2, Value = "180000", Format = "currency", Align = "right" });
            sheet1.Cells.Add(new SpreadsheetCell { Row = 3, Col = 3, Value = "210000", Format = "currency", Align = "right" });
            sheet1.Cells.Add(new SpreadsheetCell { Row = 3, Col = 4, Value = "240000", Format = "currency", Align = "right" });
            sheet1.Cells.Add(new SpreadsheetCell { Row = 3, Col = 5, Value = "290000", Format = "currency", Align = "right" });
            sheet1.Cells.Add(new SpreadsheetCell { Row = 3, Col = 6, Formula = "=SUM(B3:E3)", Format = "currency", Bold = true, Align = "right" });

            // Row 4: Danışmanlık ve Destek
            sheet1.Cells.Add(new SpreadsheetCell { Row = 4, Col = 1, Value = "Profesyonel Danışmanlık & Destek" });
            sheet1.Cells.Add(new SpreadsheetCell { Row = 4, Col = 2, Value = "95000", Format = "currency", Align = "right" });
            sheet1.Cells.Add(new SpreadsheetCell { Row = 4, Col = 3, Value = "115000", Format = "currency", Align = "right" });
            sheet1.Cells.Add(new SpreadsheetCell { Row = 4, Col = 4, Value = "130000", Format = "currency", Align = "right" });
            sheet1.Cells.Add(new SpreadsheetCell { Row = 4, Col = 5, Value = "160000", Format = "currency", Align = "right" });
            sheet1.Cells.Add(new SpreadsheetCell { Row = 4, Col = 6, Formula = "=SUM(B4:E4)", Format = "currency", Bold = true, Align = "right" });

            // Row 5: Toplam Brüt Gelir (SUM)
            sheet1.Cells.Add(new SpreadsheetCell { Row = 5, Col = 1, Value = "TOPLAM BRÜT GELİR", Bold = true, Background = "#ecfdf5", Color = "#065f46" });
            sheet1.Cells.Add(new SpreadsheetCell { Row = 5, Col = 2, Formula = "=SUM(B2:B4)", Format = "currency", Bold = true, Background = "#ecfdf5", Align = "right" });
            sheet1.Cells.Add(new SpreadsheetCell { Row = 5, Col = 3, Formula = "=SUM(C2:C4)", Format = "currency", Bold = true, Background = "#ecfdf5", Align = "right" });
            sheet1.Cells.Add(new SpreadsheetCell { Row = 5, Col = 4, Formula = "=SUM(D2:D4)", Format = "currency", Bold = true, Background = "#ecfdf5", Align = "right" });
            sheet1.Cells.Add(new SpreadsheetCell { Row = 5, Col = 5, Formula = "=SUM(E2:E4)", Format = "currency", Bold = true, Background = "#ecfdf5", Align = "right" });
            sheet1.Cells.Add(new SpreadsheetCell { Row = 5, Col = 6, Formula = "=SUM(F2:F4)", Format = "currency", Bold = true, Background = "#d1fae5", Align = "right", Color = "#047857" });

            // Blank Row 6

            // Row 7: Giderler Başlığı
            sheet1.Cells.Add(new SpreadsheetCell { Row = 7, Col = 1, Value = "FAALİYET GİDERLERİ", Bold = true, Background = "#fef2f2", Color = "#991b1b" });

            // Row 8: Ar-Ge ve Personel Maaşları
            sheet1.Cells.Add(new SpreadsheetCell { Row = 8, Col = 1, Value = "Ar-Ge ve Mühendislik Maaşları" });
            sheet1.Cells.Add(new SpreadsheetCell { Row = 8, Col = 2, Value = "220000", Format = "currency", Align = "right" });
            sheet1.Cells.Add(new SpreadsheetCell { Row = 8, Col = 3, Value = "235000", Format = "currency", Align = "right" });
            sheet1.Cells.Add(new SpreadsheetCell { Row = 8, Col = 4, Value = "250000", Format = "currency", Align = "right" });
            sheet1.Cells.Add(new SpreadsheetCell { Row = 8, Col = 5, Value = "270000", Format = "currency", Align = "right" });
            sheet1.Cells.Add(new SpreadsheetCell { Row = 8, Col = 6, Formula = "=SUM(B8:E8)", Format = "currency", Bold = true, Align = "right" });

            // Row 9: Sunucu & Altyapı Maliyetleri
            sheet1.Cells.Add(new SpreadsheetCell { Row = 9, Col = 1, Value = "Bulut Sunucu & Hosting Giderleri" });
            sheet1.Cells.Add(new SpreadsheetCell { Row = 9, Col = 2, Value = "45000", Format = "currency", Align = "right" });
            sheet1.Cells.Add(new SpreadsheetCell { Row = 9, Col = 3, Value = "52000", Format = "currency", Align = "right" });
            sheet1.Cells.Add(new SpreadsheetCell { Row = 9, Col = 4, Value = "60000", Format = "currency", Align = "right" });
            sheet1.Cells.Add(new SpreadsheetCell { Row = 9, Col = 5, Value = "68000", Format = "currency", Align = "right" });
            sheet1.Cells.Add(new SpreadsheetCell { Row = 9, Col = 6, Formula = "=SUM(B9:E9)", Format = "currency", Bold = true, Align = "right" });

            // Row 10: Toplam Faaliyet Gideri
            sheet1.Cells.Add(new SpreadsheetCell { Row = 10, Col = 1, Value = "TOPLAM GİDERLER", Bold = true, Background = "#fee2e2", Color = "#b91c1c" });
            sheet1.Cells.Add(new SpreadsheetCell { Row = 10, Col = 2, Formula = "=SUM(B8:B9)", Format = "currency", Bold = true, Background = "#fee2e2", Align = "right" });
            sheet1.Cells.Add(new SpreadsheetCell { Row = 10, Col = 3, Formula = "=SUM(C8:C9)", Format = "currency", Bold = true, Background = "#fee2e2", Align = "right" });
            sheet1.Cells.Add(new SpreadsheetCell { Row = 10, Col = 4, Formula = "=SUM(D8:D9)", Format = "currency", Bold = true, Background = "#fee2e2", Align = "right" });
            sheet1.Cells.Add(new SpreadsheetCell { Row = 10, Col = 5, Formula = "=SUM(E8:E9)", Format = "currency", Bold = true, Background = "#fee2e2", Align = "right" });
            sheet1.Cells.Add(new SpreadsheetCell { Row = 10, Col = 6, Formula = "=SUM(F8:F9)", Format = "currency", Bold = true, Background = "#fecaca", Align = "right", Color = "#b91c1c" });

            model.Sheets.Add(sheet1);

            // Sayfa 2: Bölgesel Satış Kotaları
            var sheet2 = new SpreadsheetSheet
            {
                Name = "Bölge Kotaları",
                Rows = 10,
                Cols = 6
            };
            sheet2.Cells.Add(new SpreadsheetCell { Row = 1, Col = 1, Value = "BÖLGE MÜDÜRLÜĞÜ", Bold = true, Background = "#f8fafc" });
            sheet2.Cells.Add(new SpreadsheetCell { Row = 1, Col = 2, Value = "Marmara", Bold = true, Align = "center" });
            sheet2.Cells.Add(new SpreadsheetCell { Row = 1, Col = 3, Value = "Ege", Bold = true, Align = "center" });
            sheet2.Cells.Add(new SpreadsheetCell { Row = 1, Col = 4, Value = "İç Anadolu", Bold = true, Align = "center" });
            sheet2.Cells.Add(new SpreadsheetCell { Row = 1, Col = 5, Value = "ORTALAMA", Bold = true, Background = "#e2e8f0", Align = "right" });

            sheet2.Cells.Add(new SpreadsheetCell { Row = 2, Col = 1, Value = "Müşteri Kazanımı (Adet)" });
            sheet2.Cells.Add(new SpreadsheetCell { Row = 2, Col = 2, Value = "120", Align = "center" });
            sheet2.Cells.Add(new SpreadsheetCell { Row = 2, Col = 3, Value = "85", Align = "center" });
            sheet2.Cells.Add(new SpreadsheetCell { Row = 2, Col = 4, Value = "95", Align = "center" });
            sheet2.Cells.Add(new SpreadsheetCell { Row = 2, Col = 5, Formula = "=AVERAGE(B2:D2)", Bold = true, Align = "right" });

            model.Sheets.Add(sheet2);

            return model.Sheets;
        }
    }
}
