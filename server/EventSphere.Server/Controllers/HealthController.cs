using EventSphere.Server.Data;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace EventSphere.Server.Controllers;

/* Lightweight liveness/DB health check, deliberately:
   - public (no JWT) so uptime monitors can probe it without auth
   - returns 200 only when the DB is reachable
   - returns 503 the moment it is not (so a monitor sees a real failure)
   Never emits secrets or data; safe for public polling. */
[ApiController]
[Route("api/health")]
public class HealthController : ControllerBase
{
    private readonly AppDbContext _db;

    public HealthController(AppDbContext db) { _db = db; }

    [HttpGet]
    public async Task<IActionResult> Get()
    {
        // Any table root reaches the same DB connection, so a config-row
        // count is a cheap, real "is the database alive?" probe.
        var probe = _db.Events.AsNoTracking();

        try
        {
            // Executes a real query against SQL Server (SELECT COUNT on the
            // PK-backed table) - if the connection/pool is healthy this
            // completes; if the DB is down it throws -> 503 below.
            var canCount = await probe.CountAsync() >= 0;

            return Ok(new
            {
                status = "ok",
                database = "reachable",
                checkedAtUtc = DateTime.UtcNow.ToString("o"),
            });
        }
        catch
        {
            return StatusCode(StatusCodes.Status503ServiceUnavailable, new
            {
                status = "degraded",
                database = "unreachable",
                checkedAtUtc = DateTime.UtcNow.ToString("o"),
            });
        }
    }
}
