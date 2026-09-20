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
public class EventSuppliersController : ControllerBase
{
    private readonly AppDbContext _db;

    public EventSuppliersController(AppDbContext db)
    {
        _db = db;
    }

    [HttpGet]
    public IActionResult GetAll(int? eventId = null, int? supplierId = null, string? status = null,
        string? serviceType = null, string? sortBy = null, string? sortDir = null,
        int? page = null, int? pageSize = null)
    {
        var query = _db.EventSuppliers.AsQueryable();

        if (eventId.HasValue)
            query = query.Where(es => es.EventId == eventId);

        if (supplierId.HasValue)
            query = query.Where(es => es.SupplierId == supplierId);

        if (!string.IsNullOrEmpty(status))
            query = query.Where(es => es.Status == status);

        if (!string.IsNullOrEmpty(serviceType))
            query = query.Where(es => es.ServiceType == serviceType);

        query = (sortBy, sortDir) switch
        {
            ("serviceType", "asc") => query.OrderBy(es => es.ServiceType),
            ("serviceType", _) => query.OrderByDescending(es => es.ServiceType),
            ("cost", "asc") => query.OrderBy(es => es.Cost),
            ("cost", _) => query.OrderByDescending(es => es.Cost),
            ("status", "asc") => query.OrderBy(es => es.Status),
            ("status", _) => query.OrderByDescending(es => es.Status),
            _ => query.OrderByDescending(es => es.Status),
        };

        return Ok(query.Page(page, pageSize));
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(int id)
    {
        var entity = await _db.EventSuppliers.FindAsync(id);
        if (entity == null)
            return NotFound();

        return Ok(entity);
    }

    [HttpPost]
    [Authorize(Roles = "Admin,Manager")]
    public async Task<IActionResult> Create([FromBody] EventSupplier entity)
    {
        if (!ModelState.IsValid)
            return BadRequest(ModelState);

        _db.EventSuppliers.Add(entity);
        await _db.SaveChangesAsync();

        return CreatedAtAction(nameof(GetById), new { id = entity.Id }, entity);
    }

    [HttpPut("{id}")]
    [Authorize(Roles = "Admin,Manager")]
    public async Task<IActionResult> Update(int id, [FromBody] EventSupplier entity)
    {
        var existing = await _db.EventSuppliers.FindAsync(id);
        if (existing == null)
            return NotFound();

        existing.EventId = entity.EventId;
        existing.SupplierId = entity.SupplierId;
        existing.ServiceType = entity.ServiceType;
        existing.Cost = entity.Cost;
        existing.Status = entity.Status;
        existing.UpdatedAt = DateTime.UtcNow;

        await _db.SaveChangesAsync();
        return NoContent();
    }

    [HttpDelete("{id}")]
    [Authorize(Roles = "Admin,Manager")]
    public async Task<IActionResult> Delete(int id)
    {
        var entity = await _db.EventSuppliers.FindAsync(id);
        if (entity == null)
            return NotFound();

        _db.EventSuppliers.Remove(entity);
        await _db.SaveChangesAsync();
        return NoContent();
    }
}