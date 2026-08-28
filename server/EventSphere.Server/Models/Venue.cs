using System.ComponentModel.DataAnnotations;

namespace EventSphere.Server.Models;

public class Venue : BaseEntity
{
    [Required]
    public string Name { get; set; } = string.Empty;

    public string? Address { get; set; }

    public string? City { get; set; }

    [Display(Name = "Capacity")]
    public int Capacity { get; set; }

    [Display(Name = "Price / Day"), DataType(DataType.Currency)]
    public decimal PricePerDay { get; set; }

    [Display(Name = "Contact Person")]
    public string? ContactPerson { get; set; }

    [Phone]
    public string? Phone { get; set; }

    [EmailAddress]
    public string? Email { get; set; }

    public string? Description { get; set; }

    public ICollection<Event> Events { get; set; } = new List<Event>();
}