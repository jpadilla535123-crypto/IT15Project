using System.ComponentModel.DataAnnotations;
using System.Net.Http.Headers;
using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using EventSphere.Server.Data;
using EventSphere.Server.Models;
using EventSphere.Server.Services;
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
    private readonly IConfiguration _config;
    private readonly ILogger<TicketsController> _logger;
    private readonly EmailService _email;

    public TicketsController(AppDbContext db, IWebHostEnvironment env, IConfiguration config, ILogger<TicketsController> logger, EmailService email)
    {
        _db = db;
        _env = env;
        _config = config;
        _logger = logger;
        _email = email;
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
            Client = client,
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

        /* confirmation email — only actually sent when SMTP is configured on the
           server; otherwise the landing flow still succeeds (no hard failure).
           At this point the payment is UNVERIFIED, so no seat number is issued:
           it is reserved and emailed once staff confirms the payment. */
        if (_email.IsConfigured)
        {
            try
            {
                var firstName = (request.FullName ?? string.Empty).Trim().Split(' ', StringSplitOptions.RemoveEmptyEntries).FirstOrDefault() ?? "friend";
                var venue = evt.VenueId.HasValue ? await _db.Venues.FindAsync(evt.VenueId.Value) : null;
                var venueLine = venue != null
                    ? string.Join(", ", new[] { venue.Name, venue.City }.Where(s => !string.IsNullOrWhiteSpace(s)))
                    : "TBA";

                var body = EmailBranding.Wrap(
                    EmailBranding.Paragraph($"Hi <b>{firstName}</b> — thanks for registering for <b>{evt.Name}</b>! Here's what happens now.") +
                    EmailBranding.TicketBlock(
                        evt.Name,
                        ("Date", evt.StartDate.ToString("dddd, MMMM d, yyyy")),
                        ("Venue", venueLine),
                        ("Attendee", request.FullName ?? "—"),
                        ("Email", registration.Email ?? "—"),
                        ("Phone", string.IsNullOrWhiteSpace(registration.Phone) ? "—" : registration.Phone),
                        ("Payment method", registration.PaymentMethod),
                        ("Ticket reference", registration.TicketReference),
                        ("Amount", $"₱{amount:N2}")) +
                    EmailBranding.Paragraph("<b>Your payment is now being reviewed.</b> Our team checks every payment proof before tickets and seats are handed out.") +
                    EmailBranding.Step(1, "We verify your payment", "A coordinator reviews your payment proof — usually within one business day.") +
                    EmailBranding.Step(2, "Your seat number arrives", "Once confirmed, we'll email your ticket with your reserved seat number.") +
                    EmailBranding.Divider() +
                    EmailBranding.PrimaryButton("Keep an eye on your inbox"),
                    "Payment received 🙏",
                    evt.Name);
                await _email.SendAsync(registration.Email ?? "guest@example.com", "We received your payment — " + evt.Name, body);
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Could not send ticket confirmation email to {Email}", registration.Email);
            }
        }

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
            registration.SeatNumber,
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
                r.SeatNumber,
                r.RejectReason,
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
                r.SeatNumber,
                r.RejectReason,
                r.CreatedAt,
                Flags = flags,
                RiskScore = flags.Count,
            };
        }).ToList();

        return Ok(new { items = rows, total = rows.Count, page = page ?? 1, pageSize = pageSize ?? 100, totalPages = 1 });
    }

    /* Staff review: set a registration's payment status. Confirming a payment
       assigns the attendee their seat and emails their ticket; rejecting stores
       the note entered by the reviewer and emails it to the attendee so they
       know why their payment wasn't confirmed. */
    [HttpPut("{id}/status")]
    [Authorize(Roles = "Admin,Manager,Finance")]
    public async Task<IActionResult> SetStatus(int id, [FromBody] SetStatusRequest request)
    {
        if (request.Status is not ("Pending" or "Confirmed" or "Rejected"))
            return BadRequest(new { message = "Status must be Pending, Confirmed or Rejected." });

        var registration = await _db.Registrations
            .Include(r => r.Event!)
            .ThenInclude(e => e!.Venue)
            .FirstOrDefaultAsync(r => r.Id == id);
        if (registration == null)
            return NotFound();

        /* No-op if the status didn't actually change — avoids double emails when
           a reviewer re-clicks the same action. */
        if (registration.Status == request.Status)
            return Ok(new { registration.Id, registration.Status, registration.SeatNumber });

        registration.Status = request.Status;

        if (request.Status == "Confirmed")
        {
            /* A seat is only handed out once the payment is verified, so a rejected
               ticket never consumes a seat number. */
            if (string.IsNullOrWhiteSpace(registration.SeatNumber))
            {
                var sequence = await _db.Registrations.CountAsync(r => r.EventId == registration.EventId && r.Status == "Confirmed");
                registration.SeatNumber = $"GA-{registration.EventId:D3}-{sequence + 1:D3}";
            }
            registration.RejectReason = null;
        }
        else if (request.Status == "Rejected")
        {
            registration.RejectReason = string.IsNullOrWhiteSpace(request.Note) ? null : request.Note.Trim();
        }

        await _db.SaveChangesAsync();

        if (_email.IsConfigured)
        {
            try
            {
                if (request.Status == "Confirmed")
                    await SendTicketEmailAsync(registration);
                else if (request.Status == "Rejected")
                    await SendRejectionEmailAsync(registration);
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Could not send status update email to {Email}", registration.Email);
            }
        }

        return Ok(new { registration.Id, registration.Status, registration.SeatNumber });
    }

    public class SetStatusRequest
    {
        public string Status { get; set; } = string.Empty;

        /* Optional note used when Rejected — shown to the attendee in the email. */
        public string? Note { get; set; }
    }

    /* Boarding-pass style ticket email, sent once a payment is confirmed. */
    private async Task SendTicketEmailAsync(Registration registration)
    {
        var evt = registration.Event;
        var email = registration.Email;
        if (evt == null || string.IsNullOrWhiteSpace(email)) return;

        var firstName = (registration.FullName ?? string.Empty).Trim().Split(' ', StringSplitOptions.RemoveEmptyEntries).FirstOrDefault() ?? "friend";
        var venueLine = evt.Venue != null
            ? string.Join(", ", new[] { evt.Venue.Name, evt.Venue.City }.Where(s => !string.IsNullOrWhiteSpace(s)))
            : "TBA";

        var body = EmailBranding.Wrap(
            EmailBranding.Paragraph($"Hi <b>{firstName}</b> — your payment is confirmed. Here's your ticket for <b>{evt.Name}</b>!") +
            EmailBranding.SeatBanner(registration.SeatNumber ?? "GA") +
            EmailBranding.TicketBlock(
                evt.Name,
                ("Date", evt.StartDate.ToString("dddd, MMMM d, yyyy")),
                ("Venue", venueLine),
                ("Attendee", registration.FullName ?? "—"),
                ("Email", registration.Email ?? "—"),
                ("Phone", string.IsNullOrWhiteSpace(registration.Phone) ? "—" : registration.Phone),
                ("Payment method", registration.PaymentMethod),
                ("Amount", $"₱{registration.Amount:N2}"),
                ("Ticket reference", registration.TicketReference)) +
            EmailBranding.Paragraph("Keep your ticket reference handy for any follow-ups — just reply to this email and we're here to help.") +
            EmailBranding.Divider() +
            EmailBranding.PrimaryButton("See you there!"),
            "You're in! 🎟️",
            $"{evt.Name} — see you there!");
        await _email.SendAsync(email, "Your EventSphere ticket — " + evt.Name, body);
    }

    /* Sent when a payment is rejected, including the reviewer's note so the
       attendee knows exactly why and how to move forward. */
    private async Task SendRejectionEmailAsync(Registration registration)
    {
        var evt = registration.Event;
        var email = registration.Email;
        if (evt == null || string.IsNullOrWhiteSpace(email)) return;

        var firstName = (registration.FullName ?? string.Empty).Trim().Split(' ', StringSplitOptions.RemoveEmptyEntries).FirstOrDefault() ?? "friend";
        var reason = string.IsNullOrWhiteSpace(registration.RejectReason)
            ? "Our team could not verify your payment. Please reach out and we'll help you sort it out."
            : registration.RejectReason;

        var body = EmailBranding.Wrap(
            EmailBranding.Paragraph($"Hi <b>{firstName}</b>, a quick update on your registration for <b>{evt.Name}</b>:") +
            EmailBranding.Alert("Why your payment wasn't confirmed", reason) +
            EmailBranding.InfoRows(
                ("Event", evt.Name),
                ("Ticket reference", registration.TicketReference),
                ("Payment method", registration.PaymentMethod),
                ("Amount", $"₱{registration.Amount:N2}")) +
            EmailBranding.Paragraph("No worries — you can try again with a corrected payment, or simply reply to this email and our team will personally help you secure your seat.") +
            EmailBranding.Divider() +
            EmailBranding.PrimaryButton("Contact EventSphere"),
            "A note about your payment",
            evt.Name);
        await _email.SendAsync(email, "Update on your EventSphere ticket — " + evt.Name, body);
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
            registration.SeatNumber,
            registration.RejectReason,
            registration.CreatedAt,
        });
    }

    // ── Anonymous PayMongo hosted checkout (landing "pay online" GCash/Card) ──
    [HttpPost("public/paymongo-checkout")]
    [AllowAnonymous]
    public async Task<IActionResult> CreatePublicPayMongoCheckout([FromBody] PublicPayMongoCheckoutRequest request)
    {
        var baseUrl = (_config.GetSection("PayMongo:BaseUrl").Value ?? "https://api.paymongo.com/v1").TrimEnd('/');
        var secretKey = _config.GetSection("PayMongo:SecretKey").Value ?? "";

        var evt = request.EventId > 0 ? await _db.Events.FindAsync(request.EventId) : null;
        var amount = request.Amount > 0 ? request.Amount : (evt?.Venue?.PricePerDay ?? 0m);
        var description = !string.IsNullOrWhiteSpace(request.Description)
            ? request.Description
            : evt != null ? $"Ticket to {evt.Name}" : "EventSphere ticket";

        var payload = new
        {
            data = new
            {
                attributes = new
                {
                    amount = (long)(amount * 100),
                    currency = "PHP",
                    description,
                    statement_descriptor = "EventSphere",
                    line_items = new[]
                    {
                        new { currency = "PHP", amount = (long)(amount * 100), name = evt?.Name ?? "Event ticket", quantity = 1 }
                    },
                    payment_method_types = new[] { "gcash", "card" },
                    payment_method_options = new { card = new { request_three_d_secure = "automatic" } },
                    success_url = $"{Request.Scheme}://{Request.Host}/?paymongo=success",
                    cancel_url = $"{Request.Scheme}://{Request.Host}/?paymongo=cancel"
                }
            }
        };

        using var client = new HttpClient();
        var content = new StringContent(JsonSerializer.Serialize(payload), Encoding.UTF8, "application/json");
        client.DefaultRequestHeaders.Accept.Add(new MediaTypeWithQualityHeaderValue("application/json"));
        if (!string.IsNullOrEmpty(secretKey))
            client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Basic", Convert.ToBase64String(Encoding.UTF8.GetBytes(secretKey)));

        try
        {
            using var response = await client.PostAsync($"{baseUrl}/checkout_sessions", content);
            var body = await response.Content.ReadAsStringAsync();
            if (!response.IsSuccessStatusCode)
            {
                _logger.LogError("PayMongo checkout failed {Status}: {Body}", (int)response.StatusCode, body);
                return StatusCode((int)response.StatusCode, new { message = "The payment gateway could not start a checkout. Try the QR code option instead." });
            }

            using var doc = JsonDocument.Parse(body);
            var root = doc.RootElement.GetProperty("data");
            var attributes = root.GetProperty("attributes");
            var checkoutUrl = attributes.TryGetProperty("checkout_url", out var cu) ? cu.GetString() : null;
            var id = root.TryGetProperty("id", out var sid) ? sid.GetString() : null;
            if (string.IsNullOrEmpty(checkoutUrl))
                return StatusCode(502, new { message = "The payment gateway returned no checkout link. Please use the QR code option instead." });

            return Ok(new { checkoutUrl, sessionId = id, amount });
        }
        catch (TaskCanceledException)
        {
            return StatusCode(504, new { message = "The payment gateway timed out. Please try again or use the QR code option." });
        }
        catch (HttpRequestException ex)
        {
            _logger.LogError(ex, "PayMongo checkout network error");
            return StatusCode(502, new { message = "The payment gateway is unreachable right now. Please use the QR code option instead." });
        }
    }

    [HttpGet("public/paymongo-status/{sessionId}")]
    [AllowAnonymous]
    public async Task<IActionResult> GetPublicPayMongoStatus(string sessionId)
    {
        var baseUrl = (_config.GetSection("PayMongo:BaseUrl").Value ?? "https://api.paymongo.com/v1").TrimEnd('/');
        var secretKey = _config.GetSection("PayMongo:SecretKey").Value ?? "";

        using var client = new HttpClient();
        client.DefaultRequestHeaders.Accept.Add(new MediaTypeWithQualityHeaderValue("application/json"));
        if (!string.IsNullOrEmpty(secretKey))
            client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Basic", Convert.ToBase64String(Encoding.UTF8.GetBytes(secretKey)));

        try
        {
            using var response = await client.GetAsync($"{baseUrl}/checkout_sessions/{sessionId}");
            var body = await response.Content.ReadAsStringAsync();
            if (!response.IsSuccessStatusCode)
                return Ok(new { paid = false, status = "unknown", paymentStatus = "checkout session not found" });

            using var doc = JsonDocument.Parse(body);
            var attributes = doc.RootElement.GetProperty("data").GetProperty("attributes");
            var status = attributes.TryGetProperty("status", out var st) ? st.GetString() : "unknown";
            var paymentStatus = "unpaid";
            if (attributes.TryGetProperty("payments", out var payments) && payments.ValueKind == JsonValueKind.Array)
            {
                foreach (var p in payments.EnumerateArray())
                    if (p.TryGetProperty("status", out var ps) && ps.GetString() == "paid") paymentStatus = "paid";
            }
            return Ok(new { paid = paymentStatus == "paid", status, paymentStatus });
        }
        catch (TaskCanceledException)
        {
            return Ok(new { paid = false, status = "unknown", paymentStatus = "pending" });
        }
        catch (HttpRequestException ex)
        {
            _logger.LogError(ex, "PayMongo status network error for {Session}", sessionId);
            return Ok(new { paid = false, status = "unknown", paymentStatus = "pending" });
        }
    }
}

public class PublicPayMongoCheckoutRequest
{
    public int EventId { get; set; }
    public decimal Amount { get; set; }
    public string? Description { get; set; }
}