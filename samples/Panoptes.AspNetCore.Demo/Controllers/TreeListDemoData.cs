using System;
using System.Collections.Generic;
using System.Globalization;
using System.Linq;
using System.Text.Json;
using System.Text.RegularExpressions;
using Panoptes.AspNetCore.Models;

namespace Panoptes.AspNetCore.Demo.Controllers
{
    /// <summary>Her TreeList özellik sayfasının ortak görünüm modeli.</summary>
    public class TreeListPageModel
    {
        public string Title { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public string[] Highlights { get; set; } = Array.Empty<string>();
        public string RazorCode { get; set; } = string.Empty;
        public string ScriptCode { get; set; } = string.Empty;
        public List<TreeListColumn> Columns { get; set; } = new();
        public List<TreeListItem> Items { get; set; } = new();
    }

    /// <summary>Uzak / OData bağlama demolarında sunucudan dönen düğüm.</summary>
    public class ProductNode
    {
        public string Id { get; set; } = string.Empty;
        public string? ParentId { get; set; }
        public bool HasChildren { get; set; }
        public string Name { get; set; } = string.Empty;
        public string Type { get; set; } = string.Empty;
        public decimal? Price { get; set; }
        public int? Stock { get; set; }
        public string Updated { get; set; } = string.Empty;
    }

    public record ProductFilter(string Field, string Op, string Value);

    public static class TreeListDemoData
    {
        public static readonly string[] Departments = { "İcra Kurulu", "Teknoloji", "Finans", "Pazarlama" };
        public static readonly string[] Locations = { "İstanbul", "Ankara", "İzmir", "Uzaktan" };

        /* ------------------------------ Çalışanlar ------------------------------ */

        /// <param name="wide">E-posta ve telefon sütunlarını da ekler (yatay kaydırma gerektirir).</param>
        public static List<TreeListColumn> EmployeeColumns(bool wide = false)
        {
            var cols = new List<TreeListColumn>
            {
                new() { Field = "Name", Title = "Ad Soyad", Width = "260", IsTreeColumn = true, Required = true },
                new() { Field = "Role", Title = "Unvan", Width = "200" },
                new() { Field = "Department", Title = "Departman", Width = "150", Type = "select", Options = Departments.ToList() },
                new() { Field = "Location", Title = "Lokasyon", Width = "120", Type = "select", Options = Locations.ToList() },
            };
            if (wide)
            {
                cols.Add(new() { Field = "Email", Title = "E-posta", Width = "240" });
                cols.Add(new() { Field = "Phone", Title = "Telefon", Width = "160" });
            }
            cols.Add(new() { Field = "HireDate", Title = "İşe Giriş", Width = "120", Format = "date" });
            cols.Add(new() { Field = "Salary", Title = "Maaş (₺)", Width = "130", Align = "right", Format = "currency" });
            cols.Add(new() { Field = "Active", Title = "Aktif", Width = "90", Align = "center", Format = "boolean" });
            return cols;
        }

        public static List<TreeListColumn> EmployeeGroupedColumns() => new()
        {
            new() { Field = "Name", Title = "Ad Soyad", Width = "240", IsTreeColumn = true, Group = "Kişi" },
            new() { Field = "Role", Title = "Unvan", Width = "190", Group = "Kişi" },
            new() { Field = "Department", Title = "Departman", Width = "150", Group = "Organizasyon" },
            new() { Field = "Location", Title = "Lokasyon", Width = "120", Group = "Organizasyon" },
            new() { Field = "Salary", Title = "Maaş (₺)", Width = "130", Align = "right", Format = "currency", Group = "Ücret" },
            new() { Field = "Bonus", Title = "Prim (₺)", Width = "120", Align = "right", Format = "currency", Group = "Ücret" },
        };

        private static TreeListItem E(string id, string? parent, string name, string role, string dept, string loc,
            string email, string phone, string hire, int salary, bool active = true, bool expanded = true) => new()
        {
            Id = id,
            ParentId = parent,
            Expanded = expanded,
            Values = new()
            {
                ["Name"] = name, ["Role"] = role, ["Department"] = dept, ["Location"] = loc,
                ["Email"] = email, ["Phone"] = phone, ["HireDate"] = hire, ["Salary"] = salary,
                ["Bonus"] = salary / 10, ["Active"] = active
            }
        };

