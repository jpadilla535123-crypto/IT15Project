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
public class ClientsController : ControllerBase
{
    private readonly AppDbContext _db;

    public ClientsController(AppDbContext db)
    {
        _db = db;
    }

    [HttpGet]
    public IActionResult GetAll(string? status = null, string? search = null, string? clientType = null,
        string? sortBy = null, string? sortDir = null, int? page = null, int? pageSize = null)
    {
        var query = _db.Clients.AsQueryable();

        if (!string.IsNullOrEmpty(status))
            query = query.Where(c => c.Status == status);

        if (!string.IsNullOrEmpty(clientType))
            query = query.Where(c => c.ClientType == clientType);

        if (!string.IsNullOrEmpty(search))
            query = query.Where(c =>
                c.CompanyName.Contains(search) ||
                (c.Email != null && c.Email.Contains(search)) ||
                (c.ContactPerson != null && c.ContactPerson.Contains(search)));

        query = (sortBy, sortDir) switch
        {
            ("companyName", "asc") => query.OrderBy(c => c.CompanyName),
            ("companyName", _) => query.OrderByDescending(c => c.CompanyName),
            ("status", "asc") => query.OrderBy(c => c.Status),
            ("status", _) => query.OrderByDescending(c => c.Status),
            ("clientType", "asc") => query.OrderBy(c => c.ClientType),
            ("clientType", _) => query.OrderByDescending(c => c.ClientType),
            ("dateOfInquiry", "asc") => query.OrderBy(c => c.DateOfInquiry),
            ("dateOfInquiry", _) => query.OrderByDescending(c => c.DateOfInquiry),
            _ => query.OrderByDescending(c => c.DateOfInquiry),
        };

        return Ok(query.Page(page, pageSize));
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(int id)
    {
        var client = await _db.Clients.FindAsync(id);
        if (client == null)
            return NotFound();

        return Ok(client);
    }

    [HttpPost]
    [Authorize(Roles = "Admin,Manager")]
    public async Task<IActionResult> Create([FromBody] Client client)
    {
        if (!ModelState.IsValid)
            return BadRequest(ModelState);

        _db.Clients.Add(client);
        await _db.SaveChangesAsync();

        return CreatedAtAction(nameof(GetById), new { id = client.Id }, client);
    }

    [HttpPut("{id}")]
    [Authorize(Roles = "Admin,Manager")]
    public async Task<IActionResult> Update(int id, [FromBody] Client client)
    {
        var existing = await _db.Clients.FindAsync(id);
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

        await _db.SaveChangesAsync();
        return NoContent();
    }

    [HttpDelete("{id}")]
    [Authorize(Roles = "Admin,Manager")]
    public async Task<IActionResult> Delete(int id)
    {
        var client = await _db.Clients.FindAsync(id);
        if (client == null)
            return NotFound();

        _db.Clients.Remove(client);
        await _db.SaveChangesAsync();
        return NoContent();
    }
}