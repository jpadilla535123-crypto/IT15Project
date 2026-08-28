using EventSphere.Server.Data;
using EventSphere.Server.Models;
using Microsoft.AspNetCore.Mvc;

namespace EventSphere.Server.Controllers;

[ApiController]
[Route("api/[controller]")]
public class PaymentsController : ControllerBase
{
    private readonly InMemoryDataContext _data;

    public PaymentsController(InMemoryDataContext data)
    {
        _data = data;
    }

    [HttpGet]
    public IActionResult GetAll(int? invoiceId = null)
    {
        var query = _data.Payments.AsQueryable();

        if (invoiceId.HasValue)
            query = query.Where(p => p.InvoiceId == invoiceId);

        return Ok(query.OrderByDescending(p => p.PaymentDate).ToList());
    }

    [HttpGet("{id}")]
    public IActionResult GetById(int id)
    {
        var payment = _data.Payments.FirstOrDefault(p => p.Id == id);
        if (payment == null)
            return NotFound();

        return Ok(payment);
    }

    [HttpPost]
    public IActionResult Create([FromBody] Payment payment)
    {
        if (!ModelState.IsValid)
            return BadRequest(ModelState);

        var invoice = _data.Invoices.FirstOrDefault(i => i.Id == payment.InvoiceId);
        if (invoice == null)
            return NotFound("Invoice not found.");

        payment.Id = _data.NextId(_data.Payments);
        payment.CreatedAt = DateTime.UtcNow;
        payment.UpdatedAt = DateTime.UtcNow;
        _data.Payments.Add(payment);

        invoice.PaidAmount = Math.Min(invoice.Amount, invoice.PaidAmount + payment.Amount);
        invoice.Status = invoice.PaidAmount >= invoice.Amount
            ? "Paid"
            : invoice.PaidAmount > 0 ? "Partial" : "Pending";
        invoice.UpdatedAt = DateTime.UtcNow;
        return CreatedAtAction(nameof(GetById), new { id = payment.Id }, payment);
    }

    [HttpPut("{id}")]
    public IActionResult Update(int id, [FromBody] Payment payment)
    {
        var existing = _data.Payments.FirstOrDefault(p => p.Id == id);
        if (existing == null)
            return NotFound();

        existing.InvoiceId = payment.InvoiceId;
        existing.Amount = payment.Amount;
        existing.PaymentDate = payment.PaymentDate;
        existing.Method = payment.Method;
        existing.Reference = payment.Reference;
        existing.Notes = payment.Notes;
        existing.UpdatedAt = DateTime.UtcNow;

        return NoContent();
    }

    [HttpDelete("{id}")]
    public IActionResult Delete(int id)
    {
        var payment = _data.Payments.FirstOrDefault(p => p.Id == id);
        if (payment == null)
            return NotFound();

        var invoice = _data.Invoices.FirstOrDefault(i => i.Id == payment.InvoiceId);
        if (invoice != null)
        {
            invoice.PaidAmount = Math.Max(0, invoice.PaidAmount - payment.Amount);
            invoice.Status = invoice.PaidAmount >= invoice.Amount
                ? "Paid"
                : invoice.PaidAmount > 0 ? "Partial" : "Pending";
            invoice.UpdatedAt = DateTime.UtcNow;
        }

        _data.Payments.Remove(payment);
        return NoContent();
    }
}