        public static List<TreeListItem> Employees() => new()
        {
            E("1", null, "Mehmet Kaya", "Genel Müdür (CEO)", "İcra Kurulu", "İstanbul", "mehmet.kaya@panoptes.dev", "+90 212 555 01 01", "2012-01-09", 250000),
            E("2", "1", "Zeynep Arslan", "Teknoloji Direktörü (CTO)", "Teknoloji", "İstanbul", "zeynep.arslan@panoptes.dev", "+90 212 555 01 02", "2014-03-17", 180000),
            E("3", "2", "Burak Yılmaz", "Yazılım Mimarı", "Teknoloji", "Ankara", "burak.yilmaz@panoptes.dev", "+90 312 555 02 03", "2016-06-01", 125000, true, false),
            E("4", "3", "Elif Demir", "Kıdemli .NET Uzmanı", "Teknoloji", "İzmir", "elif.demir@panoptes.dev", "+90 232 555 03 04", "2018-09-24", 95000),
            E("5", "3", "Emre Çetin", "DevOps Mühendisi", "Teknoloji", "Uzaktan", "emre.cetin@panoptes.dev", "+90 532 555 04 05", "2020-02-10", 90000),
            E("6", "2", "Selin Koç", "Frontend Takım Lideri", "Teknoloji", "İstanbul", "selin.koc@panoptes.dev", "+90 212 555 05 06", "2017-11-13", 120000),
            E("7", "6", "Can Aydın", "UI Geliştirici", "Teknoloji", "Ankara", "can.aydin@panoptes.dev", "+90 312 555 06 07", "2021-04-05", 88000),
            E("8", "6", "Deniz Aksoy", "UX Tasarımcısı", "Teknoloji", "Uzaktan", "deniz.aksoy@panoptes.dev", "+90 533 555 07 08", "2022-08-29", 82000, false),
            E("9", "1", "Ahmet Öztürk", "Finans Direktörü (CFO)", "Finans", "İstanbul", "ahmet.ozturk@panoptes.dev", "+90 212 555 08 09", "2013-05-20", 175000),
            E("10", "9", "Ayşe Şen", "Muhasebe Müdürü", "Finans", "İstanbul", "ayse.sen@panoptes.dev", "+90 212 555 09 10", "2015-10-12", 95000),
            E("11", "9", "Murat Polat", "Bütçe Uzmanı", "Finans", "İzmir", "murat.polat@panoptes.dev", "+90 232 555 10 11", "2019-01-21", 78000),
            E("12", "1", "Gül Yıldız", "Pazarlama Direktörü (CMO)", "Pazarlama", "İstanbul", "gul.yildiz@panoptes.dev", "+90 212 555 11 12", "2015-02-02", 165000, true, false),
            E("13", "12", "Kerem Bulut", "Dijital Pazarlama Uzmanı", "Pazarlama", "Uzaktan", "kerem.bulut@panoptes.dev", "+90 534 555 12 13", "2021-09-06", 72000),
            E("14", "12", "Ceren Işık", "İçerik Editörü", "Pazarlama", "Ankara", "ceren.isik@panoptes.dev", "+90 312 555 13 14", "2023-01-16", 69000),
        };

        /* ------------------------------ Bütçe (aggregates) ------------------------------ */

        public static List<TreeListColumn> BudgetColumns() => new()
        {
            new() { Field = "Name", Title = "Bütçe Kalemi", Width = "280", IsTreeColumn = true },
            new() { Field = "Budget", Title = "Planlanan (₺)", Width = "150", Align = "right", Format = "currency", Aggregate = "sum" },
            new() { Field = "Spent", Title = "Harcanan (₺)", Width = "150", Align = "right", Format = "currency", Aggregate = "sum" },
            new() { Field = "Headcount", Title = "Kadro", Width = "100", Align = "right", Format = "number", Aggregate = "sum" },
            new() { Field = "Score", Title = "Performans (ort.)", Width = "150", Align = "right", Format = "number", Aggregate = "avg" },
        };

        private static TreeListItem B(string id, string? parent, string name, int? budget = null, int? spent = null, int? head = null, double? score = null)
        {
            var it = new TreeListItem { Id = id, ParentId = parent, Expanded = true, Values = new() { ["Name"] = name } };
            if (budget.HasValue) it.Values["Budget"] = budget.Value;
            if (spent.HasValue) it.Values["Spent"] = spent.Value;
            if (head.HasValue) it.Values["Headcount"] = head.Value;
            if (score.HasValue) it.Values["Score"] = score.Value;
            return it;
        }

