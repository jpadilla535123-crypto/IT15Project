using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;
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
public class PaymentsController : ControllerBase
{
    private static readonly string[] AllowedEvidence = { ".png", ".jpg", ".jpeg", ".gif", ".webp" };

    private readonly AppDbContext _db;
    private readonly IWebHostEnvironment _env;
    private readonly string _payMongoBaseUrl;
    private readonly string _payMongoSecretKey;

    public PaymentsController(AppDbContext db, IWebHostEnvironment env, IConfiguration config)
    {
        _db = db;
        _env = env;
        _payMongoBaseUrl = (config.GetSection("PayMongo:BaseUrl").Value ?? "https://api.paymongo.com/v1").TrimEnd('/');
        _payMongoSecretKey = config.GetSection("PayMongo:SecretKey").Value ?? "";
    }

    [HttpGet]
    public IActionResult GetAll(int? invoiceId = null, string? method = null,
        string? sortBy = null, string? sortDir = null, int? page = null, int? pageSize = null)
    {
        var query = _db.Payments.AsQueryable();

        if (invoiceId.HasValue)
            query = query.Where(p => p.InvoiceId == invoiceId);

        if (!string.IsNullOrEmpty(method))
            query = query.Where(p => p.Method == method);

        query = (sortBy, sortDir) switch
        {
            ("paymentDate", "asc") => query.OrderBy(p => p.PaymentDate),
            ("paymentDate", _) => query.OrderByDescending(p => p.PaymentDate),
            ("amount", "asc") => query.OrderBy(p => p.Amount),
            ("amount", _) => query.OrderByDescending(p => p.Amount),
            ("method", "asc") => query.OrderBy(p => p.Method),
            ("method", _) => query.OrderByDescending(p => p.Method),
            _ => query.OrderByDescending(p => p.PaymentDate),
        };

        return Ok(query.Page(page, pageSize));
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(int id)
    {
        var payment = await _db.Payments.FindAsync(id);
        if (payment == null)
            return NotFound();

        return Ok(payment);
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] Payment payment)
    {
        if (!ModelState.IsValid)
            return BadRequest(ModelState);

        var invoice = await _db.Invoices.FindAsync(payment.InvoiceId);
        if (invoice == null)
            return NotFound("Invoice not found.");

        _db.Payments.Add(payment);
        ApplyToInvoice(invoice, payment.Amount);

        await _db.SaveChangesAsync();
        return CreatedAtAction(nameof(GetById), new { id = payment.Id }, payment);
    }

    public class EvidencePaymentRequest
    {
        public int? InvoiceId { get; set; }
        public int? EventId { get; set; }
        public int? ClientId { get; set; }
        public decimal Amount { get; set; }
        public DateTime? PaymentDate { get; set; }
        public string Method { get; set; } = "GCash";
        public string? Reference { get; set; }
        public string? Notes { get; set; }
        public IFormFile? Evidence { get; set; }
    }

