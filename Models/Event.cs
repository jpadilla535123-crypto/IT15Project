using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace EventSphere.Web.Models;

public class Event
{
    public int Id { get; set; }

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

    [NotMapped, Display(Name = "Client")]
    public string? ClientName { get; set; }

    [NotMapped, Display(Name = "Venue")]
    public string? VenueName { get; set; }

    [DataType(DataType.MultilineText)]
    public string? Description { get; set; }

    public Client? Client { get; set; }
    public Venue? Venue { get; set; }

    public ICollection<EventAssignment> Assignments { get; set; } = new List<EventAssignment>();
    public ICollection<Budget> Budgets { get; set; } = new List<Budget>();
    public ICollection<Invoice> Invoices { get; set; } = new List<Invoice>();

    [Display(Name = "Total Budget")]
    public decimal TotalBudget => Budgets.Sum(b => b.PlannedAmount);
}