        public static List<TreeListItem> Budget() => new()
        {
            B("b1", null, "Şirket Geneli 2026"),
            B("b2", "b1", "Teknoloji"),
            B("b3", "b2", "Yazılım Geliştirme", 1200000, 980000, 24, 8.4),
            B("b4", "b2", "Altyapı & Bulut", 800000, 760000, 8, 7.9),
            B("b5", "b2", "Siber Güvenlik", 450000, 300000, 5, 8.8),
            B("b6", "b1", "Pazarlama"),
            B("b7", "b6", "Dijital Reklam", 600000, 640000, 6, 7.2),
            B("b8", "b6", "Marka & İçerik", 350000, 220000, 7, 8.1),
            B("b9", "b1", "Operasyon"),
            B("b10", "b9", "Lojistik", 900000, 870000, 18, 7.5),
            B("b11", "b9", "Satın Alma", 300000, 250000, 5, 8.0),
            B("b12", "b9", "Müşteri Hizmetleri", 500000, 510000, 22, 7.7),
        };

        /* ------------------------------ Bölge ofisleri (sayfalama) ------------------------------ */

        public static List<TreeListColumn> RegionColumns() => new()
        {
            new() { Field = "Name", Title = "Ofis / Şube", Width = "260", IsTreeColumn = true },
            new() { Field = "Manager", Title = "Sorumlu", Width = "180" },
            new() { Field = "Staff", Title = "Personel", Width = "100", Align = "right", Format = "number" },
            new() { Field = "Revenue", Title = "Ciro (₺)", Width = "150", Align = "right", Format = "currency" },
        };

        public static List<TreeListItem> Regions()
        {
            var cities = new[] { "İstanbul Avrupa", "İstanbul Anadolu", "Ankara", "İzmir", "Bursa", "Antalya", "Adana", "Konya", "Gaziantep", "Kayseri", "Trabzon", "Eskişehir", "Samsun", "Mersin" };
            var managers = new[] { "Ali Yıldırım", "Fatma Kurt", "Hasan Doğan", "Leyla Aslan", "Oğuz Tekin", "Pınar Gür", "Rıza Erdem", "Sevgi Ay", "Tuna Bal", "Umut Sezer" };
            var rnd = new Random(7);
            var list = new List<TreeListItem>();
            for (int i = 0; i < cities.Length; i++)
            {
                var rid = "r" + (i + 1);
                var branches = 2 + rnd.Next(2);
                int staffTotal = 0; int revTotal = 0;
                var kids = new List<TreeListItem>();
                for (int b = 0; b < branches; b++)
                {
                    var staff = 8 + rnd.Next(40);
                    var rev = (500 + rnd.Next(4500)) * 1000;
                    staffTotal += staff; revTotal += rev;
                    kids.Add(new TreeListItem
                    {
                        Id = rid + "-" + (b + 1), ParentId = rid, Expanded = false,
                        Values = new() { ["Name"] = $"{cities[i]} Şube {b + 1}", ["Manager"] = managers[rnd.Next(managers.Length)], ["Staff"] = staff, ["Revenue"] = rev }
                    });
                }
                list.Add(new TreeListItem
                {
                    Id = rid, ParentId = null, Expanded = i < 2,
                    Values = new() { ["Name"] = cities[i] + " Bölge Ofisi", ["Manager"] = managers[rnd.Next(managers.Length)], ["Staff"] = staffTotal, ["Revenue"] = revTotal }
                });
                list.AddRange(kids);
            }
            return list;
        }

        /* ------------------------------ Ürün kataloğu (sunucu) ------------------------------ */

        public static List<TreeListColumn> ProductColumns() => new()
        {
            new() { Field = "name", Title = "Ürün / Kategori", Width = "320", IsTreeColumn = true },
            new() { Field = "type", Title = "Tür", Width = "130" },
            new() { Field = "price", Title = "Fiyat (₺)", Width = "130", Align = "right", Format = "currency", Type = "number" },
            new() { Field = "stock", Title = "Stok", Width = "90", Align = "right", Format = "number" },
            new() { Field = "updated", Title = "Güncelleme", Width = "130", Format = "date" },
        };

        public static readonly List<ProductNode> Catalog = BuildCatalog();

