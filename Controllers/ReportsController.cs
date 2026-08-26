using Microsoft.AspNetCore.Mvc;
using EventSphere.Web.Data;

namespace EventSphere.Web.Controllers;

public class ReportsController : Controller
{
    private readonly JsonDataContext _context;

    public ReportsController(JsonDataContext context)
    {
        _context = context;
    }

    public async Task<IActionResult> Index()
    {
        var today = DateTime.Today;

        ViewData["TotalEvents"] = await _context.Events.CountAsync();
        ViewData["TotalClients"] = await _context.Clients.CountAsync();
        ViewData["TotalLeads"] = await _context.Leads.CountAsync();
        ViewData["ConvertedLeads"] = await _context.Leads.CountAsync(l => l.Status == "Converted");
        ViewData["TotalEmployees"] = await _context.Employees.CountAsync();

        ViewData["Revenue"] = await _context.Invoices.SumAsync(i => (decimal?)i.Amount) ?? 0;
        ViewData["Collected"] = await _context.Invoices.SumAsync(i => (decimal?)i.PaidAmount) ?? 0;
        ViewData["Outstanding"] = await _context.Invoices.SumAsync(i => (decimal?)(i.Amount - i.PaidAmount)) ?? 0;

        ViewData["EventsByStatus"] = await _context.Events
            .GroupBy(e => e.Status)
            .Select(g => new { Key = g.Key, Value = g.Count() })
            .OrderByDescending(x => x.Value)
            .ToListAsync();

        ViewData["EventsByType"] = await _context.Events
            .GroupBy(e => e.EventType)
            .Select(g => new { Key = g.Key, Value = g.Count() })
            .OrderByDescending(x => x.Value)
            .ToListAsync();

        var revenueByClient = await _context.Invoices
            .Include(i => i.Client)
            .GroupBy(i => i.Client!.CompanyName)
            .Select(g => new { Key = g.Key, Value = g.Sum(i => i.Amount) })
            .ToListAsync();

        ViewData["RevenueByClient"] = revenueByClient
            .OrderByDescending(x => x.Value)
            .ToList();

        var budgetVsActual = await _context.Events
            .Include(e => e.Budgets)
            .Select(e => new
            {
                Name = e.Name,
                Planned = e.Budgets.Sum(b => b.PlannedAmount),
                Actual = e.Budgets.Sum(b => b.ActualAmount)
            })
            .ToListAsync();

        ViewData["BudgetVsActual"] = budgetVsActual
            .OrderByDescending(x => x.Planned)
            .ToList();

        ViewData["LeadsByStatus"] = await _context.Leads
            .GroupBy(l => l.Status)
            .Select(g => new { Key = g.Key, Value = g.Count() })
            .OrderBy(x => x.Key)
            .ToListAsync();

        ViewData["LeadsBySource"] = await _context.Leads
            .GroupBy(l => l.Source ?? "Unknown")
            .Select(g => new { Key = g.Key, Value = g.Count() })
            .OrderByDescending(x => x.Value)
            .ToListAsync();

        var workload = await _context.Employees
            .Include(e => e.Assignments)
            .Select(e => new
            {
                Name = e.FullName,
                Role = e.Role,
                Hours = e.Assignments.Sum(a => a.Hours),
                Count = e.Assignments.Count()
            })
            .ToListAsync();

        ViewData["WorkloadByEmployee"] = workload
            .OrderByDescending(x => x.Hours)
            .ToList();

        return View();
    }
}
