using System;
using System.Collections.Generic;
using System.Globalization;
using System.Linq;
using System.Text.Json;
using System.Text.Json.Serialization;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Razor.TagHelpers;
using Panoptes.AspNetCore.Models;

namespace Panoptes.AspNetCore.TagHelpers;

/// <summary>
/// Gün, hafta, iş haftası, ay, yıl, ajanda ve zaman çizelgesi görünümlerine sahip tam özellikli takvim (scheduler).
/// Kaynak gruplama, yinelenen etkinlikler, sürükle-bırak, düzenleyici, saat dilimi, yerelleştirme, PDF ve iCal desteği sunar.
/// Yapılandırma, istemci tarafındaki panoptes-scheduler.js tarafından okunan bir JSON bloğu olarak yazılır.
/// </summary>
[HtmlTargetElement("panoptes-scheduler")]
public class SchedulerTagHelper : TagHelper
{
    internal static readonly JsonSerializerOptions JsonOptions = CreateJsonOptions();

    private static JsonSerializerOptions CreateJsonOptions()
    {
        var o = new JsonSerializerOptions
        {
            PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
            DictionaryKeyPolicy = null,
            DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull
        };
        o.Converters.Add(new SchedulerDateTimeConverter());
        o.Converters.Add(new JsonStringEnumConverter(JsonNamingPolicy.CamelCase));
        return o;
    }

    [HtmlAttributeName("id")] public string? Id { get; set; }
    [HtmlAttributeName("class")] public string? CssClass { get; set; }
    /// <summary>Yükseklik (piksel sayısı veya CSS değeri, ör. "70vh"). "auto" verilirse sabitlenmez.</summary>
    [HtmlAttributeName("height")] public string? Height { get; set; }

    // ---- Görünüm & tarih
    [HtmlAttributeName("default-view")] public SchedulerViewType? DefaultView { get; set; }
    /// <summary>Virgülle ayrılmış görünümler (ör. "day,week,month,agenda,timelineWeek").</summary>
    [HtmlAttributeName("views")] public string? Views { get; set; }
    [HtmlAttributeName("default-date")] public DateTime? DefaultDate { get; set; }
    [HtmlAttributeName("start-time")] public string? StartTime { get; set; }
    [HtmlAttributeName("end-time")] public string? EndTime { get; set; }
    [HtmlAttributeName("work-day-start")] public string? WorkDayStart { get; set; }
    [HtmlAttributeName("work-day-end")] public string? WorkDayEnd { get; set; }
    /// <summary>Çalışma günleri (0=Pazar … 6=Cumartesi), ör. "1,2,3,4,5".</summary>
    [HtmlAttributeName("work-days")] public string? WorkDays { get; set; }
    [HtmlAttributeName("show-work-hours")] public bool? ShowWorkHours { get; set; }
    [HtmlAttributeName("scroll-time")] public string? ScrollTime { get; set; }
    [HtmlAttributeName("major-tick")] public int? MajorTick { get; set; }
    [HtmlAttributeName("minor-tick-count")] public int? MinorTickCount { get; set; }
    [HtmlAttributeName("slot-height")] public int? SlotHeight { get; set; }
    [HtmlAttributeName("all-day-slot")] public bool? AllDaySlot { get; set; }
    [HtmlAttributeName("agenda-days")] public int? AgendaDays { get; set; }
    [HtmlAttributeName("first-day")] public int? FirstDay { get; set; }

    // ---- Yerelleştirme
    [HtmlAttributeName("culture")] public string? Culture { get; set; }
    /// <summary>IANA saat dilimi (ör. "Europe/Istanbul", "Etc/UTC").</summary>
    [HtmlAttributeName("timezone")] public string? Timezone { get; set; }
    [HtmlAttributeName("rtl")] public bool? Rtl { get; set; }
    /// <summary>Mesaj geçersiz kılmaları için global değişken/fonksiyon adı veya JSON.</summary>
    [HtmlAttributeName("messages")] public string? Messages { get; set; }

