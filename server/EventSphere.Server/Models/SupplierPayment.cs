using System.ComponentModel.DataAnnotations;

namespace EventSphere.Server.Models;

public class SupplierPayment : BaseEntity
{
    [Display(Name = "Supplier")]
    public int SupplierId { get; set; }

    public Supplier? Supplier { get; set; }

    [Display(Name = "Event")]
    public int? EventId { get; set; }

    public Event? Event { get; set; }

    [Required, Display(Name = "Description")]
    public string Description { get; set; } = string.Empty;

    [Required, DataType(DataType.Currency), Range(0.01, double.MaxValue)]
    public decimal Amount { get; set; }

    [Display(Name = "Payment Method")]
    public string PaymentMethod { get; set; } = "Bank Transfer";

    [Display(Name = "Reference Number")]
    public string? ReferenceNumber { get; set; }

    [Display(Name = "Evidence")]
    public string? EvidencePath { get; set; }

    [Display(Name = "Evidence Hash")]
    public string? EvidenceHash { get; set; }

    public string Status { get; set; } = "Paid";

    [Display(Name = "Payment Date"), DataType(DataType.Date)]
    public DateTime PaymentDate { get; set; } = DateTime.Today;
}