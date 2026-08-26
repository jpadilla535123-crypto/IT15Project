using System.ComponentModel.DataAnnotations;

namespace EventSphere.Web.Models;

public class Client
{
    public int Id { get; set; }

    [Required, Display(Name = "Company Name")]
    public string CompanyName { get; set; } = string.Empty;

    [Display(Name = "Contact Person")]
    public string? ContactPerson { get; set; }

    [EmailAddress]
    public string? Email { get; set; }

    [Phone]
    public string? Phone { get; set; }

    public string? Address { get; set; }

    [Display(Name = "Client Type")]
    public string ClientType { get; set; } = "Corporate";

    public string Status { get; set; } = "Active";

    [Display(Name = "Date of Inquiry"), DataType(DataType.Date)]
    public DateTime DateOfInquiry { get; set; } = DateTime.Today;

    public ICollection<Event> Events { get; set; } = new List<Event>();
    public ICollection<Invoice> Invoices { get; set; } = new List<Invoice>();
}