    /* Multipart endpoint used by the Event drawer & Billing "Make a payment".
       Uploads the proof screenshot and attaches the payment to an invoice,
       creating the invoice for the event automatically when none exists yet. */
    [HttpPost("with-evidence")]
    [RequestSizeLimit(10_485_760)]
    public async Task<IActionResult> CreateWithEvidence([FromForm] EvidencePaymentRequest req)
    {
        if (req.Amount <= 0)
            return BadRequest(new { message = "Amount must be greater than zero." });

        var invoice = req.InvoiceId.HasValue
            ? await _db.Invoices.FindAsync(req.InvoiceId.Value)
            : null;

        if (invoice == null)
        {
            var evt = req.EventId.HasValue ? await _db.Events.FindAsync(req.EventId.Value) : null;
            if (evt == null)
                return NotFound(new { message = "No invoice or event was found." });

            var clientId = req.ClientId ?? evt.ClientId;
            if (clientId == null)
                return BadRequest(new { message = "The event has no client yet; create an invoice first." });

            invoice = await _db.Invoices.FirstOrDefaultAsync(i => i.EventId == evt.Id);
            if (invoice == null)
            {
                invoice = new Invoice
                {
                    EventId = evt.Id,
                    ClientId = clientId.Value,
                    InvoiceNumber = $"INV-{DateTime.Now:yyyyMMddHHmmss}{Random.Shared.Next(10, 99)}",
                    IssueDate = DateTime.Today,
                    DueDate = DateTime.Today.AddDays(30),
                    Amount = evt.Venue?.PricePerDay ?? req.Amount,
                    Status = "Pending",
                };
                _db.Invoices.Add(invoice);
            }
        }

        var payment = new Payment
        {
            InvoiceId = invoice.Id,
            Amount = req.Amount,
            PaymentDate = req.PaymentDate ?? DateTime.Today,
            Method = req.Method,
            Reference = req.Reference?.Trim(),
            Notes = req.Notes,
        };

        if (req.Evidence is { Length: > 0 })
        {
            var ext = Path.GetExtension(req.Evidence.FileName).ToLowerInvariant();
            if (!AllowedEvidence.Contains(ext))
                return BadRequest(new { message = "Payment evidence must be an image (png, jpg, jpeg, gif, webp)." });

            var uploadDir = Path.Combine(_env.WebRootPath ?? Path.Combine(_env.ContentRootPath, "wwwroot"), "uploads", "payments");
            Directory.CreateDirectory(uploadDir);
            var fileName = $"PAY-{invoice.InvoiceNumber}-{Guid.NewGuid():N}".Substring(0, 28) + ext;
            var filePath = Path.Combine(uploadDir, fileName);
            await using (var stream = new FileStream(filePath, FileMode.Create))
            {
                await req.Evidence.CopyToAsync(stream);
            }
            payment.EvidencePath = $"/uploads/payments/{fileName}";
        }

        _db.Payments.Add(payment);
        ApplyToInvoice(invoice, req.Amount);
        await _db.SaveChangesAsync();

        return CreatedAtAction(nameof(GetById), new { id = payment.Id }, new
        {
            payment.Id,
            payment.InvoiceId,
            payment.Amount,
            payment.PaymentDate,
            payment.Method,
            payment.Reference,
            payment.Notes,
            payment.EvidencePath,
        });
    }

    public class PayMongoCheckoutRequest
    {
        public decimal Amount { get; set; }
        public string Description { get; set; } = "Event booking";
        public string? SuccessUrl { get; set; }
        public string? CancelUrl { get; set; }
    }

    /* Creates a PayMongo (sandbox) checkout session for a GCash / Card payment
       and returns the hosted checkout URL the browser will open. */
    [HttpPost("paymongo-checkout")]
    public async Task<IActionResult> CreatePayMongoCheckout([FromBody] PayMongoCheckoutRequest req)
    {
        if (string.IsNullOrWhiteSpace(_payMongoSecretKey))
            return BadRequest(new { message = "PayMongo sandbox key is not configured yet. Add PayMongo:SecretKey to appsettings.json." });
        if (req.Amount <= 0)
            return BadRequest(new { message = "Amount must be greater than zero." });

        try
        {
            var successUrl = req.SuccessUrl ?? $"{Request.Scheme}://{Request.Host}/billing?paymongo=success";
            var cancelUrl = req.CancelUrl ?? $"{Request.Scheme}://{Request.Host}/billing?paymongo=cancelled";

            using var client = new HttpClient();
            client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue(
                "Basic", Convert.ToBase64String(Encoding.UTF8.GetBytes($"{_payMongoSecretKey}:")));

            var payload = new
            {
                data = new
                {
                    attributes = new
                    {
                        line_items = new[]
                        {
                        new
                        {
                            currency = "PHP",
                            amount = (int)Math.Round(req.Amount * 100m),
                            name = req.Description,
                            quantity = 1,
                        }
                    },
                        payment_method_types = new[] { "gcash", "card" },
                        success_url = successUrl,
                        cancel_url = cancelUrl,
                        description = req.Description,
                    }
                }
            };

            var res = await client.PostAsJsonAsync($"{_payMongoBaseUrl}/checkout_sessions", payload);
            var body = await res.Content.ReadAsStringAsync();
            if (!res.IsSuccessStatusCode)
                return BadRequest(new { message = "PayMongo could not create the checkout session.", detail = TrimJson(body) });

            using var doc = JsonDocument.Parse(body);
            var data = doc.RootElement.GetProperty("data");
            return Ok(new
            {
                checkoutUrl = data.GetProperty("checkout_url").GetString(),
                sessionId = data.GetProperty("id").GetString(),
            });
        }
        catch (HttpRequestException)
        {
            return BadRequest(new { message = "Could not reach PayMongo right now. Check that your PayMongo:SecretKey is correct, then try again — or attach a proof screenshot instead." });
        }
    }

