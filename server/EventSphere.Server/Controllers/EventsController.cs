using EventSphere.Server.Data;
using EventSphere.Server.Models;
using Microsoft.AspNetCore.Mvc;

namespace EventSphere.Server.Controllers;

[ApiController]
[Route("api/[controller]")]
public class EventsController : ControllerBase
{
    private readonly InMemoryDataContext _data;

    public EventsController(InMemoryDataContext data)
    {
        _data = data;
    }

    [HttpGet]
    public IActionResult GetAll(string? status = null, string? search = null, DateTime? from = null, DateTime? to = null)
    {
        var query = _data.Events.AsQueryable();

        if (!string.IsNullOrEmpty(status))
            query = query.Where(e => e.Status == status);

        if (!string.IsNullOrEmpty(search))
            query = query.Where(e => e.Name.Contains(search));

        if (from.HasValue)
            query = query.Where(e => e.StartDate.Date >= from.Value.Date);

        if (to.HasValue)
            query = query.Where(e => e.StartDate.Date <= to.Value.Date);
        return Ok(query.OrderByDescending(e => e.StartDate).ToList());
    }

    [HttpGet("{id}")]
    public IActionResult GetById(int id)
    {
        var evt = _data.Events.FirstOrDefault(e => e.Id == id);
        if (evt == null)
            return NotFound();

        return Ok(evt);
    }

    [HttpPost]
    public IActionResult Create([FromBody] Event evt)
    {
        if (!ModelState.IsValid)
            return BadRequest(ModelState);

        evt.Id = _data.NextId(_data.Events);
        evt.CreatedAt = DateTime.UtcNow;
        evt.UpdatedAt = DateTime.UtcNow;
        _data.Events.Add(evt);

        return CreatedAtAction(nameof(GetById), new { id = evt.Id }, evt);
    }

    [HttpPut("{id}")]
    public IActionResult Update(int id, [FromBody] Event evt)
    {
        var existing = _data.Events.FirstOrDefault(e => e.Id == id);
        if (existing == null)
            return NotFound();

        existing.Name = evt.Name;
        existing.EventType = evt.EventType;
        existing.Status = evt.Status;
        existing.StartDate = evt.StartDate;
        existing.EndDate = evt.EndDate;
        existing.ClientId = evt.ClientId;
        existing.VenueId = evt.VenueId;
        existing.Description = evt.Description;
        existing.UpdatedAt = DateTime.UtcNow;

        return NoContent();
    }

    [HttpDelete("{id}")]
    public IActionResult Delete(int id)
    {
        var evt = _data.Events.FirstOrDefault(e => e.Id == id);
        if (evt == null)
            return NotFound();

        _data.Events.Remove(evt);
        return NoContent();
    }
}