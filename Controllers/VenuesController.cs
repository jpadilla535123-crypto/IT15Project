using Microsoft.AspNetCore.Mvc;
using EventSphere.Web.Data;
using EventSphere.Web.Models;

namespace EventSphere.Web.Controllers;

public class VenuesController : Controller
{
    private readonly JsonDataContext _context;

    public VenuesController(JsonDataContext context)
    {
        _context = context;
    }

    public async Task<IActionResult> Index(string? search = null)
    {
        var query = _context.Venues.AsQueryable();
        if (!string.IsNullOrEmpty(search))
            query = query.Where(v => v.Name.Contains(search) || (v.City != null && v.City.Contains(search)));

        ViewData["Search"] = search;
        return View(await query.OrderBy(v => v.Name).ToListAsync());
    }

    public async Task<IActionResult> Details(int? id)
    {
        if (id == null) return NotFound();
        var venue = await _context.Venues
            .Include(v => v.Events)
            .FirstOrDefaultAsync(v => v.Id == id);
        if (venue == null) return NotFound();
        return View(venue);
    }

    public IActionResult Create() => View();

    [HttpPost]
    [ValidateAntiForgeryToken]
    public async Task<IActionResult> Create([Bind("Name,Address,City,Capacity,PricePerDay,ContactPerson,Phone,Email,Description")] Venue venue)
    {
        if (ModelState.IsValid)
        {
            _context.Add(venue);
            await _context.SaveChangesAsync();
            return RedirectToAction(nameof(Index));
        }
        return View(venue);
    }

    public async Task<IActionResult> Edit(int? id)
    {
        if (id == null) return NotFound();
        var venue = await _context.Venues.FindAsync(id);
        if (venue == null) return NotFound();
        return View(venue);
    }

    [HttpPost]
    [ValidateAntiForgeryToken]
    public async Task<IActionResult> Edit(int id, [Bind("Id,Name,Address,City,Capacity,PricePerDay,ContactPerson,Phone,Email,Description")] Venue venue)
    {
        if (id != venue.Id) return NotFound();
        if (ModelState.IsValid)
        {
            _context.Update(venue);
            await _context.SaveChangesAsync();
            return RedirectToAction(nameof(Index));
        }
        return View(venue);
    }

    public async Task<IActionResult> Delete(int? id)
    {
        if (id == null) return NotFound();
        var venue = await _context.Venues.FindAsync(id);
        if (venue == null) return NotFound();
        return View(venue);
    }

    [HttpPost, ActionName("Delete")]
    [ValidateAntiForgeryToken]
    public async Task<IActionResult> DeleteConfirmed(int id)
    {
        var venue = await _context.Venues.FindAsync(id);
        if (venue != null)
        {
            _context.Venues.Remove(venue);
            await _context.SaveChangesAsync();
        }
        return RedirectToAction(nameof(Index));
    }
}
