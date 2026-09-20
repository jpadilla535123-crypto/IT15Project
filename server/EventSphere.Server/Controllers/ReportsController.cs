using System.Globalization;
using EventSphere.Server.Data;
using EventSphere.Server.Models;
using EventSphere.Server.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace EventSphere.Server.Controllers;

/* Finance & HR reporting endpoints.
   - finance:  aggregated month dataset (income, expenses, per-event profit, staff)
   - staff:    per-employee attendance / duties / payslip summary for a month
   - publish:  Finance generates + stores the monthly PDF report (uploaded every month)
   - request:  Admin/Manager on-demand PDF covering the current covered days (immediate)
   - documents: lists the published monthly PDFs (the libraries admins/managers check) */
[ApiController]
[Route("api/reports")]
[Authorize(Roles = "Admin,Manager,Finance")]
public class ReportsController : ControllerBase
{
    private const string UploadDir = "uploads/reports";

    private readonly AppDbContext _db;
    private readonly IWebHostEnvironment _env;

    public ReportsController(AppDbContext db, IWebHostEnvironment env)
    {
        _db = db;
        _env = env;
    }

    private string Root => _env.WebRootPath ?? Path.Combine(_env.ContentRootPath, "wwwroot");

    [HttpGet("finance")]
    public async Task<IActionResult> Finance(int? month = null, int? year = null)
    {
        var now = DateTime.Today;
        var m = Math.Clamp(month ?? now.Month, 1, 12);
        var y = year ?? now.Year;
        var start = new DateTime(y, m, 1);
        var data = await LoadAsync(start, start.AddMonths(1).AddDays(-1));
        return Ok(ToDto(data));
    }

    [HttpGet("staff")]
    public async Task<IActionResult> Staff(int? month = null, int? year = null)
    {
        var now = DateTime.Today;
        var m = Math.Clamp(month ?? now.Month, 1, 12);
        var y = year ?? now.Year;
        var start = new DateTime(y, m, 1);
        var data = await LoadAsync(start, start.AddMonths(1).AddDays(-1));
        return Ok(data.Staff.Select(s => new
        {
            s.Name,
            s.Role,
            s.Worked,
            s.Absents,
            s.Lates,
            s.Leaves,
            s.Duties,
            s.Hours,
            s.Salary,
            payslip = s.Payslip == null ? null : new
            {
                s.Payslip.DaysWorked,
                s.Payslip.Absents,
                s.Payslip.DailyRate,
                s.Payslip.GrossPay,
                s.Payslip.Deductions,
                s.Payslip.NetPay,
                s.Payslip.Status,
            },
        }));
    }

    [HttpPost("publish")]
    [Authorize(Roles = "Finance")]
    public async Task<IActionResult> Publish(int? month = null, int? year = null)
    {
        var now = DateTime.Today;
        var m = Math.Clamp(month ?? now.Month, 1, 12);
        var y = year ?? now.Year;
        var start = new DateTime(y, m, 1);
        var end = start.AddMonths(1).AddDays(-1);
        var data = await LoadAsync(start, end);
        data.Note = $"Published {now:yyyy-MM-dd} · covers the full month of {data.PeriodLabel}";

        var bytes = BuildPdf(data);
        var dir = Path.Combine(Root, UploadDir);
        Directory.CreateDirectory(dir);
        var fileName = $"report-{y}-{m:00}.pdf";
        await System.IO.File.WriteAllBytesAsync(Path.Combine(dir, fileName), bytes);

        return Ok(new
        {
            fileName,
            url = $"/{UploadDir}/{fileName}",
            month = m,
            year = y,
            size = bytes.Length,
            generatedAt = now,
        });
    }

