using EventSphere.Server.Data;
using EventSphere.Server.Models;
using Microsoft.AspNetCore.Mvc;

namespace EventSphere.Server.Controllers;

[ApiController]
[Route("api/[controller]")]
public class LeadsController : ControllerBase
{
    private readonly InMemoryDataContext _data;

    public LeadsController(InMemoryDataContext data)
    {
        _data = data;
    }

    [HttpGet]
    public IActionResult GetAll(string? status = null, string? search = null)
    {
        var query = _data.Leads.AsQueryable();

        if (!string.IsNullOrEmpty(status))
            query = query.Where(l => l.Status == status);

        if (!string.IsNullOrEmpty(search))
            query = query.Where(l =>
                l.CompanyName.Contains(search) ||
                (l.ContactName != null && l.ContactName.Contains(search)) ||
                (l.Email != null && l.Email.Contains(search)));

        return Ok(query.OrderByDescending(l => l.CreatedDate).ToList());
    }

    [HttpGet("{id}")]
    public IActionResult GetById(int id)
    {
        var lead = _data.Leads.FirstOrDefault(l => l.Id == id);
        if (lead == null)
            return NotFound();

        return Ok(lead);
    }

    [HttpPost]
    public IActionResult Create([FromBody] Lead lead)
    {
        if (!ModelState.IsValid)
            return BadRequest(ModelState);

        lead.Id = _data.NextId(_data.Leads);
        lead.CreatedAt = DateTime.UtcNow;
        lead.UpdatedAt = DateTime.UtcNow;
        _data.Leads.Add(lead);

        return CreatedAtAction(nameof(GetById), new { id = lead.Id }, lead);
    }

    [HttpPut("{id}")]
    public IActionResult Update(int id, [FromBody] Lead lead)
    {
        var existing = _data.Leads.FirstOrDefault(l => l.Id == id);
        if (existing == null)
            return NotFound();

        existing.CompanyName = lead.CompanyName;
        existing.ContactName = lead.ContactName;
        existing.Email = lead.Email;
        existing.Phone = lead.Phone;
        existing.Source = lead.Source;
        existing.EventType = lead.EventType;
        existing.EstimatedBudget = lead.EstimatedBudget;
        existing.Status = lead.Status;
        existing.Notes = lead.Notes;
        existing.CreatedDate = lead.CreatedDate;
        existing.UpdatedAt = DateTime.UtcNow;

        return NoContent();
    }

    [HttpDelete("{id}")]
    public IActionResult Delete(int id)
    {
        var lead = _data.Leads.FirstOrDefault(l => l.Id == id);
        if (lead == null)
            return NotFound();

        _data.Leads.Remove(lead);
        return NoContent();
    }
}