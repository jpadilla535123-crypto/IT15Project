using EventSphere.Server.Data;
using EventSphere.Server.Models;
using Microsoft.AspNetCore.Mvc;

namespace EventSphere.Server.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ClientsController : ControllerBase
{
    private readonly InMemoryDataContext _data;

    public ClientsController(InMemoryDataContext data)
    {
        _data = data;
    }

    [HttpGet]
    public IActionResult GetAll(string? status = null, string? search = null)
    {
        var query = _data.Clients.AsQueryable();

        if (!string.IsNullOrEmpty(status))
            query = query.Where(c => c.Status == status);

        if (!string.IsNullOrEmpty(search))
            query = query.Where(c =>
                c.CompanyName.Contains(search) ||
                (c.Email != null && c.Email.Contains(search)) ||
                (c.ContactPerson != null && c.ContactPerson.Contains(search)));

        return Ok(query.OrderByDescending(c => c.DateOfInquiry).ToList());
    }

    [HttpGet("{id}")]
    public IActionResult GetById(int id)
    {
        var client = _data.Clients.FirstOrDefault(c => c.Id == id);
        if (client == null)
            return NotFound();

        return Ok(client);
    }

    [HttpPost]
    public IActionResult Create([FromBody] Client client)
    {
        if (!ModelState.IsValid)
            return BadRequest(ModelState);

        client.Id = _data.NextId(_data.Clients);
        client.CreatedAt = DateTime.UtcNow;
        client.UpdatedAt = DateTime.UtcNow;
        _data.Clients.Add(client);

        return CreatedAtAction(nameof(GetById), new { id = client.Id }, client);
    }

    [HttpPut("{id}")]
    public IActionResult Update(int id, [FromBody] Client client)
    {
        var existing = _data.Clients.FirstOrDefault(c => c.Id == id);
        if (existing == null)
            return NotFound();

        existing.CompanyName = client.CompanyName;
        existing.ContactPerson = client.ContactPerson;
        existing.Email = client.Email;
        existing.Phone = client.Phone;
        existing.Address = client.Address;
        existing.ClientType = client.ClientType;
        existing.Status = client.Status;
        existing.DateOfInquiry = client.DateOfInquiry;
        existing.UpdatedAt = DateTime.UtcNow;

        return NoContent();
    }

    [HttpDelete("{id}")]
    public IActionResult Delete(int id)
    {
        var client = _data.Clients.FirstOrDefault(c => c.Id == id);
        if (client == null)
            return NotFound();

        _data.Clients.Remove(client);
        return NoContent();
    }
}