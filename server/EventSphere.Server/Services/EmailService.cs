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