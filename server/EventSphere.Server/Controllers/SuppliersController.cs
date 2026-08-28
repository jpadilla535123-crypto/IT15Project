using EventSphere.Server.Data;
using EventSphere.Server.Models;
using Microsoft.AspNetCore.Mvc;

namespace EventSphere.Server.Controllers;

[ApiController]
[Route("api/[controller]")]
public class SuppliersController : ControllerBase
{
    private readonly InMemoryDataContext _data;

    public SuppliersController(InMemoryDataContext data)
    {
        _data = data;
    }

    [HttpGet]
    public IActionResult GetAll(string? category = null, string? search = null)
    {
        var query = _data.Suppliers.AsQueryable();

        if (!string.IsNullOrEmpty(category))
            query = query.Where(s => s.Category == category);

        if (!string.IsNullOrEmpty(search))
            query = query.Where(s =>
                s.Name.Contains(search) ||
                (s.ContactPerson != null && s.ContactPerson.Contains(search)));

        return Ok(query.OrderBy(s => s.Name).ToList());
    }

    [HttpGet("{id}")]
    public IActionResult GetById(int id)
    {
        var supplier = _data.Suppliers.FirstOrDefault(s => s.Id == id);
        if (supplier == null)
            return NotFound();

        return Ok(supplier);
    }

    [HttpPost]
    public IActionResult Create([FromBody] Supplier supplier)
    {
        if (!ModelState.IsValid)
            return BadRequest(ModelState);

        supplier.Id = _data.NextId(_data.Suppliers);
        supplier.CreatedAt = DateTime.UtcNow;
        supplier.UpdatedAt = DateTime.UtcNow;
        _data.Suppliers.Add(supplier);

        return CreatedAtAction(nameof(GetById), new { id = supplier.Id }, supplier);
    }

    [HttpPut("{id}")]
    public IActionResult Update(int id, [FromBody] Supplier supplier)
    {
        var existing = _data.Suppliers.FirstOrDefault(s => s.Id == id);
        if (existing == null)
            return NotFound();

        existing.Name = supplier.Name;
        existing.Category = supplier.Category;
        existing.ContactPerson = supplier.ContactPerson;
        existing.Email = supplier.Email;
        existing.Phone = supplier.Phone;
        existing.Rating = supplier.Rating;
        existing.Notes = supplier.Notes;
        existing.UpdatedAt = DateTime.UtcNow;

        return NoContent();
    }

    [HttpDelete("{id}")]
    public IActionResult Delete(int id)
    {
        var supplier = _data.Suppliers.FirstOrDefault(s => s.Id == id);
        if (supplier == null)
            return NotFound();

        _data.Suppliers.Remove(supplier);
        return NoContent();
    }
}