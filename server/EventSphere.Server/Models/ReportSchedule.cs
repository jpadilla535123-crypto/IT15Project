using System.ComponentModel.DataAnnotations;

namespace EventSphere.Server.Models;

/* Simulated report automations: saved schedules that a "Run now" action can
   execute. Sending is simulated (stamps LastSentAt + RunCount) so the UI stays
   honest without requiring SMTP. */
public class ReportSchedule : BaseEntity
{
    [Required, Display(Name = "Schedule Name")]
    public string Name { get; set; } = string.Empty;

    [Display(Name = "Report Type")]
    public string ReportType { get; set; } = "financial";

    public string Frequency { get; set; } = "Weekly";

    /* 1 = Monday .. 7 = Sunday (weekly) */
    public int? DayOfWeek { get; set; }

    /* 1..28 (monthly) */
    public int? DayOfMonth { get; set; }

    public int Hour { get; set; } = 8;

    [Display(Name = "Recipients")]
    public string? Recipients { get; set; }

    public bool Active { get; set; } = true;

    [Display(Name = "Last Sent")]
    public DateTime? LastSentAt { get; set; }

    public int RunCount { get; set; }
}