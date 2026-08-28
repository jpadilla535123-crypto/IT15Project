using System.ComponentModel.DataAnnotations;

namespace EventSphere.Server.Models;

public class Employee : BaseEntity
{
    [Required, Display(Name = "First Name")]
    public string FirstName { get; set; } = string.Empty;

    [Required, Display(Name = "Last Name")]
    public string LastName { get; set; } = string.Empty;

    public string Role { get; set; } = "Staff";

    [EmailAddress]
    public string? Email { get; set; }

    [Phone]
    public string? Phone { get; set; }

    [DataType(DataType.Currency)]
    public decimal Salary { get; set; }

    [Display(Name = "Hire Date"), DataType(DataType.Date)]
    public DateTime HireDate { get; set; } = DateTime.Today;

    public string Status { get; set; } = "Active";

    [Display(Name = "Full Name")]
    public string FullName => $"{FirstName} {LastName}";

    public ICollection<EmployeeAssignment> Assignments { get; set; } = new List<EmployeeAssignment>();
}