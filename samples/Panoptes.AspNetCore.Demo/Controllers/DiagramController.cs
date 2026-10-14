using System;
using System.Collections.Generic;
using Microsoft.AspNetCore.Mvc;
using Panoptes.AspNetCore.Models;

namespace Panoptes.AspNetCore.Demo.Controllers
{
    public class DiagramDemoViewModel
    {
        public List<DiagramNode> FlowchartNodes { get; set; } = new();
        public List<DiagramConnection> FlowchartConnections { get; set; } = new();

        public List<DiagramNode> OrgNodes { get; set; } = new();
        public List<DiagramConnection> OrgConnections { get; set; } = new();
    }

    public class DiagramController : Controller
    {
        public IActionResult Index()
        {
            ViewData["Title"] = "Diagram & OrgChart (İş Akış Şeması ve Organizasyon Ağacı)";

            var model = new DiagramDemoViewModel();

            // 1. Kurumsal E-Fatura Onay & ERP Entegrasyon İş Akışı (Flowchart)
            model.FlowchartNodes = new List<DiagramNode>
            {
                new DiagramNode { Id = "step1", Title = "1. Fatura Girişi", Subtitle = "Tedarikçi Portal / XML", Color = "blue", X = 40, Y = 60 },
                new DiagramNode { Id = "step2", Title = "2. Doğrulama Motoru", Subtitle = "VKN, İrsaliye & Tutar", Color = "purple", X = 270, Y = 60 },
                new DiagramNode { Id = "step3", Title = "3. Departman Müdürü Onayı", Subtitle = "Bütçe ve Hizmet Kontrolü", Color = "amber", X = 500, Y = 60 },
                new DiagramNode { Id = "step4", Title = "4. Finans & Muhasebe Onayı", Subtitle = "Ödeme Vade Planlama", Color = "emerald", X = 500, Y = 220 },
                new DiagramNode { Id = "step5", Title = "5. GİB Entegratörü", Subtitle = "Mühür & Resmi İletim", Color = "blue", X = 270, Y = 220 },
                new DiagramNode { Id = "step6", Title = "6. ERP Kaydı & Ödeme", Subtitle = "SAP / Netsis Senkronizasyonu", Color = "emerald", X = 40, Y = 220 }
            };

            model.FlowchartConnections = new List<DiagramConnection>
            {
                new DiagramConnection { From = "step1", To = "step2", Label = "Aktarım" },
                new DiagramConnection { From = "step2", To = "step3", Label = "Uygun" },
                new DiagramConnection { From = "step3", To = "step4", Label = "Onaylandı" },
                new DiagramConnection { From = "step4", To = "step5", Label = "Vadelendirildi" },
                new DiagramConnection { From = "step5", To = "step6", Label = "Mühürlendi" }
            };

            // 2. Şirket Yönetim Organizasyon Şeması (OrgChart)
            model.OrgNodes = new List<DiagramNode>
            {
                new DiagramNode { Id = "ceo", Title = "Mehmet Kaya", Subtitle = "Genel Müdür (CEO)", Color = "blue", X = 320, Y = 30 },
                new DiagramNode { Id = "cto", Title = "Zeynep Arslan", Subtitle = "Teknoloji Direktörü (CTO)", Color = "purple", X = 100, Y = 170 },
                new DiagramNode { Id = "cfo", Title = "Ahmet Öztürk", Subtitle = "Finans Direktörü (CFO)", Color = "emerald", X = 320, Y = 170 },
                new DiagramNode { Id = "cmo", Title = "Canan Demir", Subtitle = "Pazarlama Direktörü (CMO)", Color = "amber", X = 540, Y = 170 },
                new DiagramNode { Id = "lead_be", Title = "Burak Yılmaz", Subtitle = "Backend Takım Lideri", Color = "purple", X = 30, Y = 310 },
                new DiagramNode { Id = "lead_fe", Title = "Selin Koç", Subtitle = "Frontend Takım Lideri", Color = "purple", X = 190, Y = 310 }
            };

            model.OrgConnections = new List<DiagramConnection>
            {
                new DiagramConnection { From = "ceo", To = "cto" },
                new DiagramConnection { From = "ceo", To = "cfo" },
                new DiagramConnection { From = "ceo", To = "cmo" },
                new DiagramConnection { From = "cto", To = "lead_be" },
                new DiagramConnection { From = "cto", To = "lead_fe" }
            };

            return View(model);
        }
    }
}
