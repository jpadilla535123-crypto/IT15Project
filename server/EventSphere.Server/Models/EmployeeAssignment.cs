using System.ComponentModel.DataAnnotations;

namespace EventSphere.Server.Models;

public class EmployeeAssignment : BaseEntity
{
    [Display(Name = "Event")]
    public int EventId { get; set; }

    [Display(Name = "Employee")]
    public int EmployeeId { get; set; }

    public string? Role { get; set; }

    [Display(Name = "Assigned Date"), DataType(DataType.Date)]
    public DateTime AssignedDate { get; set; } = DateTime.Today;

    public decimal Hours { get; set; }

    public string Status { get; set; } = "Assigned";

    public Event? Event { get; set; }

    public Employee? Employee { get; set; }
}