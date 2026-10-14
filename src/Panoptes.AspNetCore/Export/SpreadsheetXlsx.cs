using System;
using System.Collections.Generic;
using System.Globalization;
using System.IO;
using System.IO.Compression;
using System.Linq;
using System.Text;
using System.Text.Json;
using System.Text.RegularExpressions;
using System.Xml.Linq;

namespace Panoptes.AspNetCore.Export
{
    /// <summary>
    /// Spreadsheet bileşeni için bağımlılıksız (yalnızca System.IO.Compression + XML) minimal .xlsx yazıcı/okuyucu.
    /// Değerler, formüller (önbellekli sonuçla), kalın/italik/altı çizili/üstü çizili, yazı rengi, dolgu, kenarlık, hizalama,
    /// sayı/tarih biçimleri, birleştirilmiş hücreler, sütun genişlikleri, satır yükseklikleri, dondurulmuş bölmeler,
    /// otomatik filtre ve veri doğrulama kurallarını destekler. Resimler ve yorumlar dahil değildir.
    /// </summary>
    public static class SpreadsheetXlsx
    {
        private static readonly XNamespace Ns = "http://schemas.openxmlformats.org/spreadsheetml/2006/main";
        private static readonly XNamespace RNs = "http://schemas.openxmlformats.org/officeDocument/2006/relationships";
        private static readonly XNamespace PkgRel = "http://schemas.openxmlformats.org/package/2006/relationships";
        private static readonly CultureInfo Inv = CultureInfo.InvariantCulture;

        // ==================================================================
        //  YAZMA (JSON -> XLSX)
        // ==================================================================
        public static byte[] Write(JsonElement root)
        {
            var sheets = new List<JsonElement>();
            if (root.TryGetProperty("sheets", out var sa) && sa.ValueKind == JsonValueKind.Array)
                foreach (var s in sa.EnumerateArray()) sheets.Add(s);
            if (sheets.Count == 0) throw new InvalidOperationException("En az bir sayfa gerekli.");

            var styles = new StyleBook();
            var sheetXmls = new List<string>();
            foreach (var s in sheets) sheetXmls.Add(BuildSheet(s, styles));

            using var ms = new MemoryStream();
            using (var zip = new ZipArchive(ms, ZipArchiveMode.Create, true))
            {
                void Add(string path, string content)
                {
                    var e = zip.CreateEntry(path, CompressionLevel.Optimal);
                    using var w = new StreamWriter(e.Open(), new UTF8Encoding(false));
                    w.Write(content);
                }

                var ct = new StringBuilder("<?xml version=\"1.0\" encoding=\"UTF-8\" standalone=\"yes\"?><Types xmlns=\"http://schemas.openxmlformats.org/package/2006/content-types\"><Default Extension=\"rels\" ContentType=\"application/vnd.openxmlformats-package.relationships+xml\"/><Default Extension=\"xml\" ContentType=\"application/xml\"/><Override PartName=\"/xl/workbook.xml\" ContentType=\"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml\"/><Override PartName=\"/xl/styles.xml\" ContentType=\"application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml\"/>");
                for (int i = 0; i < sheets.Count; i++)
                    ct.Append($"<Override PartName=\"/xl/worksheets/sheet{i + 1}.xml\" ContentType=\"application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml\"/>");
                ct.Append("</Types>");
                Add("[Content_Types].xml", ct.ToString());

                Add("_rels/.rels", "<?xml version=\"1.0\" encoding=\"UTF-8\" standalone=\"yes\"?><Relationships xmlns=\"http://schemas.openxmlformats.org/package/2006/relationships\"><Relationship Id=\"rId1\" Type=\"http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument\" Target=\"xl/workbook.xml\"/></Relationships>");

                var wb = new StringBuilder("<?xml version=\"1.0\" encoding=\"UTF-8\" standalone=\"yes\"?><workbook xmlns=\"http://schemas.openxmlformats.org/spreadsheetml/2006/main\" xmlns:r=\"http://schemas.openxmlformats.org/officeDocument/2006/relationships\"><sheets>");
                var rels = new StringBuilder("<?xml version=\"1.0\" encoding=\"UTF-8\" standalone=\"yes\"?><Relationships xmlns=\"http://schemas.openxmlformats.org/package/2006/relationships\">");
                var used = new HashSet<string>(StringComparer.OrdinalIgnoreCase);
                for (int i = 0; i < sheets.Count; i++)
                {
                    var name = SafeSheetName(Str(sheets[i], "name") ?? $"Sayfa {i + 1}", used);
                    wb.Append($"<sheet name=\"{Esc(name)}\" sheetId=\"{i + 1}\" r:id=\"rId{i + 1}\"/>");
                    rels.Append($"<Relationship Id=\"rId{i + 1}\" Type=\"http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet\" Target=\"worksheets/sheet{i + 1}.xml\"/>");
                }
                wb.Append("</sheets></workbook>");
                rels.Append($"<Relationship Id=\"rId{sheets.Count + 1}\" Type=\"http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles\" Target=\"styles.xml\"/></Relationships>");
                Add("xl/workbook.xml", wb.ToString());
                Add("xl/_rels/workbook.xml.rels", rels.ToString());
                Add("xl/styles.xml", styles.ToXml());
                for (int i = 0; i < sheetXmls.Count; i++) Add($"xl/worksheets/sheet{i + 1}.xml", sheetXmls[i]);
            }
            return ms.ToArray();
        }

