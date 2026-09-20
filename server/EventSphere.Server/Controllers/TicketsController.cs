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
public class TicketsController : ControllerBase
{
    private static readonly string[] AllowedEvidence = { ".png", ".jpg", ".jpeg", ".gif", ".webp" };

    private readonly AppDbContext _db;
    private readonly IWebHostEnvironment _env;

    public TicketsController(AppDbContext db, IWebHostEnvironment env)
    {
        _db = db;
        _env = env;
    }

    public class TicketRegistrationRequest
    {
        [Required] public string FullName { get; set; } = string.Empty;
        [EmailAddress] public string? Email { get; set; }
        public string? Phone { get; set; }
        public int EventId { get; set; }
        public string PaymentMethod { get; set; } = "GCash";
        public string? ReferenceNumber { get; set; }
        public string? PayerName { get; set; }
        public decimal Amount { get; set; }
        public IFormFile? Evidence { get; set; }
    }

    /* Public, unauthenticated ticket registration from the native site.
       Creates (or reuses) a Client record + a Registration with the payment
       evidence; the record then shows up in Client Management. */
    [HttpPost("public/register")]
    [AllowAnonymous]
    [RequestSizeLimit(10_485_760)]
    public async Task<IActionResult> Register([FromForm] TicketRegistrationRequest request)
    {
        if (!ModelState.IsValid)
            return BadRequest(ModelState);

        var evt = await _db.Events.FindAsync(request.EventId);
        if (evt == null)
            return NotFound(new { message = "That event no longer exists." });

        var amount = request.Amount > 0 ? request.Amount : (evt.Venue?.PricePerDay ?? 0m);

        var normalized = request.Email?.Trim().ToLowerInvariant();
        var client = normalized != null
            ? await _db.Clients.FirstOrDefaultAsync(c => c.Email != null && c.Email.ToLower() == normalized)
            : null;

        if (client == null)
        {
            client = new Client
            {
                CompanyName = request.FullName.Trim(),
                ContactPerson = request.FullName.Trim(),
                Email = normalized,
                Phone = request.Phone,
                ClientType = "Individual",
                Status = "New",
                DateOfInquiry = DateTime.Today,
            };
            _db.Clients.Add(client);
        }

        var registration = new Registration
        {
            FullName = request.FullName.Trim(),
            Email = normalized,
            Phone = request.Phone,
            EventId = evt.Id,
            PaymentMethod = request.PaymentMethod,
            ReferenceNumber = request.ReferenceNumber?.Trim(),
            PayerName = request.PayerName?.Trim(),
            Amount = amount,
            Status = "Pending",
            TicketReference = $"TKT-2026-{Random.Shared.Next(100000, 999999)}",
        };

        if (request.Evidence is { Length: > 0 })
        {
            var ext = Path.GetExtension(request.Evidence.FileName).ToLowerInvariant();
            if (!AllowedEvidence.Contains(ext))
                return BadRequest(new { message = "Payment evidence must be an image (png, jpg, jpeg, gif, webp)." });

            var uploadDir = Path.Combine(_env.WebRootPath ?? Path.Combine(_env.ContentRootPath, "wwwroot"), "uploads", "payments");
            Directory.CreateDirectory(uploadDir);
            var fileName = $"{registration.TicketReference}-{Guid.NewGuid():N}".Substring(0, 24) + ext;
            var filePath = Path.Combine(uploadDir, fileName);

            /* hash the bytes so the review queue can flag the same screenshot being reused */
            var bytes = new byte[request.Evidence.Length];
            await using (var mem = new MemoryStream(bytes, writable: true))
            {
                await request.Evidence.CopyToAsync(mem);
            }
            await System.IO.File.WriteAllBytesAsync(filePath, bytes);
            registration.EvidencePath = $"/uploads/payments/{fileName}";
            registration.EvidenceHash = Convert.ToHexString(SHA256.HashData(bytes));
        }

        _db.Registrations.Add(registration);
        await _db.SaveChangesAsync();

        return CreatedAtAction(nameof(GetById), new { id = registration.Id }, new
        {
            registration.Id,
            registration.FullName,
            registration.Email,
            registration.Phone,
            registration.EventId,
            registration.PaymentMethod,
            registration.ReferenceNumber,
            registration.PayerName,
            registration.EvidencePath,
            registration.Amount,
            registration.Status,
            registration.TicketReference,
            ClientId = registration.ClientId,
            EventName = evt.Name,
            registration.CreatedAt,
        });
    }

