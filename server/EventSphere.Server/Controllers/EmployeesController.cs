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
public class EmployeesController : ControllerBase
{
    private readonly AppDbContext _db;

    public EmployeesController(AppDbContext db)
    {
        _db = db;
    }

    [HttpGet]
    public IActionResult GetAll(string? role = null, string? search = null,
        string? sortBy = null, string? sortDir = null, int? page = null, int? pageSize = null)
    {
        var query = _db.Employees.AsQueryable();

        if (!string.IsNullOrEmpty(role))
            query = query.Where(e => e.Role == role);

        if (!string.IsNullOrEmpty(search))
            query = query.Where(e =>
                e.FirstName.Contains(search) ||
                e.LastName.Contains(search) ||
                (e.Email != null && e.Email.Contains(search)));

        query = (sortBy, sortDir) switch
        {
            ("lastName", "asc") => query.OrderBy(e => e.LastName),
            ("lastName", _) => query.OrderByDescending(e => e.LastName),
            ("firstName", "asc") => query.OrderBy(e => e.FirstName),
            ("firstName", _) => query.OrderByDescending(e => e.FirstName),
            ("role", "asc") => query.OrderBy(e => e.Role),
            ("role", _) => query.OrderByDescending(e => e.Role),
            ("status", "asc") => query.OrderBy(e => e.Status),
            ("status", _) => query.OrderByDescending(e => e.Status),
            ("hireDate", "asc") => query.OrderBy(e => e.HireDate),
            ("hireDate", _) => query.OrderByDescending(e => e.HireDate),
            _ => query.OrderBy(e => e.LastName),
        };

        return Ok(query.Page(page, pageSize));
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(int id)
    {
        var employee = await _db.Employees.FindAsync(id);
        if (employee == null)
            return NotFound();

        return Ok(employee);
    }

    [HttpPost]
    [Authorize(Roles = "Admin,Manager")]
    public async Task<IActionResult> Create([FromBody] Employee employee)
    {
        if (!ModelState.IsValid)
            return BadRequest(ModelState);

        _db.Employees.Add(employee);
        await _db.SaveChangesAsync();

        return CreatedAtAction(nameof(GetById), new { id = employee.Id }, employee);
    }

    [HttpPut("{id}")]
    [Authorize(Roles = "Admin,Manager")]
    public async Task<IActionResult> Update(int id, [FromBody] Employee employee)
    {
        var existing = await _db.Employees.FindAsync(id);
        if (existing == null)
            return NotFound();

        existing.FirstName = employee.FirstName;
        existing.LastName = employee.LastName;
        existing.Role = employee.Role;
        existing.Email = employee.Email;
        existing.Phone = employee.Phone;
        existing.Salary = employee.Salary;
        existing.HireDate = employee.HireDate;
        existing.Status = employee.Status;
        existing.UpdatedAt = DateTime.UtcNow;

        await _db.SaveChangesAsync();
        return NoContent();
    }

    [HttpDelete("{id}")]
    [Authorize(Roles = "Admin,Manager")]
    public async Task<IActionResult> Delete(int id)
    {
        var employee = await _db.Employees.FindAsync(id);
        if (employee == null)
            return NotFound();

        _db.Employees.Remove(employee);
        await _db.SaveChangesAsync();
        return NoContent();
    }
}