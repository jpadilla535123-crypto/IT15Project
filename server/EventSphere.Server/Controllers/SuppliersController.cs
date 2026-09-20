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
public class SuppliersController : ControllerBase
{
    private readonly AppDbContext _db;

    public SuppliersController(AppDbContext db)
    {
        _db = db;
    }

    [HttpGet]
    public IActionResult GetAll(string? category = null, string? search = null,
        string? sortBy = null, string? sortDir = null, int? page = null, int? pageSize = null)
    {
        var query = _db.Suppliers.AsQueryable();

        if (!string.IsNullOrEmpty(category))
            query = query.Where(s => s.Category == category);

        if (!string.IsNullOrEmpty(search))
            query = query.Where(s =>
                s.Name.Contains(search) ||
                (s.ContactPerson != null && s.ContactPerson.Contains(search)));

        query = (sortBy, sortDir) switch
        {
            ("name", "asc") => query.OrderBy(s => s.Name),
            ("name", _) => query.OrderByDescending(s => s.Name),
            ("category", "asc") => query.OrderBy(s => s.Category),
            ("category", _) => query.OrderByDescending(s => s.Category),
            ("rating", "asc") => query.OrderBy(s => s.Rating),
            ("rating", _) => query.OrderByDescending(s => s.Rating),
            _ => query.OrderBy(s => s.Name),
        };

        return Ok(query.Page(page, pageSize));
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(int id)
    {
        var supplier = await _db.Suppliers.FindAsync(id);
        if (supplier == null)
            return NotFound();

        return Ok(supplier);
    }

    [HttpPost]
    [Authorize(Roles = "Admin,Manager")]
    public async Task<IActionResult> Create([FromBody] Supplier supplier)
    {
        if (!ModelState.IsValid)
            return BadRequest(ModelState);

        _db.Suppliers.Add(supplier);
        await _db.SaveChangesAsync();

        return CreatedAtAction(nameof(GetById), new { id = supplier.Id }, supplier);
    }

    [HttpPut("{id}")]
    [Authorize(Roles = "Admin,Manager")]
    public async Task<IActionResult> Update(int id, [FromBody] Supplier supplier)
    {
        var existing = await _db.Suppliers.FindAsync(id);
        if (existing == null)
            return NotFound();

        existing.Name = supplier.Name;
        existing.Category = supplier.Category;
        existing.ContactPerson = supplier.ContactPerson;
        existing.Email = supplier.Email;
        existing.Phone = supplier.Phone;
        existing.Rating = supplier.Rating;
        existing.Notes = supplier.Notes;
        existing.UpdatedAt = DateTime.UtcNow;

        await _db.SaveChangesAsync();
        return NoContent();
    }

    [HttpDelete("{id}")]
    [Authorize(Roles = "Admin,Manager")]
    public async Task<IActionResult> Delete(int id)
    {
        var supplier = await _db.Suppliers.FindAsync(id);
        if (supplier == null)
            return NotFound();

        _db.Suppliers.Remove(supplier);
        await _db.SaveChangesAsync();
        return NoContent();
    }
}