    [HttpGet("documents")]
    public IActionResult Documents()
    {
        var dir = Path.Combine(Root, UploadDir);
        var list = new List<ReportDocument>();
        if (Directory.Exists(dir))
        {
            foreach (var f in Directory.GetFiles(dir, "report-*.pdf"))
            {
                var name = Path.GetFileName(f);
                if (!TryParseReportName(name, out var m, out var y))
                    continue;
                var info = new FileInfo(f);
                list.Add(new ReportDocument
                {
                    FileName = name,
                    Month = m,
                    Year = y,
                    Url = $"/{UploadDir}/{name}",
                    Size = info.Length,
                    GeneratedAt = info.LastWriteTime,
                });
            }
        }
        return Ok(list
            .OrderByDescending(d => d.Year)
            .ThenByDescending(d => d.Month)
            .Select(d => new { d.FileName, d.Month, d.Year, d.Url, d.Size, d.GeneratedAt }));
    }

    /* Immediate-action request for Admin/Manager: generates a PDF covering the
       current month so far and returns the file (download) plus metadata. */
    [HttpPost("request")]
    [Authorize(Roles = "Admin,Manager")]
    public async Task<IActionResult> RequestPdf()
    {
        var now = DateTime.Today;
        var start = new DateTime(now.Year, now.Month, 1);
        var data = await LoadAsync(start, now);
        data.PeriodLabel = $"{MonthName(now.Month)} {now.Year}";
        data.Note = $"On-demand request on {now:yyyy-MM-dd HH:mm} · covers {start.ToString("MMM d", CultureInfo.InvariantCulture)} to {now.ToString("MMM d", CultureInfo.InvariantCulture)} (days covered so far this month)";

        var requester = User.Identity?.Name ?? "requester";
        var safe = new string(requester.Where(c => char.IsLetterOrDigit(c) || c is '_' or '-').Take(32).ToArray());
        if (string.IsNullOrWhiteSpace(safe))
            safe = "requester";

        var bytes = BuildPdf(data);
        var dir = Path.Combine(Root, UploadDir, "requests");
        Directory.CreateDirectory(dir);
        var fileName = $"request-{now:yyyyMMdd-HHmmss}-{safe}.pdf";
        await System.IO.File.WriteAllBytesAsync(Path.Combine(dir, fileName), bytes);

        return Ok(new
        {
            fileName,
            url = $"/{UploadDir}/requests/{fileName}",
            from = start,
            to = now,
            requester,
            size = bytes.Length,
            generatedAt = now,
        });
    }

    private async Task<ReportData> LoadAsync(DateTime start, DateTime end)
    {
        var dayAfter = end.AddDays(1);
        var data = new ReportData
        {
            From = start,
            To = end,
            PeriodLabel = $"{MonthName(start.Month)} {start.Year}",
        };

        data.Income = await _db.Payments
            .Where(p => p.PaymentDate >= start && p.PaymentDate < dayAfter)
            .SumAsync(p => p.Amount);
        data.SupplierExpense = await _db.SupplierPayments
            .Where(sp => sp.PaymentDate >= start && sp.PaymentDate < dayAfter)
            .SumAsync(sp => sp.Amount);
        data.SalaryExpense = await _db.Employees
            .Where(e => e.Status == "Active")
            .SumAsync(e => e.Salary);

        var events = await _db.Events
            .AsNoTracking()
            .Include(e => e.Invoices)
            .Include(e => e.Budgets)
            .Where(e => e.StartDate >= start && e.StartDate < dayAfter)
            .ToListAsync();

        foreach (var ev in events)
        {
            var received = ev.Invoices.Sum(i => i.PaidAmount);
            var spent = ev.Budgets.Sum(b => b.ActualAmount);
            data.Events.Add(new EventRow
            {
                Name = ev.Name,
                Status = ev.Status,
                Start = ev.StartDate,
                Received = received,
                Planned = ev.Budgets.Sum(b => b.PlannedAmount),
                Spent = spent,
                Profit = received - spent,
            });
        }
        data.Events.Sort((a, b) => a.Start.CompareTo(b.Start));

        data.BudgetSpent = data.Events.Sum(e => e.Spent);
        data.Outstanding = await _db.Invoices.SumAsync(i => i.Amount - i.PaidAmount);

        var employees = await _db.Employees
            .Where(e => e.Status == "Active")
            .OrderBy(e => e.LastName)
            .ThenBy(e => e.FirstName)
            .AsNoTracking()
            .ToListAsync();
        var attendance = await _db.Attendance
            .Where(a => a.WorkDate >= start && a.WorkDate < dayAfter)
            .AsNoTracking()
            .ToListAsync();
        var assignments = await _db.EmployeeAssignments
            .Where(a => a.Event != null && a.Event.StartDate >= start && a.Event.StartDate < dayAfter)
            .AsNoTracking()
            .ToListAsync();
        var payslips = await _db.Payslips
            .Where(p => p.Year == start.Year && p.Month == start.Month)
            .AsNoTracking()
            .ToListAsync();

        foreach (var emp in employees)
        {
            var att = attendance.Where(a => a.EmployeeId == emp.Id).ToList();
            var duties = assignments.Where(a => a.EmployeeId == emp.Id).ToList();
            data.Staff.Add(new StaffRow
            {
                Name = emp.FullName,
                Role = emp.Role,
                Worked = att.Count(a => a.Status is AttendanceStatus.Present or AttendanceStatus.Late),
                Absents = att.Count(a => a.Status == AttendanceStatus.Absent),
                Lates = att.Count(a => a.Status == AttendanceStatus.Late),
                Leaves = att.Count(a => a.Status == AttendanceStatus.Leave),
                Duties = duties.Count,
                Hours = duties.Sum(a => a.Hours),
                Salary = emp.Salary,
                Payslip = payslips.FirstOrDefault(p => p.EmployeeId == emp.Id),
            });
        }

        return data;
    }

