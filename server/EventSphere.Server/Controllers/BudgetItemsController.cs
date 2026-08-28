using EventSphere.Server.Data;
using EventSphere.Server.Models;
using Microsoft.AspNetCore.Mvc;

namespace EventSphere.Server.Controllers;

[ApiController]
[Route("api/[controller]")]
public class BudgetItemsController : ControllerBase
{
    private readonly InMemoryDataContext _data;

    public BudgetItemsController(InMemoryDataContext data)
    {
        _data = data;
    }

    [HttpGet]
    public IActionResult GetAll(int? budgetId = null)
    {
        var query = _data.BudgetItems.AsQueryable();

        if (budgetId.HasValue)
            query = query.Where(bi => bi.BudgetId == budgetId);

        return Ok(query.OrderBy(bi => bi.Name).ToList());
    }

    [HttpGet("{id}")]
    public IActionResult GetById(int id)
    {
        var item = _data.BudgetItems.FirstOrDefault(bi => bi.Id == id);
        if (item == null)
            return NotFound();

        return Ok(item);
    }

    [HttpPost]
    public IActionResult Create([FromBody] BudgetItem item)
    {
        if (!ModelState.IsValid)
            return BadRequest(ModelState);

        item.Id = _data.NextId(_data.BudgetItems);
        item.CreatedAt = DateTime.UtcNow;
        item.UpdatedAt = DateTime.UtcNow;
        _data.BudgetItems.Add(item);

        return CreatedAtAction(nameof(GetById), new { id = item.Id }, item);
    }

    [HttpPut("{id}")]
    public IActionResult Update(int id, [FromBody] BudgetItem item)
    {
        var existing = _data.BudgetItems.FirstOrDefault(bi => bi.Id == id);
        if (existing == null)
            return NotFound();

        existing.BudgetId = item.BudgetId;
        existing.Name = item.Name;
        existing.PlannedAmount = item.PlannedAmount;
        existing.ActualAmount = item.ActualAmount;
        existing.Notes = item.Notes;
        existing.UpdatedAt = DateTime.UtcNow;

        return NoContent();
    }

    [HttpDelete("{id}")]
    public IActionResult Delete(int id)
    {
        var item = _data.BudgetItems.FirstOrDefault(bi => bi.Id == id);
        if (item == null)
            return NotFound();

        _data.BudgetItems.Remove(item);
        return NoContent();
    }
}