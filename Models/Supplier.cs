using System.ComponentModel.DataAnnotations;

namespace EventSphere.Web.Models;

public class Supplier
{
    public int Id { get; set; }

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
}
