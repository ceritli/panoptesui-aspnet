using System;
using System.Collections.Generic;

namespace Panoptes.AspNetCore.Models
{
    public class TreeListColumn
    {
        public string Field { get; set; } = string.Empty;
        public string Title { get; set; } = string.Empty;
        public string? Width { get; set; }
        public string Align { get; set; } = "left"; // left, center, right

        /// <summary>currency, number, percent, progress, date, boolean, badge</summary>
        public string? Format { get; set; }

        /// <summary>İlk sütun: girintileme ve aç/kapat oku ile gösterilir.</summary>
        public bool IsTreeColumn { get; set; } = false;

        /// <summary>sum, avg, count, min, max (TreeList aggregates özelliği)</summary>
        public string? Aggregate { get; set; }

        /// <summary>string, number, date, boolean, select (boş bırakılırsa Format'tan çıkarılır)</summary>
        public string? Type { get; set; }

        /// <summary>Düzenleme modunda bu sütun düzenlenebilir mi?</summary>
        public bool Editable { get; set; } = true;

        public bool? Sortable { get; set; }
        public bool? Filterable { get; set; }

        /// <summary>Sütunu dondurur (yatay kaydırmada sabit kalır). Kilitli sütunlar en başta olmalıdır.</summary>
        public bool Locked { get; set; }

        public bool Hidden { get; set; }

        /// <summary>Çok katmanlı başlık: aynı değere sahip ardışık sütunlar tek üst başlık altında toplanır.</summary>
        public string? Group { get; set; }

        /// <summary>Açılır liste seçenekleri (Type = select).</summary>
        public List<string>? Options { get; set; }

        public bool Required { get; set; }
    }

    public class TreeListItem
    {
        public string Id { get; set; } = string.Empty;
        public string? ParentId { get; set; }
        public bool Expanded { get; set; } = true;
        public Dictionary<string, object?> Values { get; set; } = new();
    }
}
