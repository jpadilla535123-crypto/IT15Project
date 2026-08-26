using Microsoft.AspNetCore.Mvc;
using EventSphere.Web.Data;
using EventSphere.Web.Models;

namespace EventSphere.Web.Controllers;

public class EventsController : Controller
{
    private readonly JsonDataContext _context;

    public EventsController(JsonDataContext context)
    {
        _context = context;
    }

    public async Task<IActionResult> Index(string? tab = null, string? range = null, string? search = null, int page = 1, DateTime? from = null, DateTime? to = null)
    {
        var today = DateTime.Today;

        var query = _context.Events
            .Include(e => e.Client)
            .Include(e => e.Venue)
            .AsQueryable();

        if (!string.IsNullOrEmpty(search))
            query = query.Where(e => e.Name.Contains(search));

        switch (tab)
        {
            case "upcoming":
                query = query.Where(e => e.StartDate >= today && e.Status != "Completed");
                break;
            case "completed":
                query = query.Where(e => e.Status == "Completed");
                break;
        }

        switch (range)
        {
            case "today":
                query = query.Where(e => e.StartDate.Date == today);
                break;
            case "yesterday":
                query = query.Where(e => e.StartDate.Date == today.AddDays(-1));
                break;
            case "last7":
                query = query.Where(e => e.StartDate.Date >= today.AddDays(-7));
                break;
            case "last30":
                query = query.Where(e => e.StartDate.Date >= today.AddDays(-30));
                break;
            case "thismonth":
            {
                var firstThis = new DateTime(today.Year, today.Month, 1);
                query = query.Where(e => e.StartDate.Date >= firstThis && e.StartDate.Date <= firstThis.AddMonths(1).AddDays(-1));
                break;
            }
            case "lastmonth":
            {
                var firstLast = new DateTime(today.Year, today.Month, 1).AddMonths(-1);
                query = query.Where(e => e.StartDate.Date >= firstLast && e.StartDate.Date <= firstLast.AddMonths(1).AddDays(-1));
                break;
            }
            case "custom":
                if (from.HasValue && to.HasValue)
                {
                    var f = from.Value;
                    var t = to.Value;
                    query = query.Where(e => e.StartDate.Date >= f && e.StartDate.Date <= t);
                }
                break;
        }

        var total = await query.CountAsync();
        var pageSize = 8;
        page = Math.Max(1, page);
        var totalPages = Math.Max(1, (int)Math.Ceiling(total / (double)pageSize));
        page = Math.Min(page, totalPages);

        var items = await query
            .OrderByDescending(e => e.StartDate)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();

        ViewData["TotalEvents"] = await _context.Events.CountAsync();
        ViewData["CompletedCount"] = await _context.Events.CountAsync(e => e.Status == "Completed");
        ViewData["InProcessCount"] = await _context.Events.CountAsync(e => e.Status == "Pending");

        ViewData["Tab"] = tab ?? "all";
        ViewData["Range"] = range;
        ViewData["RangeLabel"] = RangeLabel(range, from, to);
        ViewData["Search"] = search;
        ViewData["Page"] = page;
        ViewData["TotalPages"] = totalPages;
        ViewData["TotalCount"] = total;
        ViewData["PageStart"] = total == 0 ? 0 : (page - 1) * pageSize + 1;
        ViewData["PageEnd"] = Math.Min(page * pageSize, total);
        ViewData["FromDate"] = from?.ToString("yyyy-MM-dd");
        ViewData["ToDate"] = to?.ToString("yyyy-MM-dd");

        return View(items);
    }

    private static string RangeLabel(string? range, DateTime? from, DateTime? to)
    {
        var today = DateTime.Today;
        return range switch
        {
            "today" => $"Today: {today:MMM d}",
            "yesterday" => $"Yesterday: {today.AddDays(-1):MMM d}",
            "last7" => "Last 7 Days",
            "last30" => "Last 30 Days",
            "thismonth" => today.ToString("MMMM yyyy"),
            "lastmonth" => today.AddMonths(-1).ToString("MMMM yyyy"),
            "custom" when from.HasValue && to.HasValue => $"{from:MMM d} - {to:MMM d}",
            _ => "All Dates"
        };
    }

