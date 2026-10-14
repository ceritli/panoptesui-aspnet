using System;
using System.Collections.Generic;
using System.Globalization;
using System.Linq;
using Microsoft.AspNetCore.Http;

namespace Panoptes.AspNetCore.Demo.Services;

public record DemoNavItem(string Href, string Label, bool Sub = false);
public record DemoNavGroup(string Title, DemoNavItem[] Items);

public static class DemoTranslations
{
    public static bool IsEnglish(HttpContext? context)
    {
        if (context == null) return false;
        var path = context.Request.Path.Value ?? "";
        if (path.Equals("/en", StringComparison.OrdinalIgnoreCase) || path.StartsWith("/en/", StringComparison.OrdinalIgnoreCase))
            return true;

        var queryCulture = context.Request.Query["culture"].ToString();
        if (queryCulture.StartsWith("en", StringComparison.OrdinalIgnoreCase))
            return true;

        var cookie = context.Request.Cookies[Microsoft.AspNetCore.Localization.CookieRequestCultureProvider.DefaultCookieName];
        if (!string.IsNullOrEmpty(cookie) && cookie.Contains("en", StringComparison.OrdinalIgnoreCase))
            return true;

        return CultureInfo.CurrentUICulture.TwoLetterISOLanguageName.Equals("en", StringComparison.OrdinalIgnoreCase);
    }

    public static string Prefix(bool isEn) => isEn ? "/en" : "";

