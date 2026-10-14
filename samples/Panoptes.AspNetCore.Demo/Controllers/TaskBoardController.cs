using System;
using System.Collections.Generic;
using Microsoft.AspNetCore.Mvc;
using Panoptes.AspNetCore.Models;

namespace Panoptes.AspNetCore.Demo.Controllers;

public class TaskBoardController : Controller
{
    public IActionResult Index()
    {
        var model = new List<TaskBoardColumnModel>
        {
            new TaskBoardColumnModel
            {
                Id = "col_todo",
                Title = "Yapılacaklar",
                BadgeColor = "bg-slate-400",
                Cards = new List<TaskBoardCardModel>
                {
                    new TaskBoardCardModel
                    {
                        Id = "card_1",
                        Title = "Docker Compose Altyapısını Kur",
                        Description = "PostgreSQL ve Redis servislerini barındıran docker-compose dosyasını hazırla.",
                        Priority = TaskPriority.High,
                        Category = "DEVOPS",
                        AssigneeName = "Ahmet Y.",
                        DueDate = DateTime.Now.AddDays(2)
                    },
                    new TaskBoardCardModel
                    {
                        Id = "card_2",
                        Title = "SSL Sertifikasını Yenile",
                        Description = "Let's Encrypt botunun sertifika yenileme komutunu cronjob'a bağla.",
                        Priority = TaskPriority.Medium,
                        Category = "GÜVENLİK",
                        AssigneeName = "Zeynep K.",
                        DueDate = DateTime.Now.AddDays(5)
                    }
                }
            },
            new TaskBoardColumnModel
            {
                Id = "col_in_progress",
                Title = "Devam Edenler",
                BadgeColor = "bg-blue-500",
                Cards = new List<TaskBoardCardModel>
                {
                    new TaskBoardCardModel
                    {
                        Id = "card_3",
                        Title = "Kullanıcı Yetkilendirme Modülü",
                        Description = "JWT tabanlı yetkilendirme ve rol kontrollerini API endpointlerine uygula.",
                        Priority = TaskPriority.Urgent,
                        Category = "BACKEND",
                        AssigneeName = "Fatih C.",
                        DueDate = DateTime.Now.AddDays(1)
                    }
                }
            },
            new TaskBoardColumnModel
            {
                Id = "col_review",
                Title = "Kod İncelemesi",
                BadgeColor = "bg-amber-500",
                Cards = new List<TaskBoardCardModel>
                {
                    new TaskBoardCardModel
                    {
                        Id = "card_4",
                        Title = "Ödeme Geçidi Entegrasyonu",
                        Description = "3D Secure ödeme akışı testleri ve webhook entegrasyonu pull requesti.",
                        Priority = TaskPriority.High,
                        Category = "FİNANS",
                        AssigneeName = "Mehmet T.",
                        DueDate = DateTime.Now.AddDays(3)
                    }
                }
            },
            new TaskBoardColumnModel
            {
                Id = "col_done",
                Title = "Tamamlandı",
                BadgeColor = "bg-emerald-500",
                Cards = new List<TaskBoardCardModel>
                {
                    new TaskBoardCardModel
                    {
                        Id = "card_5",
                        Title = "Veritabanı İndeksleme Optimizasyonu",
                        Description = "Sık sorgulanan kolonlara B-Tree ve Composite indeksler tanımlandı.",
                        Priority = TaskPriority.Low,
                        Category = "VERİTABANI",
                        AssigneeName = "Fatih C.",
                        DueDate = DateTime.Now.AddDays(-1)
                    }
                }
            }
        };

        return View(model);
    }
}
