using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Rendering;
using EventSphere.Web.Data;
using EventSphere.Web.Models;

namespace EventSphere.Web.Controllers;

public class BudgetsController : Controller
{
    private readonly JsonDataContext _context;

    public BudgetsController(JsonDataContext context)
    {
        _context = context;
    }

    public async Task<IActionResult> Index(int? eventId = null, string? category = null)
    {
        var query = _context.Budgets.Include(b => b.Event).AsQueryable();

        if (eventId.HasValue)
            query = query.Where(b => b.EventId == eventId);
        if (!string.IsNullOrEmpty(category))
            query = query.Where(b => b.Category == category);

        var budgets = await query.OrderBy(b => b.Event!.Name).ThenBy(b => b.Category).ToListAsync();

        ViewData["EventId"] = eventId;
        ViewData["Category"] = category;
        ViewData["Categories"] = new[] { "Venue", "Catering", "Decor", "Audio-Visual", "Photography", "Entertainment", "Transport", "Staff", "Marketing", "General" };
        ViewData["Events"] = new SelectList(await _context.Events.OrderBy(e => e.Name).ToListAsync(), "Id", "Name", eventId);
        ViewData["TotalPlanned"] = budgets.Sum(b => b.PlannedAmount);
        ViewData["TotalActual"] = budgets.Sum(b => b.ActualAmount);

        return View(budgets);
    }

    public async Task<IActionResult> Create(int? eventId = null)
    {
        await PopulateDropdownsAsync(new Budget { EventId = eventId ?? 0 });
        return View();
    }

    [HttpPost]
    [ValidateAntiForgeryToken]
    public async Task<IActionResult> Create([Bind("EventId,Category,PlannedAmount,ActualAmount,Notes")] Budget budget)
    {
        if (ModelState.IsValid)
        {
            _context.Add(budget);
            await _context.SaveChangesAsync();
            return RedirectToAction(nameof(Index));
        }
        await PopulateDropdownsAsync(budget);
        return View(budget);
    }

    public async Task<IActionResult> Edit(int? id)
    {
        if (id == null) return NotFound();
        var budget = await _context.Budgets.FindAsync(id);
        if (budget == null) return NotFound();
        await PopulateDropdownsAsync(budget);
        return View(budget);
    }

    [HttpPost]
    [ValidateAntiForgeryToken]
    public async Task<IActionResult> Edit(int id, [Bind("Id,EventId,Category,PlannedAmount,ActualAmount,Notes")] Budget budget)
    {
        if (id != budget.Id) return NotFound();
        if (ModelState.IsValid)
        {
            _context.Update(budget);
            await _context.SaveChangesAsync();
            return RedirectToAction(nameof(Index));
        }
        await PopulateDropdownsAsync(budget);
        return View(budget);
    }

    public async Task<IActionResult> Delete(int? id)
    {
        if (id == null) return NotFound();
        var budget = await _context.Budgets.Include(b => b.Event).FirstOrDefaultAsync(b => b.Id == id);
        if (budget == null) return NotFound();
        return View(budget);
    }

    [HttpPost, ActionName("Delete")]
    [ValidateAntiForgeryToken]
    public async Task<IActionResult> DeleteConfirmed(int id)
    {
        var budget = await _context.Budgets.FindAsync(id);
        if (budget != null)
        {
            _context.Budgets.Remove(budget);
            await _context.SaveChangesAsync();
        }
        return RedirectToAction(nameof(Index));
    }

    private async Task PopulateDropdownsAsync(Budget? selected = null)
    {
        ViewBag.EventList = new SelectList(await _context.Events.OrderBy(e => e.Name).ToListAsync(), "Id", "Name", selected?.EventId);
        ViewBag.Categories = new[] { "Venue", "Catering", "Decor", "Audio-Visual", "Photography", "Entertainment", "Transport", "Staff", "Marketing", "General" };
    }
}
