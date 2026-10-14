using System;
using System.Collections.Generic;
using Microsoft.AspNetCore.Mvc;
using Panoptes.AspNetCore.Models;

namespace Panoptes.AspNetCore.Demo.Controllers;

public class GanttController : Controller
{
    public IActionResult Index()
    {
        var baseDate = DateTime.Today.AddDays(-2);

        // 1. Yazılım Geliştirme Proje Görevleri (Hiyerarşik / Sprint)
        var softwareTasks = new List<GanttTaskModel>
        {
            new GanttTaskModel
            {
                Id = "task_phase1",
                Title = "Faz 1: Analiz ve Mimari Tasarım",
                Start = baseDate,
                End = baseDate.AddDays(5),
                PercentComplete = 100,
                Summary = true,
                ColorClass = "bg-slate-700"
            },
            new GanttTaskModel
            {
                Id = "task_req",
                ParentId = "task_phase1",
                Title = "İş Gereksinimleri ve Kapsam Belirleme",
                Start = baseDate,
                End = baseDate.AddDays(2),
                PercentComplete = 100,
                Summary = false,
                ColorClass = "bg-blue-600"
            },
            new GanttTaskModel
            {
                Id = "task_arch",
                ParentId = "task_phase1",
                Title = "Veritabanı Şeması ve API Mimarisi",
                Start = baseDate.AddDays(2),
                End = baseDate.AddDays(5),
                PercentComplete = 100,
                Summary = false,
                ColorClass = "bg-blue-600"
            },
            new GanttTaskModel
            {
                Id = "task_phase2",
                Title = "Faz 2: Geliştirme & UI Uygulaması",
                Start = baseDate.AddDays(4),
                End = baseDate.AddDays(14),
                PercentComplete = 65,
                Summary = true,
                ColorClass = "bg-indigo-700"
            },
            new GanttTaskModel
            {
                Id = "task_ui",
                ParentId = "task_phase2",
                Title = "Panoptes UI Bileşen Entegrasyonu",
                Start = baseDate.AddDays(4),
                End = baseDate.AddDays(9),
                PercentComplete = 90,
                Summary = false,
                ColorClass = "bg-indigo-600"
            },
            new GanttTaskModel
            {
                Id = "task_backend",
                ParentId = "task_phase2",
                Title = "Backend Servisleri & CQRS Katmanı",
                Start = baseDate.AddDays(7),
                End = baseDate.AddDays(14),
                PercentComplete = 45,
                Summary = false,
                ColorClass = "bg-cyan-600"
            },
            new GanttTaskModel
            {
                Id = "task_phase3",
                Title = "Faz 3: Test, Doğrulama & Canlı Dağıtım",
                Start = baseDate.AddDays(12),
                End = baseDate.AddDays(20),
                PercentComplete = 15,
                Summary = true,
                ColorClass = "bg-emerald-700"
            },
            new GanttTaskModel
            {
                Id = "task_qa",
                ParentId = "task_phase3",
                Title = "Otomasyon & UAT Kabul Testleri",
                Start = baseDate.AddDays(12),
                End = baseDate.AddDays(17),
                PercentComplete = 30,
                Summary = false,
                ColorClass = "bg-amber-600"
            },
            new GanttTaskModel
            {
                Id = "task_deploy",
                ParentId = "task_phase3",
                Title = "Kubernetes Prod Dağıtımı & Yayına Alma",
                Start = baseDate.AddDays(17),
                End = baseDate.AddDays(20),
                PercentComplete = 0,
                Summary = false,
                ColorClass = "bg-emerald-600"
            }
        };

        // 2. İnşaat & Altyapı Saha Çizelgesi
        var constructionTasks = new List<GanttTaskModel>
        {
            new GanttTaskModel
            {
                Id = "c_1",
                Title = "Zemin Etüdü ve Kazı Çalışmaları",
                Start = baseDate.AddDays(-1),
                End = baseDate.AddDays(4),
                PercentComplete = 100,
                Summary = false,
                ColorClass = "bg-amber-700"
            },
            new GanttTaskModel
            {
                Id = "c_2",
                Title = "Temel Betonu ve İskele Kurulumu",
                Start = baseDate.AddDays(3),
                End = baseDate.AddDays(9),
                PercentComplete = 80,
                Summary = false,
                ColorClass = "bg-orange-600"
            },
            new GanttTaskModel
            {
                Id = "c_3",
                Title = "Çelik Konstrüksiyon Montajı",
                Start = baseDate.AddDays(8),
                End = baseDate.AddDays(16),
                PercentComplete = 25,
                Summary = false,
                ColorClass = "bg-violet-600"
            },
            new GanttTaskModel
            {
                Id = "c_4",
                Title = "Elektrik & Mekanik Tesisat Çekimi",
                Start = baseDate.AddDays(13),
                End = baseDate.AddDays(22),
                PercentComplete = 0,
                Summary = false,
                ColorClass = "bg-teal-600"
            }
        };

        ViewBag.ConstructionTasks = constructionTasks;

        return View(softwareTasks);
    }
}
