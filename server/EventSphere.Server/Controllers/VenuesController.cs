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
public class VenuesController : ControllerBase
{
    private readonly AppDbContext _db;

    public VenuesController(AppDbContext db)
    {
        _db = db;
    }

    [HttpGet]
    public IActionResult GetAll(string? city = null, string? search = null,
        string? sortBy = null, string? sortDir = null, int? page = null, int? pageSize = null)
    {
        var query = _db.Venues.AsQueryable();

        if (!string.IsNullOrEmpty(city))
            query = query.Where(v => v.City == city);

        if (!string.IsNullOrEmpty(search))
            query = query.Where(v =>
                v.Name.Contains(search) ||
                (v.City != null && v.City.Contains(search)));

        query = (sortBy, sortDir) switch
        {
            ("name", "asc") => query.OrderBy(v => v.Name),
            ("name", _) => query.OrderByDescending(v => v.Name),
            ("city", "asc") => query.OrderBy(v => v.City),
            ("city", _) => query.OrderByDescending(v => v.City),
            ("capacity", "asc") => query.OrderBy(v => v.Capacity),
            ("capacity", _) => query.OrderByDescending(v => v.Capacity),
            ("pricePerDay", "asc") => query.OrderBy(v => v.PricePerDay),
            ("pricePerDay", _) => query.OrderByDescending(v => v.PricePerDay),
            _ => query.OrderBy(v => v.Name),
        };

        return Ok(query.Page(page, pageSize));
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(int id)
    {
        var venue = await _db.Venues.FindAsync(id);
        if (venue == null)
            return NotFound();

        return Ok(venue);
    }

    [HttpPost]
    [Authorize(Roles = "Admin,Manager")]
    public async Task<IActionResult> Create([FromBody] Venue venue)
    {
        if (!ModelState.IsValid)
            return BadRequest(ModelState);

        _db.Venues.Add(venue);
        await _db.SaveChangesAsync();

        return CreatedAtAction(nameof(GetById), new { id = venue.Id }, venue);
    }

    [HttpPut("{id}")]
    [Authorize(Roles = "Admin,Manager")]
    public async Task<IActionResult> Update(int id, [FromBody] Venue venue)
    {
        var existing = await _db.Venues.FindAsync(id);
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
        existing.Status = venue.Status;
        existing.UpdatedAt = DateTime.UtcNow;

        await _db.SaveChangesAsync();
        return NoContent();
    }

    [HttpDelete("{id}")]
    [Authorize(Roles = "Admin,Manager")]
    public async Task<IActionResult> Delete(int id)
    {
        var venue = await _db.Venues.FindAsync(id);
        if (venue == null)
            return NotFound();

        _db.Venues.Remove(venue);
        await _db.SaveChangesAsync();
        return NoContent();
    }
}