using System.Diagnostics;
using Microsoft.AspNetCore.Mvc;
using EventSphere.Web.Models;
using EventSphere.Web.Data;

namespace EventSphere.Web.Controllers;

public class HomeController : Controller
{
    private readonly JsonDataContext _context;

    public HomeController(JsonDataContext context)
    {
        _context = context;
    }

    public async Task<IActionResult> Index()
    {
        var today = DateTime.Today;

        ViewData["ClientCount"] = await _context.Clients.CountAsync();
        ViewData["EventCount"] = await _context.Events.CountAsync();
        ViewData["VenueCount"] = await _context.Venues.CountAsync();
        ViewData["EmployeeCount"] = await _context.Employees.CountAsync();
        ViewData["SupplierCount"] = await _context.Suppliers.CountAsync();
        ViewData["LeadCount"] = await _context.Leads.CountAsync();
        ViewData["OpenLeadCount"] = await _context.Leads.CountAsync(l => l.Status == "New" || l.Status == "Contacted" || l.Status == "Qualified");
        ViewData["UpcomingEventCount"] = await _context.Events.CountAsync(e => e.StartDate >= today && e.Status != "Cancelled");

        ViewData["RevenueTotal"] = await _context.Invoices.SumAsync(i => (decimal?)i.Amount) ?? 0;
        ViewData["CollectedTotal"] = await _context.Invoices.SumAsync(i => (decimal?)i.PaidAmount) ?? 0;
        ViewData["OutstandingTotal"] = await _context.Invoices.SumAsync(i => (decimal?)(i.Amount - i.PaidAmount)) ?? 0;

        ViewData["UpcomingEvents"] = await _context.Events
            .Include(e => e.Client)
            .Include(e => e.Venue)
            .Where(e => e.StartDate >= today)
            .OrderBy(e => e.StartDate)
            .Take(5)
            .ToListAsync();

        ViewData["RecentLeads"] = await _context.Leads
            .OrderByDescending(l => l.CreatedDate)
            .Take(5)
            .ToListAsync();

        ViewData["RecentInvoices"] = await _context.Invoices
            .Include(i => i.Client)
            .OrderByDescending(i => i.IssueDate)
            .Take(5)
            .ToListAsync();

        ViewData["EventStatusCounts"] = await _context.Events
            .GroupBy(e => e.Status)
            .Select(g => new { Status = g.Key, Count = g.Count() })
            .ToDictionaryAsync(x => x.Status, x => x.Count);

        var revenueByClient = await _context.Invoices
            .Include(i => i.Client)
            .GroupBy(i => i.Client!.CompanyName)
            .Select(g => new { Client = g.Key, Total = g.Sum(i => i.Amount) })
            .ToListAsync();

        ViewData["RevenueByClient"] = revenueByClient
            .OrderByDescending(x => x.Total)
            .Take(6)
            .ToList();

        var firstOfMonth = new DateTime(today.Year, today.Month, 1);
        var monthEvents = await _context.Events
            .Where(e => e.StartDate.Year == today.Year && e.StartDate.Month == today.Month)
            .Include(e => e.Client)
            .ToListAsync();

        ViewData["Suppliers"] = await _context.Suppliers
            .OrderByDescending(s => s.Rating)
            .ThenBy(s => s.Name)
            .Take(4)
            .ToListAsync();

        ViewData["MonthEvents"] = monthEvents;
        ViewData["MonthEventCount"] = monthEvents.Count;
        ViewData["MonthCompleted"] = monthEvents.Count(e => e.Status == "Completed");
        ViewData["CalendarEvents"] = monthEvents
            .GroupBy(e => e.StartDate.Day)
            .ToDictionary(g => g.Key, g => g.ToList());
        ViewData["DaysInMonth"] = DateTime.DaysInMonth(today.Year, today.Month);
        ViewData["StartOffset"] = ((int)firstOfMonth.DayOfWeek + 6) % 7;
        ViewData["MonthName"] = firstOfMonth.ToString("MMMM yyyy");

        return View();
    }

    [ResponseCache(Duration = 0, Location = ResponseCacheLocation.None, NoStore = true)]
    public IActionResult Error()
    {
        return View(new ErrorViewModel { RequestId = Activity.Current?.Id ?? HttpContext.TraceIdentifier });
    }
}
