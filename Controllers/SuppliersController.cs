using Microsoft.AspNetCore.Mvc;
using EventSphere.Web.Data;
using EventSphere.Web.Models;

namespace EventSphere.Web.Controllers;

public class SuppliersController : Controller
{
    private readonly JsonDataContext _context;

    public SuppliersController(JsonDataContext context)
    {
        _context = context;
    }

    public async Task<IActionResult> Index(string? category = null, string? search = null)
    {
        var query = _context.Suppliers.AsQueryable();

        if (!string.IsNullOrEmpty(category))
            query = query.Where(s => s.Category == category);

        if (!string.IsNullOrEmpty(search))
            query = query.Where(s => s.Name.Contains(search) || (s.ContactPerson != null && s.ContactPerson.Contains(search)));

        ViewData["Category"] = category;
        ViewData["Search"] = search;
        ViewData["Categories"] = new[] { "Catering", "Decor", "Audio-Visual", "Photography", "Entertainment", "Transport", "Other" };
        return View(await query.OrderBy(s => s.Name).ToListAsync());
    }

    public IActionResult Create() => View();

    [HttpPost]
    [ValidateAntiForgeryToken]
    public async Task<IActionResult> Create([Bind("Name,Category,ContactPerson,Email,Phone,Rating,Notes")] Supplier supplier)
    {
        if (ModelState.IsValid)
        {
            _context.Add(supplier);
            await _context.SaveChangesAsync();
            return RedirectToAction(nameof(Index));
        }
        return View(supplier);
    }

    public async Task<IActionResult> Edit(int? id)
    {
        if (id == null) return NotFound();
        var supplier = await _context.Suppliers.FindAsync(id);
        if (supplier == null) return NotFound();
        return View(supplier);
    }

    [HttpPost]
    [ValidateAntiForgeryToken]
    public async Task<IActionResult> Edit(int id, [Bind("Id,Name,Category,ContactPerson,Email,Phone,Rating,Notes")] Supplier supplier)
    {
        if (id != supplier.Id) return NotFound();
        if (ModelState.IsValid)
        {
            _context.Update(supplier);
            await _context.SaveChangesAsync();
            return RedirectToAction(nameof(Index));
        }
        return View(supplier);
    }

    public async Task<IActionResult> Delete(int? id)
    {
        if (id == null) return NotFound();
        var supplier = await _context.Suppliers.FindAsync(id);
        if (supplier == null) return NotFound();
        return View(supplier);
    }

    [HttpPost, ActionName("Delete")]
    [ValidateAntiForgeryToken]
    public async Task<IActionResult> DeleteConfirmed(int id)
    {
        var supplier = await _context.Suppliers.FindAsync(id);
        if (supplier != null)
        {
            _context.Suppliers.Remove(supplier);
            await _context.SaveChangesAsync();
        }
        return RedirectToAction(nameof(Index));
    }
}
