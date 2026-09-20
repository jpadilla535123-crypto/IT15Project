using System.ComponentModel.DataAnnotations;

namespace EventSphere.Server.Models;

public class Payment : BaseEntity
{
    [Display(Name = "Invoice")]
    public int InvoiceId { get; set; }

    [Required, DataType(DataType.Currency), Range(0.01, double.MaxValue)]
    public decimal Amount { get; set; }

    [Display(Name = "Payment Date"), DataType(DataType.Date)]
    public DateTime PaymentDate { get; set; } = DateTime.Today;

    [Display(Name = "Payment Method")]
    public string Method { get; set; } = "Cash";

    public string? Reference { get; set; }

    [DataType(DataType.MultilineText)]
    public string? Notes { get; set; }

    [Display(Name = "Evidence")]
    public string? EvidencePath { get; set; }

    public Invoice? Invoice { get; set; }
}