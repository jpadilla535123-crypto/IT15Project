using System.ComponentModel.DataAnnotations;

namespace EventSphere.Server.Models;

public class Event : BaseEntity
{
    [Required]
    public string Name { get; set; } = string.Empty;

    [Display(Name = "Event Type")]
    public string EventType { get; set; } = "Corporate";

    public string Status { get; set; } = "Planned";

    [Display(Name = "Start Date"), DataType(DataType.Date)]
    public DateTime StartDate { get; set; }

    [Display(Name = "End Date"), DataType(DataType.Date)]
    public DateTime EndDate { get; set; }

    [Display(Name = "Client")]
    public int? ClientId { get; set; }

    [Display(Name = "Venue")]
    public int? VenueId { get; set; }

    [DataType(DataType.MultilineText)]
    public string? Description { get; set; }

    public Client? Client { get; set; }

    public Venue? Venue { get; set; }

    public ICollection<EmployeeAssignment> Assignments { get; set; } = new List<EmployeeAssignment>();

    public ICollection<EventSupplier> Suppliers { get; set; } = new List<EventSupplier>();

    public ICollection<Budget> Budgets { get; set; } = new List<Budget>();

    public ICollection<Invoice> Invoices { get; set; } = new List<Invoice>();

    [Display(Name = "Total Budget")]
    public decimal TotalBudget => Budgets.Sum(b => b.PlannedAmount);
}