        private static string SafeSheetName(string n, HashSet<string> used)
        {
            n = Regex.Replace(n, @"[\\/*?:\[\]]", "_").Trim();
            if (n.Length == 0) n = "Sayfa";
            if (n.Length > 31) n = n[..31];
            var b = n; int k = 2;
            while (!used.Add(n)) { var suf = " (" + k++ + ")"; n = (b.Length + suf.Length > 31 ? b[..(31 - suf.Length)] : b) + suf; }
            return n;
        }

        private sealed class StyleBook
        {
            private readonly List<string> fonts = new() { "<font><sz val=\"11\"/><name val=\"Calibri\"/></font>" };
            private readonly List<string> fills = new() { "<fill><patternFill patternType=\"none\"/></fill>", "<fill><patternFill patternType=\"gray125\"/></fill>" };
            private readonly List<string> borders = new() { "<border><left/><right/><top/><bottom/><diagonal/></border>" };
            private readonly Dictionary<string, int> numFmts = new();
            private readonly List<string> xfs = new() { "<xf numFmtId=\"0\" fontId=\"0\" fillId=\"0\" borderId=\"0\" xfId=\"0\"/>" };
            private readonly Dictionary<string, int> xfIndex = new();

            private static int Idx(List<string> l, string x) { var i = l.IndexOf(x); if (i < 0) { l.Add(x); i = l.Count - 1; } return i; }

            public int Get(JsonElement cell)
            {
                bool b = Bool(cell, "bold"), it = Bool(cell, "italic"), u = Bool(cell, "underline"), st = Bool(cell, "strike"), wr = Bool(cell, "wrap");
                string? fg = Rgb(Str(cell, "color")), bg = Rgb(Str(cell, "background"));
                int fs = Int(cell, "fontSize") ?? 11;
                string? al = Str(cell, "align"), va = Str(cell, "vAlign"), bd = Str(cell, "border"), fmt = Str(cell, "format");
                bool locked = cell.TryGetProperty("enabled", out var en) && en.ValueKind == JsonValueKind.False;
                var key = string.Join("|", b, it, u, st, wr, fg, bg, fs, al, va, bd, fmt, locked);
                if (!b && !it && !u && !st && !wr && fg == null && bg == null && fs == 11 && al == null && va == null && string.IsNullOrEmpty(bd) && string.IsNullOrEmpty(fmt) && !locked) return 0;
                if (xfIndex.TryGetValue(key, out var found)) return found;

                var f = new StringBuilder("<font>");
                if (b) f.Append("<b/>"); if (it) f.Append("<i/>"); if (st) f.Append("<strike/>"); if (u) f.Append("<u/>");
                f.Append($"<sz val=\"{fs}\"/>");
                if (fg != null) f.Append($"<color rgb=\"{fg}\"/>");
                f.Append("<name val=\"Calibri\"/></font>");
                int fontId = Idx(fonts, f.ToString());
                int fillId = bg == null ? 0 : Idx(fills, $"<fill><patternFill patternType=\"solid\"><fgColor rgb=\"{bg}\"/><bgColor indexed=\"64\"/></patternFill></fill>");
                int borderId = 0;
                if (!string.IsNullOrEmpty(bd))
                {
                    string Side(string tag, char c) => bd!.Contains(c) ? $"<{tag} style=\"thin\"><color rgb=\"FF000000\"/></{tag}>" : $"<{tag}/>";
                    borderId = Idx(borders, "<border>" + Side("left", 'l') + Side("right", 'r') + Side("top", 't') + Side("bottom", 'b') + "<diagonal/></border>");
                }
                int numId = NumFmtId(fmt);

                var x = new StringBuilder($"<xf numFmtId=\"{numId}\" fontId=\"{fontId}\" fillId=\"{fillId}\" borderId=\"{borderId}\" xfId=\"0\"");
                if (numId != 0) x.Append(" applyNumberFormat=\"1\"");
                if (fontId != 0) x.Append(" applyFont=\"1\"");
                if (fillId != 0) x.Append(" applyFill=\"1\"");
                if (borderId != 0) x.Append(" applyBorder=\"1\"");
                bool hasAl = al != null || va != null || wr;
                if (hasAl) x.Append(" applyAlignment=\"1\"");
                if (locked) x.Append(" applyProtection=\"1\"");
                x.Append('>');
                if (hasAl)
                {
                    x.Append("<alignment");
                    if (al is "left" or "center" or "right") x.Append($" horizontal=\"{al}\"");
                    if (va != null) x.Append($" vertical=\"{(va == "middle" ? "center" : va)}\"");
                    if (wr) x.Append(" wrapText=\"1\"");
                    x.Append("/>");
                }
                if (locked) x.Append("<protection locked=\"1\"/>");
                x.Append("</xf>");
                xfs.Add(x.ToString());
                xfIndex[key] = xfs.Count - 1;
                return xfs.Count - 1;
            }

