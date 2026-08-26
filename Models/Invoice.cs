using System.ComponentModel.DataAnnotations;

namespace EventSphere.Web.Models;

public class Invoice
{
    public int Id { get; set; }

    [Display(Name = "Event")]
    public int? EventId { get; set; }

    [Display(Name = "Client")]
    public int ClientId { get; set; }

    [Display(Name = "Invoice #")]
    public string InvoiceNumber { get; set; } = string.Empty;

    [Display(Name = "Issue Date"), DataType(DataType.Date)]
    public DateTime IssueDate { get; set; } = DateTime.Today;

    [Display(Name = "Due Date"), DataType(DataType.Date)]
    public DateTime DueDate { get; set; } = DateTime.Today.AddDays(30);

    [DataType(DataType.Currency)]
    public decimal Amount { get; set; }

    [Display(Name = "Paid Amount"), DataType(DataType.Currency)]
    public decimal PaidAmount { get; set; }

    public string Status { get; set; } = "Pending";

    [DataType(DataType.MultilineText)]
    public string? Notes { get; set; }

    public Event? Event { get; set; }
    public Client? Client { get; set; }

    [Display(Name = "Balance")]
    public decimal Balance => Amount - PaidAmount;
}
