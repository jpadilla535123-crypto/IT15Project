using EventSphere.Server.Data;
using EventSphere.Server.Models;
using Microsoft.AspNetCore.Mvc;

namespace EventSphere.Server.Controllers;

[ApiController]
[Route("api/[controller]")]
public class InvoicesController : ControllerBase
{
    private readonly InMemoryDataContext _data;

    public InvoicesController(InMemoryDataContext data)
    {
        _data = data;
    }

    [HttpGet]
    public IActionResult GetAll(string? status = null, int? clientId = null)
    {
        var query = _data.Invoices.AsQueryable();

        if (!string.IsNullOrEmpty(status))
            query = query.Where(i => i.Status == status);

        if (clientId.HasValue)
            query = query.Where(i => i.ClientId == clientId);

        return Ok(query.OrderByDescending(i => i.IssueDate).ToList());
    }

    [HttpGet("{id}")]
    public IActionResult GetById(int id)
    {
        var invoice = _data.Invoices.FirstOrDefault(i => i.Id == id);
        if (invoice == null)
            return NotFound();

        return Ok(invoice);
    }

    [HttpPost]
    public IActionResult Create([FromBody] Invoice invoice)
    {
        if (string.IsNullOrWhiteSpace(invoice.InvoiceNumber))
            invoice.InvoiceNumber = $"INV-{DateTime.Now:yyyyMMddHHmmss}";

        if (!ModelState.IsValid)
            return BadRequest(ModelState);

        invoice.Id = _data.NextId(_data.Invoices);
        invoice.CreatedAt = DateTime.UtcNow;
        invoice.UpdatedAt = DateTime.UtcNow;
        _data.Invoices.Add(invoice);

        return CreatedAtAction(nameof(GetById), new { id = invoice.Id }, invoice);
    }

    [HttpPut("{id}")]
    public IActionResult Update(int id, [FromBody] Invoice invoice)
    {
        var existing = _data.Invoices.FirstOrDefault(i => i.Id == id);
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

        return NoContent();
    }

    [HttpDelete("{id}")]
    public IActionResult Delete(int id)
    {
        var invoice = _data.Invoices.FirstOrDefault(i => i.Id == id);
        if (invoice == null)
            return NotFound();

        _data.Invoices.Remove(invoice);
        return NoContent();
    }

    [HttpPost("{id}/record-payment")]
    public IActionResult RecordPayment(int id, [FromBody] decimal amount)
    {
        var invoice = _data.Invoices.FirstOrDefault(i => i.Id == id);
        if (invoice == null)
            return NotFound();

        invoice.PaidAmount = Math.Min(invoice.Amount, invoice.PaidAmount + amount);
        invoice.Status = invoice.PaidAmount >= invoice.Amount
            ? "Paid"
            : invoice.PaidAmount > 0 ? "Partial" : "Pending";
        invoice.UpdatedAt = DateTime.UtcNow;

        _data.Payments.Add(new Payment
        {
            Id = _data.NextId(_data.Payments),
            InvoiceId = id,
            Amount = amount,
            PaymentDate = DateTime.Today,
            Method = "Other"
        });
        return NoContent();
    }
}