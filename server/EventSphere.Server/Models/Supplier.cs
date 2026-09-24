using System.ComponentModel.DataAnnotations;

namespace EventSphere.Server.Models;

public class Supplier : BaseEntity
{
    [Required]
    public string Name { get; set; } = string.Empty;

    public string Category { get; set; } = "Other";

    [Display(Name = "Contact Person")]
    public string? ContactPerson { get; set; }

    [EmailAddress]
    public string? Email { get; set; }

    [Phone]
    public string? Phone { get; set; }

    [Range(1, 5)]
    public int Rating { get; set; } = 3;

    public string? Notes { get; set; }

    public string? PackageName { get; set; }

    public string? PackageInclusions { get; set; }

    public decimal PackagePrice { get; set; }

    public ICollection<EventSupplier> EventSuppliers { get; set; } = new List<EventSupplier>();
}