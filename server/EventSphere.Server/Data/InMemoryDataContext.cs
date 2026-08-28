using EventSphere.Server.Models;

namespace EventSphere.Server.Data;

/// <summary>
/// In-memory data store. No database yet.
/// Data resets every time the server restarts.
/// Swap this out for a real database (e.g. EF Core + SQL Server/SQLite) later.
/// </summary>
public class InMemoryDataContext
{
    private readonly object _lock = new();

    public List<Client> Clients { get; set; } = new();
    public List<Lead> Leads { get; set; } = new();
    public List<Event> Events { get; set; } = new();
    public List<Venue> Venues { get; set; } = new();
    public List<Employee> Employees { get; set; } = new();
    public List<EmployeeAssignment> EmployeeAssignments { get; set; } = new();
    public List<Supplier> Suppliers { get; set; } = new();
    public List<EventSupplier> EventSuppliers { get; set; } = new();
    public List<Budget> Budgets { get; set; } = new();
    public List<BudgetItem> BudgetItems { get; set; } = new();
    public List<Invoice> Invoices { get; set; } = new();
    public List<Payment> Payments { get; set; } = new();

    public int NextId<T>(IEnumerable<T> items) where T : BaseEntity
    {
        lock (_lock)
        {
            return items.Count() == 0 ? 1 : items.Max(x => x.Id) + 1;
        }
    }
}