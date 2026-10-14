using System;
using System.Collections.Generic;
using System.Linq;
using Panoptes.AspNetCore.Models;

namespace Panoptes.AspNetCore.Demo.Data;

/// <summary>Takvim demoları için örnek veri üreticisi. Tüm tarihler içinde bulunulan haftaya göre hesaplanır.</summary>
public static class SchedulerDemoData
{
    public static DateTime Monday
    {
        get
        {
            var today = DateTime.Today;
            var diff = ((int)today.DayOfWeek + 6) % 7;
            return today.AddDays(-diff);
        }
    }

    // ------------------------------------------------------------------ kaynaklar
    public static List<SchedulerResourceItem> People() => new()
    {
        new() { Value = 1, Text = "Ayşe Yılmaz", Color = "#f8a398" },
        new() { Value = 2, Text = "Mehmet Demir", Color = "#51a0ed" },
        new() { Value = 3, Text = "Zeynep Kaya", Color = "#56ca85" }
    };

    public static SchedulerResource Owners() => new() { Name = "Owners", Field = "ownerId", Title = "Sorumlu", Items = People() };

    public static SchedulerResource Rooms() => new()
    {
        Name = "Rooms", Field = "roomId", Title = "Toplantı Odası",
        Items = new()
        {
            new() { Value = 1, Text = "Oda 101 – Boğaziçi", Color = "#6eb3fa" },
            new() { Value = 2, Text = "Oda 201 – Kapadokya", Color = "#f58a8a" }
        }
    };

    public static SchedulerResource Attendees() => new() { Name = "Attendees", Field = "attendees", Title = "Katılımcılar", Multiple = true, Items = People() };

    public static SchedulerResource Teams() => new()
    {
        Name = "Teams", Field = "teamId", Title = "Ekip",
        Items = new()
        {
            new() { Value = 1, Text = "Güvenlik – A Vardiyası", Color = "#6366f1" },
            new() { Value = 2, Text = "Güvenlik – B Vardiyası", Color = "#0ea5e9" },
            new() { Value = 3, Text = "Teknik Bakım", Color = "#f59e0b" },
            new() { Value = 4, Text = "Acil Müdahale", Color = "#ef4444" }
        }
    };