            private int NumFmtId(string? fmt)
            {
                if (string.IsNullOrEmpty(fmt)) return 0;
                if (fmt == "text") return 49;
                var code = fmt switch
                {
                    "number" => "#,##0.00",
                    "integer" => "#,##0",
                    "currency" => "#,##0.00\\ \"₺\"",
                    "percent" => "0%",
                    "percent2" => "0.00%",
                    "date" => "dd\\.mm\\.yyyy",
                    "datetime" => "dd\\.mm\\.yyyy\\ hh:mm",
                    "time" => "hh:mm",
                    "scientific" => "0.00E+00",
                    _ => ToExcelCode(fmt)
                };
                if (code == "0%") return 9;
                if (code == "0.00%") return 10;
                if (code == "#,##0") return 3;
                if (code == "#,##0.00") return 4;
                if (!numFmts.TryGetValue(code, out var id)) { id = 164 + numFmts.Count; numFmts[code] = id; }
                return id;
            }

            private static string ToExcelCode(string p)
            {
                // Tarih/saat kalıpları büyük-küçük harf duyarsızdır; ay/dakika ayrımını Excel bağlamdan yapar.
                if (!Regex.IsMatch(p, "[0#]") && Regex.IsMatch(p, "[dMyHms]")) return p.ToLowerInvariant();
                return p;
            }

            public string ToXml()
            {
                var sb = new StringBuilder("<?xml version=\"1.0\" encoding=\"UTF-8\" standalone=\"yes\"?><styleSheet xmlns=\"http://schemas.openxmlformats.org/spreadsheetml/2006/main\">");
                if (numFmts.Count > 0)
                {
                    sb.Append($"<numFmts count=\"{numFmts.Count}\">");
                    foreach (var kv in numFmts) sb.Append($"<numFmt numFmtId=\"{kv.Value}\" formatCode=\"{Esc(kv.Key)}\"/>");
                    sb.Append("</numFmts>");
                }
                sb.Append($"<fonts count=\"{fonts.Count}\">{string.Concat(fonts)}</fonts>");
                sb.Append($"<fills count=\"{fills.Count}\">{string.Concat(fills)}</fills>");
                sb.Append($"<borders count=\"{borders.Count}\">{string.Concat(borders)}</borders>");
                sb.Append("<cellStyleXfs count=\"1\"><xf numFmtId=\"0\" fontId=\"0\" fillId=\"0\" borderId=\"0\"/></cellStyleXfs>");
                sb.Append($"<cellXfs count=\"{xfs.Count}\">{string.Concat(xfs)}</cellXfs>");
                sb.Append("<cellStyles count=\"1\"><cellStyle name=\"Normal\" xfId=\"0\" builtinId=\"0\"/></cellStyles></styleSheet>");
                return sb.ToString();
            }
        }

        private static string BuildSheet(JsonElement s, StyleBook styles)
        {
            var sb = new StringBuilder("<?xml version=\"1.0\" encoding=\"UTF-8\" standalone=\"yes\"?><worksheet xmlns=\"http://schemas.openxmlformats.org/spreadsheetml/2006/main\">");
            int fr = Int(s, "frozenRows") ?? 0, fc = Int(s, "frozenCols") ?? 0;
            bool grid = !(s.TryGetProperty("showGridLines", out var g) && g.ValueKind == JsonValueKind.False);
            sb.Append($"<sheetViews><sheetView workbookViewId=\"0\"{(grid ? "" : " showGridLines=\"0\"")}>");
            if (fr > 0 || fc > 0)
            {
                var tl = ColName(fc + 1) + (fr + 1);
                var pane = fr > 0 && fc > 0 ? "bottomRight" : fr > 0 ? "bottomLeft" : "topRight";
                sb.Append("<pane" + (fc > 0 ? $" xSplit=\"{fc}\"" : "") + (fr > 0 ? $" ySplit=\"{fr}\"" : "") + $" topLeftCell=\"{tl}\" activePane=\"{pane}\" state=\"frozen\"/>");
            }
            sb.Append("</sheetView></sheetViews><sheetFormatPr defaultRowHeight=\"15\"/>");

            // Sütun genişlikleri
            if (s.TryGetProperty("columnWidths", out var cw) && cw.ValueKind == JsonValueKind.Object)
            {
                var cols = cw.EnumerateObject().Select(p => (c: int.TryParse(p.Name, out var ci) ? ci : 0, w: p.Value.ValueKind == JsonValueKind.Number ? p.Value.GetDouble() : 0)).Where(t => t.c > 0 && t.w > 0).OrderBy(t => t.c).ToList();
                if (cols.Count > 0)
                {
                    sb.Append("<cols>");
                    foreach (var (c, w) in cols) sb.Append($"<col min=\"{c}\" max=\"{c}\" width=\"{(Math.Round(w / 7.0 + 0.71, 2)).ToString(Inv)}\" customWidth=\"1\"/>");
                    sb.Append("</cols>");
                }
            }

