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
public class EventsController : ControllerBase
{
    private readonly AppDbContext _db;

    public EventsController(AppDbContext db)
    {
        _db = db;
    }

    [HttpGet]
    public IActionResult GetAll(string? status = null, string? search = null,
        DateTime? from = null, DateTime? to = null, string? eventType = null,
        string? sortBy = null, string? sortDir = null,
        int? page = null, int? pageSize = null)
    {
        var query = _db.Events.AsQueryable();

        if (!string.IsNullOrEmpty(status))
            query = query.Where(e => e.Status == status);

        if (!string.IsNullOrEmpty(eventType))
            query = query.Where(e => e.EventType == eventType);

        if (!string.IsNullOrEmpty(search))
            query = query.Where(e =>
                e.Name.Contains(search) ||
                (e.Description != null && e.Description.Contains(search)));

        if (from.HasValue)
            query = query.Where(e => e.StartDate.Date >= from.Value.Date);

        if (to.HasValue)
            query = query.Where(e => e.StartDate.Date <= to.Value.Date);

        query = (sortBy, sortDir) switch
        {
            ("startDate", "asc") => query.OrderBy(e => e.StartDate),
            ("startDate", _) => query.OrderByDescending(e => e.StartDate),
            ("endDate", "asc") => query.OrderBy(e => e.EndDate),
            ("endDate", _) => query.OrderByDescending(e => e.EndDate),
            ("name", "asc") => query.OrderBy(e => e.Name),
            ("name", _) => query.OrderByDescending(e => e.Name),
            ("status", "asc") => query.OrderBy(e => e.Status),
            ("status", _) => query.OrderByDescending(e => e.Status),
            ("eventType", "asc") => query.OrderBy(e => e.EventType),
            ("eventType", _) => query.OrderByDescending(e => e.EventType),
            _ => query.OrderByDescending(e => e.StartDate),
        };

        return Ok(query.Page(page, pageSize));
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(int id)
    {
        var evt = await _db.Events.FindAsync(id);
        if (evt == null)
            return NotFound();

        return Ok(evt);
    }

    /* Public, unauthenticated feed of open events for the native site's
       "Get a Ticket" flow. Exposes only a safe projection: no client data. */
    [HttpGet("public")]
    [AllowAnonymous]
    public IActionResult GetPublicOpenEvents()
    {
        var list = _db.Events
            .Where(e => e.Status != "Completed" && e.Status != "Cancelled" && e.AccessType == "Public")
            .OrderBy(e => e.StartDate)
            .Select(e => new
            {
                id = e.Id,
                name = e.Name,
                eventType = e.EventType,
                status = e.Status,
                startDate = e.StartDate,
                endDate = e.EndDate,
                venueId = e.VenueId,
                venueName = e.Venue != null ? e.Venue.Name : null,
                venueAddress = e.Venue != null ? e.Venue.Address : null,
                venueCity = e.Venue != null ? e.Venue.City : null,
                price = e.Venue != null ? e.Venue.PricePerDay : 0m,
            })
            .ToList();

        return Ok(list);
    }

    [HttpPost]
    [Authorize(Roles = "Admin,Manager")]
    public async Task<IActionResult> Create([FromBody] Event evt)
    {
        if (!ModelState.IsValid)
            return BadRequest(ModelState);

        _db.Events.Add(evt);
        await _db.SaveChangesAsync();

        return CreatedAtAction(nameof(GetById), new { id = evt.Id }, evt);
    }

    [HttpPut("{id}")]
    [Authorize(Roles = "Admin,Manager")]
    public async Task<IActionResult> Update(int id, [FromBody] Event evt)
    {
        var existing = await _db.Events.FindAsync(id);
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
        existing.AccessType = evt.AccessType;
        existing.UpdatedAt = DateTime.UtcNow;

        await _db.SaveChangesAsync();
        return NoContent();
    }

    [HttpDelete("{id}")]
    [Authorize(Roles = "Admin,Manager")]
    public async Task<IActionResult> Delete(int id)
    {
        var evt = await _db.Events.FindAsync(id);
        if (evt == null)
            return NotFound();

        _db.Events.Remove(evt);
        await _db.SaveChangesAsync();
        return NoContent();
    }
}