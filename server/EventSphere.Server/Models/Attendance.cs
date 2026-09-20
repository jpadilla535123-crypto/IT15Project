using System.ComponentModel.DataAnnotations;

namespace EventSphere.Server.Models;

public class Attendance : BaseEntity
{
    [Display(Name = "Employee")]
    public int EmployeeId { get; set; }

    [Display(Name = "Work Date"), DataType(DataType.Date)]
    public DateTime WorkDate { get; set; }

    public string Status { get; set; } = AttendanceStatus.Present;

    public string? ClockIn { get; set; }

    public string? ClockOut { get; set; }

    public string? Notes { get; set; }

    public Employee? Employee { get; set; }
}

public static class AttendanceStatus
{
    public const string Present = "Present";
    public const string Late = "Late";
    public const string Absent = "Absent";
    public const string Leave = "Leave";
    public const string RestDay = "RestDay";

    public static readonly string[] All = { Present, Late, Absent, Leave, RestDay };
}