        private static List<ProductNode> BuildCatalog()
        {
            var tree = new (string Cat, string[] Subs)[]
            {
                ("Elektronik", new[] { "Telefon", "Televizyon", "Kulaklık" }),
                ("Bilgisayar", new[] { "Dizüstü", "Monitör", "Klavye & Fare" }),
                ("Ev & Yaşam", new[] { "Mobilya", "Aydınlatma", "Mutfak" }),
                ("Giyim", new[] { "Kadın", "Erkek", "Çocuk" }),
                ("Spor & Outdoor", new[] { "Kamp", "Fitness", "Bisiklet" }),
                ("Kitap & Kırtasiye", new[] { "Roman", "Akademik", "Kırtasiye" }),
                ("Oyuncak", new[] { "Eğitici", "Yapboz", "Kutu Oyunu" }),
                ("Otomotiv", new[] { "Aksesuar", "Bakım", "Lastik" }),
            };
            var rnd = new Random(42);
            var all = new List<ProductNode>();
            string Date() => new DateTime(2025, 1, 1).AddDays(rnd.Next(0, 640)).ToString("yyyy-MM-dd");
            for (int c = 0; c < tree.Length; c++)
            {
                var cid = "c" + (c + 1);
                all.Add(new ProductNode { Id = cid, ParentId = null, Name = tree[c].Cat, Type = "Kategori", Updated = Date() });
                for (int s = 0; s < tree[c].Subs.Length; s++)
                {
                    var sid = cid + "-s" + (s + 1);
                    all.Add(new ProductNode { Id = sid, ParentId = cid, Name = tree[c].Subs[s], Type = "Alt Kategori", Updated = Date() });
                    for (int p = 0; p < 4; p++)
                    {
                        all.Add(new ProductNode
                        {
                            Id = sid + "-p" + (p + 1), ParentId = sid,
                            Name = $"{tree[c].Subs[s]} Model {(char)('A' + p)}{rnd.Next(10, 99)}",
                            Type = "Ürün",
                            Price = Math.Round((decimal)(rnd.Next(49, 9999) + rnd.NextDouble()), 2),
                            Stock = rnd.Next(0, 250),
                            Updated = Date()
                        });
                    }
                }
            }
            var parents = all.Where(n => n.ParentId != null).Select(n => n.ParentId!).ToHashSet();
            foreach (var n in all) n.HasChildren = parents.Contains(n.Id);
            return all;
        }

        public static List<ProductFilter> ParseJsonFilters(string? json)
        {
            var list = new List<ProductFilter>();
            if (string.IsNullOrWhiteSpace(json)) return list;
            try
            {
                using var doc = JsonDocument.Parse(json);
                foreach (var el in doc.RootElement.EnumerateArray())
                {
                    var v = el.GetProperty("value");
                    var value = v.ValueKind == JsonValueKind.String ? v.GetString() ?? "" : v.GetRawText();
                    list.Add(new ProductFilter(el.GetProperty("field").GetString() ?? "", el.GetProperty("op").GetString() ?? "contains", value));
                }
            }
            catch (JsonException) { }
            return list;
        }

        /// <summary>"name-asc,price-desc" biçimi.</summary>
        public static List<(string Field, bool Desc)> ParseSort(string? sort) =>
            (sort ?? "").Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
                .Select(s => { var i = s.LastIndexOf('-'); return i > 0 ? (s[..i], s[(i + 1)..].Equals("desc", StringComparison.OrdinalIgnoreCase)) : (s, false); })
                .ToList();