            // Hücreler
            var rowH = new Dictionary<int, double>();
            if (s.TryGetProperty("rowHeights", out var rh) && rh.ValueKind == JsonValueKind.Object)
                foreach (var p in rh.EnumerateObject()) if (int.TryParse(p.Name, out var ri) && p.Value.ValueKind == JsonValueKind.Number) rowH[ri] = p.Value.GetDouble();

            var byRow = new SortedDictionary<int, SortedDictionary<int, JsonElement>>();
            if (s.TryGetProperty("cells", out var cells) && cells.ValueKind == JsonValueKind.Array)
                foreach (var c in cells.EnumerateArray())
                {
                    int r = Int(c, "row") ?? 0, col = Int(c, "col") ?? 0;
                    if (r < 1 || col < 1) continue;
                    if (!byRow.TryGetValue(r, out var rowD)) byRow[r] = rowD = new();
                    rowD[col] = c;
                }
            foreach (var r in rowH.Keys) if (!byRow.ContainsKey(r)) byRow[r] = new();

            sb.Append("<sheetData>");
            foreach (var (r, row) in byRow)
            {
                sb.Append($"<row r=\"{r}\"");
                if (rowH.TryGetValue(r, out var h)) sb.Append($" ht=\"{(h * 0.75).ToString("0.##", Inv)}\" customHeight=\"1\"");
                sb.Append('>');
                foreach (var (col, c) in row)
                {
                    var addr = ColName(col) + r;
                    int xf = styles.Get(c);
                    var formula = Str(c, "formula");
                    var val = Str(c, "value");
                    var fmt = Str(c, "format");
                    sb.Append($"<c r=\"{addr}\"{(xf != 0 ? $" s=\"{xf}\"" : "")}");
                    string? f = string.IsNullOrWhiteSpace(formula) ? null : (formula!.StartsWith('=') ? formula[1..] : formula);
                    if (f != null)
                    {
                        if (val != null && val.StartsWith('#')) sb.Append($" t=\"e\"><f>{Esc(f)}</f><v>{Esc(val)}</v></c>");
                        else if (val is "TRUE" or "FALSE") sb.Append($" t=\"b\"><f>{Esc(f)}</f><v>{(val == "TRUE" ? 1 : 0)}</v></c>");
                        else if (val != null && fmt != "text" && double.TryParse(val, NumberStyles.Float, Inv, out var dv)) sb.Append($"><f>{Esc(f)}</f><v>{dv.ToString("R", Inv)}</v></c>");
                        else if (val != null) sb.Append($" t=\"str\"><f>{Esc(f)}</f><v>{Esc(val)}</v></c>");
                        else sb.Append($"><f>{Esc(f)}</f></c>");
                    }
                    else if (val == null || val.Length == 0) sb.Append("/>");
                    else if (val is "TRUE" or "FALSE" && fmt != "text") sb.Append($" t=\"b\"><v>{(val == "TRUE" ? 1 : 0)}</v></c>");
                    else if (fmt != "text" && double.TryParse(val, NumberStyles.Float, Inv, out var num) && !double.IsNaN(num) && !double.IsInfinity(num)) sb.Append($"><v>{num.ToString("R", Inv)}</v></c>");
                    else sb.Append($" t=\"inlineStr\"><is><t xml:space=\"preserve\">{Esc(val)}</t></is></c>");
                }
                sb.Append("</row>");
            }
            sb.Append("</sheetData>");

            var filter = Str(s, "filter");
            if (!string.IsNullOrWhiteSpace(filter)) sb.Append($"<autoFilter ref=\"{Esc(filter!)}\"/>");

            if (s.TryGetProperty("mergedCells", out var mc) && mc.ValueKind == JsonValueKind.Array)
            {
                var list = mc.EnumerateArray().Select(x => x.GetString()).Where(x => !string.IsNullOrEmpty(x) && x!.Contains(':')).ToList();
                if (list.Count > 0)
                {
                    sb.Append($"<mergeCells count=\"{list.Count}\">");
                    foreach (var m in list) sb.Append($"<mergeCell ref=\"{Esc(m!)}\"/>");
                    sb.Append("</mergeCells>");
                }
            }

