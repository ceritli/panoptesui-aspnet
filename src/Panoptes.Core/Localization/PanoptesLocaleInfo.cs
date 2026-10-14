using System;
using System.Collections.Generic;

namespace Panoptes.Core.Localization
{
    public class PanoptesLocaleInfo
    {
        public string Code { get; set; } = "tr";
        public string Culture { get; set; } = "tr-TR";
        public string Name { get; set; } = "Turkish";
        public string NativeName { get; set; } = "Türkçe";
        public string Flag { get; set; } = "🇹🇷";
        public string Direction { get; set; } = "ltr";

        // Grid & Data Translations
        public string GridPage { get; set; } = "Sayfa";
        public string GridOf { get; set; } = "/";
        public string GridItems { get; set; } = "öğe";
        public string GridTotalItems { get; set; } = "Toplam {0} kayıt";
        public string GridItemsPerPage { get; set; } = "Sayfa boyutu:";
        public string GridFirstPage { get; set; } = "İlk Sayfa";
        public string GridPrevPage { get; set; } = "Önceki Sayfa";
        public string GridNextPage { get; set; } = "Sonraki Sayfa";
        public string GridLastPage { get; set; } = "Son Sayfa";
        public string GridNoRecords { get; set; } = "Gösterilecek kayıt bulunamadı";
        public string GridLoading { get; set; } = "Yükleniyor...";
        public string GridSearchPlaceholder { get; set; } = "Tabloda ara...";
        public string GridColumns { get; set; } = "Sütunlar";
        public string GridManageColumns { get; set; } = "Sütunları Yönet";
        public string GridExportExcel { get; set; } = "Excel İndir";
        public string GridExportPdf { get; set; } = "PDF İndir";
        public string GridAddNew { get; set; } = "Yeni Ekle";
        public string GridSaveChanges { get; set; } = "Değişiklikleri Kaydet";
        public string GridCancelChanges { get; set; } = "İptal Et";
        public string GridSelectedItems { get; set; } = "{0} satır seçildi";
        public string GridFilter { get; set; } = "Filtrele";
        public string GridFilterFor { get; set; } = "Filtre:";
        public string GridClearFilter { get; set; } = "Temizle";
        public string GridApplyFilter { get; set; } = "Uygula";
        public string GridOperator { get; set; } = "Operatör";
        public string GridValue { get; set; } = "Değer";
        public string GridContains { get; set; } = "İçerir";
        public string GridStartsWith { get; set; } = "İle Başlar";
        public string GridEndsWith { get; set; } = "İle Biter";
        public string GridEquals { get; set; } = "Eşittir";
        public string GridNotEquals { get; set; } = "Eşit Değildir";
        public string GridGreaterThan { get; set; } = "Büyüktür";
        public string GridLessThan { get; set; } = "Küçüktür";
        public string GridGreaterThanOrEqual { get; set; } = "Büyük Eşit";
        public string GridLessThanOrEqual { get; set; } = "Küçük Eşit";
        public string GridEdit { get; set; } = "Düzenle";
        public string GridDelete { get; set; } = "Sil";
        public string GridEditRecord { get; set; } = "Kaydı Düzenle";
        public string GridNewRecord { get; set; } = "Yeni Kayıt Ekle";

        // Date & Time
        public string[] Months { get; set; } = new[] { "Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran", "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık" };
        public string[] MonthsShort { get; set; } = new[] { "Oca", "Şub", "Mar", "Nis", "May", "Haz", "Tem", "Ağu", "Eyl", "Eki", "Kas", "Ara" };
        public string[] Days { get; set; } = new[] { "Pazar", "Pazartesi", "Salı", "Çarşamba", "Perşembe", "Cuma", "Cumartesi" };
        public string[] DaysShort { get; set; } = new[] { "Pz", "Pt", "Sa", "Ça", "Pe", "Cu", "Ct" };
        public string DateToday { get; set; } = "Bugün";
        public string DateClear { get; set; } = "Temizle";
        public string DateNow { get; set; } = "Şimdi";
        public string DateHour { get; set; } = "Saat";
        public string DateMinute { get; set; } = "Dakika";
        public string DatePlaceholder { get; set; } = "Tarih seçin";
        public string DateRangePlaceholder { get; set; } = "Tarih aralığı seçin";

        // Common UI
        public string CommonSave { get; set; } = "Kaydet";
        public string CommonCancel { get; set; } = "İptal";
        public string CommonConfirm { get; set; } = "Onayla";
        public string CommonClose { get; set; } = "Kapat";
        public string CommonDelete { get; set; } = "Sil";
        public string CommonYes { get; set; } = "Evet";
        public string CommonNo { get; set; } = "Hayır";
        public string CommonOk { get; set; } = "Tamam";
        public string CommonSelect { get; set; } = "Seçiniz";
        public string CommonSearch { get; set; } = "Ara...";
        public string CommonClear { get; set; } = "Temizle";
        public string CommonAll { get; set; } = "Tümü";
        public string CommonDropFilesHere { get; set; } = "Dosyaları buraya sürükleyin veya";
        public string CommonBrowse { get; set; } = "Gözat";
    }
}