    // ---- Düzenleme
    [HtmlAttributeName("editable")] public bool? Editable { get; set; }
    [HtmlAttributeName("editable-create")] public bool? EditableCreate { get; set; }
    [HtmlAttributeName("editable-update")] public bool? EditableUpdate { get; set; }
    [HtmlAttributeName("editable-destroy")] public bool? EditableDestroy { get; set; }
    [HtmlAttributeName("editable-move")] public bool? EditableMove { get; set; }
    [HtmlAttributeName("editable-resize")] public bool? EditableResize { get; set; }
    [HtmlAttributeName("editable-timezone")] public bool? EditableTimezone { get; set; }
    /// <summary>"dialog" (varsayılan), "occurrence" veya "series".</summary>
    [HtmlAttributeName("edit-recurring-mode")] public string? EditRecurringMode { get; set; }
    /// <summary>Silme onay metni; "false" verilirse onay sorulmaz.</summary>
    [HtmlAttributeName("delete-confirmation")] public string? DeleteConfirmation { get; set; }
    /// <summary>Özel düzenleyici şablonu ("#templateId" veya global fonksiyon adı).</summary>
    [HtmlAttributeName("editor-template")] public string? EditorTemplate { get; set; }
    [HtmlAttributeName("editor-title")] public string? EditorTitle { get; set; }
    [HtmlAttributeName("editor-width")] public string? EditorWidth { get; set; }
    /// <summary>"true" (tekli) veya "multiple".</summary>
    [HtmlAttributeName("selectable")] public string? Selectable { get; set; }

    // ---- Şablonlar & görünüm seçenekleri
    [HtmlAttributeName("event-template")] public string? EventTemplate { get; set; }
    [HtmlAttributeName("all-day-event-template")] public string? AllDayEventTemplate { get; set; }
    [HtmlAttributeName("date-header-template")] public string? DateHeaderTemplate { get; set; }
    [HtmlAttributeName("group-header-template")] public string? GroupHeaderTemplate { get; set; }
    [HtmlAttributeName("major-time-header-template")] public string? MajorTimeHeaderTemplate { get; set; }
    /// <summary>Araç çubuğu öğeleri: today, nav, previous, next, title, spacer, search, views, refresh, pdf, ical, icalExport veya global fonksiyon adı.</summary>
    [HtmlAttributeName("toolbar")] public string? Toolbar { get; set; }
    [HtmlAttributeName("search")] public bool? Search { get; set; }
    [HtmlAttributeName("footer")] public bool? Footer { get; set; }
    [HtmlAttributeName("auto-event-height")] public bool? AutoEventHeight { get; set; }
    [HtmlAttributeName("adaptive-slot-height")] public bool? AdaptiveSlotHeight { get; set; }
    [HtmlAttributeName("current-time-marker")] public bool? CurrentTimeMarker { get; set; }
    [HtmlAttributeName("ongoing-events")] public bool? OngoingEvents { get; set; }
    [HtmlAttributeName("ongoing-events-interval")] public int? OngoingEventsInterval { get; set; }
    [HtmlAttributeName("ongoing-events-class")] public string? OngoingEventsClass { get; set; }
    [HtmlAttributeName("more-events-popover")] public bool? MoreEventsPopover { get; set; }
    [HtmlAttributeName("virtual")] public bool? Virtual { get; set; }
    [HtmlAttributeName("column-width")] public int? ColumnWidth { get; set; }
    [HtmlAttributeName("timeline-column-width")] public int? TimelineColumnWidth { get; set; }
    [HtmlAttributeName("month-column-width")] public int? MonthColumnWidth { get; set; }
    [HtmlAttributeName("resource-column-width")] public int? ResourceColumnWidth { get; set; }
    [HtmlAttributeName("event-height")] public int? EventHeight { get; set; }
    [HtmlAttributeName("timeline-event-height")] public int? TimelineEventHeight { get; set; }
    [HtmlAttributeName("row-height")] public int? RowHeight { get; set; }
    /// <summary>"auto" (varsayılan; dar alanda kompakt), "true"/"phone" veya "false".</summary>
    [HtmlAttributeName("mobile")] public string? Mobile { get; set; }
    [HtmlAttributeName("pdf-file-name")] public string? PdfFileName { get; set; }