            if (s.TryGetProperty("validations", out var vs) && vs.ValueKind == JsonValueKind.Array && vs.GetArrayLength() > 0)
            {
                var vb = new StringBuilder();
                int n = 0;
                foreach (var v in vs.EnumerateArray())
                {
                    var range = Str(v, "range"); var type = Str(v, "type") ?? "list";
                    if (string.IsNullOrEmpty(range)) continue;
                    var xt = type switch { "list" => "list", "whole" => "whole", "decimal" => "decimal", "date" => "date", "textLength" => "textLength", "custom" => "custom", _ => null };
                    if (xt == null) continue;
                    var cmp = Str(v, "comparer") ?? "between";
                    var op = cmp switch { "notBetween" => "notBetween", "equalTo" => "equal", "notEqualTo" => "notEqual", "greaterThan" => "greaterThan", "lessThan" => "lessThan", "greaterThanOrEqualTo" => "greaterThanOrEqual", "lessThanOrEqualTo" => "lessThanOrEqual", _ => "between" };
                    string f1, f2 = "";
                    if (xt == "list")
                    {
                        var items = v.TryGetProperty("items", out var it) && it.ValueKind == JsonValueKind.Array ? it.EnumerateArray().Select(x => x.GetString() ?? "") : Enumerable.Empty<string>();
                        f1 = "\"" + string.Join(",", items).Replace("\"", "\"\"") + "\"";
                    }
                    else if (xt == "custom") f1 = (Str(v, "formula") ?? "TRUE").TrimStart('=');
                    else { f1 = Str(v, "from") ?? "0"; f2 = Str(v, "to") ?? ""; }
                    bool allowNull = !(v.TryGetProperty("allowNulls", out var an) && an.ValueKind == JsonValueKind.False);
                    bool reject = !(v.TryGetProperty("reject", out var rj) && rj.ValueKind == JsonValueKind.False);
                    vb.Append($"<dataValidation type=\"{xt}\"");
                    if (xt is not ("list" or "custom")) vb.Append($" operator=\"{op}\"");
                    vb.Append($" allowBlank=\"{(allowNull ? 1 : 0)}\" showInputMessage=\"1\" showErrorMessage=\"1\" errorStyle=\"{(reject ? "stop" : "warning")}\"");
                    var tt = Str(v, "title"); var mm = Str(v, "message"); var er = Str(v, "error");
                    if (!string.IsNullOrEmpty(tt)) vb.Append($" promptTitle=\"{Esc(Trunc(tt!, 32))}\"");
                    if (!string.IsNullOrEmpty(mm)) vb.Append($" prompt=\"{Esc(Trunc(mm!, 255))}\"");
                    if (!string.IsNullOrEmpty(er)) vb.Append($" error=\"{Esc(Trunc(er!, 255))}\"");
                    vb.Append($" sqref=\"{Esc(range!)}\"><formula1>{Esc(f1)}</formula1>");
                    if (xt is not ("list" or "custom") && (op is "between" or "notBetween") && f2.Length > 0) vb.Append($"<formula2>{Esc(f2)}</formula2>");
                    vb.Append("</dataValidation>");
                    n++;
                }
                if (n > 0) sb.Append($"<dataValidations count=\"{n}\">{vb}</dataValidations>");
            }

            sb.Append("</worksheet>");
            return sb.ToString();
        }

        // ==================================================================
        //  OKUMA (XLSX -> sayfa listesi)
        // ==================================================================
        public static List<Dictionary<string, object?>> Read(Stream input)
        {
            using var zip = new ZipArchive(input, ZipArchiveMode.Read, true);
            XDocument Load(string path)
            {
                var e = zip.GetEntry(path) ?? throw new InvalidDataException("Geçersiz xlsx: " + path);
                using var st = e.Open();
                return XDocument.Load(st);
            }

            var wb = Load("xl/workbook.xml");
            var rels = Load("xl/_rels/workbook.xml.rels");
            var relMap = rels.Descendants(PkgRel + "Relationship").ToDictionary(x => (string)x.Attribute("Id")!, x => (string)x.Attribute("Target")!);

            var shared = new List<string>();
            var sstEntry = zip.GetEntry("xl/sharedStrings.xml");
            if (sstEntry != null)
            {
                using var st = sstEntry.Open();
                foreach (var si in XDocument.Load(st).Descendants(Ns + "si"))
                    shared.Add(string.Concat(si.Descendants(Ns + "t").Where(t => t.Parent?.Name != Ns + "rPh").Select(t => t.Value)));
            }

            var xfs = ReadStyles(zip);

            var result = new List<Dictionary<string, object?>>();
            foreach (var sheetEl in wb.Descendants(Ns + "sheet"))
            {
                var name = (string?)sheetEl.Attribute("name") ?? "Sayfa";
                var rid = (string?)sheetEl.Attribute(RNs + "id");
                if (rid == null || !relMap.TryGetValue(rid, out var target)) continue;
                var path = target.StartsWith('/') ? target[1..] : "xl/" + target;
                if (zip.GetEntry(path) == null) continue;
                result.Add(ReadSheet(Load(path), name, shared, xfs));
            }
            return result;
        }

        private sealed class XfInfo { public string? Fmt; public bool B, I, U, S; public string? Fg, Bg, Al, Va; public bool Wrap; public int? Fs; public string? Bd; public bool Locked = true; }

