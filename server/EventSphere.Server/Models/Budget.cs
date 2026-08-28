using System.ComponentModel.DataAnnotations;

namespace EventSphere.Server.Models;

public class Budget : BaseEntity
{
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

    public ICollection<BudgetItem> Items { get; set; } = new List<BudgetItem>();
}