using Microsoft.AspNetCore.Mvc;
using EventSphere.Web.Data;
using EventSphere.Web.Models;

namespace EventSphere.Web.Controllers;

public class ClientsController : Controller
{
    private readonly JsonDataContext _context;

    public ClientsController(JsonDataContext context)
    {
        _context = context;
    }

    public async Task<IActionResult> Index(string? tab = null, string? search = null, int page = 1)
    {
        var query = _context.Clients.AsQueryable();

        if (!string.IsNullOrEmpty(search))
            query = query.Where(c =>
                c.CompanyName.Contains(search) ||
                (c.Email != null && c.Email.Contains(search)) ||
                c.Phone.Contains(search));

        switch (tab)
        {
            case "new":
                query = query.Where(c => c.Status == "New");
                break;
            case "booked":
                query = query.Where(c => c.Status == "Booked");
                break;
            case "completed":
                query = query.Where(c => c.Status == "Completed");
                break;
            case "cancelled":
                query = query.Where(c => c.Status == "Cancelled");
                break;
        }

        var total = await query.CountAsync();
        var pageSize = 10;
        page = Math.Max(1, page);
        var totalPages = Math.Max(1, (int)Math.Ceiling(total / (double)pageSize));
        page = Math.Min(page, totalPages);

        var items = await query
            .OrderByDescending(c => c.DateOfInquiry)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();

        ViewData["Tab"] = tab ?? "all";
        ViewData["Search"] = search;
        ViewData["Page"] = page;
        ViewData["TotalPages"] = totalPages;
        ViewData["TotalCount"] = total;
        ViewData["PageStart"] = total == 0 ? 0 : (page - 1) * pageSize + 1;
        ViewData["PageEnd"] = Math.Min(page * pageSize, total);

        ViewData["AllCount"] = await _context.Clients.CountAsync();
        ViewData["NewCount"] = await _context.Clients.CountAsync(c => c.Status == "New");
        ViewData["BookedCount"] = await _context.Clients.CountAsync(c => c.Status == "Booked");
        ViewData["CompletedCount"] = await _context.Clients.CountAsync(c => c.Status == "Completed");
        ViewData["CancelledCount"] = await _context.Clients.CountAsync(c => c.Status == "Cancelled");

        return View(items);
    }

    [HttpPost]
    [ValidateAntiForgeryToken]
    public async Task<IActionResult> Create([Bind("CompanyName,Email,Phone,DateOfInquiry")] Client client)
    {
        if (ModelState.IsValid)
        {
            client.Status = "New";
            _context.Add(client);
            await _context.SaveChangesAsync();
            return RedirectToAction(nameof(Index));
        }
        return RedirectToAction(nameof(Index));
    }

    [HttpPost]
    [ValidateAntiForgeryToken]
    public async Task<IActionResult> Book(int id, string? tab = null, string? search = null, int page = 1)
    {
        var client = await _context.Clients.FindAsync(id);
        if (client != null && client.Status == "New")
        {
            client.Status = "Booked";
            await _context.SaveChangesAsync();
        }
        return RedirectToAction(nameof(Index), new { tab, search, page });
    }

    [HttpPost]
    [ValidateAntiForgeryToken]
    public async Task<IActionResult> Cancel(int id, string? tab = null, string? search = null, int page = 1)
    {
        var client = await _context.Clients.FindAsync(id);
        if (client != null && client.Status == "New")
        {
            client.Status = "Cancelled";
            await _context.SaveChangesAsync();
        }
        return RedirectToAction(nameof(Index), new { tab, search, page });
    }
}