    private static object ToDto(ReportData d) => new
    {
        year = d.From.Year,
        month = d.From.Month,
        from = d.From,
        to = d.To,
        summary = new
        {
            income = d.Income,
            supplierExpense = d.SupplierExpense,
            salaryExpense = d.SalaryExpense,
            budgetSpent = d.BudgetSpent,
            expenses = d.SupplierExpense + d.SalaryExpense + d.BudgetSpent,
            net = d.Income - d.SupplierExpense - d.SalaryExpense - d.BudgetSpent,
            outstanding = d.Outstanding,
            totalEvents = d.Events.Count,
            completedEvents = d.Events.Count(e => e.Status == "Completed"),
        },
        events = d.Events.Select(e => new
        {
            name = e.Name,
            status = e.Status,
            startDate = e.Start,
            received = e.Received,
            planned = e.Planned,
            spent = e.Spent,
            profit = e.Profit,
        }),
        staff = d.Staff.Select(s => new
        {
            name = s.Name,
            role = s.Role,
            worked = s.Worked,
            absents = s.Absents,
            lates = s.Lates,
            leaves = s.Leaves,
            duties = s.Duties,
            hours = s.Hours,
            salary = s.Salary,
            payslip = s.Payslip == null ? null : new
            {
                s.Payslip.DaysWorked,
                s.Payslip.Absents,
                s.Payslip.DailyRate,
                s.Payslip.GrossPay,
                s.Payslip.Deductions,
                s.Payslip.NetPay,
                s.Payslip.Status,
            },
        }),
    };

