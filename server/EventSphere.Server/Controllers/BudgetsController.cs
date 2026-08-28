using EventSphere.Server.Data;
using EventSphere.Server.Models;
using Microsoft.AspNetCore.Mvc;

namespace EventSphere.Server.Controllers;

[ApiController]
[Route("api/[controller]")]
public class BudgetsController : ControllerBase
{
    private readonly InMemoryDataContext _data;

    public BudgetsController(InMemoryDataContext data)
    {
        _data = data;
    }

    [HttpGet]
    public IActionResult GetAll(int? eventId = null, string? category = null)
    {
        var query = _data.Budgets.AsQueryable();

        if (eventId.HasValue)
            query = query.Where(b => b.EventId == eventId);

        if (!string.IsNullOrEmpty(category))
            query = query.Where(b => b.Category == category);

        return Ok(query
            .OrderBy(b => b.Event!.Name)
            .ThenBy(b => b.Category)
            .ToList());
    }

    [HttpGet("{id}")]
    public IActionResult GetById(int id)
    {
        var budget = _data.Budgets.FirstOrDefault(b => b.Id == id);
        if (budget == null)
            return NotFound();

        return Ok(budget);
    }

    [HttpPost]
    public IActionResult Create([FromBody] Budget budget)
    {
        if (!ModelState.IsValid)
            return BadRequest(ModelState);

        budget.Id = _data.NextId(_data.Budgets);
        budget.CreatedAt = DateTime.UtcNow;
        budget.UpdatedAt = DateTime.UtcNow;
        _data.Budgets.Add(budget);

        return CreatedAtAction(nameof(GetById), new { id = budget.Id }, budget);
    }

    [HttpPut("{id}")]
    public IActionResult Update(int id, [FromBody] Budget budget)
    {
        var existing = _data.Budgets.FirstOrDefault(b => b.Id == id);
        if (existing == null)
            return NotFound();

        existing.EventId = budget.EventId;
        existing.Category = budget.Category;
        existing.PlannedAmount = budget.PlannedAmount;
        existing.ActualAmount = budget.ActualAmount;
        existing.Notes = budget.Notes;
        existing.UpdatedAt = DateTime.UtcNow;

        return NoContent();
    }

    [HttpDelete("{id}")]
    public IActionResult Delete(int id)
    {
        var budget = _data.Budgets.FirstOrDefault(b => b.Id == id);
        if (budget == null)
            return NotFound();

        _data.Budgets.Remove(budget);
        return NoContent();
    }
}