    public static DemoNavGroup[] GetNavGroups(bool isEn)
    {
        var p = Prefix(isEn);
        if (isEn)
        {
            return new[]
            {
                new DemoNavGroup("Data Management", new[]
                {
                    new DemoNavItem(p + "/Grid", "Data Grid (Overview)"),
                    new DemoNavItem(p + "/Grid/Paging", "Paging", true),
                    new DemoNavItem(p + "/Grid/Sorting", "Sorting (Multi-Sort)", true),
                    new DemoNavItem(p + "/Grid/Filtering", "Filtering (Filter Menu)", true),
                    new DemoNavItem(p + "/Grid/Grouping", "Grouping & Summaries", true),
                    new DemoNavItem(p + "/Grid/Hierarchy", "Hierarchy & Detail Grid", true),
                    new DemoNavItem(p + "/Grid/InlineEdit", "In-Line Editing", true),
                    new DemoNavItem(p + "/Grid/IncellEdit", "In-Cell (Batch Edit)", true),
                    new DemoNavItem(p + "/Grid/PopupEdit", "PopUp Modal Edit", true),
                    new DemoNavItem(p + "/Grid/Selection", "Selection (Single & Multi)", true),
                    new DemoNavItem(p + "/Grid/Columns", "Column Menu & Resizing", true),
                    new DemoNavItem(p + "/Grid/Export", "Excel & PDF Export", true),
                    new DemoNavItem(p + "/Grid/TagHelper", "TagHelper Architecture", true),
                    new DemoNavItem(p + "/Grid/Aggregates", "Group & Footer Totals", true),
                    new DemoNavItem(p + "/Grid/SearchPanel", "Search Panel", true),
                    new DemoNavItem(p + "/Grid/Events", "Client Events", true),
                    new DemoNavItem(p + "/Grid/Api", "Client API", true),
                    new DemoNavItem(p + "/ListView", "ListView (Card Template)"),
                    new DemoNavItem(p + "/PivotGrid", "PivotGrid (Cube Analytics)"),
                    new DemoNavItem(p + "/ScrollView", "ScrollView (Carousel)"),
                }),
                new DemoNavGroup("TreeList (Tree Table)", new[]
                {
                    new DemoNavItem(p + "/TreeList", "TreeList (Overview)"),
                    new DemoNavItem(p + "/TreeList/Aggregates", "Aggregates", true),
                    new DemoNavItem(p + "/TreeList/Api", "API & Methods", true),
                    new DemoNavItem(p + "/TreeList/CheckboxSelection", "Checkbox Selection", true),
                    new DemoNavItem(p + "/TreeList/ClientSidePaging", "Client-Side Paging", true),
                    new DemoNavItem(p + "/TreeList/ColumnMenu", "Column Menu", true),
                    new DemoNavItem(p + "/TreeList/ColumnReordering", "Column Reordering", true),
                    new DemoNavItem(p + "/TreeList/ColumnResizing", "Column Resizing", true),
                    new DemoNavItem(p + "/TreeList/DragDrop", "Row Drag & Drop", true),
                    new DemoNavItem(p + "/TreeList/Editing", "In-Line Editing", true),
                    new DemoNavItem(p + "/TreeList/EditingInCell", "In-Cell Editing", true),
                    new DemoNavItem(p + "/TreeList/EditingPopup", "PopUp Editing", true),
                    new DemoNavItem(p + "/TreeList/Events", "Events", true),
                    new DemoNavItem(p + "/TreeList/ExcelExport", "Excel Export", true),
                    new DemoNavItem(p + "/TreeList/FilterRow", "Filter Row", true),
                    new DemoNavItem(p + "/TreeList/FrozenColumns", "Frozen Columns", true),
                    new DemoNavItem(p + "/TreeList/KeyboardNavigation", "Keyboard Navigation", true),
                    new DemoNavItem(p + "/TreeList/MultiColumnHeaders", "Multi-Column Headers", true),
                    new DemoNavItem(p + "/TreeList/OData", "OData Binding", true),
                    new DemoNavItem(p + "/TreeList/PdfExport", "PDF Export", true),
                    new DemoNavItem(p + "/TreeList/PersistState", "Persist State", true),
                    new DemoNavItem(p + "/TreeList/RemoteDataBinding", "Remote Data Binding", true),
                    new DemoNavItem(p + "/TreeList/RowTemplate", "Row Template", true),
                    new DemoNavItem(p + "/TreeList/SearchPanel", "Search Panel", true),
                    new DemoNavItem(p + "/TreeList/ToolbarTemplate", "Toolbar Template", true),
                }),
                new DemoNavGroup("Spreadsheet", new[]
                {
                    new DemoNavItem(p + "/Spreadsheet", "Spreadsheet (Overview)"),
                    new DemoNavItem(p + "/Spreadsheet/TagHelper", "TagHelper Usage", true),
                    new DemoNavItem(p + "/Spreadsheet/SortingFiltering", "Sorting & Filtering", true),
                    new DemoNavItem(p + "/Spreadsheet/ServerImportExport", "Server Import & Export", true),
                    new DemoNavItem(p + "/Spreadsheet/PdfExport", "PDF Export", true),
                    new DemoNavItem(p + "/Spreadsheet/DataSource", "Data Source Binding", true),
                    new DemoNavItem(p + "/Spreadsheet/Resize", "Resizing", true),
                    new DemoNavItem(p + "/Spreadsheet/DisabledCells", "Disabled Cells", true),
                    new DemoNavItem(p + "/Spreadsheet/CustomEditors", "Custom Editors", true),
                    new DemoNavItem(p + "/Spreadsheet/Images", "Images", true),
                    new DemoNavItem(p + "/Spreadsheet/CellComments", "Cell Comments", true),
                    new DemoNavItem(p + "/Spreadsheet/Events", "Events", true),
                    new DemoNavItem(p + "/Spreadsheet/Validation", "Data Validation", true),
                    new DemoNavItem(p + "/Spreadsheet/KeyboardNavigation", "Keyboard Navigation", true),
                }),
                new DemoNavGroup("DatePicker", new[]
                {
                    new DemoNavItem(p + "/DatePicker", "Overview"),
                    new DemoNavItem(p + "/DatePicker/Validation", "Validation (Min/Max)", true),
                    new DemoNavItem(p + "/DatePicker/DisabledDates", "Disabled Dates", true),
                    new DemoNavItem(p + "/DatePicker/WeekNumber", "Week Numbers", true),
                    new DemoNavItem(p + "/DatePicker/Events", "Events", true),
                    new DemoNavItem(p + "/DatePicker/Api", "API (Methods)", true),
                }),
                new DemoNavGroup("Select & Dropdown", new[]
                {
                    new DemoNavItem(p + "/Select", "Overview"),
                    new DemoNavItem(p + "/Select/RemoteData", "Remote Data", true),
                    new DemoNavItem(p + "/Select/Filtering", "Filtering (Searchable)", true),
                    new DemoNavItem(p + "/Select/Grouping", "Grouping", true),
                    new DemoNavItem(p + "/Select/Templates", "Templates", true),
                    new DemoNavItem(p + "/Select/Cascading", "Cascading", true),
                    new DemoNavItem(p + "/Select/Events", "Events", true),
                    new DemoNavItem(p + "/Select/Api", "API (Methods)", true),
                }),
                new DemoNavGroup("DropDownTree", new[]
                {
                    new DemoNavItem(p + "/DropDownTree/BasicUsage", "Overview"),
                    new DemoNavItem(p + "/DropDownTree/TagHelper", "TagHelper Usage", true),
                    new DemoNavItem(p + "/DropDownTree/Checkboxes", "Multi & Tri-State Checkboxes", true),
                    new DemoNavItem(p + "/DropDownTree/Appearance", "Styling & Sizes", true),
                    new DemoNavItem(p + "/DropDownTree/FloatingLabel", "Floating Label", true),
                    new DemoNavItem(p + "/DropDownTree/AdaptiveMode", "Adaptive Mode", true),
                    new DemoNavItem(p + "/DropDownTree/Images", "Icons & Images", true),
                    new DemoNavItem(p + "/DropDownTree/Templates", "Custom Templates", true),
                    new DemoNavItem(p + "/DropDownTree/ClientFiltering", "Client Filtering (Search)", true),
                    new DemoNavItem(p + "/DropDownTree/LocalDataBinding", "Local Data Binding", true),
                    new DemoNavItem(p + "/DropDownTree/RemoteDataBinding", "Remote Data Binding", true),
                    new DemoNavItem(p + "/DropDownTree/Events", "Events & Console", true),
                    new DemoNavItem(p + "/DropDownTree/Api", "Client API Methods", true),
                    new DemoNavItem(p + "/DropDownTree/RtlSupport", "RTL Support", true),
                    new DemoNavItem(p + "/DropDownTree/KeyboardNavigation", "Keyboard Navigation (A11y)", true),
                }),
                new DemoNavGroup("Form & Inputs", new[]
                {
                    new DemoNavItem(p + "/Form", "Form (Declarative Builder)"),
                    new DemoNavItem(p + "/Slider", "Slider & Range"),
                    new DemoNavItem(p + "/Rating", "Rating"),
                    new DemoNavItem(p + "/Otp", "OtpInput (SMS Code)"),
                    new DemoNavItem(p + "/Signature", "Signature Pad"),
                    new DemoNavItem(p + "/Editor", "Editor (Rich Text)"),
                    new DemoNavItem(p + "/ImageEditor", "Image Editor"),
                    new DemoNavItem(p + "/Filter", "Filter (Query Engine)"),
                    new DemoNavItem(p + "/Components/DateRangePicker", "DateRangePicker"),
                    new DemoNavItem(p + "/Components/TimePicker", "TimePicker"),
                    new DemoNavItem(p + "/Components/DateTimePicker", "DateTimePicker"),
                    new DemoNavItem(p + "/Components/MultiSelect", "MultiSelect (Tagged)"),
                    new DemoNavItem(p + "/Components/ComboBox", "ComboBox (Input & List)"),
                    new DemoNavItem(p + "/Components/MultiColumnComboBox", "MultiColumnComboBox"),
                    new DemoNavItem(p + "/Components/AutoComplete", "AutoComplete"),
                    new DemoNavItem(p + "/Components/NumericTextBox", "NumericTextBox (Currency/Number)"),
                    new DemoNavItem(p + "/Components/TextBox", "TextBox (Clearable)"),
                    new DemoNavItem(p + "/Components/TextArea", "TextArea (Auto-Size)"),
                    new DemoNavItem(p + "/Components/Switch", "Switch (Toggle)"),
                    new DemoNavItem(p + "/Components/CheckBox", "CheckBox (Custom)"),
                    new DemoNavItem(p + "/Components/RadioGroup", "RadioGroup"),
                    new DemoNavItem(p + "/Components/MaskedTextBox", "MaskedTextBox"),
                    new DemoNavItem(p + "/Components/ColorPicker", "ColorPicker (Palette)"),
                }),
                new DemoNavGroup("Upload", new[]
                {
                    new DemoNavItem(p + "/Upload", "Upload (Overview)"),
                    new DemoNavItem(p + "/Upload/Manual", "Manual Upload (Sync)", true),
                    new DemoNavItem(p + "/Upload/Validation", "Validation", true),
                    new DemoNavItem(p + "/Upload/Events", "Events", true),
                    new DemoNavItem(p + "/Upload/Gallery", "Image Gallery (Sorting)", true),
                    new DemoNavItem(p + "/Upload/Api", "API Methods", true),
                }),
                new DemoNavGroup("Navigation & Layout", new[]
                {
                    new DemoNavItem(p + "/Menu", "Menu & ContextMenu"),
                    new DemoNavItem(p + "/TabStrip", "TabStrip (Tabs Panel)"),
                    new DemoNavItem(p + "/PanelBar", "PanelBar (Accordion)"),
                    new DemoNavItem(p + "/Breadcrumb", "Breadcrumb"),
                    new DemoNavItem(p + "/Drawer", "Drawer (Side Panel)"),
                    new DemoNavItem(p + "/TreeView", "TreeView"),
                    new DemoNavItem(p + "/Stepper", "Stepper & Wizard"),
                    new DemoNavItem(p + "/ToolBar", "ToolBar"),
                    new DemoNavItem(p + "/Splitter", "Splitter (Panel Divider)"),
                    new DemoNavItem(p + "/TileLayout/Overview", "TileLayout (Dashboard)"),
                    new DemoNavItem(p + "/ActionSheet/Overview", "ActionSheet"),
                }),
                new DemoNavGroup("TileLayout (Dashboard)", new[]
                {
                    new DemoNavItem(p + "/TileLayout/Overview", "Overview"),
                    new DemoNavItem(p + "/TileLayout/TagHelper", "TagHelper Usage", true),
                    new DemoNavItem(p + "/TileLayout/Reordering", "Drag & Drop Reordering", true),
                    new DemoNavItem(p + "/TileLayout/Resizing", "2D Resizing", true),
                    new DemoNavItem(p + "/TileLayout/AddRemove", "Add & Remove Cards", true),
                    new DemoNavItem(p + "/TileLayout/KeyboardNavigation", "Keyboard Navigation (A11y)", true),
                    new DemoNavItem(p + "/TileLayout/Events", "Events & Console", true),
                    new DemoNavItem(p + "/TileLayout/StatePersistence", "State Persistence (Storage)", true),
                    new DemoNavItem(p + "/TileLayout/Api", "Client API Methods", true),
                }),
                new DemoNavGroup("ActionSheet", new[]
                {
                    new DemoNavItem(p + "/ActionSheet/Overview", "Overview"),
                    new DemoNavItem(p + "/ActionSheet/TagHelper", "TagHelper Usage", true),
                    new DemoNavItem(p + "/ActionSheet/Animation", "Animation Effects", true),
                    new DemoNavItem(p + "/ActionSheet/ActionButtons", "Action Buttons & Themes", true),
                    new DemoNavItem(p + "/ActionSheet/Api", "Client API Methods", true),
                    new DemoNavItem(p + "/ActionSheet/Events", "Events & Console", true),
                    new DemoNavItem(p + "/ActionSheet/KeyboardNavigation", "Keyboard Navigation (A11y)", true),
                    new DemoNavItem(p + "/ActionSheet/Templates", "Custom Templates", true),
                    new DemoNavItem(p + "/ActionSheet/ModalFullscreen", "Modal & Fullscreen", true),
                }),
                new DemoNavGroup("Map (Geographic Map)", new[]
                {
                    new DemoNavItem(p + "/Map/Overview", "Overview"),
                    new DemoNavItem(p + "/Map/TagHelper", "TagHelper Usage", true),
                    new DemoNavItem(p + "/Map/TileLayers", "Multiple Tile Layers", true),
                    new DemoNavItem(p + "/Map/BubbleLayer", "Bubble Layer", true),
                    new DemoNavItem(p + "/Map/GeoJson", "GeoJSON & Vector Layer", true),
                    new DemoNavItem(p + "/Map/Markers", "Markers & Popups", true),
                    new DemoNavItem(p + "/Map/Export", "Export (PNG / SVG)", true),
                    new DemoNavItem(p + "/Map/Events", "Events", true),
                    new DemoNavItem(p + "/Map/Api", "Client API", true),
                }),
                new DemoNavGroup("Notification & Window", new[]
                {
                    new DemoNavItem(p + "/Notification", "Notification (Toast)"),
                    new DemoNavItem(p + "/Dialog", "Dialog (Alert/Confirm)"),
                    new DemoNavItem(p + "/Window", "Window (Floating)"),
                }),
                new DemoNavGroup("Scheduling & Project", new[]
                {
                    new DemoNavItem(p + "/Scheduler", "Scheduler (Overview)"),
                    new DemoNavItem(p + "/Scheduler/RemoteData", "Remote Data", true),
                    new DemoNavItem(p + "/Scheduler/Views", "Views", true),
                    new DemoNavItem(p + "/Scheduler/Grouping", "Grouping", true),
                    new DemoNavItem(p + "/Scheduler/Resources", "Resources", true),
                    new DemoNavItem(p + "/Scheduler/Events", "Events", true),
                    new DemoNavItem(p + "/Scheduler/Api", "API (Methods)", true),
                    new DemoNavItem(p + "/Gantt", "Gantt Chart"),
                    new DemoNavItem(p + "/TaskBoard", "TaskBoard (Kanban)"),
                }),
                new DemoNavGroup("Charts & Visualization", new[]
                {
                    new DemoNavItem(p + "/Chart", "Charts"),
                    new DemoNavItem(p + "/StockChart", "StockChart (Finance)"),
                    new DemoNavItem(p + "/Diagram", "Diagram & OrgChart"),
                    new DemoNavItem(p + "/Gauge", "Gauges"),
                    new DemoNavItem(p + "/Barcode", "Barcode & QR"),
                }),
                new DemoNavGroup("Media & Documents", new[]
                {
                    new DemoNavItem(p + "/FileManager", "FileManager"),
                    new DemoNavItem(p + "/MediaPlayer", "MediaPlayer (Video/Audio)"),
                    new DemoNavItem(p + "/PdfViewer", "PDFViewer (Reader)"),
                })
            };
        }

        // Turkish Default
        return new[]
        {
            new DemoNavGroup("Veri Yönetimi", new[]
            {
                new DemoNavItem("/Grid", "Data Grid (Genel Bakış)"),
                new DemoNavItem("/Grid/Paging", "Sayfalama (Paging)", true),
                new DemoNavItem("/Grid/Sorting", "Sıralama (Multi-Sort)", true),
                new DemoNavItem("/Grid/Filtering", "Filtreleme (Filter Menu)", true),
                new DemoNavItem("/Grid/Grouping", "Gruplama & Özetler", true),
                new DemoNavItem("/Grid/Hierarchy", "Hiyerarşi & Alt Grid", true),
                new DemoNavItem("/Grid/InlineEdit", "Satır İçi Düzenleme", true),
                new DemoNavItem("/Grid/IncellEdit", "Hücre İçi (Batch Edit)", true),
                new DemoNavItem("/Grid/PopupEdit", "Modal ile Düzenleme", true),
                new DemoNavItem("/Grid/Selection", "Seçim (Tekli & Çoklu)", true),
                new DemoNavItem("/Grid/Columns", "Sütun Menüsü & Boyut", true),
                new DemoNavItem("/Grid/Export", "Excel & PDF Çıktısı", true),
                new DemoNavItem("/Grid/TagHelper", "TagHelper Mimarisi", true),
                new DemoNavItem("/Grid/Aggregates", "Grup & Dip Toplamlar", true),
                new DemoNavItem("/Grid/SearchPanel", "Arama Paneli (Search)", true),
                new DemoNavItem("/Grid/Events", "İstemci Olayları (Events)", true),
                new DemoNavItem("/Grid/Api", "İstemci API (Client API)", true),
                new DemoNavItem("/ListView", "ListView (Kart Şablonu)"),
                new DemoNavItem("/PivotGrid", "PivotGrid (Küp Analizi)"),
                new DemoNavItem("/ScrollView", "ScrollView (Carousel)"),
            }),
            new DemoNavGroup("TreeList (Ağaç Tablo)", new[]
            {
                new DemoNavItem("/TreeList", "TreeList (Genel Bakış)"),
                new DemoNavItem("/TreeList/Aggregates", "Toplamlar (Aggregates)", true),
                new DemoNavItem("/TreeList/Api", "API (Metotlar)", true),
                new DemoNavItem("/TreeList/CheckboxSelection", "Onay Kutulu Seçim", true),
                new DemoNavItem("/TreeList/ClientSidePaging", "İstemci Tarafı Sayfalama", true),
                new DemoNavItem("/TreeList/ColumnMenu", "Sütun Menüsü", true),
                new DemoNavItem("/TreeList/ColumnReordering", "Sütun Sıralama (Sürükle)", true),
                new DemoNavItem("/TreeList/ColumnResizing", "Sütun Boyutlandırma", true),
                new DemoNavItem("/TreeList/DragDrop", "Sürükle & Bırak (Satır)", true),
                new DemoNavItem("/TreeList/Editing", "Satır İçi Düzenleme", true),
                new DemoNavItem("/TreeList/EditingInCell", "Hücre İçi Düzenleme", true),
                new DemoNavItem("/TreeList/EditingPopup", "Popup Düzenleme", true),
                new DemoNavItem("/TreeList/Events", "Olaylar (Events)", true),
                new DemoNavItem("/TreeList/ExcelExport", "Excel Dışa Aktarım", true),
                new DemoNavItem("/TreeList/FilterRow", "Filtre Satırı", true),
                new DemoNavItem("/TreeList/FrozenColumns", "Dondurulmuş Sütunlar", true),
                new DemoNavItem("/TreeList/KeyboardNavigation", "Klavye Navigasyonu", true),
                new DemoNavItem("/TreeList/MultiColumnHeaders", "Çok Katmanlı Başlıklar", true),
                new DemoNavItem("/TreeList/OData", "OData Bağlama", true),
                new DemoNavItem("/TreeList/PdfExport", "PDF Dışa Aktarım", true),
                new DemoNavItem("/TreeList/PersistState", "Durumu Kaydet", true),
                new DemoNavItem("/TreeList/RemoteDataBinding", "Uzak Veri Bağlama", true),
                new DemoNavItem("/TreeList/RowTemplate", "Satır Şablonu", true),
                new DemoNavItem("/TreeList/SearchPanel", "Arama Paneli", true),
                new DemoNavItem("/TreeList/ToolbarTemplate", "Araç Çubuğu Şablonu", true),
            }),
            new DemoNavGroup("Spreadsheet (Hesap Tablosu)", new[]
            {
                new DemoNavItem("/Spreadsheet", "Spreadsheet (Genel Bakış)"),
                new DemoNavItem("/Spreadsheet/TagHelper", "TagHelper Kullanımı", true),
                new DemoNavItem("/Spreadsheet/SortingFiltering", "Sıralama ve Filtreleme", true),
                new DemoNavItem("/Spreadsheet/ServerImportExport", "Sunucu Taraflı İçe/Dışa Aktarma", true),
                new DemoNavItem("/Spreadsheet/PdfExport", "PDF'e Aktarma", true),
                new DemoNavItem("/Spreadsheet/DataSource", "Veri Kaynağına Bağlama", true),
                new DemoNavItem("/Spreadsheet/Resize", "Boyutlandırma", true),
                new DemoNavItem("/Spreadsheet/DisabledCells", "Devre Dışı Hücreler", true),
                new DemoNavItem("/Spreadsheet/CustomEditors", "Özel Hücre Düzenleyicileri", true),
                new DemoNavItem("/Spreadsheet/Images", "Resimler", true),
                new DemoNavItem("/Spreadsheet/CellComments", "Hücre Yorumları", true),
                new DemoNavItem("/Spreadsheet/Events", "Olaylar (Events)", true),
                new DemoNavItem("/Spreadsheet/Validation", "Veri Doğrulama", true),
                new DemoNavItem("/Spreadsheet/KeyboardNavigation", "Klavye Gezinmesi", true),
            }),
            new DemoNavGroup("DatePicker (Tarih Seçici)", new[]
            {
                new DemoNavItem("/DatePicker", "Genel Bakış (Overview)"),
                new DemoNavItem("/DatePicker/Validation", "Doğrulama (Min/Max)", true),
                new DemoNavItem("/DatePicker/DisabledDates", "Pasif Tarihler", true),
                new DemoNavItem("/DatePicker/WeekNumber", "Hafta Numaraları", true),
                new DemoNavItem("/DatePicker/Events", "Olaylar (Events)", true),
                new DemoNavItem("/DatePicker/Api", "API (Metotlar)", true),
            }),
            new DemoNavGroup("Select (Açılır Liste)", new[]
            {
                new DemoNavItem("/Select", "Genel Bakış (Overview)"),
                new DemoNavItem("/Select/RemoteData", "Uzaktan Veri (Remote Data)", true),
                new DemoNavItem("/Select/Filtering", "Filtreleme (Searchable)", true),
                new DemoNavItem("/Select/Grouping", "Gruplama (Grouping)", true),
                new DemoNavItem("/Select/Templates", "Şablonlar (Templates)", true),
                new DemoNavItem("/Select/Cascading", "Bağımlı Seçim (Cascading)", true),
                new DemoNavItem("/Select/Events", "Olaylar (Events)", true),
                new DemoNavItem("/Select/Api", "API (Metotlar)", true),
            }),
            new DemoNavGroup("DropDownTree (Açılır Ağaç)", new[]
            {
                new DemoNavItem("/DropDownTree/BasicUsage", "Genel Bakış (Overview)"),
                new DemoNavItem("/DropDownTree/TagHelper", "Tag Helper Kullanımı", true),
                new DemoNavItem("/DropDownTree/Checkboxes", "Çoklu & Tri-State Onay Kutuları", true),
                new DemoNavItem("/DropDownTree/Appearance", "Görünüm & Boyutlar (Styling)", true),
                new DemoNavItem("/DropDownTree/FloatingLabel", "Floating Label (Yüzen Etiket)", true),
                new DemoNavItem("/DropDownTree/AdaptiveMode", "Mobil Uyumlu (Adaptive Mode)", true),
                new DemoNavItem("/DropDownTree/Images", "İkonlar & Resimler", true),
                new DemoNavItem("/DropDownTree/Templates", "Özel Şablonlar (Templates)", true),
                new DemoNavItem("/DropDownTree/ClientFiltering", "İstemci Filtreleme (Search)", true),
                new DemoNavItem("/DropDownTree/LocalDataBinding", "Yerel Veri Bağlama (Local)", true),
                new DemoNavItem("/DropDownTree/RemoteDataBinding", "Uzaktan Veri Bağlama (Remote)", true),
                new DemoNavItem("/DropDownTree/Events", "Olaylar & Konsol (Events)", true),
                new DemoNavItem("/DropDownTree/Api", "İstemci API Metotları", true),
                new DemoNavItem("/DropDownTree/RtlSupport", "RTL Desteği (Sağdan Sola)", true),
                new DemoNavItem("/DropDownTree/KeyboardNavigation", "Klavye Navigasyonu (A11y)", true),
            }),
            new DemoNavGroup("Form & Girdi", new[]
            {
                new DemoNavItem("/Form", "Form (Deklaratif Builder)"),
                new DemoNavItem("/Slider", "Slider & Range"),
                new DemoNavItem("/Rating", "Rating (Puanlama)"),
                new DemoNavItem("/Otp", "OtpInput (SMS Kod)"),
                new DemoNavItem("/Signature", "Signature (İmza)"),
                new DemoNavItem("/Editor", "Editor (Zengin Metin)"),
                new DemoNavItem("/ImageEditor", "ImageEditor (Resim Düzenleyici)"),
                new DemoNavItem("/Filter", "Filter (Sorgu Motoru)"),
                new DemoNavItem("/Components/DateRangePicker", "DateRangePicker (Tarih Aralığı)"),
                new DemoNavItem("/Components/TimePicker", "TimePicker (Saat Seçici)"),
                new DemoNavItem("/Components/DateTimePicker", "DateTimePicker (Tarih & Saat)"),
                new DemoNavItem("/Components/MultiSelect", "MultiSelect (Etiketli Çoklu)"),
                new DemoNavItem("/Components/ComboBox", "ComboBox (Girdi & Liste)"),
                new DemoNavItem("/Components/MultiColumnComboBox", "MultiColumnComboBox (Çok Sütunlu)"),
                new DemoNavItem("/Components/AutoComplete", "AutoComplete (Tamamlama)"),
                new DemoNavItem("/Components/NumericTextBox", "NumericTextBox (Para/Sayı)"),
                new DemoNavItem("/Components/TextBox", "TextBox (Temizlenebilir)"),
                new DemoNavItem("/Components/TextArea", "TextArea (Oto-Boyutlandırma)"),
                new DemoNavItem("/Components/Switch", "Switch (Aç/Kapa Buton)"),
                new DemoNavItem("/Components/CheckBox", "CheckBox (Özel Onay)"),
                new DemoNavItem("/Components/RadioGroup", "RadioGroup (Radyo Grubu)"),
                new DemoNavItem("/Components/MaskedTextBox", "MaskedTextBox (Maskeli)"),
                new DemoNavItem("/Components/ColorPicker", "ColorPicker (Renk Paleti)"),
            }),
            new DemoNavGroup("Upload (Dosya Yükleme)", new[]
            {
                new DemoNavItem("/Upload", "Upload (Genel Bakış)"),
                new DemoNavItem("/Upload/Manual", "Manuel Yükleme (Sync)", true),
                new DemoNavItem("/Upload/Validation", "Doğrulama (Validation)", true),
                new DemoNavItem("/Upload/Events", "Olaylar (Events)", true),
                new DemoNavItem("/Upload/Gallery", "Resim Galerisi (Sıralama)", true),
                new DemoNavItem("/Upload/Api", "API Metotları", true),
            }),
            new DemoNavGroup("Navigasyon & Düzen", new[]
            {
                new DemoNavItem("/Menu", "Menu & ContextMenu"),
                new DemoNavItem("/TabStrip", "TabStrip (Sekmeli Panel)"),
                new DemoNavItem("/PanelBar", "PanelBar (Akordiyon)"),
                new DemoNavItem("/Breadcrumb", "Breadcrumb (Yol Çubuğu)"),
                new DemoNavItem("/Drawer", "Drawer (Yan Çekmece)"),
                new DemoNavItem("/TreeView", "TreeView (Ağaç Yapısı)"),
                new DemoNavItem("/Stepper", "Stepper & Wizard"),
                new DemoNavItem("/ToolBar", "ToolBar (Araç Çubuğu)"),
                new DemoNavItem("/Splitter", "Splitter (Panel Bölücü)"),
                new DemoNavItem("/TileLayout/Overview", "TileLayout (Dashboard)"),
                new DemoNavItem("/ActionSheet/Overview", "ActionSheet (Eylem Sayfası)"),
            }),
            new DemoNavGroup("TileLayout (Dashboard Düzeni)", new[]
            {
                new DemoNavItem("/TileLayout/Overview", "Genel Bakış (Overview)"),
                new DemoNavItem("/TileLayout/TagHelper", "Tag Helper Kullanımı", true),
                new DemoNavItem("/TileLayout/Reordering", "Sürükle-Bırak Sıralama", true),
                new DemoNavItem("/TileLayout/Resizing", "2D Boyutlandırma", true),
                new DemoNavItem("/TileLayout/AddRemove", "Kart Ekleme & Kaldırma", true),
                new DemoNavItem("/TileLayout/KeyboardNavigation", "Klavye Gezintisi (A11y)", true),
                new DemoNavItem("/TileLayout/Events", "Olaylar & Konsol (Events)", true),
                new DemoNavItem("/TileLayout/StatePersistence", "Durum Saklama (Storage)", true),
                new DemoNavItem("/TileLayout/Api", "İstemci API Metotları", true),
            }),
            new DemoNavGroup("ActionSheet (Alt Eylem Sayfası)", new[]
            {
                new DemoNavItem("/ActionSheet/Overview", "Genel Bakış (Overview)"),
                new DemoNavItem("/ActionSheet/TagHelper", "Tag Helper Kullanımı", true),
                new DemoNavItem("/ActionSheet/Animation", "Animasyon Efektleri", true),
                new DemoNavItem("/ActionSheet/ActionButtons", "Eylem Butonları & Temalar", true),
                new DemoNavItem("/ActionSheet/Api", "İstemci API Metotları", true),
                new DemoNavItem("/ActionSheet/Events", "Olaylar & Konsol (Events)", true),
                new DemoNavItem("/ActionSheet/KeyboardNavigation", "Klavye Gezintisi (A11y)", true),
                new DemoNavItem("/ActionSheet/Templates", "Özel Şablonlar & İçerik", true),
                new DemoNavItem("/ActionSheet/ModalFullscreen", "Modal & Tam Ekran Modu", true),
            }),
            new DemoNavGroup("Map (Coğrafi Harita)", new[]
            {
                new DemoNavItem("/Map/Overview", "Genel Bakış (Overview)"),
                new DemoNavItem("/Map/TagHelper", "TagHelper Kullanımı", true),
                new DemoNavItem("/Map/TileLayers", "Çoklu Harita Katmanları (Tile Layers)", true),
                new DemoNavItem("/Map/BubbleLayer", "Kabarcık Katmanı (Bubble Layer)", true),
                new DemoNavItem("/Map/GeoJson", "GeoJSON & Vektör Katmanı", true),
                new DemoNavItem("/Map/Markers", "İşaretçiler ve Popuplar (Markers)", true),
                new DemoNavItem("/Map/Export", "Dışa Aktarma (PNG / SVG)", true),
                new DemoNavItem("/Map/Events", "Olaylar (Events)", true),
                new DemoNavItem("/Map/Api", "İstemci API (Client API)", true),
            }),
            new DemoNavGroup("Bildirim & Pencere", new[]
            {
                new DemoNavItem("/Notification", "Notification (Toast)"),
                new DemoNavItem("/Dialog", "Dialog (Alert/Confirm)"),
                new DemoNavItem("/Window", "Window (Serbest Pencere)"),
            }),
            new DemoNavGroup("Planlama & Proje", new[]
            {
                new DemoNavItem("/Scheduler", "Scheduler (Genel Bakış)"),
                new DemoNavItem("/Scheduler/RemoteData", "Uzaktan Veri (Remote Data)", true),
                new DemoNavItem("/Scheduler/Views", "Görünümler (Views)", true),
                new DemoNavItem("/Scheduler/Grouping", "Gruplama (Grouping)", true),
                new DemoNavItem("/Scheduler/Resources", "Kaynaklar (Resources)", true),
                new DemoNavItem("/Scheduler/Events", "Olaylar (Events)", true),
                new DemoNavItem("/Scheduler/Api", "API (Metotlar)", true),
                new DemoNavItem("/Gantt", "Gantt (Çizelge)"),
                new DemoNavItem("/TaskBoard", "TaskBoard (Kanban)"),
            }),
            new DemoNavGroup("Grafik & Görsel", new[]
            {
                new DemoNavItem("/Chart", "Charts (Grafikler)"),
                new DemoNavItem("/StockChart", "StockChart (Finans)"),
                new DemoNavItem("/Diagram", "Diagram & OrgChart"),
                new DemoNavItem("/Gauge", "Gauges (Göstergeler)"),
                new DemoNavItem("/Barcode", "Barcode & QR"),
            }),
            new DemoNavGroup("Medya & Doküman", new[]
            {
                new DemoNavItem("/FileManager", "FileManager (Dosya Yöneticisi)"),
                new DemoNavItem("/MediaPlayer", "MediaPlayer (Video/Ses)"),
                new DemoNavItem("/PdfViewer", "PDFViewer (Okuyucu)"),
            }),
        };
    }

