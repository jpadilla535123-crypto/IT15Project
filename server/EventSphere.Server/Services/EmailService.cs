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
   EventSphere logo, typography, colors and footer stay consistent everywhere. */
public static class EmailBranding
{
    public const string LogoUrl = "https://it-15-project.vercel.app/logo.png";

    public static string Wrap(string content)
    {
        return $@"<!doctype html>
<html>
  <head>
    <meta charset='utf-8'>
    <meta name='viewport' content='width=device-width, initial-scale=1.0'>
  </head>
  <body style='margin:0;padding:16px;background-color:#f7f7f8;font-family:-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,Helvetica,Arial,sans-serif;color:#111827;'>
    <table role='presentation' border='0' cellpadding='0' cellspacing='0' width='100%' style='max-width:560px;margin:0 auto;'>
      <tr>
        <td style='padding:0 0 16px 0;text-align:center;'>
          <img src='{LogoUrl}' alt='EventSphere' style='max-height:48px;width:auto;'>
        </td>
      </tr>
      <tr>
        <td style='background:#ffffff;border:1px solid #e5e7eb;border-radius:12px;padding:24px;'>
          {content}
        </td>
      </tr>
      <tr>
        <td style='padding:16px 0 0 0;text-align:center;color:#6b7280;font-size:12px;line-height:1.5;'>
          © 2026 EventSphere Inc. — End-to-end event management
        </td>
      </tr>
    </table>
  </body>
</html>";
    }

    public static string Heading(string text)
        => $"<h1 style='margin:0 0 12px 0;font-size:18px;font-weight:700;'>{text}</h1>";

    public static string Paragraph(string text)
        => $"<p style='margin:0 0 12px 0;line-height:1.6;'>{text}</p>";
}