    private static byte[] BuildPdf(ReportData d)
    {
        var doc = new PdfDocument("EventSphere - Monthly Report", d.PeriodLabel);
        doc.Heading("Financial summary");
        doc.Pair("Income received (payments)", Money(d.Income));
        doc.Pair("Supplier payments", Money(d.SupplierExpense));
        doc.Pair("Staff salaries", Money(d.SalaryExpense));
        doc.Pair("Budget spend (actual)", Money(d.BudgetSpent));
        doc.Blank();
        doc.Pair("Net result", Money(d.Income - d.SupplierExpense - d.SalaryExpense - d.BudgetSpent));
        doc.Pair("Outstanding client balances", Money(d.Outstanding));

        doc.Heading("Events of the period");
        if (d.Events.Count == 0)
        {
            doc.Note("No events started during this period.");
        }
        else
        {
            doc.Table(
                new[] { "Event", "Status", "Day", "Received", "Budget used", "Profit" },
                d.Events.Select(e => new[] { e.Name, e.Status, e.StartDate, Money(e.Received), Money(e.Spent), Money(e.Profit) }).ToList(),
                new[] { 3.2f, 1.2f, 1f, 1.15f, 1.15f, 1.15f });
        }

        doc.Heading("Staff payroll & attendance");
        if (d.Staff.Count == 0)
        {
            doc.Note("No active staff records.");
        }
        else
        {
            doc.Table(
                new[] { "Employee", "Role", "Worked", "Absent", "Late", "Leave", "Duties", "Hrs", "Gross", "Deduct", "Net" },
                d.Staff.Select(s => new[]
                {
                    s.Name,
                    s.Role,
                    s.Worked.ToString(CultureInfo.InvariantCulture),
                    s.Absents.ToString(CultureInfo.InvariantCulture),
                    s.Lates.ToString(CultureInfo.InvariantCulture),
                    s.Leaves.ToString(CultureInfo.InvariantCulture),
                    s.Duties.ToString(CultureInfo.InvariantCulture),
                    s.Hours.ToString("0.##", CultureInfo.InvariantCulture),
                    s.Payslip is { GrossPay: var gross } ? Money(gross) : "-",
                    s.Payslip is { Deductions: var ded } ? Money(ded) : "-",
                    s.Payslip is { NetPay: var net } ? Money(net) : "-",
                }).ToList(),
                new[] { 2.2f, 1.3f, 0.8f, 0.8f, 0.8f, 0.8f, 0.8f, 0.8f, 1.1f, 1.1f, 1.1f });
        }

        if (!string.IsNullOrWhiteSpace(d.Note))
            doc.Note(d.Note);

        return doc.ToPdf();
    }

    private static string Money(decimal v) => "PHP " + v.ToString("#,##0.00", CultureInfo.InvariantCulture);

    private static string MonthName(int m) => new DateTime(2000, m, 1).ToString("MMMM", CultureInfo.InvariantCulture);

    private static bool TryParseReportName(string name, out int month, out int year)
    {
        month = 0;
        year = 0;
        var parts = name.Split('-');
        if (parts.Length != 4)
            return false;
        if (!int.TryParse(parts[1], out year) || !int.TryParse(parts[2].Replace(".pdf", ""), out month))
            return false;
        return month >= 1 && month <= 12 && year > 2000;
    }

    private sealed class ReportData
    {
        public DateTime From { get; set; }
        public DateTime To { get; set; }
        public string PeriodLabel { get; set; } = string.Empty;
        public string? Note { get; set; }
        public decimal Income { get; set; }
        public decimal SupplierExpense { get; set; }
        public decimal SalaryExpense { get; set; }
        public decimal BudgetSpent { get; set; }
        public decimal Outstanding { get; set; }
        public List<EventRow> Events { get; } = new();
        public List<StaffRow> Staff { get; } = new();
    }

    private sealed class EventRow
    {
        public string Name { get; set; } = string.Empty;
        public string Status { get; set; } = string.Empty;
        public DateTime Start { get; set; }
        public string StartDate => Start.ToString("MMM d", CultureInfo.InvariantCulture);
        public decimal Received { get; set; }
        public decimal Planned { get; set; }
        public decimal Spent { get; set; }
        public decimal Profit { get; set; }
    }

    private sealed class StaffRow
    {
        public string Name { get; set; } = string.Empty;
        public string Role { get; set; } = string.Empty;
        public int Worked { get; set; }
        public int Absents { get; set; }
        public int Lates { get; set; }
        public int Leaves { get; set; }
        public int Duties { get; set; }
        public decimal Hours { get; set; }
        public decimal Salary { get; set; }
        public Payslip? Payslip { get; set; }
    }

    private sealed class ReportDocument
    {
        public string FileName { get; set; } = string.Empty;
        public int Month { get; set; }
        public int Year { get; set; }
        public string Url { get; set; } = string.Empty;
        public long Size { get; set; }
        public DateTime GeneratedAt { get; set; }
    }
}