using System;
using System.Collections.Generic;

namespace Panoptes.AspNetCore.Models
{
    public class SpreadsheetCell
    {
        public int Row { get; set; } // 1-based index
        public int Col { get; set; } // 1-based index
        public string? Value { get; set; }
        public string? Formula { get; set; }
        public bool Bold { get; set; }
        public bool Italic { get; set; }
        public bool Underline { get; set; }
        public bool Strike { get; set; }
        public string? Color { get; set; }
        public string? Background { get; set; }
        public string? Align { get; set; } // left, center, right
        public string? VAlign { get; set; } // top, middle, bottom
        public string? Format { get; set; } // currency, percent, number, date, text ya da özel biçim
        public int? FontSize { get; set; }
        public bool Wrap { get; set; }
        public string? Border { get; set; } // "tblr" bayrakları (top, bottom, left, right)
        public bool Enabled { get; set; } = true;
        public string? Comment { get; set; }
    }

    /// <summary>Veri doğrulama kuralı (Validation).</summary>
    public class SpreadsheetValidation
    {
        public string Range { get; set; } = string.Empty; // "B2:B20"
        public string Type { get; set; } = "list"; // list, whole, decimal, date, textLength, custom
        public string Comparer { get; set; } = "between"; // between, notBetween, equalTo, notEqualTo, greaterThan, lessThan, greaterThanOrEqualTo, lessThanOrEqualTo
        public string? From { get; set; }
        public string? To { get; set; }
        public string? Formula { get; set; }
        public List<string>? Items { get; set; }
        public bool AllowNulls { get; set; } = true;
        public bool Reject { get; set; } = true;
        public string? Title { get; set; }
        public string? Message { get; set; }
        public string? Error { get; set; }
    }

    /// <summary>Özel hücre düzenleyicisi (Custom Cell Editors).</summary>
    public class SpreadsheetEditor
    {
        public string Range { get; set; } = string.Empty;
        public string Type { get; set; } = "list"; // list, date, number, checkbox, color, rating
        public List<string>? Items { get; set; }
        public double? Min { get; set; }
        public double? Max { get; set; }
        public double? Step { get; set; }
    }

    public class SpreadsheetImage
    {
        public string Src { get; set; } = string.Empty;
        public int Row { get; set; } = 1;
        public int Col { get; set; } = 1;
        public int X { get; set; }
        public int Y { get; set; }
        public int Width { get; set; } = 120;
        public int Height { get; set; } = 80;
    }

    public class SpreadsheetDataColumn
    {
        public string Field { get; set; } = string.Empty;
        public string? Title { get; set; }
        public int? Width { get; set; }
        public string? Format { get; set; }
        public string? Editor { get; set; }
        public List<string>? Items { get; set; }
    }

    /// <summary>Sayfayı bir veri kaynağına bağlar (DataSource Binding).</summary>
    public class SpreadsheetDataSource
    {
        public List<SpreadsheetDataColumn> Columns { get; set; } = new();
        public List<Dictionary<string, object?>> Items { get; set; } = new();
    }

    public class SpreadsheetSheet
    {
        public string Name { get; set; } = "Sayfa 1";
        public int Rows { get; set; } = 30;
        public int Cols { get; set; } = 15;
        public List<SpreadsheetCell> Cells { get; set; } = new();
        public Dictionary<int, int>? ColumnWidths { get; set; }
        public Dictionary<int, int>? RowHeights { get; set; }
        public List<string>? MergedCells { get; set; }
        public int FrozenRows { get; set; }
        public int FrozenCols { get; set; }
        public List<SpreadsheetValidation>? Validations { get; set; }
        public List<SpreadsheetEditor>? Editors { get; set; }
        public List<string>? DisabledRanges { get; set; }
        public List<SpreadsheetImage>? Images { get; set; }
        public string? Filter { get; set; } // "A1:F20"
        public bool ShowGridLines { get; set; } = true;
        public SpreadsheetDataSource? DataSource { get; set; }
    }

    public class SpreadsheetConfiguration
    {
        public string Id { get; set; } = string.Empty;
        public string Title { get; set; } = string.Empty;
        public List<SpreadsheetSheet> Sheets { get; set; } = new();
    }
}
