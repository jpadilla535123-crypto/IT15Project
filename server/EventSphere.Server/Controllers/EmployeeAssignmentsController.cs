using EventSphere.Server.Data;
using EventSphere.Server.Extensions;
using EventSphere.Server.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace EventSphere.Server.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class EmployeeAssignmentsController : ControllerBase
{
    private readonly AppDbContext _db;

    public EmployeeAssignmentsController(AppDbContext db)
    {
        _db = db;
    }

    [HttpGet]
    public IActionResult GetAll(int? eventId = null, int? employeeId = null, string? status = null,
        string? sortBy = null, string? sortDir = null, int? page = null, int? pageSize = null)
    {
        var query = _db.EmployeeAssignments.AsQueryable();

        if (eventId.HasValue)
            query = query.Where(a => a.EventId == eventId);

        if (employeeId.HasValue)
            query = query.Where(a => a.EmployeeId == employeeId);

        if (!string.IsNullOrEmpty(status))
            query = query.Where(a => a.Status == status);

        query = (sortBy, sortDir) switch
        {
            ("assignedDate", "asc") => query.OrderBy(a => a.AssignedDate),
            ("assignedDate", _) => query.OrderByDescending(a => a.AssignedDate),
            ("role", "asc") => query.OrderBy(a => a.Role),
            ("role", _) => query.OrderByDescending(a => a.Role),
            ("status", "asc") => query.OrderBy(a => a.Status),
            ("status", _) => query.OrderByDescending(a => a.Status),
            _ => query.OrderByDescending(a => a.AssignedDate),
        };

        return Ok(query.Page(page, pageSize));
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(int id)
    {
        var assignment = await _db.EmployeeAssignments.FindAsync(id);
        if (assignment == null)
            return NotFound();

        return Ok(assignment);
    }

    [HttpPost]
    [Authorize(Roles = "Admin,Manager")]
    public async Task<IActionResult> Create([FromBody] EmployeeAssignment assignment)
    {
        if (!ModelState.IsValid)
            return BadRequest(ModelState);

        _db.EmployeeAssignments.Add(assignment);
        await _db.SaveChangesAsync();

        return CreatedAtAction(nameof(GetById), new { id = assignment.Id }, assignment);
    }

    [HttpPut("{id}")]
    [Authorize(Roles = "Admin,Manager")]
    public async Task<IActionResult> Update(int id, [FromBody] EmployeeAssignment assignment)
    {
        var existing = await _db.EmployeeAssignments.FindAsync(id);
        if (existing == null)
            return NotFound();

        existing.EventId = assignment.EventId;
        existing.EmployeeId = assignment.EmployeeId;
        existing.Role = assignment.Role;
        existing.AssignedDate = assignment.AssignedDate;
        existing.Hours = assignment.Hours;
        existing.Status = assignment.Status;
        existing.UpdatedAt = DateTime.UtcNow;

        await _db.SaveChangesAsync();
        return NoContent();
    }

    [HttpDelete("{id}")]
    [Authorize(Roles = "Admin,Manager")]
    public async Task<IActionResult> Delete(int id)
    {
        var assignment = await _db.EmployeeAssignments.FindAsync(id);
        if (assignment == null)
            return NotFound();

        _db.EmployeeAssignments.Remove(assignment);
        await _db.SaveChangesAsync();
        return NoContent();
    }
}