    // ---- Veri
    [HtmlAttributeName("events")] public IEnumerable<SchedulerEventModel>? Events { get; set; }
    [HtmlAttributeName("read-url")] public string? ReadUrl { get; set; }
    [HtmlAttributeName("create-url")] public string? CreateUrl { get; set; }
    /// <summary>Güncelleme adresi; "{id}" yer tutucusu desteklenir.</summary>
    [HtmlAttributeName("update-url")] public string? UpdateUrl { get; set; }
    [HtmlAttributeName("destroy-url")] public string? DestroyUrl { get; set; }
    [HtmlAttributeName("read-function")] public string? ReadFunction { get; set; }
    [HtmlAttributeName("create-function")] public string? CreateFunction { get; set; }
    [HtmlAttributeName("update-function")] public string? UpdateFunction { get; set; }
    [HtmlAttributeName("destroy-function")] public string? DestroyFunction { get; set; }
    [HtmlAttributeName("server-filtering")] public bool? ServerFiltering { get; set; }
    /// <summary>Server-Sent Events (EventSource) akış adresi; diğer istemcilerdeki değişiklikler canlı yansıtılır.</summary>
    [HtmlAttributeName("realtime-url")] public string? RealtimeUrl { get; set; }

    // ---- Kaynaklar & gruplama
    [HtmlAttributeName("resources")] public IEnumerable<SchedulerResource>? Resources { get; set; }
    /// <summary>Gruplanacak kaynak adları (virgülle; hiyerarşik gruplama için birden fazla).</summary>
    [HtmlAttributeName("group-resources")] public string? GroupResources { get; set; }
    /// <summary>"horizontal" veya "vertical".</summary>
    [HtmlAttributeName("group-orientation")] public string? GroupOrientation { get; set; }
    [HtmlAttributeName("group-by-date")] public bool? GroupByDate { get; set; }