    /* Authenticated listing of ticket registrations. */
    [HttpGet]
    [Authorize]
    public async Task<IActionResult> GetAll(int? clientId = null, int? eventId = null,
        string? status = null, int? page = null, int? pageSize = null)
    {
        var query = _db.Registrations.AsQueryable();

        if (clientId.HasValue)
            query = query.Where(r => r.ClientId == clientId.Value);

        if (eventId.HasValue)
            query = query.Where(r => r.EventId == eventId.Value);

        if (!string.IsNullOrEmpty(status))
            query = query.Where(r => r.Status == status);

        query = query.OrderByDescending(r => r.CreatedAt);

        var list = await query
            .Select(r => new
            {
                r.Id,
                r.FullName,
                r.Email,
                r.Phone,
                r.ClientId,
                r.EventId,
                EventName = r.Event != null ? r.Event.Name : null,
                VenueName = r.Event != null && r.Event.Venue != null ? r.Event.Venue.Name : null,
                EventStartDate = r.Event != null ? r.Event.StartDate : (DateTime?)null,
                ExpectedAmount = r.Event != null && r.Event.Venue != null ? (decimal?)r.Event.Venue.PricePerDay : null,
                r.PaymentMethod,
                r.ReferenceNumber,
                r.PayerName,
                r.EvidencePath,
                r.EvidenceHash,
                r.Amount,
                r.Status,
                r.TicketReference,
                r.CreatedAt,
            })
            .ToListAsync();

        /* cross-registration checks: catching reused references and reused screenshots
           requires looking at every registration, so flags/risk are computed here. */
        var refCounts = list
            .Where(r => !string.IsNullOrWhiteSpace(r.ReferenceNumber))
            .GroupBy(r => r.ReferenceNumber!.Trim().ToUpperInvariant())
            .ToDictionary(g => g.Key, g => g.Count());
        var hashCounts = list
            .Where(r => !string.IsNullOrWhiteSpace(r.EvidenceHash))
            .GroupBy(r => r.EvidenceHash!)
            .ToDictionary(g => g.Key, g => g.Count());

        var rows = list.Select(r =>
        {
            var flags = new List<string>();

            if (!string.IsNullOrWhiteSpace(r.ReferenceNumber) &&
                refCounts.TryGetValue(r.ReferenceNumber.Trim().ToUpperInvariant(), out var refs) && refs > 1)
                flags.Add("duplicateReference");

            if (!string.IsNullOrWhiteSpace(r.EvidenceHash) &&
                hashCounts.TryGetValue(r.EvidenceHash, out var hashes) && hashes > 1)
                flags.Add("reusedEvidence");

            if (r.ExpectedAmount is > 0 && Math.Abs(r.Amount - r.ExpectedAmount.Value) > 1)
                flags.Add("amountMismatch");

            if (!string.IsNullOrWhiteSpace(r.PayerName) &&
                !string.Equals(r.PayerName.Trim(), r.FullName.Trim(), StringComparison.OrdinalIgnoreCase))
                flags.Add("payerMismatch");

            return new
            {
                r.Id,
                r.FullName,
                r.Email,
                r.Phone,
                r.ClientId,
                r.EventId,
                r.EventName,
                r.VenueName,
                r.EventStartDate,
                r.ExpectedAmount,
                r.PaymentMethod,
                r.ReferenceNumber,
                r.PayerName,
                r.EvidencePath,
                r.EvidenceHash,
                r.Amount,
                r.Status,
                r.TicketReference,
                r.CreatedAt,
                Flags = flags,
                RiskScore = flags.Count,
            };
        }).ToList();

        return Ok(new { items = rows, total = rows.Count, page = page ?? 1, pageSize = pageSize ?? 100, totalPages = 1 });
    }

    /* Staff review: set a registration's payment status. */
    [HttpPut("{id}/status")]
    [Authorize(Roles = "Admin,Manager,Finance")]
    public async Task<IActionResult> SetStatus(int id, [FromBody] SetStatusRequest request)
    {
        if (request.Status is not ("Pending" or "Confirmed" or "Rejected"))
            return BadRequest(new { message = "Status must be Pending, Confirmed or Rejected." });

        var registration = await _db.Registrations.FindAsync(id);
        if (registration == null)
            return NotFound();

        registration.Status = request.Status;
        await _db.SaveChangesAsync();

        return Ok(new { registration.Id, registration.Status });
    }

    public class SetStatusRequest
    {
        public string Status { get; set; } = string.Empty;
    }

    [HttpGet("{id}")]
    [Authorize]
    public async Task<IActionResult> GetById(int id)
    {
        var registration = await _db.Registrations
            .Include(r => r.Event)
            .FirstOrDefaultAsync(r => r.Id == id);
        if (registration == null)
            return NotFound();

        return Ok(new
        {
            registration.Id,
            registration.FullName,
            registration.Email,
            registration.Phone,
            registration.ClientId,
            registration.EventId,
            EventName = registration.Event?.Name,
            VenueName = registration.Event?.Venue?.Name,
            registration.PaymentMethod,
            registration.ReferenceNumber,
            registration.PayerName,
            registration.EvidencePath,
            registration.EvidenceHash,
            registration.Amount,
            registration.Status,
            registration.TicketReference,
            registration.CreatedAt,
        });
    }
}