using EventSphere.Server.Data;
using EventSphere.Server.Extensions;
using EventSphere.Server.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace EventSphere.Server.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize(Roles = "Admin,Manager,Finance")]
public class InvoicesController : ControllerBase
{
    private readonly AppDbContext _db;

    public InvoicesController(AppDbContext db)
    {
        _db = db;
    }

    [HttpGet]
    public IActionResult GetAll(string? status = null, int? clientId = null, int? eventId = null,
        string? sortBy = null, string? sortDir = null, int? page = null, int? pageSize = null)
    {
        var query = _db.Invoices.AsQueryable();

        if (!string.IsNullOrEmpty(status))
            query = query.Where(i => i.Status == status);

        if (clientId.HasValue)
            query = query.Where(i => i.ClientId == clientId);

        if (eventId.HasValue)
            query = query.Where(i => i.EventId == eventId);

        query = (sortBy, sortDir) switch
        {
            ("issueDate", "asc") => query.OrderBy(i => i.IssueDate),
            ("issueDate", _) => query.OrderByDescending(i => i.IssueDate),
            ("dueDate", "asc") => query.OrderBy(i => i.DueDate),
            ("dueDate", _) => query.OrderByDescending(i => i.DueDate),
            ("amount", "asc") => query.OrderBy(i => i.Amount),
            ("amount", _) => query.OrderByDescending(i => i.Amount),
            ("status", "asc") => query.OrderBy(i => i.Status),
            ("status", _) => query.OrderByDescending(i => i.Status),
            _ => query.OrderByDescending(i => i.IssueDate),
        };

        return Ok(query.Page(page, pageSize));
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(int id)
    {
        var invoice = await _db.Invoices.FindAsync(id);
        if (invoice == null)
            return NotFound();

        return Ok(invoice);
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] Invoice invoice)
    {
        if (string.IsNullOrWhiteSpace(invoice.InvoiceNumber))
            invoice.InvoiceNumber = $"INV-{DateTime.Now:yyyyMMddHHmmss}";

        if (!ModelState.IsValid)
            return BadRequest(ModelState);

        _db.Invoices.Add(invoice);
        await _db.SaveChangesAsync();

        return CreatedAtAction(nameof(GetById), new { id = invoice.Id }, invoice);
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> Update(int id, [FromBody] Invoice invoice)
    {
        var existing = await _db.Invoices.FindAsync(id);
        if (existing == null)
            return NotFound();

        existing.EventId = invoice.EventId;
        existing.ClientId = invoice.ClientId;
        existing.InvoiceNumber = invoice.InvoiceNumber;
        existing.IssueDate = invoice.IssueDate;
        existing.DueDate = invoice.DueDate;
        existing.Amount = invoice.Amount;
        existing.PaidAmount = invoice.PaidAmount;
        existing.Status = invoice.Status;
        existing.Notes = invoice.Notes;
        existing.UpdatedAt = DateTime.UtcNow;

        await _db.SaveChangesAsync();
        return NoContent();
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(int id)
    {
        var invoice = await _db.Invoices.FindAsync(id);
        if (invoice == null)
            return NotFound();

        _db.Invoices.Remove(invoice);
        await _db.SaveChangesAsync();
        return NoContent();
    }

    [HttpPost("{id}/record-payment")]
    public async Task<IActionResult> RecordPayment(int id, [FromBody] decimal amount)
    {
        var invoice = await _db.Invoices.FindAsync(id);
        if (invoice == null)
            return NotFound();

        invoice.PaidAmount = Math.Min(invoice.Amount, invoice.PaidAmount + amount);
        invoice.Status = invoice.PaidAmount >= invoice.Amount
            ? "Paid"
            : invoice.PaidAmount > 0 ? "Partial" : "Pending";
        invoice.UpdatedAt = DateTime.UtcNow;

        _db.Payments.Add(new Payment
        {
            InvoiceId = id,
            Amount = amount,
            PaymentDate = DateTime.Today,
            Method = "Other"
        });

        await _db.SaveChangesAsync();
        return NoContent();
    }
}