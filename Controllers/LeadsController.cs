using Microsoft.AspNetCore.Mvc;
using EventSphere.Web.Data;
using EventSphere.Web.Models;

namespace EventSphere.Web.Controllers;

public class LeadsController : Controller
{
    private readonly JsonDataContext _context;

    public LeadsController(JsonDataContext context)
    {
        _context = context;
    }

    public async Task<IActionResult> Index(string? status = null, string? search = null)
    {
        var query = _context.Leads.AsQueryable();

        if (!string.IsNullOrEmpty(status))
            query = query.Where(l => l.Status == status);

        if (!string.IsNullOrEmpty(search))
            query = query.Where(l =>
                l.CompanyName.Contains(search) ||
                (l.ContactName != null && l.ContactName.Contains(search)) ||
                (l.Email != null && l.Email.Contains(search)));

        ViewData["Status"] = status;
        ViewData["Search"] = search;
        ViewData["Statuses"] = new[] { "New", "Contacted", "Qualified", "Converted", "Lost" };
        return View(await query.OrderByDescending(l => l.CreatedDate).ToListAsync());
    }

    public async Task<IActionResult> Details(int? id)
    {
        if (id == null) return NotFound();
        var lead = await _context.Leads.FindAsync(id);
        if (lead == null) return NotFound();
        return View(lead);
    }

    public IActionResult Create()
    {
        return View();
    }

    [HttpPost]
    [ValidateAntiForgeryToken]
    public async Task<IActionResult> Create([Bind("CompanyName,ContactName,Email,Phone,Source,EventType,EstimatedBudget,Status,Notes,CreatedDate")] Lead lead)
    {
        if (ModelState.IsValid)
        {
            _context.Add(lead);
            await _context.SaveChangesAsync();
            return RedirectToAction(nameof(Index));
        }
        return View(lead);
    }

    public async Task<IActionResult> Edit(int? id)
    {
        if (id == null) return NotFound();
        var lead = await _context.Leads.FindAsync(id);
        if (lead == null) return NotFound();
        return View(lead);
    }

    [HttpPost]
    [ValidateAntiForgeryToken]
    public async Task<IActionResult> Edit(int id, [Bind("Id,CompanyName,ContactName,Email,Phone,Source,EventType,EstimatedBudget,Status,Notes,CreatedDate")] Lead lead)
    {
        if (id != lead.Id) return NotFound();
        if (ModelState.IsValid)
        {
            _context.Update(lead);
            await _context.SaveChangesAsync();
            return RedirectToAction(nameof(Index));
        }
        return View(lead);
    }

    public async Task<IActionResult> Delete(int? id)
    {
        if (id == null) return NotFound();
        var lead = await _context.Leads.FindAsync(id);
        if (lead == null) return NotFound();
        return View(lead);
    }

    [HttpPost, ActionName("Delete")]
    [ValidateAntiForgeryToken]
    public async Task<IActionResult> DeleteConfirmed(int id)
    {
        var lead = await _context.Leads.FindAsync(id);
        if (lead != null)
        {
            _context.Leads.Remove(lead);
            await _context.SaveChangesAsync();
        }
        return RedirectToAction(nameof(Index));
    }
}