        private static List<XfInfo> ReadStyles(ZipArchive zip)
        {
            var list = new List<XfInfo>();
            var e = zip.GetEntry("xl/styles.xml");
            if (e == null) return list;
            XDocument doc;
            using (var st = e.Open()) doc = XDocument.Load(st);

            var custom = doc.Descendants(Ns + "numFmt").ToDictionary(x => (int)x.Attribute("numFmtId")!, x => (string)x.Attribute("formatCode")!);
            var fonts = doc.Descendants(Ns + "fonts").Elements(Ns + "font").ToList();
            var fills = doc.Descendants(Ns + "fills").Elements(Ns + "fill").ToList();
            var borders = doc.Descendants(Ns + "borders").Elements(Ns + "border").ToList();

            foreach (var xf in doc.Descendants(Ns + "cellXfs").Elements(Ns + "xf"))
            {
                var info = new XfInfo();
                int numId = (int?)xf.Attribute("numFmtId") ?? 0;
                info.Fmt = numId switch
                {
                    0 => null,
                    1 => "0", 2 => "0.00", 3 => "integer", 4 => "number", 9 => "percent", 10 => "percent2",
                    14 or 15 or 16 or 17 => "date",
                    18 or 19 or 20 or 21 => "time",
                    22 => "datetime",
                    49 => "text",
                    _ => custom.TryGetValue(numId, out var code) ? FromExcelCode(code) : null
                };
                int fi = (int?)xf.Attribute("fontId") ?? 0;
                if (fi < fonts.Count)
                {
                    var f = fonts[fi];
                    info.B = f.Element(Ns + "b") != null; info.I = f.Element(Ns + "i") != null; info.S = f.Element(Ns + "strike") != null; info.U = f.Element(Ns + "u") != null;
                    info.Fs = (int?)f.Element(Ns + "sz")?.Attribute("val") is int sz && sz != 11 ? sz : null;
                    var rgb = (string?)f.Element(Ns + "color")?.Attribute("rgb");
                    if (!string.IsNullOrEmpty(rgb) && rgb.Length == 8 && !rgb.Equals("FF000000", StringComparison.OrdinalIgnoreCase)) info.Fg = "#" + rgb[2..];
                }
                int fl = (int?)xf.Attribute("fillId") ?? 0;
                if (fl > 1 && fl < fills.Count)
                {
                    var rgb = (string?)fills[fl].Descendants(Ns + "fgColor").FirstOrDefault()?.Attribute("rgb");
                    if (!string.IsNullOrEmpty(rgb) && rgb.Length == 8) info.Bg = "#" + rgb[2..];
                }
                int bi = (int?)xf.Attribute("borderId") ?? 0;
                if (bi > 0 && bi < borders.Count)
                {
                    var b = borders[bi]; var sbd = new StringBuilder();
                    if (b.Element(Ns + "top")?.Attribute("style") != null) sbd.Append('t');
                    if (b.Element(Ns + "bottom")?.Attribute("style") != null) sbd.Append('b');
                    if (b.Element(Ns + "left")?.Attribute("style") != null) sbd.Append('l');
                    if (b.Element(Ns + "right")?.Attribute("style") != null) sbd.Append('r');
                    if (sbd.Length > 0) info.Bd = sbd.ToString();
                }
                var al = xf.Element(Ns + "alignment");
                if (al != null)
                {
                    var h = (string?)al.Attribute("horizontal"); if (h is "left" or "center" or "right") info.Al = h;
                    var v = (string?)al.Attribute("vertical"); if (v != null) info.Va = v == "center" ? "middle" : v is "top" or "bottom" ? v : null;
                    info.Wrap = (string?)al.Attribute("wrapText") is "1" or "true";
                }
                list.Add(info);
            }
            return list;
        }

        private static string FromExcelCode(string code)
        {
            var c = code.Replace("\\.", ".").Replace("\\ ", " ").Replace("\\-", "-");
            if (c == "dd.mm.yyyy") return "date";
            if (c == "dd.mm.yyyy hh:mm") return "datetime";
            if (c == "hh:mm") return "time";
            if (c == "General") return "";
            if (!Regex.IsMatch(c, "[0#]") && Regex.IsMatch(c, "[dmyhs]", RegexOptions.IgnoreCase))
            {
                // ay (M) / dakika (m) ayrımı: h'den sonra ya da s'den önce gelen 'm' dakikadır.
                var sb = new StringBuilder(); var lower = c.ToLowerInvariant();
                for (int i = 0; i < lower.Length; i++)
                {
                    char ch = lower[i];
                    if (ch == 'm')
                    {
                        int j = i; while (j < lower.Length && lower[j] == 'm') j++;
                        var before = lower[..i].TrimEnd(' ', ':'); var after = lower[j..].TrimStart(' ', ':');
                        bool minute = before.EndsWith('h') || after.StartsWith('s');
                        sb.Append(minute ? new string('m', j - i) : new string('M', j - i)); i = j - 1;
                    }
                    else if (ch == 'h') sb.Append('H'); else sb.Append(ch);
                }
                return sb.ToString();
            }
            return c;
        }

