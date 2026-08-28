using System.ComponentModel.DataAnnotations;

namespace EventSphere.Server.Models;

public class BudgetItem : BaseEntity
{
    [Display(Name = "Budget")]
    public int BudgetId { get; set; }

    [Required, Display(Name = "Item Name")]
    public string Name { get; set; } = string.Empty;

    [Display(Name = "Planned Amount"), DataType(DataType.Currency)]
    public decimal PlannedAmount { get; set; }

    [Display(Name = "Actual Amount"), DataType(DataType.Currency)]
    public decimal ActualAmount { get; set; }

    [DataType(DataType.MultilineText)]
    public string? Notes { get; set; }

    public Budget? Budget { get; set; }
}