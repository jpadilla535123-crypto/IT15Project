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
public class LeadsController : ControllerBase
{
    private readonly AppDbContext _db;
    private readonly EmailService _email;

    public LeadsController(AppDbContext db, EmailService email)
    {
        _db = db;
        _email = email;
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
       newsletter ("Stay in the loop"). Event inquiries from Contact Us go to
       /api/eventrequests/public instead (EventRequest), so Lead Management
       holds only newsletter subscribers. Verifies the mailbox actually exists
       before saving, then creates a 'Pending' lead and sends an auto-reply. */
    public class PublicLeadRequest
    {
        [Required, EmailAddress]
        public string Email { get; set; } = string.Empty;

        public string? Name { get; set; }

        public string? Phone { get; set; }

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

        var email = (req.Email ?? string.Empty).Trim().ToLowerInvariant();
        if (string.IsNullOrWhiteSpace(email) || !new EmailAddressAttribute().IsValid(email))
            return BadRequest(new { message = "Enter a valid email address." });

        if (await _db.Leads.AnyAsync(l => l.Email == email))
            return Conflict(new { message = "This email is already on our list." });

        if (!EmailCheckService.LooksReal(email))
            return BadRequest(new { message = "We couldn't verify that email address — please double-check it and try again." });

        var name = (req.Name ?? string.Empty).Trim();
        if (string.IsNullOrEmpty(name))
            name = EmailCheckService.SuggestName(email) ?? string.Empty;

        var phone = (req.Phone ?? string.Empty).Trim();
        if (phone.Length > 20)
            return BadRequest(new { message = "That phone number looks too long — please check it." });

        var lead = new Lead
        {
            CompanyName = string.IsNullOrEmpty(name) ? email : name,
            ContactName = string.IsNullOrEmpty(name) ? null : name,
            Email = email,
            Phone = phone,
            Source = string.IsNullOrWhiteSpace(req.Source) ? "Website" : req.Source.Trim(),
            EventType = req.EventType,
            EstimatedBudget = req.EstimatedBudget ?? 0m,
            Status = "Pending",
            Notes = req.Notes,
            CreatedDate = DateTime.Today,
        };

        _db.Leads.Add(lead);
        await _db.SaveChangesAsync();

        /* "Stay in the loop" subscribers get an instant auto-reply. A missing
           SMTP config must not fail the subscription — the lead is already saved. */
        if (string.Equals(lead.Source, "Newsletter", StringComparison.OrdinalIgnoreCase) && _email.IsConfigured)
        {
            try
            {
                var subject = "Welcome to the EventSphere list!";
                var body =
$@"<p>Hi {lead.ContactName ?? "there"},</p>
<p>Thanks for staying in the loop with <b>EventSphere</b>.</p>
<p>You'll now get first dibs on our upcoming events, venue deals, and early-bird ticket offers — nothing spammy, and you can unsubscribe anytime.</p>
<p>See you at the next one,<br/>The EventSphere Team</p>";
                await _email.SendAsync(email, subject, body);
            }
            catch
            {
                /* subscribe still succeeds even if the auto-reply fails. */
            }
        }

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

    /* Shared action used by the Event Management "Requests" widget and Lead
       Management: confirm (mark as booked/coordinated), cancel (close the
       lead). Returns the updated lead so the UI can refresh in place. */
    private static readonly HashSet<string> AllowedLeadStatuses = new(StringComparer.Ordinal)
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
        var lead = await _db.Leads.FindAsync(id);
        if (lead == null)
            return NotFound(new { message = "Request not found." });

        var status = (req?.Status ?? string.Empty).Trim();
        if (!AllowedLeadStatuses.Contains(status))
            return BadRequest(new { message = $"'{status}' is not a valid lead status." });

        lead.Status = status;
        lead.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();
        return Ok(lead);
    }
    [HttpPost("{id}/confirm")]
    [Authorize(Roles = "Admin,Manager")]
    public async Task<IActionResult> Confirm(int id)
    {
        var lead = await _db.Leads.FindAsync(id);
        if (lead == null)
            return NotFound(new { message = "Request not found." });

        lead.Status = "Confirmed Appointment";
        lead.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();
        return Ok(lead);
    }

    [HttpPost("{id}/cancel")]
    [Authorize(Roles = "Admin,Manager")]
    public async Task<IActionResult> Cancel(int id, [FromBody] CancelRequest? req)
    {
        var lead = await _db.Leads.FindAsync(id);
        if (lead == null)
            return NotFound(new { message = "Request not found." });

        if (!string.IsNullOrWhiteSpace(req?.Note))
            lead.Notes = string.IsNullOrWhiteSpace(lead.Notes) ? req.Note.Trim() : $"{lead.Notes}\n{req.Note.Trim()}";

        lead.Status = "Cancelled";
        lead.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();
        return Ok(lead);
    }

    public class CancelRequest
    {
        public string? Note { get; set; }
    }

    /* "Message" action for a request. Sends the email through the configured
       SMTP server. If the server has no SMTP configured, returns sent=false so
       the frontend can gracefully open the visitor's mail client instead. */
    [HttpPost("{id}/message")]
    [Authorize(Roles = "Admin,Manager")]
    public async Task<IActionResult> SendMessage(int id, [FromBody] LeadMessageRequest req)
    {
        var lead = await _db.Leads.FindAsync(id);
        if (lead == null)
            return NotFound(new { message = "Request not found." });

        if (string.IsNullOrWhiteSpace(lead.Email))
            return BadRequest(new { message = "This request has no email address on file.", sent = false });

        var subject = string.IsNullOrWhiteSpace(req.Subject) ? $"Your inquiry — {lead.CompanyName}" : req.Subject.Trim();
        var body = string.IsNullOrWhiteSpace(req.Body)
            ? $"Hi {lead.ContactName ?? "there"},<br/><br/>Thank you for reaching out to <b>EventSphere</b>. We'd love to discuss your event plan."
            : req.Body.Trim().Replace("\n", "<br/>");

        if (!_email.IsConfigured)
            return Ok(new
            {
                sent = false,
                reason = "SMTP is not configured yet.",
                mailto = BuildMailto(lead.Email, subject, body),
            });

        try
        {
            await _email.SendAsync(lead.Email, subject, body);
            return Ok(new { sent = true, to = lead.Email, subject });
        }
        catch (Exception ex)
        {
            return Ok(new { sent = false, reason = ex.Message, mailto = BuildMailto(lead.Email, subject, body) });
        }
    }

    public class LeadMessageRequest
    {
        public string? Subject { get; set; }
        public string? Body { get; set; }
    }

    private static string BuildMailto(string to, string subject, string body)
    {
        string u(string s) => Uri.EscapeDataString(s);
        return $"mailto:{to}?subject={u(subject)}&body={u(HtmlToText(body))}";
    }

    private static string HtmlToText(string html) => System.Text.RegularExpressions.Regex.Replace(html, "<.*?>", string.Empty);
}