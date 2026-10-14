using System;
using System.Collections.Generic;
using System.Text.Json.Serialization;

namespace Panoptes.AspNetCore.Models;

/// <summary>Takvim görünüm türleri.</summary>
public enum SchedulerViewType
{
    Day,
    Week,
    WorkWeek,
    Month,
    Year,
    Agenda,
    TimelineDay,
    TimelineWeek,
    TimelineWorkWeek,
    TimelineMonth
}

/// <summary>Takvim etkinliği. Kaynak alanları (ör. RoomId, Attendees) <see cref="Fields"/> sözlüğüyle eklenir.</summary>
public class SchedulerEventModel
{
    public string? Id { get; set; }
    public string? Title { get; set; }
    public string? Description { get; set; }
    public DateTime Start { get; set; }
    public DateTime End { get; set; }
    public bool IsAllDay { get; set; }
    /// <summary>RFC 5545 RRULE (ör. "FREQ=WEEKLY;BYDAY=MO,WE").</summary>
    public string? RecurrenceRule { get; set; }
    /// <summary>Seriden hariç tutulan tekrar başlangıçları (";" ile ayrılmış ISO tarihleri).</summary>
    public string? RecurrenceException { get; set; }
    /// <summary>Bu kayıt bir serinin değiştirilmiş tekrarıysa ana etkinliğin kimliği.</summary>
    public string? RecurrenceId { get; set; }
    public string? StartTimezone { get; set; }
    public string? EndTimezone { get; set; }
    public bool IsReadonly { get; set; }
    public string? Category { get; set; }
    /// <summary>Etkinlik rengi (#hex). Kaynak rengini geçersiz kılar.</summary>
    public string? Color { get; set; }
    /// <summary>Etkinlik çipine uygulanacak CSS sınıfları (Color tanımlı değilse kullanılır).</summary>
    public string? ColorClass { get; set; }
    public string? Location { get; set; }
    public string? Organizer { get; set; }
    public string? Image { get; set; }

    /// <summary>Ek alanlar (kaynak değerleri ve şablonlarda kullanılacak özel veriler). JSON'da düz alan olarak yazılır.</summary>
    [JsonExtensionData]
    public Dictionary<string, object?>? Fields { get; set; }
}

/// <summary>Takvim kaynağı (oda, katılımcı, ekip vb.).</summary>
public class SchedulerResource
{
    /// <summary>Gruplamada kullanılan ad.</summary>
    public string? Name { get; set; }
    /// <summary>Etkinlikte kaynak değerini taşıyan alan adı (ör. "roomId").</summary>
    public string Field { get; set; } = string.Empty;
    public string? Title { get; set; }
    /// <summary>Etkinlik birden fazla kaynak değeri alabilir mi (ör. katılımcılar).</summary>
    public bool Multiple { get; set; }
    public List<SchedulerResourceItem> Items { get; set; } = new();
}

public class SchedulerResourceItem
{
    public object? Value { get; set; }
    public string? Text { get; set; }
    public string? Color { get; set; }
}

public class SchedulerContext
{
    public string? Id { get; set; }
    public DateTime CurrentDate { get; set; } = DateTime.Today;
    public SchedulerViewType DefaultView { get; set; } = SchedulerViewType.Week;
    public List<SchedulerEventModel> Events { get; set; } = new();
    public List<SchedulerResource> Resources { get; set; } = new();
}
