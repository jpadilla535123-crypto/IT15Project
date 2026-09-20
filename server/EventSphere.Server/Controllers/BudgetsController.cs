using EventSphere.Server.Data;
using EventSphere.Server.Extensions;
using EventSphere.Server.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace EventSphere.Server.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize(Roles = "Admin,Manager,Finance")]
public class BudgetsController : ControllerBase
{
    private readonly AppDbContext _db;

    public BudgetsController(AppDbContext db)
    {
        _db = db;
    }

    [HttpGet]
    public IActionResult GetAll(int? eventId = null, string? category = null,
        string? sortBy = null, string? sortDir = null, int? page = null, int? pageSize = null)
    {
        var query = _db.Budgets.AsQueryable();

        if (eventId.HasValue)
            query = query.Where(b => b.EventId == eventId);

        if (!string.IsNullOrEmpty(category))
            query = query.Where(b => b.Category == category);

        query = (sortBy, sortDir) switch
        {
            ("category", "asc") => query.OrderBy(b => b.Category),
            ("category", _) => query.OrderByDescending(b => b.Category),
            ("plannedAmount", "asc") => query.OrderBy(b => b.PlannedAmount),
            ("plannedAmount", _) => query.OrderByDescending(b => b.PlannedAmount),
            ("actualAmount", "asc") => query.OrderBy(b => b.ActualAmount),
            ("actualAmount", _) => query.OrderByDescending(b => b.ActualAmount),
            _ => query.OrderBy(b => b.Category),
        };

        return Ok(query.Page(page, pageSize));
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(int id)
    {
        var entity = await _db.Budgets.FindAsync(id);
        if (entity == null)
            return NotFound();

        return Ok(entity);
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] Budget entity)
    {
        if (!ModelState.IsValid)
            return BadRequest(ModelState);

        _db.Budgets.Add(entity);
        await _db.SaveChangesAsync();

        return CreatedAtAction(nameof(GetById), new { id = entity.Id }, entity);
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> Update(int id, [FromBody] Budget entity)
    {
        var existing = await _db.Budgets.FindAsync(id);
        if (existing == null)
            return NotFound();

        existing.EventId = entity.EventId;
        existing.Category = entity.Category;
        existing.PlannedAmount = entity.PlannedAmount;
        existing.ActualAmount = entity.ActualAmount;
        existing.Notes = entity.Notes;
        existing.UpdatedAt = DateTime.UtcNow;

        await _db.SaveChangesAsync();
        return NoContent();
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(int id)
    {
        var entity = await _db.Budgets.FindAsync(id);
        if (entity == null)
            return NotFound();

        _db.Budgets.Remove(entity);
        await _db.SaveChangesAsync();
        return NoContent();
    }
}