namespace EventSphere.Server.Models;

public class JwtSettings
{
    public string Issuer { get; set; } = "EventSphere.Api";
    public string Audience { get; set; } = "EventSphere.Client";
    public string Key { get; set; } = string.Empty;
    public int ExpiryMinutes { get; set; } = 480;
}