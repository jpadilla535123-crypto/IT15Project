using System.Net;
using System.Net.Sockets;
using System.Text;

namespace EventSphere.Server.Services;

/* Best-effort email sanity checks used by the public lead endpoint so that
   only real mailbox addresses get subscribed:
   - format + throwaway/known-disposable domain blacklist
   - live MX record lookup (a definitive NXDOMAIN is rejected)

   The MX check is deliberately fail-open: timeouts or blocked resolver
   network traffic let the lead through, so a transient DNS hiccup never
   blocks a genuine subscriber. */
public static class EmailCheckService
{
    private static readonly HashSet<string> ThrowawayDomains = new(StringComparer.OrdinalIgnoreCase)
    {
        "mailinator.com", "mailinator.net", "guerrillamail.com", "guerrillamail.org",
        "guerrillamailblock.com", "10minutemail.com", "10minutemail.net", "yopmail.com",
        "yopmail.net", "tempmail.com", "tempmail.net", "temp-mail.org", "throwaway.email",
        "dispostable.com", "maildrop.cc", "mailnesia.com", "mytemp.email", "spam4.me",
        "trashmail.com", "sharklasers.com", "grr.la", "33mail.com", "mailcatch.com",
        "getnada.com", "emailsensei.com", "mintemail.com", "dropmail.me", "0-mail.com",
    };

    private static readonly IPAddress[] Resolvers =
    {
        IPAddress.Parse("8.8.8.8"),
        IPAddress.Parse("1.1.1.1"),
        IPAddress.Parse("9.9.9.9"),
    };

    public static bool LooksReal(string email)
    {
        var domain = MailDomain(email);
        if (string.IsNullOrEmpty(domain)) return false;
        if (IsReservedOrLocal(domain)) return false;
        if (ThrowawayDomains.Contains(domain)) return false;
        return MxExists(domain);
    }

    public static string? MailDomain(string email)
    {
        if (string.IsNullOrWhiteSpace(email)) return null;
        var at = email.LastIndexOf('@');
        if (at <= 0 || at == email.Length - 1) return null;
        return email[(at + 1)..].Trim().ToLowerInvariant();
    }

    private static bool IsReservedOrLocal(string domain)
    {
        if (domain.EndsWith(".local") || domain.EndsWith(".lan") || domain.EndsWith(".internal")
            || domain.EndsWith(".localhost") || domain.EndsWith(".invalid") || domain.EndsWith(".test")) return true;
        return domain == "localhost" || IPAddress.TryParse(domain, out _);
    }

    /* Query the domain's MX records over UDP/53. null = "unknown" while a
       query could not be answered; callers treat that as "not rejected". */
    public static bool MxExists(string domain)
    {
        foreach (var resolver in Resolvers)
        {
            var verdict = QueryMx(domain, resolver);
            if (verdict.HasValue) return verdict.Value;
        }
        return true; // every resolver unavailable → fail open
    }

    private static bool? QueryMx(string domain, IPAddress resolver)
    {
        try
        {
            using var udp = new UdpClient();
            udp.Client.ReceiveTimeout = 2500;
            udp.Client.SendTimeout = 2500;

            var id = (ushort)Random.Shared.Next(1, short.MaxValue - 1);
            var query = BuildMxQuery(domain, id);
            udp.Send(query, query.Length, new IPEndPoint(resolver, 53));

            var ep = new IPEndPoint(resolver, 53);
            var response = udp.Receive(ref ep);
            return ParseMxResponse(response, id);
        }
        catch (Exception)
        {
            return null;
        }
    }

    private static byte[] BuildMxQuery(string domain, ushort id)
    {
        var name = FlattenDomain(domain);
        var length = 12 + name.Length + 4;
        var buf = new byte[length];
        buf[0] = (byte)(id >> 8);
        buf[1] = (byte)(id & 0xFF);
        buf[2] = 0x01; // RD (recursion desired)
        buf[5] = 0x01; // QDCOUNT = 1
        Array.Copy(name, 0, buf, 12, name.Length);
        var o = 12 + name.Length;
        buf[o] = 0; buf[o + 1] = 15;     // QTYPE = MX
        buf[o + 2] = 0; buf[o + 3] = 1;  // QCLASS = IN
        return buf;
    }

    private static byte[] FlattenDomain(string domain)
    {
        using var ms = new MemoryStream();
        foreach (var label in domain.Split('.'))
        {
            if (label.Length == 0 || label.Length > 63) return new byte[] { 0 };
            ms.WriteByte((byte)label.Length);
            var bytes = Encoding.ASCII.GetBytes(label);
            ms.Write(bytes, 0, bytes.Length);
        }
        ms.WriteByte(0);
        return ms.ToArray();
    }

    private static bool? ParseMxResponse(byte[] response, ushort id)
    {
        if (response.Length < 12) return null;
        var rid = (ushort)((response[0] << 8) | response[1]);
        if (rid != id) return null;
        var flags = (ushort)((response[2] << 8) | response[3]);
        var rcode = flags & 0x000F;
        if (rcode == 3) return false;  // NXDOMAIN → mailbox domain does not exist
        if (rcode == 0) return true;   // NOERROR → domain is live
        return null;                   // SERVFAIL / REFUSED / … → unknown, fail open
    }

    /* Turn the local part of the email into a presentable full name, e.g.
       "juan.dela.cruz@…” → "Juan Dela Cruz", "johndoe@…” → "Johndoe",
       "john.d@…" → "John D". Returns null when nothing usable is found. */
    public static string? SuggestName(string email)
    {
        if (string.IsNullOrWhiteSpace(email)) return null;
        var local = email.Split('@')[0].Trim();
        if (local.Length == 0 || local.Length > 64) return null;
        if (!local.All(c => char.IsLetterOrDigit(c) || c is '.' or '_' or '-' or '+')) return null;

        var words = local
            .Split('.', '_', '-', '+')
            .Where(w => w.Length > 0 && w.Any(char.IsLetter))
            .Select(CapitalizeWord)
            .Where(w => !string.IsNullOrEmpty(w))
            .ToList();

        return words.Count == 0 ? null : string.Join(' ', words);
    }

    private static string CapitalizeWord(string word)
    {
        var spaced = new StringBuilder();
        for (var i = 0; i < word.Length; i++)
        {
            var c = word[i];
            if (i > 0 && char.IsUpper(c) && (char.IsLower(word[i - 1]) || char.IsDigit(word[i - 1])))
                spaced.Append(' ');
            spaced.Append(c);
        }
        var parts = spaced.ToString()
            .Split(' ')
            .Where(p => p.Length > 0)
            .Select(p => char.ToUpperInvariant(p[0]) + p[1..].ToLowerInvariant());
        return string.Join(' ', parts).Trim();
    }
}