        private static Dictionary<string, object?> ReadSheet(XDocument doc, string name, List<string> shared, List<XfInfo> xfs)
        {
            var cells = new List<Dictionary<string, object?>>();
            int maxR = 0, maxC = 0;
            foreach (var c in doc.Descendants(Ns + "c"))
            {
                var addr = (string?)c.Attribute("r"); if (addr == null) continue;
                var (col, row) = ParseAddr(addr);
                if (row < 1 || col < 1) continue;
                var t = (string?)c.Attribute("t");
                var vEl = c.Element(Ns + "v");
                var f = c.Element(Ns + "f")?.Value;
                string? value = null;
                if (t == "s" && vEl != null && int.TryParse(vEl.Value, out var si) && si < shared.Count) value = shared[si];
                else if (t == "inlineStr") value = string.Concat(c.Descendants(Ns + "t").Select(x => x.Value));
                else if (t == "b" && vEl != null) value = vEl.Value == "1" ? "TRUE" : "FALSE";
                else if (vEl != null) value = vEl.Value;

                int sIdx = (int?)c.Attribute("s") ?? 0;
                var xf = sIdx < xfs.Count ? xfs[sIdx] : new XfInfo();
                var d = new Dictionary<string, object?> { ["row"] = row, ["col"] = col };
                if (!string.IsNullOrEmpty(f)) d["formula"] = "=" + f;
                if (value != null && value.Length > 0 && string.IsNullOrEmpty(f)) d["value"] = value;
                else if (value != null && !string.IsNullOrEmpty(f)) d["value"] = value;
                if (xf.B) d["bold"] = true; if (xf.I) d["italic"] = true; if (xf.U) d["underline"] = true; if (xf.S) d["strike"] = true;
                if (xf.Fmt != null && xf.Fmt.Length > 0) d["format"] = xf.Fmt;
                if (xf.Fg != null) d["color"] = xf.Fg; if (xf.Bg != null) d["background"] = xf.Bg;
                if (xf.Al != null) d["align"] = xf.Al; if (xf.Va != null) d["vAlign"] = xf.Va;
                if (xf.Wrap) d["wrap"] = true; if (xf.Fs != null) d["fontSize"] = xf.Fs; if (xf.Bd != null) d["border"] = xf.Bd;
                if (d.Count > 2) { cells.Add(d); maxR = Math.Max(maxR, row); maxC = Math.Max(maxC, col); }
            }

            var colW = new Dictionary<string, int>();
            foreach (var cEl in doc.Descendants(Ns + "col"))
            {
                int min = (int?)cEl.Attribute("min") ?? 0, max = (int?)cEl.Attribute("max") ?? 0;
                var w = (double?)cEl.Attribute("width");
                if (w == null || min < 1 || max - min > 200) continue;
                for (int i = min; i <= max; i++) colW[i.ToString()] = (int)Math.Round(Math.Max(0, w.Value - 0.71) * 7);
            }
            var rowH = new Dictionary<string, int>();
            foreach (var r in doc.Descendants(Ns + "row"))
            {
                var ht = (double?)r.Attribute("ht"); int ri = (int?)r.Attribute("r") ?? 0;
                if (ht != null && ri > 0 && (string?)r.Attribute("customHeight") is "1" or "true") rowH[ri.ToString()] = (int)Math.Round(ht.Value / 0.75);
            }
            var merges = doc.Descendants(Ns + "mergeCell").Select(m => (string?)m.Attribute("ref")).Where(x => !string.IsNullOrEmpty(x)).ToList();
            foreach (var m in merges) { var p = m!.Split(':'); if (p.Length == 2) { var e = ParseAddr(p[1]); maxR = Math.Max(maxR, e.row); maxC = Math.Max(maxC, e.col); } }

            int fr = 0, fc = 0;
            var pane = doc.Descendants(Ns + "pane").FirstOrDefault();
            if (pane != null && (string?)pane.Attribute("state") is "frozen" or "frozenSplit") { fr = (int?)(double?)pane.Attribute("ySplit") ?? 0; fc = (int?)(double?)pane.Attribute("xSplit") ?? 0; }

            var validations = new List<Dictionary<string, object?>>();
            foreach (var dv in doc.Descendants(Ns + "dataValidation"))
            {
                var type = (string?)dv.Attribute("type"); var sq = (string?)dv.Attribute("sqref");
                if (type == null || sq == null) continue;
                var mapped = type switch { "list" => "list", "whole" => "whole", "decimal" => "decimal", "date" => "date", "textLength" => "textLength", "custom" => "custom", _ => null };
                if (mapped == null) continue;
                var f1 = dv.Element(Ns + "formula1")?.Value ?? ""; var f2 = dv.Element(Ns + "formula2")?.Value;
                var op = (string?)dv.Attribute("operator") ?? "between";
                var cmp = op switch { "notBetween" => "notBetween", "equal" => "equalTo", "notEqual" => "notEqualTo", "greaterThan" => "greaterThan", "lessThan" => "lessThan", "greaterThanOrEqual" => "greaterThanOrEqualTo", "lessThanOrEqual" => "lessThanOrEqualTo", _ => "between" };
                var v = new Dictionary<string, object?> { ["range"] = sq.Split(' ')[0], ["type"] = mapped, ["comparer"] = cmp };
                if (mapped == "list") { if (f1.StartsWith('"')) v["items"] = f1.Trim('"').Split(',').Select(x => x.Trim()).ToList(); else continue; }
                else if (mapped == "custom") v["formula"] = "=" + f1;
                else { v["from"] = f1; if (f2 != null) v["to"] = f2; }
                v["allowNulls"] = (string?)dv.Attribute("allowBlank") is "1" or "true";
                v["reject"] = ((string?)dv.Attribute("errorStyle") ?? "stop") == "stop";
                if (dv.Attribute("promptTitle") != null) v["title"] = (string?)dv.Attribute("promptTitle");
                if (dv.Attribute("prompt") != null) v["message"] = (string?)dv.Attribute("prompt");
                if (dv.Attribute("error") != null) v["error"] = (string?)dv.Attribute("error");
                validations.Add(v);
            }

            var sheetView = doc.Descendants(Ns + "sheetView").FirstOrDefault();
            bool grid = !((string?)sheetView?.Attribute("showGridLines") is "0" or "false");
            var autoFilter = (string?)doc.Descendants(Ns + "autoFilter").FirstOrDefault()?.Attribute("ref");

            var o = new Dictionary<string, object?>
            {
                ["name"] = name,
                ["rows"] = Math.Max(30, maxR + 10),
                ["cols"] = Math.Max(12, maxC + 2),
                ["cells"] = cells,
                ["showGridLines"] = grid
            };
            if (colW.Count > 0) o["columnWidths"] = colW;
            if (rowH.Count > 0) o["rowHeights"] = rowH;
            if (merges.Count > 0) o["mergedCells"] = merges;
            if (fr > 0) o["frozenRows"] = fr;
            if (fc > 0) o["frozenCols"] = fc;
            if (validations.Count > 0) o["validations"] = validations;
            if (!string.IsNullOrEmpty(autoFilter)) o["filter"] = autoFilter;
            return o;
        }

