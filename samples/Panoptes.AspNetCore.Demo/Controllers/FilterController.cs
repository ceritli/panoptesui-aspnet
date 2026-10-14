using System;
using System.Collections.Generic;
using Microsoft.AspNetCore.Mvc;
using Panoptes.AspNetCore.Models;

namespace Panoptes.AspNetCore.Demo.Controllers
{
    public class FilterController : Controller
    {
        public IActionResult Index()
        {
            ViewData["Title"] = "Filter (Görsel Filtre & Sorgu Motoru / Visual Query Builder)";

            var customFields = new List<FilterFieldDefinition>
            {
                new FilterFieldDefinition { Name = "CustomerName", Title = "Müşteri / Firma Adı", Type = "string" },
                new FilterFieldDefinition { Name = "City", Title = "Şehir / Bölge", Type = "string" },
                new FilterFieldDefinition { Name = "TotalRevenue", Title = "Yıllık Ciro (₺)", Type = "number" },
                new FilterFieldDefinition { Name = "CreditScore", Title = "Kredi Skoru", Type = "number" },
                new FilterFieldDefinition { Name = "RegistrationDate", Title = "Üyelik Tarihi", Type = "date" },
                new FilterFieldDefinition { Name = "IsVip", Title = "VIP Müşteri Statüsü", Type = "boolean" }
            };

            return View(customFields);
        }
    }
}
