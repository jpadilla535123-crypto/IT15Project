using System.ComponentModel.DataAnnotations;

namespace EventSphere.Server.Models;

public class LeaveBalance : BaseEntity
{
    [Display(Name = "Employee")]
    public int EmployeeId { get; set; }

    public int Year { get; set; } = DateTime.Today.Year;

    [Display(Name = "Total Days")]
    public int TotalDays { get; set; } = 15;

    [Display(Name = "Used Days")]
    public int UsedDays { get; set; }

    [Display(Name = "Available Days")]
    public int AvailableDays => Math.Max(0, TotalDays - UsedDays);

    public Employee? Employee { get; set; }
}