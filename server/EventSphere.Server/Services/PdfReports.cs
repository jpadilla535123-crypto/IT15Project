using System.Globalization;
using System.Text;

namespace EventSphere.Server.Services;

/* Minimal, dependency-free PDF writer (A4, built-in Helvetica fonts).
   Renders headings, key/value pairs, notes and fixed-column tables with
   automatic pagination. Only ASCII text is shown; non-ASCII characters are
   transliterated to safe equivalents by Sanitize(). */
public sealed class PdfDocument
{
    private const float PW = 595.28f;
    private const float PH = 841.89f;
    private const float ML = 52f;
    private const float MR = 52f;
    private const float MB = 48f;
    private const float HeaderH = 76f;
    private const float BodyW = PW - ML - MR;

    private readonly string _title;
    private readonly string _subtitle;
    private readonly StringBuilder _content = new();
    private readonly List<string> _pages = new();
    private float _top = HeaderH + 20f;
    private int _pageNo;
    private bool _dirty;

    public PdfDocument(string title, string subtitle)
    {
        _title = Sanitize(title);
        _subtitle = Sanitize(subtitle);
        NewPage();
    }

    public void Heading(string text)
    {
        Ensure(28);
        Text(Sanitize(text), ML, _top, 12f, true, 0.82f, 0.12f, 0.38f);
        _top += 16f;
        HLine(_top - 5f, 0.86f, 0.88f, 0.92f);
        _top += 12f;
    }

    public void Pair(string label, string value)
    {
        Ensure(17);
        Text(Sanitize(label), ML, _top, 10f, false, 0.28f, 0.32f, 0.38f);
        Text(Sanitize(value), PW - MR - Width(value, 10f), _top, 10f, true, 0.13f, 0.16f, 0.22f);
        _top += 15f;
    }

    public void Note(string text)
    {
        Ensure(15);
        Text(Sanitize(text), ML, _top, 9f, false, 0.45f, 0.5f, 0.56f);
        _top += 13f;
    }

    public void Blank(float space = 8f) => _top += space;

    public void Table(string[] headers, IReadOnlyList<string[]> rows, float[] widths)
    {
        var cols = headers.Length;
        var total = widths.Sum();
        if (total <= 0) total = cols;

        var starts = new float[cols];
        var x = ML;
        for (var i = 0; i < cols; i++)
        {
            starts[i] = x;
            x += widths[i] / total * BodyW;
        }

        var font = 9f;
        var rowH = 15f;

        if (rows.Count > 0 && _top + 22f > PH - MB) NewPage();

        for (var i = 0; i < cols; i++)
            Text(Sanitize(headers[i]), starts[i] + 4f, _top, font, true, 0.82f, 0.12f, 0.38f);
        _top += 15f;
        HLine(_top - 4f, 0.86f, 0.88f, 0.92f);

        foreach (var row in rows)
        {
            if (_top + rowH > PH - MB) NewPage();
            for (var i = 0; i < cols; i++)
            {
                var cell = row.Length > i ? row[i] : string.Empty;
                var maxChars = (int)Math.Floor((widths[i] / total * BodyW - 10f) / (font * 0.5f));
                if (maxChars < 4) maxChars = 4;
                if (cell.Length > maxChars)
                    cell = cell.Remove(Math.Max(1, maxChars - 1)) + "~";
                Text(Sanitize(cell), starts[i] + 4f, _top, font, i == 0, 0.28f, 0.32f, 0.38f);
            }
            _top += rowH;
        }
        _top += 4f;
    }

