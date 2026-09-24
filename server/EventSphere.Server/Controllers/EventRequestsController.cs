using System.ComponentModel.DataAnnotations;
using EventSphere.Server.Data;
using EventSphere.Server.Extensions;
using EventSphere.Server.Models;
using EventSphere.Server.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace EventSphere.Server.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class EventRequestsController : ControllerBase
{
    private readonly AppDbContext _db;
    private readonly EmailService _email;

    public EventRequestsController(AppDbContext db, EmailService email)
    {
        _db = db;
        _email = email;
    }

    [HttpGet]
    public IActionResult GetAll(string? status = null, string? search = null,
        string? sortBy = null, string? sortDir = null, int? page = null, int? pageSize = null)
    {
        var query = _db.EventRequests.AsQueryable();

        if (!string.IsNullOrEmpty(status))
            query = query.Where(r => r.Status == status);

        if (!string.IsNullOrEmpty(search))
            query = query.Where(r =>
                r.ContactName.Contains(search) ||
                (r.Email != null && r.Email.Contains(search)) ||
                (r.EventType != null && r.EventType.Contains(search)));

        query = (sortBy, sortDir) switch
        {
            ("contactName", "asc") => query.OrderBy(r => r.ContactName),
            ("contactName", _) => query.OrderByDescending(r => r.ContactName),
            ("status", "asc") => query.OrderBy(r => r.Status),
            ("status", _) => query.OrderByDescending(r => r.Status),
            ("createdDate", "asc") => query.OrderBy(r => r.CreatedDate),
            _ => query.OrderByDescending(r => r.CreatedDate),
        };

        return Ok(query.Page(page, pageSize));
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(int id)
    {
        var req = await _db.EventRequests.FindAsync(id);
        if (req == null)
            return NotFound();

        return Ok(req);
    }

    /* Public, unauthenticated entry point used by the landing page's "Request
       a proposal" form (Contact Us). Creates an EventRequest and sends an
       auto-reply so the visitor knows their inquiry was received. */
    public class PublicEventRequest
    {
        [Required, EmailAddress]
        public string Email { get; set; } = string.Empty;

        [Required]
        public string Name { get; set; } = string.Empty;

        public string? Phone { get; set; }

        public string? Source { get; set; }

        public string? EventType { get; set; }

        [DataType(DataType.Date)]
        public DateTime? TargetDate { get; set; }

        public int? Guests { get; set; }

        public string? Message { get; set; }
    }

    [HttpPost("public")]
    [AllowAnonymous]
    public async Task<IActionResult> CreatePublicEventRequest([FromBody] PublicEventRequest req)
    {
        if (req == null)
            return BadRequest(new { message = "Request body is required." });

        var email = (req.Email ?? string.Empty).Trim().ToLowerInvariant();
        if (string.IsNullOrWhiteSpace(email) || !new EmailAddressAttribute().IsValid(email))
            return BadRequest(new { message = "Enter a valid email address." });

        var name = (req.Name ?? string.Empty).Trim();
        if (string.IsNullOrEmpty(name))
            return BadRequest(new { message = "Enter your name." });

        var phone = (req.Phone ?? string.Empty).Trim();
        if (phone.Length > 20)
            return BadRequest(new { message = "That phone number looks too long — please check it." });

        if (!EmailCheckService.LooksReal(email))
            return BadRequest(new { message = "We couldn't verify that email address — please double-check it and try again." });

        var eventRequest = new EventRequest
        {
            ContactName = name,
            Email = email,
            Phone = phone,
            Source = string.IsNullOrWhiteSpace(req.Source) ? "Website" : req.Source.Trim(),
            EventType = req.EventType,
            TargetDate = req.TargetDate,
            Guests = req.Guests,
            Status = "Pending",
            Notes = req.Message,
            CreatedDate = DateTime.Today,
        };

        _db.EventRequests.Add(eventRequest);
        await _db.SaveChangesAsync();

        if (_email.IsConfigured)
        {
            try
            {
                var subject = "We received your event request — EventSphere";
                var body =
$@"<p>Hi {name},</p>
<p>Thanks for reaching out to <b>EventSphere</b> about your {req.EventType ?? "event"}.</p>
<p>We received your request and a dedicated coordinator will get back to you within one business day with ideas, availability, and honest pricing.</p>
<p>If you'd like to give us more details in the meantime, simply reply to this email.</p>
<p>Best regards,<br/>The EventSphere Team</p>";
                await _email.SendAsync(email, subject, body);
            }
            catch
            {
                /* The request is already saved — a failed auto-reply must not
                   fail the submission. */
            }
        }

        return Ok(new { message = "Request received. A coordinator will get back to you within one business day." });
    }

    private static readonly HashSet<string> AllowedStatuses = new(StringComparer.Ordinal)
    {
        "Pending", "Contacted", "Confirmed Appointment", "Lost", "Cancelled",
    };

    public class SetStatusRequest
    {
        public string? Status { get; set; }
    }

    [HttpPost("{id}/status")]
    [Authorize(Roles = "Admin,Manager")]
    public async Task<IActionResult> SetStatus(int id, [FromBody] SetStatusRequest? req)
    {
        var eventRequest = await _db.EventRequests.FindAsync(id);
        if (eventRequest == null)
            return NotFound(new { message = "Request not found." });

        var status = (req?.Status ?? string.Empty).Trim();
        if (!AllowedStatuses.Contains(status))
            return BadRequest(new { message = $"'{status}' is not a valid request status." });

        eventRequest.Status = status;
        eventRequest.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();
        return Ok(eventRequest);
    }

    [HttpPost("{id}/confirm")]
    [Authorize(Roles = "Admin,Manager")]
    public async Task<IActionResult> Confirm(int id)
    {
        var eventRequest = await _db.EventRequests.FindAsync(id);
        if (eventRequest == null)
            return NotFound(new { message = "Request not found." });

        eventRequest.Status = "Confirmed Appointment";
        eventRequest.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();
        return Ok(eventRequest);
    }

    public class CancelRequest
    {
        public string? Note { get; set; }
    }

    [HttpPost("{id}/cancel")]
    [Authorize(Roles = "Admin,Manager")]
    public async Task<IActionResult> Cancel(int id, [FromBody] CancelRequest? req)
    {
        var eventRequest = await _db.EventRequests.FindAsync(id);
        if (eventRequest == null)
            return NotFound(new { message = "Request not found." });

        if (!string.IsNullOrWhiteSpace(req?.Note))
            eventRequest.Notes = string.IsNullOrWhiteSpace(eventRequest.Notes) ? req.Note.Trim() : $"{eventRequest.Notes}\n{req.Note.Trim()}";

        eventRequest.Status = "Cancelled";
        eventRequest.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();
        return Ok(eventRequest);
    }

    public class EventRequestMessageRequest
    {
        public string? Subject { get; set; }
        public string? Body { get; set; }
    }

    [HttpPost("{id}/message")]
    [Authorize(Roles = "Admin,Manager")]
    public async Task<IActionResult> SendMessage(int id, [FromBody] EventRequestMessageRequest req)
    {
        var eventRequest = await _db.EventRequests.FindAsync(id);
        if (eventRequest == null)
            return NotFound(new { message = "Request not found." });

        if (string.IsNullOrWhiteSpace(eventRequest.Email))
            return BadRequest(new { message = "This request has no email address on file.", sent = false });

        var subject = string.IsNullOrWhiteSpace(req.Subject) ? $"Your event request — EventSphere" : req.Subject.Trim();
        var body = string.IsNullOrWhiteSpace(req.Body)
            ? $"Hi {eventRequest.ContactName},<br/><br/>Thank you for reaching out to <b>EventSphere</b> about your {eventRequest.EventType ?? "event"}. We'd love to discuss the details."
            : req.Body.Trim().Replace("\n", "<br/>");

        if (!_email.IsConfigured)
            return Ok(new
            {
                sent = false,
                reason = "SMTP is not configured yet.",
                mailto = BuildMailto(eventRequest.Email, subject, body),
            });

        try
        {
            await _email.SendAsync(eventRequest.Email, subject, body);
            return Ok(new { sent = true, to = eventRequest.Email, subject });
        }
        catch (Exception ex)
        {
            return Ok(new { sent = false, reason = ex.Message, mailto = BuildMailto(eventRequest.Email, subject, body) });
        }
    }

    private static string BuildMailto(string to, string subject, string body)
    {
        string u(string s) => Uri.EscapeDataString(s);
        return $"mailto:{to}?subject={u(subject)}&body={u(HtmlToText(body))}";
    }

    private static string HtmlToText(string html) => System.Text.RegularExpressions.Regex.Replace(html, "<.*?>", string.Empty);
}