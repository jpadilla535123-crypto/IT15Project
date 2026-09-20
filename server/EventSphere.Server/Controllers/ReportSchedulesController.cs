using System.ComponentModel.DataAnnotations;
using EventSphere.Server.Data;
using EventSphere.Server.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace EventSphere.Server.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize(Roles = "Admin,Manager,Finance")]
public class ReportSchedulesController : ControllerBase
{
    private readonly AppDbContext _db;

    public ReportSchedulesController(AppDbContext db)
    {
        _db = db;
    }

    public class ScheduleRequest
    {
        [Required] public string Name { get; set; } = string.Empty;
        public string ReportType { get; set; } = "financial";
        public string Frequency { get; set; } = "Weekly";
        public int? DayOfWeek { get; set; }
        public int? DayOfMonth { get; set; }
        public int Hour { get; set; } = 8;
        public string? Recipients { get; set; }
        public bool Active { get; set; } = true;
    }

    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var list = await _db.ReportSchedules
            .OrderBy(rs => rs.Id)
            .Select(rs => new
            {
                rs.Id,
                rs.Name,
                rs.ReportType,
                rs.Frequency,
                rs.DayOfWeek,
                rs.DayOfMonth,
                rs.Hour,
                rs.Recipients,
                rs.Active,
                rs.LastSentAt,
                rs.RunCount,
                rs.CreatedAt,
            })
            .ToListAsync();

        return Ok(list);
    }

    [HttpPost]
    public async Task<IActionResult> Create(ScheduleRequest request)
    {
        if (!ModelState.IsValid)
            return BadRequest(ModelState);

        var schedule = new ReportSchedule
        {
            Name = request.Name.Trim(),
            ReportType = request.ReportType,
            Frequency = request.Frequency,
            DayOfWeek = request.DayOfWeek,
            DayOfMonth = request.DayOfMonth,
            Hour = request.Hour,
            Recipients = request.Recipients?.Trim(),
            Active = request.Active,
        };

        _db.ReportSchedules.Add(schedule);
        await _db.SaveChangesAsync();

        return CreatedAtAction(nameof(GetAll), new { }, new
        {
            schedule.Id,
            schedule.Name,
            schedule.ReportType,
            schedule.Frequency,
            schedule.DayOfWeek,
            schedule.DayOfMonth,
            schedule.Hour,
            schedule.Recipients,
            schedule.Active,
            schedule.LastSentAt,
            schedule.RunCount,
            schedule.CreatedAt,
        });
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> Update(int id, ScheduleRequest request)
    {
        var schedule = await _db.ReportSchedules.FindAsync(id);
        if (schedule == null)
            return NotFound();

        schedule.Name = request.Name.Trim();
        schedule.ReportType = request.ReportType;
        schedule.Frequency = request.Frequency;
        schedule.DayOfWeek = request.DayOfWeek;
        schedule.DayOfMonth = request.DayOfMonth;
        schedule.Hour = request.Hour;
        schedule.Recipients = request.Recipients?.Trim();
        schedule.Active = request.Active;

        await _db.SaveChangesAsync();
        return Ok(new { schedule.Id, schedule.Active });
    }

    /* Simulated automation: marks the run as executed instead of touching SMTP. */
    [HttpPost("{id}/run")]
    public async Task<IActionResult> Run(int id)
    {
        var schedule = await _db.ReportSchedules.FindAsync(id);
        if (schedule == null)
            return NotFound();

        schedule.LastSentAt = DateTime.Now;
        schedule.RunCount += 1;

        await _db.SaveChangesAsync();
        return Ok(new { schedule.Id, schedule.LastSentAt, schedule.RunCount });
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(int id)
    {
        var schedule = await _db.ReportSchedules.FindAsync(id);
        if (schedule == null)
            return NotFound();

        _db.ReportSchedules.Remove(schedule);
        await _db.SaveChangesAsync();
        return NoContent();
    }
}