    private static readonly string[] FirstNames = { "Ahmet", "Elif", "Burak", "Selin", "Can", "Deniz", "Emre", "Ece", "Hakan", "İrem", "Kerem", "Merve", "Onur", "Pelin", "Serkan", "Tuğba", "Umut", "Yasemin", "Volkan", "Gizem" };
    private static readonly string[] LastNames = { "Aksoy", "Çelik", "Doğan", "Erdem", "Güneş", "Koç", "Öztürk", "Şahin", "Tekin", "Yıldız", "Arslan", "Kurt" };
    private static readonly string[] Palette = { "#6366f1", "#0ea5e9", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899", "#14b8a6", "#84cc16", "#f97316" };

    public static SchedulerResource Technicians(int count = 120)
    {
        var items = new List<SchedulerResourceItem>();
        for (var i = 1; i <= count; i++)
            items.Add(new() { Value = i, Text = $"{FirstNames[(i * 7) % FirstNames.Length]} {LastNames[(i * 5) % LastNames.Length]} (#{i:000})", Color = Palette[i % Palette.Length] });
        return new SchedulerResource { Name = "Technicians", Field = "technicianId", Title = "Teknisyen", Items = items };
    }

    // ------------------------------------------------------------------ yardımcılar
    private static SchedulerEventModel Ev(string id, string title, DateTime start, int minutes, object? owner = null, string? desc = null, string? rule = null)
    {
        var e = new SchedulerEventModel { Id = id, Title = title, Description = desc, Start = start, End = start.AddMinutes(minutes), RecurrenceRule = rule };
        if (owner != null) e.Fields = new Dictionary<string, object?> { ["ownerId"] = owner };
        return e;
    }

    private static SchedulerEventModel AllDay(string id, string title, DateTime start, int days, object? owner = null, string? desc = null)
    {
        var e = new SchedulerEventModel { Id = id, Title = title, Description = desc, Start = start.Date, End = start.Date.AddDays(days - 1), IsAllDay = true };
        if (owner != null) e.Fields = new Dictionary<string, object?> { ["ownerId"] = owner };
        return e;
    }

    private static DateTime At(DateTime day, int hour, int minute = 0) => day.Date.AddHours(hour).AddMinutes(minute);

    private static DateTime FirstMondayOfMonth(DateTime d)
    {
        var first = new DateTime(d.Year, d.Month, 1);
        var off = ((int)DayOfWeek.Monday - (int)first.DayOfWeek + 7) % 7;
        return first.AddDays(off);
    }

    // ------------------------------------------------------------------ etkinlik setleri
    /// <summary>Genel ekip takvimi (sorumlu kaynağı: ownerId).</summary>
    public static List<SchedulerEventModel> Tasks()
    {
        var m = Monday;
        return new List<SchedulerEventModel>
        {
            Ev("t1", "Günlük Stand-up", At(m, 9, 30), 15, 1, "Ekip içi kısa durum toplantısı: dün ne yaptım, bugün ne yapacağım, engeller.", "FREQ=WEEKLY;BYDAY=MO,TU,WE,TH,FR"),
            Ev("t2", "Sprint Planlama", At(m, 10), 120, 2, "Sprint hedefleri, kapasite ve iş kalemlerinin önceliklendirilmesi."),
            Ev("t3", "Pazarlama Senkronizasyonu", At(m, 15), 60, 3, "Kampanya takvimi ve içerik planının gözden geçirilmesi."),
            Ev("t4", "Tasarım Atölyesi", At(m.AddDays(1), 9), 90, 1, "Yeni panel ekranları için kullanıcı akışı çalışması."),
            Ev("t5", "Kod İnceleme", At(m.AddDays(1), 11), 60, 2, "Açık çekme isteklerinin (pull request) ortak incelemesi.", "FREQ=WEEKLY;BYDAY=TU,TH"),
            Ev("t6", "Müşteri Sunumu – Atlas Lojistik", At(m.AddDays(1), 14), 90, 3, "Filo takip modülünün canlı demosu ve soru-cevap."),
            Ev("t7", "Teknik Mülakat", At(m.AddDays(2), 10), 60, 2, "Kıdemli ön yüz geliştirici adayı ile teknik görüşme."),
            Ev("t8", "Ekip Öğle Yemeği", At(m.AddDays(2), 12, 30), 60, 1, "Ofis yanındaki restoranda."),
            Ev("t9", "Birebir Görüşme", At(m.AddDays(2), 15), 30, 3, "Yönetici ile haftalık birebir.", "FREQ=WEEKLY;BYDAY=WE"),
            Ev("t10", "Ürün Yol Haritası", At(m.AddDays(3), 13), 120, 1, "Çeyrek hedefleri ve öncelikli özellikler."),
            AllDay("t11", "Yazılım Konferansı", m.AddDays(3), 2, 2, "İstanbul Kongre Merkezi – iki gün sürecek konferans."),
            Ev("t12", "Retrospektif", At(m.AddDays(4), 10), 60, 1, "İki haftada bir yapılan sprint değerlendirmesi.", "FREQ=WEEKLY;INTERVAL=2;BYDAY=FR"),
            Ev("t13", "Sürüm Yayını v2.4", At(m.AddDays(4), 16), 90, 3, "Üretim ortamına dağıtım ve izleme."),
            Ev("t14", "Altyapı Bakımı", At(m.AddDays(5), 22), 240, 2, "Veritabanı sunucusu yama ve yeniden başlatma (gece çalışması)."),
            Ev("t15", "Aylık Rapor Toplantısı", At(FirstMondayOfMonth(DateTime.Today), 14), 60, 1, "Her ayın ilk pazartesisi yönetime sunulan rapor.", "FREQ=MONTHLY;BYDAY=1MO"),
            AllDay("t16", "Destek Nöbeti", m, 5, 2, "Bu hafta müşteri destek nöbetçisi."),
            Ev("t17", "Bütçe Toplantısı", At(m.AddDays(-5), 10), 90, 2, "Gelecek çeyrek bütçe planlaması."),
            AllDay("t18", "Hackathon", m.AddDays(-3), 1, 3, "Şirket içi 24 saatlik geliştirme maratonu."),
            Ev("t19", "Yatırımcı Toplantısı", At(m.AddDays(7), 11), 90, 1, "Seri A yatırım görüşmesi."),
            Ev("t20", "Eğitim: Web Erişilebilirliği", At(m.AddDays(8), 9), 180, 3, "WCAG 2.2 ve ekran okuyucu testleri."),
            AllDay("t21", "Doğum Günü – Zeynep", m.AddDays(11), 1, 3, "Pasta saat 15:00'te mutfakta!"),
            Ev("t22", "Performans Değerlendirme", At(m.AddDays(9), 14), 60, 2, "Yarıyıl performans görüşmeleri."),
            Ev("t23", "Veri Ambarı Göçü", At(m.AddDays(-2), 13), 180, 1, "Eski raporlama veritabanının yeni ambara taşınması.")
        };
    }

    /// <summary>Toplantı odaları ve katılımcılar (roomId + attendees çoklu kaynak).</summary>
    public static List<SchedulerEventModel> Meetings()
    {
        var m = Monday;
        SchedulerEventModel M(string id, string title, DateTime start, int minutes, int room, int[] people, string? desc = null, string? rule = null)
            => new()
            {
                Id = id, Title = title, Description = desc, Start = start, End = start.AddMinutes(minutes), RecurrenceRule = rule,
                Fields = new Dictionary<string, object?> { ["roomId"] = room, ["attendees"] = people }
            };
        return new List<SchedulerEventModel>
        {
            M("m1", "Haftalık Yönetim Toplantısı", At(m, 9), 60, 1, new[] { 1, 2, 3 }, "Departman yöneticileriyle haftalık değerlendirme.", "FREQ=WEEKLY;BYDAY=MO"),
            M("m2", "Satış Hunisi Analizi", At(m, 11), 90, 2, new[] { 2 }, "Bölgesel satış verilerinin incelenmesi."),
            M("m3", "Mimari Tartışma", At(m, 14), 120, 1, new[] { 1, 3 }, "Mikroservis sınırlarının belirlenmesi."),
            M("m4", "İK – İşe Alım Planı", At(m.AddDays(1), 10), 60, 2, new[] { 3 }, "Q4 işe alım planı."),
            M("m5", "Tedarikçi Görüşmesi", At(m.AddDays(1), 13), 90, 1, new[] { 1, 2 }, "Donanım tedarikçisiyle sözleşme yenileme."),
            M("m6", "Ürün Demo Hazırlığı", At(m.AddDays(1), 15, 30), 60, 2, new[] { 1, 2, 3 }),
            M("m7", "Güvenlik Denetimi", At(m.AddDays(2), 9, 30), 150, 1, new[] { 2 }, "ISO 27001 iç denetim oturumu."),
            M("m8", "Kullanıcı Testi", At(m.AddDays(2), 13), 120, 2, new[] { 1, 3 }, "Beş katılımcı ile kullanılabilirlik testi."),
            M("m9", "Finans Kapanış", At(m.AddDays(3), 10), 60, 1, new[] { 2, 3 }),
            M("m10", "Eğitim Oturumu", At(m.AddDays(3), 14), 120, 2, new[] { 1 }, "Yeni çalışanlar için oryantasyon."),
            M("m11", "Müşteri Kabul Testi", At(m.AddDays(4), 9), 180, 1, new[] { 1, 2 }, "Kabul kriterlerinin müşteriyle birlikte doğrulanması."),
            M("m12", "Haftalık Kapanış", At(m.AddDays(4), 16), 45, 2, new[] { 1, 2, 3 }, "Haftanın özeti ve gelecek hafta planı.", "FREQ=WEEKLY;BYDAY=FR"),
            M("m13", "Strateji Günü", At(m.AddDays(7), 9), 480, 1, new[] { 1, 2, 3 }, "Tüm gün sürecek strateji çalıştayı."),
            M("m14", "Basın Görüşmesi", At(m.AddDays(8), 11), 60, 2, new[] { 3 })
        };
    }

    /// <summary>Gece vardiyaları (18:00 – 06:00) ve ekipler.</summary>
    public static List<SchedulerEventModel> NightShifts()
    {
        var m = Monday;
        var list = new List<SchedulerEventModel>();
        var n = 1;
        for (var d = 0; d < 7; d++)
        {
            var day = m.AddDays(d);
            list.Add(Shift(n++, "Devriye – Kuzey Blok", At(day, 18), 360, 1));
            list.Add(Shift(n++, "Devriye – Güney Blok", At(day, 0).AddDays(1), 360, 2));
            if (d % 2 == 0) list.Add(Shift(n++, "Jeneratör Kontrolü", At(day, 22), 120, 3));
            if (d % 3 == 1) list.Add(Shift(n++, "Klima Bakımı", At(day, 20), 180, 3));
            if (d == 2 || d == 5) list.Add(Shift(n++, "Acil Durum Tatbikatı", At(day, 23), 90, 4));
            list.Add(Shift(n++, "Kamera Odası", At(day, 19), 300, (d % 2) + 1));
        }
        return list;

        static SchedulerEventModel Shift(int id, string title, DateTime start, int minutes, int team) => new()
        {
            Id = "n" + id, Title = title, Start = start, End = start.AddMinutes(minutes),
            Fields = new Dictionary<string, object?> { ["teamId"] = team }
        };
    }

    /// <summary>Çok sayıda teknisyen için iş emirleri (sanal kaydırma demosu).</summary>
    public static List<SchedulerEventModel> WorkOrders(int technicians = 120)
    {
        var rnd = new Random(42);
        var m = Monday;
        string[] jobs = { "Kombi Bakımı", "Fiber Kurulum", "Asansör Kontrolü", "Klima Montajı", "Elektrik Arızası", "Su Kaçağı", "Kamera Kurulumu", "Yangın Paneli Testi", "Sunucu Odası Bakımı", "Jeneratör Servisi" };
        var list = new List<SchedulerEventModel>();
        var id = 1;
        for (var t = 1; t <= technicians; t++)
        {
            var count = rnd.Next(2, 6);
            for (var i = 0; i < count; i++)
            {
                var start = At(m.AddDays(rnd.Next(0, 5)), rnd.Next(8, 16), rnd.Next(0, 2) * 30);
                list.Add(new SchedulerEventModel
                {
                    Id = "w" + id++, Title = jobs[rnd.Next(jobs.Length)], Start = start, End = start.AddMinutes(rnd.Next(2, 7) * 30),
                    Fields = new Dictionary<string, object?> { ["technicianId"] = t }
                });
            }
        }
        return list;
    }

    /// <summary>Yıl görünümü için resmi tatiller ve yıl geneline yayılmış etkinlikler.</summary>
    public static List<SchedulerEventModel> YearEvents()
    {
        var y = DateTime.Today.Year;
        var list = new List<SchedulerEventModel>
        {
            AllDay("y1", "Yılbaşı", new DateTime(y, 1, 1), 1),
            AllDay("y2", "Ulusal Egemenlik ve Çocuk Bayramı", new DateTime(y, 4, 23), 1),
            AllDay("y3", "Emek ve Dayanışma Günü", new DateTime(y, 5, 1), 1),
            AllDay("y4", "Atatürk'ü Anma, Gençlik ve Spor Bayramı", new DateTime(y, 5, 19), 1),
            AllDay("y5", "Demokrasi ve Milli Birlik Günü", new DateTime(y, 7, 15), 1),
            AllDay("y6", "Zafer Bayramı", new DateTime(y, 8, 30), 1),
            AllDay("y7", "Cumhuriyet Bayramı", new DateTime(y, 10, 29), 1),
            AllDay("y8", "Yaz Tatili (Ofis Kapalı)", new DateTime(y, 8, 4), 5),
            AllDay("y9", "Yıl Sonu Kapanışı", new DateTime(y, 12, 29), 3)
        };
        var rnd = new Random(7);
        string[] titles = { "Çeyrek Değerlendirme", "Müşteri Ziyareti", "Fuar Katılımı", "Eğitim Programı", "Denetim", "Ürün Lansmanı", "Ekip Etkinliği", "Bütçe Revizyonu" };
        for (var i = 0; i < 70; i++)
        {
            var day = new DateTime(y, 1, 1).AddDays(rnd.Next(0, 364));
            list.Add(Ev("yr" + i, titles[rnd.Next(titles.Length)], At(day, rnd.Next(9, 16)), 60 * rnd.Next(1, 4), rnd.Next(1, 4)));
        }
        list.Add(Ev("yq", "Çeyrek Kapanış Raporu", At(new DateTime(y, 3, 31), 15), 60, 1, "Her çeyreğin son günü.", "FREQ=MONTHLY;INTERVAL=3;BYMONTHDAY=-1"));
        return list;
    }

    /// <summary>"+N daha" ve uyarlanabilir yükseklik demoları için yoğun ay verisi.</summary>
    public static List<SchedulerEventModel> BusyMonth()
    {
        var first = new DateTime(DateTime.Today.Year, DateTime.Today.Month, 1);
        var rnd = new Random(11);
        string[] titles = { "Toplantı", "Görüşme", "Sunum", "Eğitim", "Ziyaret", "Değerlendirme", "Atölye", "Rapor", "Demo", "Planlama" };
        var list = new List<SchedulerEventModel>();
        var id = 1;
        var dim = DateTime.DaysInMonth(first.Year, first.Month);
        for (var d = 0; d < dim; d++)
        {
            var day = first.AddDays(d);
            var count = day.DayOfWeek is DayOfWeek.Saturday or DayOfWeek.Sunday ? rnd.Next(0, 2) : rnd.Next(1, 7);
            if (d % 9 == 4) count = 9;
            for (var i = 0; i < count; i++)
                list.Add(Ev("b" + id++, $"{titles[rnd.Next(titles.Length)]} {i + 1}", At(day, 8 + i), 45 + rnd.Next(0, 3) * 15, rnd.Next(1, 4)));
        }
        list.Add(AllDay("b-ad1", "Proje Teslim Haftası", first.AddDays(10), 4, 2));
        return list;
    }

    /// <summary>Şu an devam eden, yaklaşan ve geçmiş etkinlikler.</summary>
    public static List<SchedulerEventModel> Ongoing()
    {
        var now = DateTime.Now;
        var r = new DateTime(now.Year, now.Month, now.Day, now.Hour, now.Minute / 15 * 15, 0);
        return new List<SchedulerEventModel>
        {
            Ev("o1", "Canlı Yayın – Ürün Lansmanı", r.AddMinutes(-45), 120, 1, "Şu anda devam ediyor."),
            Ev("o2", "Destek Hattı Nöbeti", r.AddMinutes(-15), 45, 2, "Şu anda devam ediyor."),
            Ev("o3", "Sunucu Bakımı", r.AddMinutes(-150), 60, 3, "Tamamlandı."),
            Ev("o4", "Müşteri Araması", r.AddMinutes(60), 30, 1, "Yaklaşan etkinlik."),
            Ev("o5", "Kod İnceleme", r.AddMinutes(150), 60, 2, "Yaklaşan etkinlik."),
            Ev("o6", "Sabah Brifingi", r.Date.AddHours(8), 30, 3, "Her gün tekrar eder.", "FREQ=DAILY")
        };
    }

    /// <summary>UTC olarak saklanan etkinlikler (saat dilimi demosu).</summary>
    public static List<SchedulerEventModel> UtcTasks()
    {
        var list = Tasks().Where(e => !e.IsAllDay).Take(14).ToList();
        foreach (var e in list)
        {
            e.Start = DateTime.SpecifyKind(e.Start.AddHours(-3), DateTimeKind.Utc);
            e.End = DateTime.SpecifyKind(e.End.AddHours(-3), DateTimeKind.Utc);
        }
        return list;
    }
}
