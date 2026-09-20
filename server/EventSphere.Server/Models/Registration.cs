using System.ComponentModel.DataAnnotations;

namespace EventSphere.Server.Models;

public class Registration : BaseEntity
{
    [Required, Display(Name = "Full Name")]
    public string FullName { get; set; } = string.Empty;

    [EmailAddress]
    public string? Email { get; set; }

    [Phone]
    public string? Phone { get; set; }

    [Display(Name = "Client")]
    public int ClientId { get; set; }

    public Client? Client { get; set; }

    [Display(Name = "Event")]
    public int EventId { get; set; }

    public Event? Event { get; set; }

    [Display(Name = "Payment Method")]
    public string PaymentMethod { get; set; } = "GCash";

    [Display(Name = "Reference Number")]
    public string? ReferenceNumber { get; set; }

    [Display(Name = "Payer Name")]
    public string? PayerName { get; set; }

    [Display(Name = "Evidence Path")]
    public string? EvidencePath { get; set; }

    [Display(Name = "Evidence Hash")]
    public string? EvidenceHash { get; set; }

    [DataType(DataType.Currency)]
    public decimal Amount { get; set; }

    public string Status { get; set; } = "Pending";

    [Display(Name = "Ticket Reference")]
    public string TicketReference { get; set; } = string.Empty;
}