    /// <summary>Olay işleyicileri: on-event-click, on-add, on-edit, on-save, on-remove, on-move-end, on-navigate ... (global fonksiyon adları).</summary>
    [HtmlAttributeName(DictionaryAttributePrefix = "on-")]
    public IDictionary<string, string> Handlers { get; set; } = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase);

    public override async Task ProcessAsync(TagHelperContext context, TagHelperOutput output)
    {
        var id = !string.IsNullOrWhiteSpace(Id) ? Id! : $"panoptes_sched_{Guid.NewGuid():N}";
        var ctx = new SchedulerContext
        {
            Id = id,
            CurrentDate = DefaultDate ?? DateTime.Today,
            DefaultView = DefaultView ?? SchedulerViewType.Week,
            Events = Events?.ToList() ?? new List<SchedulerEventModel>(),
            Resources = Resources?.ToList() ?? new List<SchedulerResource>()
        };
        context.Items[typeof(SchedulerContext)] = ctx;
        await output.GetChildContentAsync();

        var cfg = BuildConfig(ctx);
        var json = JsonSerializer.Serialize(cfg, JsonOptions);

        output.TagName = "div";
        output.TagMode = TagMode.StartTagAndEndTag;
        output.Attributes.SetAttribute("id", id);
        output.Attributes.SetAttribute("class", $"panoptes-scheduler {CssClass}".Trim());
        output.Attributes.SetAttribute("data-panoptes-scheduler", "true");
        output.Content.SetHtmlContent($"<script type=\"application/json\" class=\"panoptes-scheduler-config\">{json}</script>");
    }

    private Dictionary<string, object?> BuildConfig(SchedulerContext ctx)
    {
        var c = new Dictionary<string, object?>();
        void Set(string key, object? value) { if (value != null && !(value is string s && s.Length == 0)) c[key] = value; }

        Set("view", DefaultView.HasValue ? JsonNamingPolicy.CamelCase.ConvertName(DefaultView.Value.ToString()) : null);
        Set("views", string.IsNullOrWhiteSpace(Views) ? null : Views!.Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries));
        Set("date", DefaultDate?.ToString("yyyy-MM-dd", CultureInfo.InvariantCulture));
        if (!string.IsNullOrWhiteSpace(Height)) c["height"] = int.TryParse(Height, out var h) ? h : Height;
        Set("startTime", StartTime); Set("endTime", EndTime);
        Set("workDayStart", WorkDayStart); Set("workDayEnd", WorkDayEnd);
        Set("workDays", string.IsNullOrWhiteSpace(WorkDays) ? null : WorkDays!.Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries).Select(int.Parse).ToArray());
        Set("showWorkHours", ShowWorkHours); Set("scrollTime", ScrollTime);
        Set("majorTick", MajorTick); Set("minorTickCount", MinorTickCount); Set("slotHeight", SlotHeight);
        Set("allDaySlot", AllDaySlot); Set("agendaDays", AgendaDays); Set("firstDay", FirstDay);
        Set("culture", Culture); Set("timezone", Timezone); Set("rtl", Rtl);
        if (!string.IsNullOrWhiteSpace(Messages))
        {
            var m = Messages!.Trim();
            if (m.StartsWith('{')) c["messages"] = JsonSerializer.Deserialize<JsonElement>(m);
            else c["messages"] = m;
        }

        if (Editable == false) c["editable"] = false;
        else
        {
            var e = new Dictionary<string, object?>();
            if (EditableCreate.HasValue) e["create"] = EditableCreate;
            if (EditableUpdate.HasValue) e["update"] = EditableUpdate;
            if (EditableDestroy.HasValue) e["destroy"] = EditableDestroy;
            if (EditableMove.HasValue) e["move"] = EditableMove;
            if (EditableResize.HasValue) e["resize"] = EditableResize;
            if (EditableTimezone.HasValue) e["timezone"] = EditableTimezone;
            if (!string.IsNullOrWhiteSpace(EditRecurringMode)) e["editRecurringMode"] = EditRecurringMode;
            if (!string.IsNullOrWhiteSpace(DeleteConfirmation)) e["confirmation"] = DeleteConfirmation!.Equals("false", StringComparison.OrdinalIgnoreCase) ? false : DeleteConfirmation;
            if (!string.IsNullOrWhiteSpace(EditorTemplate)) e["template"] = EditorTemplate;
            if (!string.IsNullOrWhiteSpace(EditorTitle) || !string.IsNullOrWhiteSpace(EditorWidth))
                e["window"] = new Dictionary<string, object?> { ["title"] = EditorTitle, ["width"] = int.TryParse(EditorWidth, out var w) ? w : EditorWidth };
            if (e.Count > 0) c["editable"] = e;
        }
        if (!string.IsNullOrWhiteSpace(Selectable))
            c["selectable"] = Selectable!.Equals("multiple", StringComparison.OrdinalIgnoreCase) ? "multiple" : !Selectable.Equals("false", StringComparison.OrdinalIgnoreCase);

        Set("eventTemplate", EventTemplate); Set("allDayEventTemplate", AllDayEventTemplate);
        Set("dateHeaderTemplate", DateHeaderTemplate); Set("groupHeaderTemplate", GroupHeaderTemplate);
        Set("majorTimeHeaderTemplate", MajorTimeHeaderTemplate);
        Set("toolbar", string.IsNullOrWhiteSpace(Toolbar) ? null : Toolbar!.Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries));
        Set("search", Search); Set("footer", Footer);
        Set("autoEventHeight", AutoEventHeight); Set("adaptiveSlotHeight", AdaptiveSlotHeight);
        Set("currentTimeMarker", CurrentTimeMarker); Set("moreEventsPopover", MoreEventsPopover);
        if (OngoingEvents == true)
            c["ongoingEvents"] = OngoingEventsInterval.HasValue || !string.IsNullOrWhiteSpace(OngoingEventsClass)
                ? new Dictionary<string, object?> { ["updateInterval"] = OngoingEventsInterval, ["cssClass"] = OngoingEventsClass }
                : true;
        Set("virtual", Virtual);
        Set("columnWidth", ColumnWidth); Set("timelineColumnWidth", TimelineColumnWidth); Set("monthColumnWidth", MonthColumnWidth);
        Set("resourceColumnWidth", ResourceColumnWidth); Set("eventHeight", EventHeight); Set("timelineEventHeight", TimelineEventHeight);
        Set("rowHeight", RowHeight);
        if (!string.IsNullOrWhiteSpace(Mobile))
            c["mobile"] = Mobile!.ToLowerInvariant() switch { "true" => true, "false" => false, var x => x };
        if (!string.IsNullOrWhiteSpace(PdfFileName)) c["pdf"] = new Dictionary<string, object?> { ["fileName"] = PdfFileName };

        var transport = new Dictionary<string, object?>();
        void T(string key, string? url, string? fn) { var v = !string.IsNullOrWhiteSpace(fn) ? fn : url; if (!string.IsNullOrWhiteSpace(v)) transport[key] = v; }
        T("read", ReadUrl, ReadFunction); T("create", CreateUrl, CreateFunction);
        T("update", UpdateUrl, UpdateFunction); T("destroy", DestroyUrl, DestroyFunction);
        var ds = new Dictionary<string, object?>();
        if (transport.Count > 0) ds["transport"] = transport;
        if (ServerFiltering == true) ds["serverFiltering"] = true;
        if (!string.IsNullOrWhiteSpace(RealtimeUrl)) ds["realtime"] = RealtimeUrl;
        if (ds.Count > 0) c["dataSource"] = ds;
        if (ctx.Events.Count > 0 || !transport.ContainsKey("read")) c["events"] = ctx.Events;

        if (ctx.Resources.Count > 0) c["resources"] = ctx.Resources;
        if (!string.IsNullOrWhiteSpace(GroupResources))
        {
            c["group"] = new Dictionary<string, object?>
            {
                ["resources"] = GroupResources!.Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries),
                ["orientation"] = string.IsNullOrWhiteSpace(GroupOrientation) ? "horizontal" : GroupOrientation!.ToLowerInvariant(),
                ["date"] = GroupByDate == true
            };
        }

        if (Handlers.Count > 0)
        {
            var handlers = new Dictionary<string, object?>();
            foreach (var kv in Handlers)
            {
                if (string.IsNullOrWhiteSpace(kv.Value)) continue;
                var parts = kv.Key.Split('-', StringSplitOptions.RemoveEmptyEntries);
                var name = string.Concat(parts.Select((p, i) => i == 0 ? p.ToLowerInvariant() : char.ToUpperInvariant(p[0]) + p[1..].ToLowerInvariant()));
                handlers[name] = kv.Value;
            }
            if (handlers.Count > 0) c["handlers"] = handlers;
        }
        return c;
    }
}

