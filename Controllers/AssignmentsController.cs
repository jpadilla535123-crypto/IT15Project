using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Rendering;
using EventSphere.Web.Data;
using EventSphere.Web.Models;

namespace EventSphere.Web.Controllers;

public class AssignmentsController : Controller
{
    private readonly JsonDataContext _context;

    public AssignmentsController(JsonDataContext context)
    {
        _context = context;
    }

    public async Task<IActionResult> Index(int? eventId = null, int? employeeId = null, string? status = null)
    {
        var query = _context.EventAssignments
            .Include(a => a.Event)
            .Include(a => a.Employee)
            .AsQueryable();

        if (eventId.HasValue)
            query = query.Where(a => a.EventId == eventId);
        if (employeeId.HasValue)
            query = query.Where(a => a.EmployeeId == employeeId);
        if (!string.IsNullOrEmpty(status))
            query = query.Where(a => a.Status == status);

        ViewData["EventId"] = eventId;
        ViewData["EmployeeId"] = employeeId;
        ViewData["Status"] = status;
        ViewData["Statuses"] = new[] { "Assigned", "In Progress", "Completed", "Cancelled" };
        ViewData["Events"] = new SelectList(await _context.Events.OrderBy(e => e.Name).ToListAsync(), "Id", "Name", eventId);
        ViewData["Employees"] = new SelectList(await _context.Employees.OrderBy(e => e.LastName).ToListAsync(), "Id", "FullName", employeeId);

        return View(await query.OrderByDescending(a => a.AssignedDate).ToListAsync());
    }

    public async Task<IActionResult> Create(int? eventId = null)
    {
        await PopulateDropdownsAsync(new EventAssignment { EventId = eventId ?? 0 });
        return View();
    }

    [HttpPost]
    [ValidateAntiForgeryToken]
    public async Task<IActionResult> Create([Bind("EventId,EmployeeId,Role,AssignedDate,Hours,Status")] EventAssignment assignment)
    {
        if (ModelState.IsValid)
        {
            _context.Add(assignment);
            await _context.SaveChangesAsync();
            return RedirectToAction(nameof(Index));
        }
        await PopulateDropdownsAsync(assignment);
        return View(assignment);
    }

    public async Task<IActionResult> Edit(int? id)
    {
        if (id == null) return NotFound();
        var assignment = await _context.EventAssignments.FindAsync(id);
        if (assignment == null) return NotFound();
        await PopulateDropdownsAsync(assignment);
        return View(assignment);
    }

    [HttpPost]
    [ValidateAntiForgeryToken]
    public async Task<IActionResult> Edit(int id, [Bind("Id,EventId,EmployeeId,Role,AssignedDate,Hours,Status")] EventAssignment assignment)
    {
        if (id != assignment.Id) return NotFound();
        if (ModelState.IsValid)
        {
            _context.Update(assignment);
            await _context.SaveChangesAsync();
            return RedirectToAction(nameof(Index));
        }
        await PopulateDropdownsAsync(assignment);
        return View(assignment);
    }

    public async Task<IActionResult> Delete(int? id)
    {
        if (id == null) return NotFound();
        var assignment = await _context.EventAssignments
            .Include(a => a.Event)
            .Include(a => a.Employee)
            .FirstOrDefaultAsync(a => a.Id == id);
        if (assignment == null) return NotFound();
        return View(assignment);
    }

    [HttpPost, ActionName("Delete")]
    [ValidateAntiForgeryToken]
    public async Task<IActionResult> DeleteConfirmed(int id)
    {
        var assignment = await _context.EventAssignments.FindAsync(id);
        if (assignment != null)
        {
            _context.EventAssignments.Remove(assignment);
            await _context.SaveChangesAsync();
        }
        return RedirectToAction(nameof(Index));
    }

    private async Task PopulateDropdownsAsync(EventAssignment? selected = null)
    {
        ViewBag.EventList = new SelectList(await _context.Events.OrderBy(e => e.Name).ToListAsync(), "Id", "Name", selected?.EventId);
        ViewBag.EmployeeList = new SelectList(await _context.Employees.OrderBy(e => e.LastName).ToListAsync(), "Id", "FullName", selected?.EmployeeId);
        ViewBag.Statuses = new[] { "Assigned", "In Progress", "Completed", "Cancelled" };
        ViewBag.Roles = new[] { "Event Manager", "Event Coordinator", "Account Manager", "Designer", "AV Technician", "Operations Staff", "Security", "Other" };
    }
}
