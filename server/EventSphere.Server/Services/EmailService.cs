using System.Net;
using System.Net.Mail;

namespace EventSphere.Server.Services;

/* SMTP email dispatcher used by the request list actions ("Message a client").
   Reads configuration from the "Smtp" section (or Smtp__* environment
   variables). When no host is configured the service reports IsConfigured == false
   and the API tells the frontend to fall back to the visitor's mail app. */
public class EmailService
{
    private readonly SmtpOptions? _smtp;

    public EmailService(IConfiguration configuration)
    {
        _smtp = configuration.GetSection("Smtp").Get<SmtpOptions>();
    }

    public bool IsConfigured =>
        _smtp != null
        && !string.IsNullOrWhiteSpace(_smtp.Host)
        && !string.IsNullOrWhiteSpace(_smtp.From);

    public async Task SendAsync(string to, string subject, string body, CancellationToken ct = default)
    {
        if (!IsConfigured || _smtp == null)
            throw new InvalidOperationException("SMTP is not configured on the server.");

        using var client =
            _smtp.UseSsl
                ? new SmtpClient(_smtp.Host, _smtp.Port) { EnableSsl = true }
                : new SmtpClient(_smtp.Host, _smtp.Port);

        if (!string.IsNullOrWhiteSpace(_smtp.Username))
        {
            client.Credentials = new NetworkCredential(_smtp.Username, _smtp.Password);
            client.UseDefaultCredentials = false;
        }

        var mail = new MailMessage(_smtp.From, to, subject, body) { IsBodyHtml = true };
        await client.SendMailAsync(mail, ct);
    }
}

public class SmtpOptions
{
    public string Host { get; set; } = string.Empty;
    public int Port { get; set; } = 587;
    public bool UseSsl { get; set; } = true;
    public string? Username { get; set; }
    public string? Password { get; set; }
    public string From { get; set; } = string.Empty;
}

/* Shared branded HTML wrapper for all client-facing emails. Emails are made of
   small fragment bodies that get placed inside a card within this shell, so the
   EventSphere logo, colors, typography and footer stay consistent everywhere. */
public static class EmailBranding
{
    public const string LogoUrl = "https://it-15-project.vercel.app/logo.png";

    /* Plain shell (top bar + content card + footer), no hero banner. */
    public static string Wrap(string content) => Shell(string.Empty, content);

    /* Shell with a gradient hero banner under the top bar. */
    public static string Wrap(string content, string heroTitle, string heroSubtitle = "")
        => Shell(Hero(heroTitle, heroSubtitle), content);

    private static string Shell(string hero, string content) => $@"<!doctype html>
<html>
  <head>
    <meta charset='utf-8'>
    <meta name='viewport' content='width=device-width, initial-scale=1.0'>
  </head>
  <body style='margin:0;padding:0;background-color:#f4f3f8;font-family:-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,Helvetica,Arial,sans-serif;color:#1f2430;-webkit-text-size-adjust:100%;'>
    <table role='presentation' border='0' cellpadding='0' cellspacing='0' width='100%' style='width:100%;max-width:600px;margin:0 auto;'>
      <tr>
        <td style='background:#ffffff;border-bottom:1px solid #eeeaf3;padding:18px 24px;text-align:center;'>
          <img src='{LogoUrl}' alt='EventSphere' style='max-height:44px;width:auto;'>
        </td>
      </tr>
      {hero}
      <tr>
        <td style='padding:24px 16px 8px 16px;'>
          <table role='presentation' border='0' cellpadding='0' cellspacing='0' width='100%'>
            <tr>
              <td style='background:#ffffff;border:1px solid #ecebf1;border-radius:14px;padding:28px 26px;'>
                {content}
              </td>
            </tr>
          </table>
        </td>
      </tr>
      <tr>
        <td style='padding:20px 24px 28px 24px;text-align:center;color:#9ca3af;font-size:12px;line-height:1.7;'>
          <div>© 2026 EventSphere Inc. — End-to-end event management</div>
          <div style='margin-top:4px;'><span style='color:#ff2b66;font-weight:800;'>eventsphere.com</span> · <span style='text-decoration:underline;'>Unsubscribe</span></div>
        </td>
      </tr>
    </table>
  </body>
</html>";

    private static string Hero(string title, string subtitle)
    {
        var sub = string.IsNullOrWhiteSpace(subtitle)
            ? string.Empty
            : $"<div style='margin-top:8px;font-size:14px;line-height:1.5;opacity:.92;'>{subtitle}</div>";
        return $@"<tr>
        <td style='padding:34px 28px;text-align:center;color:#ffffff;background-color:#ff2b66;background-image:linear-gradient(135deg,#ff2b66 0%,#8b5cf6 100%);'>
          <div style='font-size:23px;font-weight:800;letter-spacing:-0.2px;'>{title}</div>
          {sub}
          <div style='margin:18px auto 0 auto;width:34px;height:4px;background:rgba(255,255,255,.55);border-radius:99px;'></div>
        </td>
      </tr>";
    }

    /* Tinted callout used when an action needs an explanation (e.g. a rejected payment). */
    public static string Alert(string title, string text)
        => $@"<div style='margin:0 0 14px 0;border:1px solid #f5dbe5;border-radius:10px;background:#fff5f7;padding:14px 16px;'>
      <div style='font-size:13px;font-weight:800;color:#ff2b66;'>{title}</div>
      <div style='margin-top:3px;font-size:13px;line-height:1.6;color:#1f2430;'>{text}</div>
    </div>";

