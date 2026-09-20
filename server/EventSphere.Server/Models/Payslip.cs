using System.ComponentModel.DataAnnotations;

namespace EventSphere.Server.Models;

public class Payslip : BaseEntity
{
    [Display(Name = "Employee")]
    public int EmployeeId { get; set; }

    public int Month { get; set; }

    public int Year { get; set; }

    [Display(Name = "Period Start"), DataType(DataType.Date)]
    public DateTime PeriodStart { get; set; }

    [Display(Name = "Period End"), DataType(DataType.Date)]
    public DateTime PeriodEnd { get; set; }

    [Display(Name = "Days Worked")]
    public int DaysWorked { get; set; }

    public int Absents { get; set; }

    [Display(Name = "Daily Rate"), DataType(DataType.Currency)]
    public decimal DailyRate { get; set; }

    [Display(Name = "Gross Pay"), DataType(DataType.Currency)]
    public decimal GrossPay { get; set; }

    [DataType(DataType.Currency)]
    public decimal Deductions { get; set; }

    [Display(Name = "Net Pay"), DataType(DataType.Currency)]
    public decimal NetPay { get; set; }

    public string Status { get; set; } = "Generated";

    [Display(Name = "Generated")]
    public DateTime GeneratedAt { get; set; } = DateTime.UtcNow;

    public Employee? Employee { get; set; }
}