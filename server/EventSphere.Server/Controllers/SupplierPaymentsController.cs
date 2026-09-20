using System.ComponentModel.DataAnnotations;
using System.Security.Cryptography;
using EventSphere.Server.Data;
using EventSphere.Server.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace EventSphere.Server.Controllers;

[ApiController]
[Route("api/[controller]")]
public class SupplierPaymentsController : ControllerBase
{
    private static readonly string[] AllowedEvidence = { ".png", ".jpg", ".jpeg", ".gif", ".webp" };

    private readonly AppDbContext _db;
    private readonly IWebHostEnvironment _env;

    public SupplierPaymentsController(AppDbContext db, IWebHostEnvironment env)
    {
        _db = db;
        _env = env;
    }

    public class RecordRequest
    {
        [Required] public int SupplierId { get; set; }
        public int? EventId { get; set; }
        [Required] public string Description { get; set; } = string.Empty;
        [Required] public decimal Amount { get; set; }
        public string PaymentMethod { get; set; } = "Bank Transfer";
        public string? ReferenceNumber { get; set; }
        public string? PaymentDate { get; set; }
        public IFormFile? Evidence { get; set; }
    }

    /* Supplier payment with a proof screenshot — the basis for Monthly Expenses.
       Role-gated so Staff can't record or read expense details. */
    [HttpPost("with-evidence")]
    [Authorize(Roles = "Admin,Manager,Finance")]
    [RequestSizeLimit(10_485_760)]
    public async Task<IActionResult> Record([FromForm] RecordRequest request)
    {
        if (!ModelState.IsValid)
            return BadRequest(ModelState);

        var supplier = await _db.Suppliers.FindAsync(request.SupplierId);
        if (supplier == null)
            return NotFound(new { message = "That supplier no longer exists." });

        if (request.Amount <= 0)
            return BadRequest(new { message = "Amount must be greater than zero." });

        if (request.Evidence is not { Length: > 0 })
            return BadRequest(new { message = "A payment proof screenshot is required." });

        var ext = Path.GetExtension(request.Evidence.FileName).ToLowerInvariant();
        if (!AllowedEvidence.Contains(ext))
            return BadRequest(new { message = "Payment evidence must be an image (png, jpg, jpeg, gif, webp)." });

        var eventId = request.EventId;
        if (eventId.HasValue)
        {
            var evt = await _db.Events.FindAsync(eventId.Value);
            if (evt == null)
                return NotFound(new { message = "That event no longer exists." });
        }

        var paymentDate = DateTime.Today;
        if (!string.IsNullOrWhiteSpace(request.PaymentDate) &&
            DateTime.TryParse(request.PaymentDate, out var parsed))
            paymentDate = parsed.Date;

        var uploadDir = Path.Combine(_env.WebRootPath ?? Path.Combine(_env.ContentRootPath, "wwwroot"), "uploads", "suppliers");
        Directory.CreateDirectory(uploadDir);
        var fileName = $"{Guid.NewGuid():N}".Substring(0, 24) + ext;
        var filePath = Path.Combine(uploadDir, fileName);

        var bytes = new byte[request.Evidence.Length];
        await using (var mem = new MemoryStream(bytes, writable: true))
        {
            await request.Evidence.CopyToAsync(mem);
        }
        await System.IO.File.WriteAllBytesAsync(filePath, bytes);

        var payment = new SupplierPayment
        {
            SupplierId = supplier.Id,
            EventId = eventId,
            Description = request.Description.Trim(),
            Amount = request.Amount,
            PaymentMethod = request.PaymentMethod,
            ReferenceNumber = request.ReferenceNumber?.Trim(),
            PaymentDate = paymentDate,
            Status = "Paid",
            EvidencePath = $"/uploads/suppliers/{fileName}",
            EvidenceHash = Convert.ToHexString(SHA256.HashData(bytes)),
        };

        _db.SupplierPayments.Add(payment);
        await _db.SaveChangesAsync();

        return CreatedAtAction(nameof(GetById), new { id = payment.Id }, new
        {
            payment.Id,
            payment.SupplierId,
            SupplierName = supplier.Name,
            payment.EventId,
            payment.Description,
            payment.Amount,
            payment.PaymentMethod,
            payment.ReferenceNumber,
            payment.EvidencePath,
            payment.Status,
            payment.PaymentDate,
            payment.CreatedAt,
        });
    }

    [HttpGet]
    [Authorize]
    public async Task<IActionResult> GetAll(int? supplierId = null, int? eventId = null,
        int? page = null, int? pageSize = null)
    {
        var query = _db.SupplierPayments.AsQueryable();

        if (supplierId.HasValue)
            query = query.Where(sp => sp.SupplierId == supplierId.Value);

        if (eventId.HasValue)
            query = query.Where(sp => sp.EventId == eventId.Value);

        var list = await query
            .OrderByDescending(sp => sp.PaymentDate)
            .ThenByDescending(sp => sp.Id)
            .Select(sp => new
            {
                sp.Id,
                sp.SupplierId,
                SupplierName = sp.Supplier != null ? sp.Supplier.Name : null,
                sp.EventId,
                EventName = sp.Event != null ? sp.Event.Name : null,
                sp.Description,
                sp.Amount,
                sp.PaymentMethod,
                sp.ReferenceNumber,
                sp.EvidencePath,
                sp.Status,
                sp.PaymentDate,
                sp.CreatedAt,
            })
            .ToListAsync();

        return Ok(new { items = list, total = list.Count, page = page ?? 1, pageSize = pageSize ?? 100, totalPages = 1 });
    }

    [HttpGet("{id}")]
    [Authorize]
    public async Task<IActionResult> GetById(int id)
    {
        var payment = await _db.SupplierPayments.FindAsync(id);
        if (payment == null)
            return NotFound();

        return Ok(new
        {
            payment.Id,
            payment.SupplierId,
            SupplierName = payment.Supplier?.Name,
            payment.EventId,
            EventName = payment.Event?.Name,
            payment.Description,
            payment.Amount,
            payment.PaymentMethod,
            payment.ReferenceNumber,
            payment.EvidencePath,
            payment.Status,
            payment.PaymentDate,
            payment.CreatedAt,
        });
    }

    [HttpDelete("{id}")]
    [Authorize(Roles = "Admin,Manager,Finance")]
    public async Task<IActionResult> Delete(int id)
    {
        var payment = await _db.SupplierPayments.FindAsync(id);
        if (payment == null)
            return NotFound();

        if (!string.IsNullOrEmpty(payment.EvidencePath))
        {
            var root = _env.WebRootPath ?? Path.Combine(_env.ContentRootPath, "wwwroot");
            var fullPath = Path.Combine(root, payment.EvidencePath.TrimStart('/'));
            if (System.IO.File.Exists(fullPath))
                System.IO.File.Delete(fullPath);
        }

        _db.SupplierPayments.Remove(payment);
        await _db.SaveChangesAsync();
        return NoContent();
    }
}