    public static string Paragraph(string text)
        => $"<p style='margin:0 0 12px 0;line-height:1.65;'>{text}</p>";

    public static string SectionLabel(string text)
        => $"<div style='margin:18px 0 10px 0;font-size:11px;font-weight:800;letter-spacing:1.2px;color:#ff2b66;text-transform:uppercase;'>{text}</div>";

    public static string PrimaryButton(string text)
        => $@"<table role='presentation' border='0' cellpadding='0' cellspacing='0' align='center' width='100%' style='margin:20px 0 4px 0;'>
            <tr><td align='center'>
              <div style='display:inline-block;padding:13px 30px;border-radius:999px;color:#ffffff;font-size:14px;font-weight:800;background-color:#ff2b66;background-image:linear-gradient(135deg,#ff2b66,#ff5e8a);box-shadow:0 6px 16px rgba(255,43,102,.28);'>→ {text}</div>
            </td></tr>
          </table>";

    /* Two-column label/value rows, used for ticket and payment details. */
    public static string InfoRows(params (string label, string value)[] rows)
    {
        var sb = new System.Text.StringBuilder();
        foreach (var (label, value) in rows)
        {
            sb.Append("<tr>");
            sb.Append($"<td style='padding:5px 0;font-size:13px;color:#6b7280;white-space:nowrap;width:38%;'>{label}</td>");
            sb.Append($"<td align='right' style='padding:5px 0;font-size:13px;font-weight:700;color:#1f2430;'>{value}</td>");
            sb.Append("</tr>");
        }
        return $"<table role='presentation' border='0' cellpadding='0' cellspacing='0' width='100%'>{sb}</table>";
    }

    /* Accent card for one event in a listing. */
    public static string EventCard(string name, string meta, string date, string location, decimal price)
    {
        var loc = string.IsNullOrWhiteSpace(location)
            ? string.Empty
            : $"<div style='margin-top:3px;font-size:13px;color:#1f2430;'>📍 {location}</div>";
        return $@"<table role='presentation' border='0' cellpadding='0' cellspacing='0' width='100%' style='margin:0 0 10px 0;'>
          <tr>
            <td style='background:#fff5f7;border-left:4px solid #ff2b66;border-radius:10px;padding:13px 15px;'>
              <div style='font-size:15px;font-weight:800;color:#1f2430;'>{name}</div>
              <div style='margin-top:3px;font-size:11px;color:#8b5cf6;font-weight:800;text-transform:uppercase;letter-spacing:.6px;'>{meta}</div>
              <div style='margin-top:7px;font-size:13px;color:#1f2430;'>📅 {date}</div>
              {loc}
              <div style='margin-top:9px;display:inline-block;padding:4px 12px;border-radius:999px;background-color:#ff2b66;color:#ffffff;font-size:12px;font-weight:800;'>PHP {price:N0}</div>
            </td>
          </tr>
        </table>";
    }

    /* Numbered step used by the request/confirmation emails. */
    public static string Step(int number, string title, string text)
        => $@"<table role='presentation' border='0' cellpadding='0' cellspacing='0' width='100%' style='margin:0 0 10px 0;'>
          <tr>
            <td style='width:34px;vertical-align:top;'>
              <div style='width:24px;height:24px;border-radius:99px;background-color:#ff2b66;color:#ffffff;font-size:12px;font-weight:800;text-align:center;line-height:24px;'>{number}</div>
            </td>
            <td style='padding:0 0 0 12px;'>
              <div style='font-size:13px;font-weight:800;color:#1f2430;'>{title}</div>
              <div style='margin-top:2px;font-size:13px;line-height:1.55;color:#6b7280;'>{text}</div>
            </td>
          </tr>
        </table>";

    /* Dashed divider so a ticket block reads like a stub. */
    public static string Divider()
        => "<div style='margin:16px 0;border-top:2px dashed #e5e2ec;'></div>";

    /* Boarding-pass style ticket block. */
    public static string TicketBlock(string eventName, params (string label, string value)[] rows)
    {
        var body = new System.Text.StringBuilder();
        body.Append($"<div style='padding:12px 16px;color:#ffffff;font-size:15px;font-weight:800;background-color:#ff2b66;background-image:linear-gradient(135deg,#ff2b66,#ff5e8a);'>🎟️ {eventName}</div>");
        body.Append("<div style='padding:14px 16px;'>");
        body.Append(InfoRows(rows));
        body.Append("</div>");
        return $@"<table role='presentation' border='0' cellpadding='0' cellspacing='0' width='100%' style='margin:14px 0 16px 0;'>
          <tr><td style='border:1px solid #f3d9e4;border-radius:14px;overflow:hidden;'>{body}</td></tr>
        </table>";
    }

    /* Prominent seat banner shown inside the ticket email. */
    public static string SeatBanner(string seat)
        => $"<div style='margin:0 0 14px 0;text-align:center;border:2px dashed #ff2b66;border-radius:10px;padding:12px;background:#fff5f7;'><div style='font-size:11px;font-weight:800;letter-spacing:1.4px;color:#ff2b66;text-transform:uppercase;'>Your seat</div><div style='margin-top:2px;font-size:18px;font-weight:800;color:#ff2b66;'>{seat}</div></div>";
}