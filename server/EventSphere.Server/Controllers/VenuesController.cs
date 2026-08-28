using EventSphere.Server.Data;
using EventSphere.Server.Models;
using Microsoft.AspNetCore.Mvc;

namespace EventSphere.Server.Controllers;

[ApiController]
[Route("api/[controller]")]
public class VenuesController : ControllerBase
{
    private readonly InMemoryDataContext _data;

    public VenuesController(InMemoryDataContext data)
    {
        _data = data;
    }

    [HttpGet]
    public IActionResult GetAll(string? search = null)
    {
        var query = _data.Venues.AsQueryable();

        if (!string.IsNullOrEmpty(search))
            query = query.Where(v =>
                v.Name.Contains(search) ||
                (v.City != null && v.City.Contains(search)));

        return Ok(query.OrderBy(v => v.Name).ToList());
    }

    [HttpGet("{id}")]
    public IActionResult GetById(int id)
    {
        var venue = _data.Venues.FirstOrDefault(v => v.Id == id);
        if (venue == null)
            return NotFound();

        return Ok(venue);
    }

    [HttpPost]
    public IActionResult Create([FromBody] Venue venue)
    {
        if (!ModelState.IsValid)
            return BadRequest(ModelState);

        venue.Id = _data.NextId(_data.Venues);
        venue.CreatedAt = DateTime.UtcNow;
        venue.UpdatedAt = DateTime.UtcNow;
        _data.Venues.Add(venue);

        return CreatedAtAction(nameof(GetById), new { id = venue.Id }, venue);
    }

    [HttpPut("{id}")]
    public IActionResult Update(int id, [FromBody] Venue venue)
    {
        var existing = _data.Venues.FirstOrDefault(v => v.Id == id);
        if (existing == null)
            return NotFound();

        existing.Name = venue.Name;
        existing.Address = venue.Address;
        existing.City = venue.City;
        existing.Capacity = venue.Capacity;
        existing.PricePerDay = venue.PricePerDay;
        existing.ContactPerson = venue.ContactPerson;
        existing.Phone = venue.Phone;
        existing.Email = venue.Email;
        existing.Description = venue.Description;
        existing.UpdatedAt = DateTime.UtcNow;

        return NoContent();
    }

    [HttpDelete("{id}")]
    public IActionResult Delete(int id)
    {
        var venue = _data.Venues.FirstOrDefault(v => v.Id == id);
        if (venue == null)
            return NotFound();

        _data.Venues.Remove(venue);
        return NoContent();
    }
}