/// <summary>Takvime deklaratif kaynak tanımı. İçine &lt;panoptes-scheduler-resource-item&gt; eklenebilir.</summary>
[HtmlTargetElement("panoptes-scheduler-resource", ParentTag = "panoptes-scheduler")]
public class SchedulerResourceTagHelper : TagHelper
{
    [HtmlAttributeName("name")] public string? Name { get; set; }
    [HtmlAttributeName("field")] public string Field { get; set; } = string.Empty;
    [HtmlAttributeName("title")] public string? Title { get; set; }
    [HtmlAttributeName("multiple")] public bool Multiple { get; set; }
    [HtmlAttributeName("items")] public IEnumerable<SchedulerResourceItem>? Items { get; set; }

    public override async Task ProcessAsync(TagHelperContext context, TagHelperOutput output)
    {
        if (!context.Items.TryGetValue(typeof(SchedulerContext), out var obj) || obj is not SchedulerContext ctx)
        {
            output.SuppressOutput();
            return;
        }
        var res = new SchedulerResource
        {
            Name = string.IsNullOrWhiteSpace(Name) ? Field : Name,
            Field = Field,
            Title = Title ?? Name ?? Field,
            Multiple = Multiple,
            Items = Items?.ToList() ?? new List<SchedulerResourceItem>()
        };
        context.Items[typeof(SchedulerResource)] = res;
        await output.GetChildContentAsync();
        context.Items.Remove(typeof(SchedulerResource));
        ctx.Resources.Add(res);
        output.SuppressOutput();
    }
}

[HtmlTargetElement("panoptes-scheduler-resource-item", ParentTag = "panoptes-scheduler-resource", TagStructure = TagStructure.WithoutEndTag)]
public class SchedulerResourceItemTagHelper : TagHelper
{
    [HtmlAttributeName("value")] public string? Value { get; set; }
    [HtmlAttributeName("text")] public string? Text { get; set; }
    [HtmlAttributeName("color")] public string? Color { get; set; }

    public override void Process(TagHelperContext context, TagHelperOutput output)
    {
        if (context.Items.TryGetValue(typeof(SchedulerResource), out var obj) && obj is SchedulerResource res)
        {
            object? value = int.TryParse(Value, NumberStyles.Integer, CultureInfo.InvariantCulture, out var n) ? n : Value;
            res.Items.Add(new SchedulerResourceItem { Value = value, Text = Text ?? Value, Color = Color });
        }
        output.SuppressOutput();
    }
}

