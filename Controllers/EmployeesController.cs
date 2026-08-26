using Microsoft.AspNetCore.Mvc;
using EventSphere.Web.Data;
using EventSphere.Web.Models;

namespace EventSphere.Web.Controllers;

public class EmployeesController : Controller
{
    private readonly JsonDataContext _context;

    public EmployeesController(JsonDataContext context)
    {
        _context = context;
    }

    public async Task<IActionResult> Index(string? role = null, string? search = null)
    {
        var query = _context.Employees.AsQueryable();

        if (!string.IsNullOrEmpty(role))
            query = query.Where(e => e.Role == role);

        if (!string.IsNullOrEmpty(search))
            query = query.Where(e =>
                e.FirstName.Contains(search) ||
                e.LastName.Contains(search) ||
                (e.Email != null && e.Email.Contains(search)));

        ViewData["Role"] = role;
        ViewData["Search"] = search;
        ViewData["Roles"] = new[] { "Event Manager", "Event Coordinator", "Account Manager", "Designer", "Audio-Visual Technician", "Operations Staff", "Other" };
        return View(await query.OrderBy(e => e.LastName).ToListAsync());
    }

    public async Task<IActionResult> Details(int? id)
    {
        if (id == null) return NotFound();
        var employee = await _context.Employees
            .Include(e => e.Assignments)
            .FirstOrDefaultAsync(e => e.Id == id);
        if (employee == null) return NotFound();
        return View(employee);
    }

    public IActionResult Create() => View();

    [HttpPost]
    [ValidateAntiForgeryToken]
    public async Task<IActionResult> Create([Bind("FirstName,LastName,Role,Email,Phone,Salary,HireDate,Status")] Employee employee)
    {
        if (ModelState.IsValid)
        {
            _context.Add(employee);
            await _context.SaveChangesAsync();
            return RedirectToAction(nameof(Index));
        }
        return View(employee);
    }

    public async Task<IActionResult> Edit(int? id)
    {
        if (id == null) return NotFound();
        var employee = await _context.Employees.FindAsync(id);
        if (employee == null) return NotFound();
        return View(employee);
    }

    [HttpPost]
    [ValidateAntiForgeryToken]
    public async Task<IActionResult> Edit(int id, [Bind("Id,FirstName,LastName,Role,Email,Phone,Salary,HireDate,Status")] Employee employee)
    {
        if (id != employee.Id) return NotFound();
        if (ModelState.IsValid)
        {
            _context.Update(employee);
            await _context.SaveChangesAsync();
            return RedirectToAction(nameof(Index));
        }
        return View(employee);
    }

    public async Task<IActionResult> Delete(int? id)
    {
        if (id == null) return NotFound();
        var employee = await _context.Employees.FindAsync(id);
        if (employee == null) return NotFound();
        return View(employee);
    }

    [HttpPost, ActionName("Delete")]
    [ValidateAntiForgeryToken]
    public async Task<IActionResult> DeleteConfirmed(int id)
    {
        var employee = await _context.Employees.FindAsync(id);
        if (employee != null)
        {
            _context.Employees.Remove(employee);
            await _context.SaveChangesAsync();
        }
        return RedirectToAction(nameof(Index));
    }
}