    public async Task<IActionResult> Details(int? id)
    {
        if (id == null) return NotFound();
        var evt = await _context.Events
            .Include(e => e.Client)
            .Include(e => e.Venue)
            .Include(e => e.Assignments)
            .Include(e => e.Budgets)
            .Include(e => e.Invoices)
            .FirstOrDefaultAsync(e => e.Id == id);
        if (evt == null) return NotFound();
        return View(evt);
    }

    public async Task<IActionResult> Create()
    {
        await PopulateDropdownsAsync();
        return View();
    }

    [HttpPost]
    [ValidateAntiForgeryToken]
    public async Task<IActionResult> Create([Bind("Name,EventType,Status,StartDate,EndDate,Description,ClientName,VenueName")] Event evt)
    {
        if (ModelState.IsValid)
        {
            evt.ClientId = (await ResolveClientAsync(evt.ClientName))?.Id;
            evt.VenueId = (await ResolveVenueAsync(evt.VenueName))?.Id;
            _context.Add(evt);
            await _context.SaveChangesAsync();
            return RedirectToAction(nameof(Index));
        }
        await PopulateDropdownsAsync(evt);
        return View(evt);
    }

    public async Task<IActionResult> Edit(int? id)
    {
        if (id == null) return NotFound();
        var evt = await _context.Events
            .Include(e => e.Client)
            .Include(e => e.Venue)
            .FirstOrDefaultAsync(e => e.Id == id);
        if (evt == null) return NotFound();
        evt.ClientName = evt.Client?.CompanyName;
        evt.VenueName = evt.Venue?.Name;
        await PopulateDropdownsAsync(evt);
        return View(evt);
    }

    [HttpPost]
    [ValidateAntiForgeryToken]
    public async Task<IActionResult> Edit(int id, [Bind("Id,Name,EventType,Status,StartDate,EndDate,Description,ClientName,VenueName")] Event evt)
    {
        if (id != evt.Id) return NotFound();
        if (ModelState.IsValid)
        {
            evt.ClientId = (await ResolveClientAsync(evt.ClientName))?.Id;
            evt.VenueId = (await ResolveVenueAsync(evt.VenueName))?.Id;
            _context.Update(evt);
            await _context.SaveChangesAsync();
            return RedirectToAction(nameof(Index));
        }
        await PopulateDropdownsAsync(evt);
        return View(evt);
    }

    public async Task<IActionResult> Delete(int? id)
    {
        if (id == null) return NotFound();
        var evt = await _context.Events
            .Include(e => e.Client)
            .Include(e => e.Venue)
            .FirstOrDefaultAsync(e => e.Id == id);
        if (evt == null) return NotFound();
        return View(evt);
    }

    [HttpPost, ActionName("Delete")]
    [ValidateAntiForgeryToken]
    public async Task<IActionResult> DeleteConfirmed(int id)
    {
        var evt = await _context.Events.FindAsync(id);
        if (evt != null)
        {
            _context.Events.Remove(evt);
            await _context.SaveChangesAsync();
        }
        return RedirectToAction(nameof(Index));
    }

    private async Task<Client?> ResolveClientAsync(string? name)
    {
        if (string.IsNullOrWhiteSpace(name)) return null;
        var trimmed = name.Trim();
        var client = await _context.Clients.FirstOrDefaultAsync(c => c.CompanyName.ToLower() == trimmed.ToLower());
        if (client == null)
        {
            client = new Client { CompanyName = trimmed };
            _context.Add(client);
            await _context.SaveChangesAsync();
        }
        return client;
    }

    private async Task<Venue?> ResolveVenueAsync(string? name)
    {
        if (string.IsNullOrWhiteSpace(name)) return null;
        var trimmed = name.Trim();
        var venue = await _context.Venues.FirstOrDefaultAsync(v => v.Name.ToLower() == trimmed.ToLower());
        if (venue == null)
        {
            venue = new Venue { Name = trimmed };
            _context.Add(venue);
            await _context.SaveChangesAsync();
        }
        return venue;
    }

    private Task PopulateDropdownsAsync(Event? selected = null)
    {
        ViewBag.Statuses = new[] { "Pending", "Completed", "Cancelled" };
        ViewData["Statuses"] = ViewBag.Statuses;
        return Task.CompletedTask;
    }
}