        // ==================================================================
        //  Yardımcılar
        // ==================================================================
        private static string? Str(JsonElement e, string name)
        {
            if (e.ValueKind != JsonValueKind.Object || !e.TryGetProperty(name, out var p)) return null;
            return p.ValueKind switch
            {
                JsonValueKind.String => p.GetString(),
                JsonValueKind.Number => p.GetRawText(),
                JsonValueKind.True => "true",
                JsonValueKind.False => "false",
                _ => null
            };
        }

        private static bool Bool(JsonElement e, string name) => e.ValueKind == JsonValueKind.Object && e.TryGetProperty(name, out var p) && p.ValueKind == JsonValueKind.True;

        private static int? Int(JsonElement e, string name)
        {
            if (e.ValueKind != JsonValueKind.Object || !e.TryGetProperty(name, out var p)) return null;
            if (p.ValueKind == JsonValueKind.Number && p.TryGetDouble(out var d)) return (int)Math.Round(d);
            if (p.ValueKind == JsonValueKind.String && int.TryParse(p.GetString(), out var i)) return i;
            return null;
        }

        private static string? Rgb(string? css)
        {
            if (string.IsNullOrWhiteSpace(css)) return null;
            css = css.Trim();
            var m = Regex.Match(css, "^#([0-9a-fA-F]{6})$");
            if (m.Success) return "FF" + m.Groups[1].Value.ToUpperInvariant();
            m = Regex.Match(css, "^#([0-9a-fA-F])([0-9a-fA-F])([0-9a-fA-F])$");
            if (m.Success) return "FF" + $"{m.Groups[1].Value}{m.Groups[1].Value}{m.Groups[2].Value}{m.Groups[2].Value}{m.Groups[3].Value}{m.Groups[3].Value}".ToUpperInvariant();
            m = Regex.Match(css, @"^rgba?\((\d+)\s*,\s*(\d+)\s*,\s*(\d+)");
            if (m.Success) return "FF" + int.Parse(m.Groups[1].Value).ToString("X2") + int.Parse(m.Groups[2].Value).ToString("X2") + int.Parse(m.Groups[3].Value).ToString("X2");
            return null;
        }

        private static string Esc(string s)
        {
            var sb = new StringBuilder(s.Length + 8);
            foreach (var ch in s)
            {
                if (ch == '&') sb.Append("&amp;");
                else if (ch == '<') sb.Append("&lt;");
                else if (ch == '>') sb.Append("&gt;");
                else if (ch == '"') sb.Append("&quot;");
                else if (ch < 0x20 && ch != '\t' && ch != '\n' && ch != '\r') continue; // XML'de geçersiz denetim karakterleri
                else sb.Append(ch);
            }
            return sb.ToString();
        }

        private static string Trunc(string s, int n) => s.Length <= n ? s : s[..n];

        private static string ColName(int c)
        {
            var sb = new StringBuilder();
            while (c > 0) { c--; sb.Insert(0, (char)('A' + c % 26)); c /= 26; }
            return sb.ToString();
        }

        private static (int col, int row) ParseAddr(string a)
        {
            var m = Regex.Match(a, @"^\$?([A-Za-z]+)\$?(\d+)$");
            if (!m.Success) return (0, 0);
            int col = 0;
            foreach (var ch in m.Groups[1].Value.ToUpperInvariant()) col = col * 26 + (ch - 'A' + 1);
            return (col, int.Parse(m.Groups[2].Value));
        }
    }
}