    public static readonly Dictionary<string, (string Tr, string En)> Texts = new()
    {
        // Top Nav & Header
        ["TopNav.Showcase"] = ("Bileşen Vitrini", "Component Showcase"),
        ["TopNav.DataGrid"] = ("Data Grid", "Data Grid"),
        ["TopNav.Catalog"] = ("Bileşen Kataloğu", "Component Catalog"),
        ["TopNav.ZeroDep"] = ("Sıfır Dış Bağımlılık", "Zero External Dependencies"),
        ["TopNav.Enterprise"] = ("Kurumsal UI v1.0", "Enterprise UI v1.0"),
        ["TopNav.SearchPlaceholder"] = ("Bileşen ara... ({0} bileşen)", "Search components... ({0} components)"),
        ["TopNav.SearchEmpty"] = ("Eşleşen bileşen bulunamadı.", "No matching components found."),

        // Catalog Callout in Sidebar
        ["Sidebar.CatalogBadge"] = ("Katalog", "Catalog"),
        ["Sidebar.CatalogTitle"] = ("Bileşen Kataloğu & Yetenekler", "Component Catalog & Features"),
        ["Sidebar.CatalogDesc"] = ("Kapsam ve demoları incele →", "Explore coverage & demos →"),

        // Sub Bar / Ref Banner
        ["Ref.SuiteTitle"] = ("Panoptes UI Enterprise", "Panoptes UI Enterprise"),
        ["Ref.SuiteSubtitle"] = ("ASP.NET Core Kurumsal Bileşen Paketi", "ASP.NET Core Enterprise Component Suite"),
        ["Ref.CatalogButton"] = ("Bileşen Kataloğu", "Component Catalog"),

        // Footer
        ["Footer.Subtitle"] = ("Kurumsal UI Bileşen Paketi", "Enterprise UI Component Suite"),
        ["Footer.BuiltWith"] = ("Modern web için geliştirildi", "Built with ♥️ for modern web"),

        // Home View (Index)
        ["Home.HeroBadge"] = ("🚀 Kurumsal ASP.NET Core UI Vitrini", "🚀 Enterprise ASP.NET Core UI Showcase"),
        ["Home.HeroBadge2"] = ("Kurumsal UI Bileşenleri", "Enterprise UI Components"),
        ["Home.HeroTitle1"] = ("Hızlı, Bağımsız ve", "Fast, Independent and"),
        ["Home.HeroTitle2"] = ("Modern Bileşenler", "Modern Components"),
        ["Home.HeroDesc"] = (
            "Sıfır üçüncü parti lisans bağımlılığı, %100 Tailwind CSS uyumluluğu, gerçek binary Excel (.xlsx) motoru ve 16 adet zengin form bileşeni içeren açık kaynaklı ASP.NET Core UI kütüphanesi.",
            "Open-source ASP.NET Core UI library featuring zero third-party license dependencies, 100% Tailwind CSS compatibility, true binary Excel (.xlsx) engine, and 16 rich form components."
        ),
        ["Home.BtnGrid"] = ("📊 Data Grid Demoları (12 Sayfa)", "📊 Data Grid Demos (12 Pages)"),
        ["Home.BtnComponents"] = ("🧩 Form Bileşenleri (16 Adet)", "🧩 Form Components (16 Items)"),
        ["Home.Stat1Title"] = ("Grid Demoları", "Grid Demos"),
        ["Home.Stat1Sub"] = ("Sayfalama, Sıralama, Hiyerarşi", "Paging, Sorting, Hierarchy"),
        ["Home.Stat2Title"] = ("Form Bileşeni", "Form Components"),
        ["Home.Stat2Sub"] = ("Tarih, Seçim, Sayı, Maske", "Date, Select, Numeric, Mask"),
        ["Home.Stat3Title"] = ("Dış Bağımlılık", "External Dependencies"),
        ["Home.Stat3Sub"] = ("Sadece ASP.NET Core & Tailwind", "Only ASP.NET Core & Tailwind"),
        ["Home.Stat4Title"] = ("Excel Dışa Aktarım", "Excel Export"),
        ["Home.Stat4Sub"] = ("Gerçek OpenXML .xlsx Çıktısı", "Native OpenXML .xlsx Output"),

        // Component Catalog View
        ["Catalog.HeroBadge"] = ("Kurumsal Ekosistem & Yetenek Panosu", "Enterprise Ecosystem & Capability Board"),
        ["Catalog.HeroTitle1"] = ("Panoptes UI —", "Panoptes UI —"),
        ["Catalog.HeroTitle2"] = ("52 Kurumsal Bileşen", "52 Enterprise Components"),
        ["Catalog.HeroTitle3"] = ("Kataloğu", "Catalog"),
        ["Catalog.HeroDesc"] = (
            "Panoptes ASP.NET Core ekosistemindeki tüm gelişmiş UI bileşenleri, veri ızgaraları, form kontrolleri ve görselleştirme araçlarının kapsamlı yetenek matrisi ve canlı demo bağlantıları.",
            "Comprehensive capability matrix and live demo links for all advanced UI components, data grids, form controls, and visualization tools in the Panoptes ASP.NET Core ecosystem."
        ),
        ["Catalog.Metric1"] = ("Toplam Bileşen", "Total Components"),
        ["Catalog.Metric2"] = ("Kurumsal Yetenek Eşliği", "Enterprise Capability Parity"),
        ["Catalog.Metric3"] = ("Harici Kütüphane Bağımlılığı", "External Library Dependencies"),
        ["Catalog.Metric4"] = ("Açık Kaynak Lisans", "Open Source License"),

        // Grid Overview View
        ["Grid.HeroBadge"] = ("Modern ASP.NET Core Data Grid", "Modern ASP.NET Core Data Grid"),
        ["Grid.HeroBadge2"] = ("%100 Eksiksiz Eşlik", "100% Complete Parity"),
        ["Grid.HeroTitle"] = ("ASP.NET Core Data Grid Genel Bakış", "ASP.NET Core Data Grid Overview"),
        ["Grid.HeroDesc"] = (
            "Gelişmiş kurumsal veri tablosu mimarisiyle; çoklu sütun sıralama, gelişmiş filtreleme, sürükle-bırak gruplama, hücre içi/satır içi düzenleme, çoklu seçim, OpenXML Excel/PDF dışa aktarma, resimli/yıldızlı zengin hücre şablonları ve hiyerarşik detay tablosu tek ekranda.",
            "Advanced enterprise data grid architecture featuring multi-column sorting, advanced filtering, drag-and-drop grouping, in-cell and in-line editing, multi-selection, native OpenXML Excel/PDF export, rich templates, and hierarchical detail tables."
        ),
        ["Grid.Kpi1Title"] = ("Toplam Ürün", "Total Products"),
        ["Grid.Kpi1Sub"] = ("Aktif Katalog", "Active Catalog"),
        ["Grid.Kpi2Title"] = ("Toplam Ciro", "Total Revenue"),
        ["Grid.Kpi2Sub"] = ("+14.2% Bu Ay", "+14.2% This Month"),
        ["Grid.Kpi3Title"] = ("Ortalama Puan", "Average Rating"),
        ["Grid.Kpi3Sub"] = ("Müşteri Memnuniyeti", "Customer Satisfaction"),
        ["Grid.Kpi4Title"] = ("Stok Durumu", "Stock Status"),
        ["Grid.Kpi4Sub"] = ("Stokta Bulunanlar", "In Stock Items"),
        ["Grid.ExportExcel"] = ("Excel İndir (.xlsx)", "Export Excel (.xlsx)"),
        ["Grid.ExportPdf"] = ("PDF İndir", "Export PDF"),
        ["Grid.AddNew"] = ("Yeni Ürün Ekle", "Add New Product"),
        ["Grid.Refresh"] = ("Yenile", "Refresh"),
        ["Grid.EditMode"] = ("Düzenleme Modu:", "Edit Mode:"),
        ["Grid.Incell"] = ("Hücre İçi (In-Cell)", "In-Cell"),
        ["Grid.Inline"] = ("Satır İçi (In-Line)", "In-Line"),
        ["Grid.Popup"] = ("Açılır Pencere (PopUp)", "PopUp Modal"),

        // Catalog Extras
        ["Catalog.CatAll"] = ("Tümü (52)", "All (52)"),
        ["Catalog.CatData"] = ("Veri & Tablolar", "Data & Grids"),
        ["Catalog.CatForms"] = ("Form & Girdi", "Forms & Inputs"),
        ["Catalog.CatNav"] = ("Navigasyon", "Navigation"),
        ["Catalog.CatPopups"] = ("Pencereler & Popuplar", "Windows & Popups"),
        ["Catalog.CatScheduling"] = ("Planlama & Gantt", "Scheduling & Gantt"),
        ["Catalog.CatCharts"] = ("Grafikler & Göstergeler", "Charts & Gauges"),
        ["Catalog.CatTools"] = ("Araçlar & Medya", "Tools & Media"),
        ["Catalog.SearchPlaceholder"] = ("Bileşen veya yetenek ara...", "Search components or capabilities..."),
        ["Catalog.OpenDemo"] = ("Demoyu Aç", "Open Demo"),
        ["Catalog.Ready"] = ("Hazır", "Ready"),
        ["Catalog.EnterpriseParity"] = ("%100 Kurumsal Eşlik", "100% Enterprise Parity"),
        ["Catalog.NoResults"] = ("Aramanıza uygun bileşen bulunamadı.", "No components found matching your search."),
        ["Catalog.NoResultsSub"] = ("Farklı bir kelime deneyin veya filtreyi sıfırlayın.", "Try a different keyword or reset the category filter."),
    };

    public static string T(string key, bool isEn, params object[] args)
    {
        if (Texts.TryGetValue(key, out var pair))
        {
            var text = isEn ? pair.En : pair.Tr;
            return args.Length > 0 ? string.Format(text, args) : text;
        }
        return key;
    }
}