        public static (string? ParentId, List<ProductFilter> Filters, List<(string Field, bool Desc)> Sort, int? Top, int Skip) ParseOData(IQueryCollection q)
        {
            string? parentId = null;
            var filters = new List<ProductFilter>();
            var filter = q["$filter"].ToString();
            if (!string.IsNullOrWhiteSpace(filter))
            {
                foreach (var clause in Regex.Split(filter, @"\s+and\s+", RegexOptions.IgnoreCase))
                {
                    var c = clause.Trim();
                    Match m;
                    if ((m = Regex.Match(c, @"^parentId\s+eq\s+null$", RegexOptions.IgnoreCase)).Success) parentId = null;
                    else if ((m = Regex.Match(c, @"^parentId\s+eq\s+'(.*)'$", RegexOptions.IgnoreCase)).Success) parentId = m.Groups[1].Value.Replace("''", "'");
                    else if ((m = Regex.Match(c, @"^contains\(tolower\((\w+)\),\s*'(.*)'\)$", RegexOptions.IgnoreCase)).Success)
                        filters.Add(new ProductFilter(m.Groups[1].Value, "contains", m.Groups[2].Value.Replace("''", "'")));
                    else if ((m = Regex.Match(c, @"^(\w+)\s+(eq|ne|gt|ge|lt|le)\s+(.+)$", RegexOptions.IgnoreCase)).Success)
                        filters.Add(new ProductFilter(m.Groups[1].Value, m.Groups[2].Value.ToLowerInvariant(), m.Groups[3].Value.Trim().Trim('\'').Replace("''", "'")));
                }
            }
            var sort = q["$orderby"].ToString()
                .Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
                .Select(s => { var p = s.Split(' ', StringSplitOptions.RemoveEmptyEntries); return (p[0], p.Length > 1 && p[1].Equals("desc", StringComparison.OrdinalIgnoreCase)); })
                .ToList();
            int? top = int.TryParse(q["$top"], out var t) ? t : null;
            int skip = int.TryParse(q["$skip"], out var sk) ? sk : 0;
            return (parentId, filters, sort, top, skip);
        }

        private static bool Matches(ProductNode n, ProductFilter f)
        {
            object? v = f.Field.ToLowerInvariant() switch
            {
                "name" => n.Name,
                "type" => n.Type,
                "price" => n.Price,
                "stock" => n.Stock,
                "updated" => n.Updated,
                _ => null
            };
            if (v is null) return false;
            if (v is string s)
            {
                return f.Op switch
                {
                    "contains" => s.Contains(f.Value, StringComparison.OrdinalIgnoreCase),
                    "eq" => s.Equals(f.Value, StringComparison.OrdinalIgnoreCase),
                    "ne" => !s.Equals(f.Value, StringComparison.OrdinalIgnoreCase),
                    _ => false
                };
            }
            var num = Convert.ToDecimal(v, CultureInfo.InvariantCulture);
            if (!decimal.TryParse(f.Value, NumberStyles.Any, CultureInfo.InvariantCulture, out var target))
                return false;
            return f.Op switch
            {
                "eq" => num == target,
                "ne" => num != target,
                "gt" => num > target,
                "ge" => num >= target,
                "lt" => num < target,
                "le" => num <= target,
                "contains" => num.ToString(CultureInfo.InvariantCulture).Contains(f.Value),
                _ => false
            };
        }

        private static bool Passes(ProductNode n, List<ProductFilter> filters) => filters.All(f => Matches(n, f));

        // Düğümün kendisi ya da herhangi bir torunu filtreyi geçiyorsa görünür kalır.
        private static bool Keep(ProductNode n, List<ProductFilter> filters) =>
            Passes(n, filters) || Catalog.Where(c => c.ParentId == n.Id).Any(c => Keep(c, filters));

        private static IComparable? Key(ProductNode n, string field) => field.ToLowerInvariant() switch
        {
            "type" => n.Type,
            "price" => (IComparable?)n.Price,
            "stock" => (IComparable?)n.Stock,
            "updated" => n.Updated,
            _ => n.Name
        };

        /// <summary>Verilen üst düğümün çocuklarını filtre + sıralama + sayfalama ile döndürür.</summary>
        public static (List<ProductNode> Items, int Total) Query(string? parentId, List<ProductFilter> filters, List<(string Field, bool Desc)> sort, int skip, int? take)
        {
            if (string.IsNullOrEmpty(parentId)) parentId = null;
            IEnumerable<ProductNode> q = Catalog.Where(n => n.ParentId == parentId);
            if (filters.Count > 0) q = q.Where(n => Keep(n, filters));

            IOrderedEnumerable<ProductNode>? ordered = null;
            foreach (var (field, desc) in sort)
            {
                ordered = ordered == null
                    ? (desc ? q.OrderByDescending(n => Key(n, field)) : q.OrderBy(n => Key(n, field)))
                    : (desc ? ordered.ThenByDescending(n => Key(n, field)) : ordered.ThenBy(n => Key(n, field)));
            }
            var list = (ordered ?? q).ToList();
            var total = list.Count;
            if (take.HasValue && take.Value > 0) list = list.Skip(skip).Take(take.Value).ToList();
            return (list, total);
        }
    }
}
