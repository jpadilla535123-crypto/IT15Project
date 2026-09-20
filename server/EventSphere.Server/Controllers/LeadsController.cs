using System.ComponentModel.DataAnnotations;
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
public class LeadsController : ControllerBase
{
    private readonly AppDbContext _db;

    public LeadsController(AppDbContext db)
    {
        _db = db;
    }

    [HttpGet]
    public IActionResult GetAll(string? status = null, string? search = null, string? source = null,
        string? sortBy = null, string? sortDir = null, int? page = null, int? pageSize = null)
    {
        var query = _db.Leads.AsQueryable();

        if (!string.IsNullOrEmpty(status))
            query = query.Where(l => l.Status == status);

        if (!string.IsNullOrEmpty(source))
            query = query.Where(l => l.Source == source);

        if (!string.IsNullOrEmpty(search))
            query = query.Where(l =>
                l.CompanyName.Contains(search) ||
                (l.ContactName != null && l.ContactName.Contains(search)) ||
                (l.Email != null && l.Email.Contains(search)));

        query = (sortBy, sortDir) switch
        {
            ("companyName", "asc") => query.OrderBy(l => l.CompanyName),
            ("companyName", _) => query.OrderByDescending(l => l.CompanyName),
            ("status", "asc") => query.OrderBy(l => l.Status),
            ("status", _) => query.OrderByDescending(l => l.Status),
            ("estimatedBudget", "asc") => query.OrderBy(l => l.EstimatedBudget),
            ("estimatedBudget", _) => query.OrderByDescending(l => l.EstimatedBudget),
            ("createdDate", "asc") => query.OrderBy(l => l.CreatedDate),
            ("createdDate", _) => query.OrderByDescending(l => l.CreatedDate),
            _ => query.OrderByDescending(l => l.CreatedDate),
        };

        return Ok(query.Page(page, pageSize));
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(int id)
    {
        var lead = await _db.Leads.FindAsync(id);
        if (lead == null)
            return NotFound();

        return Ok(lead);
    }

    /* Public, unauthenticated entry point used by the native site's
       newsletter ("Stay in the loop") and public ticket registration.
       Creates a 'New' lead so it shows up in Lead Management. */
    public class PublicLeadRequest
    {
        [Required, EmailAddress]
        public string Email { get; set; } = string.Empty;

        public string? Name { get; set; }

        public string? Source { get; set; }

        public string? EventType { get; set; }

        public string? Notes { get; set; }

        public decimal? EstimatedBudget { get; set; }
    }

    [HttpPost("public")]
    [AllowAnonymous]
    public async Task<IActionResult> CreatePublicLead([FromBody] PublicLeadRequest req)
    {
        if (req == null)
            return BadRequest(new { message = "Request body is required." });

        if (string.IsNullOrWhiteSpace(req.Email) || !new EmailAddressAttribute().IsValid(req.Email))
            return BadRequest(new { message = "Enter a valid email address." });

        var lead = new Lead
        {
            CompanyName = string.IsNullOrWhiteSpace(req.Name) ? req.Email.Trim() : req.Name.Trim(),
            ContactName = req.Name,
            Email = req.Email.Trim(),
            Source = string.IsNullOrWhiteSpace(req.Source) ? "Website" : req.Source.Trim(),
            EventType = req.EventType,
            EstimatedBudget = req.EstimatedBudget ?? 0m,
            Status = "New",
            Notes = req.Notes,
            CreatedDate = DateTime.Today,
        };

        _db.Leads.Add(lead);
        await _db.SaveChangesAsync();

        return CreatedAtAction(nameof(GetById), new { id = lead.Id }, lead);
    }

    [HttpPost]
    [Authorize(Roles = "Admin,Manager")]
    public async Task<IActionResult> Create([FromBody] Lead lead)
    {
        if (!ModelState.IsValid)
            return BadRequest(ModelState);

        _db.Leads.Add(lead);
        await _db.SaveChangesAsync();

        return CreatedAtAction(nameof(GetById), new { id = lead.Id }, lead);
    }

    [HttpPut("{id}")]
    [Authorize(Roles = "Admin,Manager")]
    public async Task<IActionResult> Update(int id, [FromBody] Lead lead)
    {
        var existing = await _db.Leads.FindAsync(id);
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

        await _db.SaveChangesAsync();
        return NoContent();
    }

    [HttpDelete("{id}")]
    [Authorize(Roles = "Admin,Manager")]
    public async Task<IActionResult> Delete(int id)
    {
        var lead = await _db.Leads.FindAsync(id);
        if (lead == null)
            return NotFound();

        _db.Leads.Remove(lead);
        await _db.SaveChangesAsync();
        return NoContent();
    }
}