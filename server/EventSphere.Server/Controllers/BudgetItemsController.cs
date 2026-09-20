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
public class BudgetItemsController : ControllerBase
{
    private readonly AppDbContext _db;

    public BudgetItemsController(AppDbContext db)
    {
        _db = db;
    }

    [HttpGet]
    public IActionResult GetAll(int? budgetId = null, string? search = null,
        string? sortBy = null, string? sortDir = null, int? page = null, int? pageSize = null)
    {
        var query = _db.BudgetItems.AsQueryable();

        if (budgetId.HasValue)
            query = query.Where(bi => bi.BudgetId == budgetId);

        if (!string.IsNullOrEmpty(search))
            query = query.Where(bi => bi.Name.Contains(search));

        query = (sortBy, sortDir) switch
        {
            ("name", "asc") => query.OrderBy(bi => bi.Name),
            ("name", _) => query.OrderByDescending(bi => bi.Name),
            ("plannedAmount", "asc") => query.OrderBy(bi => bi.PlannedAmount),
            ("plannedAmount", _) => query.OrderByDescending(bi => bi.PlannedAmount),
            ("actualAmount", "asc") => query.OrderBy(bi => bi.ActualAmount),
            ("actualAmount", _) => query.OrderByDescending(bi => bi.ActualAmount),
            _ => query.OrderBy(bi => bi.Name),
        };

        return Ok(query.Page(page, pageSize));
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(int id)
    {
        var item = await _db.BudgetItems.FindAsync(id);
        if (item == null)
            return NotFound();

        return Ok(item);
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] BudgetItem item)
    {
        if (!ModelState.IsValid)
            return BadRequest(ModelState);

        _db.BudgetItems.Add(item);
        await _db.SaveChangesAsync();

        return CreatedAtAction(nameof(GetById), new { id = item.Id }, item);
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> Update(int id, [FromBody] BudgetItem item)
    {
        var existing = await _db.BudgetItems.FindAsync(id);
        if (existing == null)
            return NotFound();

        existing.BudgetId = item.BudgetId;
        existing.Name = item.Name;
        existing.PlannedAmount = item.PlannedAmount;
        existing.ActualAmount = item.ActualAmount;
        existing.Notes = item.Notes;
        existing.UpdatedAt = DateTime.UtcNow;

        await _db.SaveChangesAsync();
        return NoContent();
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(int id)
    {
        var item = await _db.BudgetItems.FindAsync(id);
        if (item == null)
            return NotFound();

        _db.BudgetItems.Remove(item);
        await _db.SaveChangesAsync();
        return NoContent();
    }
}