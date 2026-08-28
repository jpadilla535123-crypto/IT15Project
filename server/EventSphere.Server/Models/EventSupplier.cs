using System.ComponentModel.DataAnnotations;

namespace EventSphere.Server.Models;

public class EventSupplier : BaseEntity
{
    [Display(Name = "Event")]
    public int EventId { get; set; }

    [Display(Name = "Supplier")]
    public int SupplierId { get; set; }

    [Display(Name = "Service Type")]
    public string? ServiceType { get; set; }

    [Display(Name = "Cost"), DataType(DataType.Currency)]
    public decimal Cost { get; set; }

    public string Status { get; set; } = "Booked";

    public Event? Event { get; set; }

    public Supplier? Supplier { get; set; }
}