    /* Polls PayMongo for the status of a checkout session (sandbox). */
    [HttpGet("paymongo-status/{sessionId}")]
    public async Task<IActionResult> PayMongoStatus(string sessionId)
    {
        if (string.IsNullOrWhiteSpace(_payMongoSecretKey))
            return BadRequest(new { message = "PayMongo sandbox key is not configured yet. Add PayMongo:SecretKey to appsettings.json." });

        try
        {
            using var client = new HttpClient();
            client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue(
                "Basic", Convert.ToBase64String(Encoding.UTF8.GetBytes($"{_payMongoSecretKey}:")));

            var res = await client.GetAsync($"{_payMongoBaseUrl}/checkout_sessions/{sessionId}");
            var body = await res.Content.ReadAsStringAsync();
            if (!res.IsSuccessStatusCode)
                return BadRequest(new { message = "Could not check that checkout session.", detail = TrimJson(body) });

            using var doc = JsonDocument.Parse(body);
            var attrs = doc.RootElement.GetProperty("data").GetProperty("attributes");
            var paymentStatus = attrs.GetProperty("payment_status").GetString();
            return Ok(new
            {
                status = attrs.GetProperty("status").GetString(),
                paymentStatus,
                paid = paymentStatus == "paid",
            });
        }
        catch (HttpRequestException)
        {
            return BadRequest(new { message = "Could not reach PayMongo right now to check the payment status." });
        }
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> Update(int id, [FromBody] Payment payment)
    {
        var existing = await _db.Payments.FindAsync(id);
        if (existing == null)
            return NotFound();

        existing.InvoiceId = payment.InvoiceId;
        existing.Amount = payment.Amount;
        existing.PaymentDate = payment.PaymentDate;
        existing.Method = payment.Method;
        existing.Reference = payment.Reference;
        existing.Notes = payment.Notes;
        existing.EvidencePath = payment.EvidencePath;
        existing.UpdatedAt = DateTime.UtcNow;

        await _db.SaveChangesAsync();
        return NoContent();
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(int id)
    {
        var payment = await _db.Payments.FindAsync(id);
        if (payment == null)
            return NotFound();

        var invoice = await _db.Invoices.FindAsync(payment.InvoiceId);
        if (invoice != null)
        {
            invoice.PaidAmount = Math.Max(0, invoice.PaidAmount - payment.Amount);
            RecalculateInvoiceStatus(invoice);
            invoice.UpdatedAt = DateTime.UtcNow;
        }

        _db.Payments.Remove(payment);
        await _db.SaveChangesAsync();
        return NoContent();
    }

    private static void ApplyToInvoice(Invoice invoice, decimal amount)
    {
        invoice.PaidAmount = Math.Min(invoice.Amount, invoice.PaidAmount + amount);
        RecalculateInvoiceStatus(invoice);
        invoice.UpdatedAt = DateTime.UtcNow;
    }

    private static void RecalculateInvoiceStatus(Invoice invoice)
    {
        invoice.Status = invoice.PaidAmount >= invoice.Amount
            ? "Paid"
            : invoice.PaidAmount > 0 ? "Partial" : "Pending";
    }

    private static string TrimJson(string body)
    {
        if (string.IsNullOrWhiteSpace(body) || body.Length <= 500) return body;
        return body[..500];
    }
}