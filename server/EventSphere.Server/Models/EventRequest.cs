using System.ComponentModel.DataAnnotations;

namespace EventSphere.Server.Models;

/* An event inquiry sent from the landing page's "Request a proposal" form.
   Kept separate from Lead so Lead Management holds only "Stay in the loop"
   newsletter subscribers. */
public class EventRequest : BaseEntity
{
    [Required, Display(Name = "Contact Name")]
    public string ContactName { get; set; } = string.Empty;

    [Required, EmailAddress]
    public string Email { get; set; } = string.Empty;

    [Phone]
    public string? Phone { get; set; }

    public string? Source { get; set; } = "Website";

    [Display(Name = "Event Type")]
    public string? EventType { get; set; }

    [Display(Name = "Target Date"), DataType(DataType.Date)]
    public DateTime? TargetDate { get; set; }

    public int? Guests { get; set; }

    public string Status { get; set; } = "Pending";

    [DataType(DataType.MultilineText)]
    public string? Notes { get; set; }

    [Display(Name = "Created Date")]
    public DateTime CreatedDate { get; set; } = DateTime.Today;
}