    public byte[] ToPdf()
    {
        if (_dirty)
        {
            _pages.Add(_content.ToString());
            _content.Clear();
            _dirty = false;
        }

        var nPages = _pages.Count;
        if (nPages == 0) return Array.Empty<byte>();

        var f1 = 4 + nPages * 2;
        var f2 = 5 + nPages * 2;

        var sb = new StringBuilder();
        sb.Append("%PDF-1.4\n");

        var objCount = 0;
        var offsets = new List<long>();
        void Obj(string body)
        {
            offsets.Add(sb.Length);
            objCount++;
            sb.Append(objCount).Append(" 0 obj\n").Append(body).Append("\nendobj\n");
        }

        var kids = new StringBuilder();
        for (var i = 0; i < nPages; i++)
            kids.Append(3 + i * 2).Append(" 0 R ");

        Obj("<< /Type /Catalog /Pages 2 0 R >>");
        Obj($"<< /Type /Pages /Kids [{kids}] /Count {nPages} >>");

        for (var i = 0; i < nPages; i++)
        {
            var pageId = 3 + i * 2;
            var contentId = 4 + i * 2;
            var stream = _pages[i];
            Obj($"<< /Type /Page /Parent 2 0 R /MediaBox [0 0 {N(PW)} {N(PH)}] /Resources << /Font << /F1 {f1} 0 R /F2 {f2} 0 R >> >> /Contents {contentId} 0 R >>");
            Obj($"<< /Length {stream.Length} >>\nstream\n{stream}\nendstream");
        }

        Obj("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>");
        Obj("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>");

        var xref = sb.Length;
        sb.Append("xref\n0 ").Append(objCount + 1).Append('\n');
        sb.Append("0000000000 65535 f \n");
        foreach (var off in offsets)
            sb.Append(off.ToString("D10", CultureInfo.InvariantCulture)).Append(" 00000 n \n");
        sb.Append("trailer\n<< /Size ").Append(objCount + 1).Append(" /Root 1 0 R >>\nstartxref\n").Append(xref).Append("\n%%EOF\n");

        return Encoding.ASCII.GetBytes(sb.ToString());
    }

    private void Ensure(float space)
    {
        if (_top + space > PH - MB) NewPage();
    }

    private void NewPage()
    {
        if (_dirty)
        {
            _pages.Add(_content.ToString());
            _content.Clear();
        }
        _pageNo++;
        _top = HeaderH + 18f;
        _dirty = true;

        Rect(0f, 0f, PW, HeaderH, 0.13f, 0.16f, 0.22f, true);
        Text(_title, ML + 24f, HeaderH * 0.5f - 4f, 15f, true, 1f, 1f, 1f);
        Text(_subtitle, ML + 24f, HeaderH * 0.5f + 16f, 9f, false, 0.72f, 0.76f, 0.82f);
        var pageLabel = "Page " + _pageNo;
        Text(pageLabel, PW - MR - Width(pageLabel, 9f), HeaderH * 0.5f - 4f, 9f, false, 0.72f, 0.76f, 0.82f);
    }

    private void Text(string s, float x, float top, float size, bool bold, float r, float g, float b)
    {
        var btm = PH - top - size * 0.8f;
        _content.Append("BT /F").Append(bold ? '2' : '1').Append(' ').Append(N(size)).Append(" Tf ")
            .Append(N(r)).Append(' ').Append(N(g)).Append(' ').Append(N(b)).Append(" rg ")
            .Append(N(x)).Append(' ').Append(N(btm)).Append(" Td (").Append(Esc(s)).Append(") Tj ET\n");
    }

    private void Rect(float x, float top, float w, float h, float r, float g, float b, bool fill)
    {
        var y = PH - top - h;
        _content.Append(N(r)).Append(' ').Append(N(g)).Append(' ').Append(N(b)).Append(" rg ")
            .Append(N(x)).Append(' ').Append(N(y)).Append(' ').Append(N(w)).Append(' ').Append(N(h))
            .Append(" re ").Append(fill ? 'f' : 'S').Append('\n');
    }

    private void HLine(float top, float r, float g, float b)
    {
        var y = PH - top;
        _content.Append(N(r)).Append(' ').Append(N(g)).Append(' ').Append(N(b)).Append(" RG\n")
            .Append(N(ML)).Append(' ').Append(N(y)).Append(" m ").Append(N(PW - MR)).Append(' ').Append(N(y)).Append(" l S\n");
    }

    private static float Width(string s, float size) => s.Length * size * 0.5f;

    private static string N(float v) => Math.Round(v, 2).ToString("0.##", CultureInfo.InvariantCulture);

    private static string Sanitize(string s)
    {
        var sb = new StringBuilder(s.Length);
        foreach (var c in s)
        {
            if (c == '—' || c == '–' || c == '·') sb.Append('-');
            else if (c == '’') sb.Append('\'');
            else if (c == '“' || c == '”') sb.Append('"');
            else if (c == '…') sb.Append("...");
            else if (c == '₱') sb.Append("PHP ");
            else if (c < 128) sb.Append(c);
            else sb.Append('?');
        }
        return sb.ToString();
    }

    private static string Esc(string s) => s.Replace("\\", "\\\\").Replace("(", "\\(").Replace(")", "\\)");
}