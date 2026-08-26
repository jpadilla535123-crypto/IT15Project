using System.ComponentModel.DataAnnotations;

namespace EventSphere.Web.Models;

public class Lead
{
    public int Id { get; set; }

    [Required, Display(Name = "Company Name")]
    public string CompanyName { get; set; } = string.Empty;

    [Display(Name = "Contact Name")]
    public string? ContactName { get; set; }

    [EmailAddress]
    public string? Email { get; set; }

    [Phone]
    public string? Phone { get; set; }

    public string? Source { get; set; }

    [Display(Name = "Event Type")]
    public string? EventType { get; set; }

    [Display(Name = "Estimated Budget"), DataType(DataType.Currency)]
    public decimal EstimatedBudget { get; set; }

    public string Status { get; set; } = "New";

    [DataType(DataType.MultilineText)]
    public string? Notes { get; set; }

    [Display(Name = "Created Date")]
    public DateTime CreatedDate { get; set; } = DateTime.Today;
}
