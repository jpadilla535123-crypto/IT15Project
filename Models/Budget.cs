using System.ComponentModel.DataAnnotations;

namespace EventSphere.Web.Models;

public class Budget
{
    public int Id { get; set; }

    [Display(Name = "Event")]
    public int EventId { get; set; }

    public string Category { get; set; } = "General";

    [Display(Name = "Planned Amount"), DataType(DataType.Currency)]
    public decimal PlannedAmount { get; set; }

    [Display(Name = "Actual Amount"), DataType(DataType.Currency)]
    public decimal ActualAmount { get; set; }

    [DataType(DataType.MultilineText)]
    public string? Notes { get; set; }

    public Event? Event { get; set; }
}
