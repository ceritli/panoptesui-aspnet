using System;
using System.Collections.Generic;
using Microsoft.AspNetCore.Mvc;
using Panoptes.AspNetCore.Models;

namespace Panoptes.AspNetCore.Demo.Controllers;

public class SchedulerController : Controller
{
    private List<SchedulerEventModel> GetSampleEvents()
    {
        var today = DateTime.Today;
        var dayOfWeek = (int)today.DayOfWeek;
        var diff = dayOfWeek == 0 ? -6 : 1 - dayOfWeek;
        var monday = today.AddDays(diff);

        return new List<SchedulerEventModel>
        {
            new SchedulerEventModel
            {
                Id = "ev_1",
                Title = "Haftalık Mimari & Sprint Planlama",
                Description = "Tüm frontend ve backend ekiplerinin katılımıyla sprint hedefleri belirlenecek.",
                Start = monday.AddHours(9).AddMinutes(30),
                End = monday.AddHours(11),
                Category = "TOPLANTI",
                ColorClass = "bg-blue-100 text-blue-800 border-blue-200",
                Location = "Ana Toplantı Salonu A",
                Organizer = "Fatih Ceritli",
                Fields = new Dictionary<string, object?> { { "RoomId", 1 }, { "Attendees", new[] { 1, 2 } } }
            },
            new SchedulerEventModel
            {
                Id = "ev_2",
                Title = "Dr. Ahmet Yılmaz - Rutin Kontrol",
                Description = "Kardiyoloji kontrol muayenesi ve EKG sonuç incelemesi.",
                Start = monday.AddDays(1).AddHours(14),
                End = monday.AddDays(1).AddHours(15),
                Category = "KLİNİK",
                ColorClass = "bg-emerald-100 text-emerald-800 border-emerald-200",
                Location = "Oda 204",
                Organizer = "Ahmet Yılmaz",
                Fields = new Dictionary<string, object?> { { "RoomId", 2 }, { "Attendees", new[] { 1, 3 } } }
            },
            new SchedulerEventModel
            {
                Id = "ev_3",
                Title = "Güvenlik Rapor Değerlendirmesi",
                Description = "Üçüncü taraf siber güvenlik denetim bulgularının analizi.",
                Start = monday.AddDays(2).AddHours(11),
                End = monday.AddDays(2).AddHours(12).AddMinutes(30),
                Category = "GÜVENLİK",
                ColorClass = "bg-rose-100 text-rose-800 border-rose-200",
                Location = "Online",
                Organizer = "Zeynep Kaya",
                Fields = new Dictionary<string, object?> { { "RoomId", 1 }, { "Attendees", new[] { 2 } } }
            },
            new SchedulerEventModel
            {
                Id = "ev_4",
                Title = "Kabul Testleri (UAT)",
                Description = "Panoptes UI kurumsal portal teslim öncesi kullanıcı kabul testi (UAT).",
                Start = monday.AddDays(3).AddHours(15),
                End = monday.AddDays(3).AddHours(16).AddMinutes(30),
                Category = "DEMO",
                ColorClass = "bg-amber-100 text-amber-800 border-amber-200",
                Location = "Müşteri Merkezi",
                Organizer = "Mehmet Tezcan",
                Fields = new Dictionary<string, object?> { { "RoomId", 2 }, { "Attendees", new[] { 1 } } }
            },
            new SchedulerEventModel
            {
                Id = "ev_5",
                Title = "Sürüm Dağıtımı (v2.0 Release)",
                Description = "Canlı ortama yeni mikroservislerin yayını.",
                Start = monday.AddDays(4).AddHours(16),
                End = monday.AddDays(4).AddHours(17).AddMinutes(30),
                Category = "CANLI YAYIN",
                ColorClass = "bg-indigo-100 text-indigo-800 border-indigo-200",
                Location = "DevOps Odası",
                Organizer = "DevOps Ekibi",
                Fields = new Dictionary<string, object?> { { "RoomId", 1 }, { "Attendees", new[] { 1, 2, 3 } } }
            }
        };
    }

    public IActionResult Index()
    {
        return View(GetSampleEvents());
    }

    public IActionResult RemoteData()
    {
        return View();
    }

    public IActionResult Views()
    {
        return View(GetSampleEvents());
    }

    public IActionResult Grouping()
    {
        return View(GetSampleEvents());
    }

    public IActionResult Resources()
    {
        return View(GetSampleEvents());
    }

    public IActionResult Events()
    {
        return View(GetSampleEvents());
    }

    public IActionResult Api()
    {
        return View(GetSampleEvents());
    }

    [HttpGet]
    [Route("api/scheduler/events")]
    public IActionResult GetEvents()
    {
        return Ok(GetSampleEvents());
    }
}
