using EventSphere.Server.Data;
using EventSphere.Server.Models;
using Microsoft.AspNetCore.Mvc;

namespace EventSphere.Server.Controllers;

[ApiController]
[Route("api/[controller]")]
public class EventSuppliersController : ControllerBase
{
    private readonly InMemoryDataContext _data;

    public EventSuppliersController(InMemoryDataContext data)
    {
        _data = data;
    }

    [HttpGet]
    public IActionResult GetAll(int? eventId = null, int? supplierId = null)
    {
        var query = _data.EventSuppliers.AsQueryable();

        if (eventId.HasValue)
            query = query.Where(es => es.EventId == eventId);

        if (supplierId.HasValue)
            query = query.Where(es => es.SupplierId == supplierId);

        return Ok(query.OrderByDescending(es => es.CreatedAt).ToList());
    }

    [HttpGet("{id}")]
    public IActionResult GetById(int id)
    {
        var item = _data.EventSuppliers.FirstOrDefault(es => es.Id == id);
        if (item == null)
            return NotFound();

        return Ok(item);
    }

    [HttpPost]
    public IActionResult Create([FromBody] EventSupplier item)
    {
        if (!ModelState.IsValid)
            return BadRequest(ModelState);

        item.Id = _data.NextId(_data.EventSuppliers);
        item.CreatedAt = DateTime.UtcNow;
        item.UpdatedAt = DateTime.UtcNow;
        _data.EventSuppliers.Add(item);

        return CreatedAtAction(nameof(GetById), new { id = item.Id }, item);
    }

    [HttpPut("{id}")]
    public IActionResult Update(int id, [FromBody] EventSupplier item)
    {
        var existing = _data.EventSuppliers.FirstOrDefault(es => es.Id == id);
        if (existing == null)
            return NotFound();

        existing.EventId = item.EventId;
        existing.SupplierId = item.SupplierId;
        existing.ServiceType = item.ServiceType;
        existing.Cost = item.Cost;
        existing.Status = item.Status;
        existing.UpdatedAt = DateTime.UtcNow;

        return NoContent();
    }

    [HttpDelete("{id}")]
    public IActionResult Delete(int id)
    {
        var item = _data.EventSuppliers.FirstOrDefault(es => es.Id == id);
        if (item == null)
            return NotFound();

        _data.EventSuppliers.Remove(item);
        return NoContent();
    }
}