/// <summary>Takvime deklaratif olarak eklenen etkinlik. Ek alanlar "field-" önekiyle verilir (ör. field-room-id="1").</summary>
[HtmlTargetElement("panoptes-scheduler-event", ParentTag = "panoptes-scheduler")]
public class SchedulerEventTagHelper : TagHelper
{
    [HtmlAttributeName("id")] public string? Id { get; set; }
    [HtmlAttributeName("title")] public string? Title { get; set; }
    [HtmlAttributeName("description")] public string? Description { get; set; }
    [HtmlAttributeName("start")] public DateTime Start { get; set; }
    [HtmlAttributeName("end")] public DateTime End { get; set; }
    [HtmlAttributeName("is-all-day")] public bool IsAllDay { get; set; }
    [HtmlAttributeName("recurrence-rule")] public string? RecurrenceRule { get; set; }
    [HtmlAttributeName("recurrence-exception")] public string? RecurrenceException { get; set; }
    [HtmlAttributeName("is-readonly")] public bool IsReadonly { get; set; }
    [HtmlAttributeName("category")] public string? Category { get; set; }
    [HtmlAttributeName("color")] public string? Color { get; set; }
    [HtmlAttributeName("color-class")] public string? ColorClass { get; set; }
    [HtmlAttributeName("location")] public string? Location { get; set; }
    [HtmlAttributeName("organizer")] public string? Organizer { get; set; }

    [HtmlAttributeName(DictionaryAttributePrefix = "field-")]
    public IDictionary<string, string> Fields { get; set; } = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase);

    public override void Process(TagHelperContext context, TagHelperOutput output)
    {
        if (!context.Items.TryGetValue(typeof(SchedulerContext), out var obj) || obj is not SchedulerContext ctx)
        {
            output.SuppressOutput();
            return;
        }
        Dictionary<string, object?>? fields = null;
        if (Fields.Count > 0)
        {
            fields = new Dictionary<string, object?>();
            foreach (var kv in Fields)
            {
                var parts = kv.Key.Split('-', StringSplitOptions.RemoveEmptyEntries);
                var name = string.Concat(parts.Select((p, i) => i == 0 ? p.ToLowerInvariant() : char.ToUpperInvariant(p[0]) + p[1..].ToLowerInvariant()));
                fields[name] = int.TryParse(kv.Value, NumberStyles.Integer, CultureInfo.InvariantCulture, out var n) ? n : kv.Value;
            }
        }
        ctx.Events.Add(new SchedulerEventModel
        {
            Id = Id,
            Title = Title,
            Description = Description,
            Start = Start,
            End = End,
            IsAllDay = IsAllDay,
            RecurrenceRule = RecurrenceRule,
            RecurrenceException = RecurrenceException,
            IsReadonly = IsReadonly,
            Category = Category,
            Color = Color,
            ColorClass = ColorClass,
            Location = Location,
            Organizer = Organizer,
            Fields = fields
        });
        output.SuppressOutput();
    }
}

/// <summary>Tarihleri ofsetsiz duvar saati olarak yazar (UTC türündekiler "Z" ile).</summary>
public sealed class SchedulerDateTimeConverter : JsonConverter<DateTime>
{
    public override DateTime Read(ref Utf8JsonReader reader, Type typeToConvert, JsonSerializerOptions options)
    {
        var s = reader.GetString();
        if (string.IsNullOrEmpty(s)) return default;
        if (DateTimeOffset.TryParse(s, CultureInfo.InvariantCulture, DateTimeStyles.AssumeLocal, out var dto) && (s.EndsWith("Z", StringComparison.OrdinalIgnoreCase) || s.Length > 19 && (s[^6] == '+' || s[^6] == '-')))
            return dto.UtcDateTime;
        return DateTime.Parse(s, CultureInfo.InvariantCulture, DateTimeStyles.None);
    }

    public override void Write(Utf8JsonWriter writer, DateTime value, JsonSerializerOptions options)
    {
        writer.WriteStringValue(value.Kind == DateTimeKind.Utc
            ? value.ToString("yyyy-MM-dd'T'HH:mm:ss'Z'", CultureInfo.InvariantCulture)
            : value.ToString("yyyy-MM-dd'T'HH:mm:ss", CultureInfo.InvariantCulture));
    }
}
