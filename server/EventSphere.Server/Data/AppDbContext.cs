using EventSphere.Server.Models;
using Microsoft.EntityFrameworkCore;

namespace EventSphere.Server.Data;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

    public DbSet<Client> Clients => Set<Client>();
    public DbSet<Lead> Leads => Set<Lead>();
    public DbSet<Event> Events => Set<Event>();
    public DbSet<Venue> Venues => Set<Venue>();
    public DbSet<Employee> Employees => Set<Employee>();
    public DbSet<EmployeeAssignment> EmployeeAssignments => Set<EmployeeAssignment>();
    public DbSet<Supplier> Suppliers => Set<Supplier>();
    public DbSet<EventSupplier> EventSuppliers => Set<EventSupplier>();
    public DbSet<Budget> Budgets => Set<Budget>();
    public DbSet<BudgetItem> BudgetItems => Set<BudgetItem>();
    public DbSet<Invoice> Invoices => Set<Invoice>();
    public DbSet<Payment> Payments => Set<Payment>();
    public DbSet<Registration> Registrations => Set<Registration>();
    public DbSet<SupplierPayment> SupplierPayments => Set<SupplierPayment>();
    public DbSet<ReportSchedule> ReportSchedules => Set<ReportSchedule>();
    public DbSet<User> Users => Set<User>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<Event>(e =>
        {
            e.Property(x => x.EventType).HasMaxLength(64);
            e.Property(x => x.Status).HasMaxLength(32);
            e.Property(x => x.Name).HasMaxLength(200);
            e.Property(x => x.AccessType).HasMaxLength(32);
        });

        modelBuilder.Entity<Client>(c =>
        {
            c.Property(x => x.CompanyName).HasMaxLength(200);
            c.Property(x => x.ClientType).HasMaxLength(32);
            c.Property(x => x.Status).HasMaxLength(32);
        });

        modelBuilder.Entity<Lead>(l =>
        {
            l.Property(x => x.CompanyName).HasMaxLength(200);
            l.Property(x => x.Status).HasMaxLength(32);
            l.Property(x => x.EstimatedBudget).HasPrecision(18, 2);
        });

        modelBuilder.Entity<Venue>(v =>
        {
            v.Property(x => x.Name).HasMaxLength(200);
            v.Property(x => x.PricePerDay).HasPrecision(18, 2);
            v.Property(x => x.Status).HasMaxLength(32);
        });

        modelBuilder.Entity<Employee>(e =>
        {
            e.Property(x => x.FirstName).HasMaxLength(100);
            e.Property(x => x.LastName).HasMaxLength(100);
            e.Property(x => x.Role).HasMaxLength(64);
            e.Property(x => x.Status).HasMaxLength(32);
            e.Property(x => x.Salary).HasPrecision(18, 2);
        });

        modelBuilder.Entity<EmployeeAssignment>(a =>
        {
            a.Property(x => x.Status).HasMaxLength(32);
            a.Property(x => x.Hours).HasPrecision(18, 2);
            a.HasOne(x => x.Event).WithMany(x => x.Assignments).HasForeignKey(x => x.EventId);
            a.HasOne(x => x.Employee).WithMany(x => x.Assignments).HasForeignKey(x => x.EmployeeId);
        });

        modelBuilder.Entity<Supplier>(s =>
        {
            s.Property(x => x.Name).HasMaxLength(200);
            s.Property(x => x.Category).HasMaxLength(64);
        });

        modelBuilder.Entity<EventSupplier>(es =>
        {
            es.Property(x => x.Status).HasMaxLength(32);
            es.Property(x => x.Cost).HasPrecision(18, 2);
            es.HasOne(x => x.Event).WithMany(x => x.Suppliers).HasForeignKey(x => x.EventId);
            es.HasOne(x => x.Supplier).WithMany(x => x.EventSuppliers).HasForeignKey(x => x.SupplierId);
        });

        modelBuilder.Entity<Budget>(b =>
        {
            b.Property(x => x.Category).HasMaxLength(64);
            b.Property(x => x.PlannedAmount).HasPrecision(18, 2);
            b.Property(x => x.ActualAmount).HasPrecision(18, 2);
            b.HasOne(x => x.Event).WithMany(x => x.Budgets).HasForeignKey(x => x.EventId);
        });

        modelBuilder.Entity<BudgetItem>(bi =>
        {
            bi.Property(x => x.Name).HasMaxLength(200);
            bi.Property(x => x.PlannedAmount).HasPrecision(18, 2);
            bi.Property(x => x.ActualAmount).HasPrecision(18, 2);
            bi.HasOne(x => x.Budget).WithMany(x => x.Items).HasForeignKey(x => x.BudgetId);
        });

        modelBuilder.Entity<Invoice>(i =>
        {
            i.Property(x => x.InvoiceNumber).HasMaxLength(32);
            i.Property(x => x.Status).HasMaxLength(32);
            i.Property(x => x.Amount).HasPrecision(18, 2);
            i.Property(x => x.PaidAmount).HasPrecision(18, 2);
            i.HasOne(x => x.Client).WithMany(x => x.Invoices).HasForeignKey(x => x.ClientId);
            i.HasOne(x => x.Event).WithMany(x => x.Invoices).HasForeignKey(x => x.EventId);
        });

        modelBuilder.Entity<Payment>(p =>
        {
            p.Property(x => x.Method).HasMaxLength(32);
            p.Property(x => x.Amount).HasPrecision(18, 2);
            p.Property(x => x.EvidencePath).HasMaxLength(500);
            p.HasOne(x => x.Invoice).WithMany(x => x.Payments).HasForeignKey(x => x.InvoiceId);
        });

        modelBuilder.Entity<User>(u =>
        {
            u.Property(x => x.Email).HasMaxLength(200);
            u.Property(x => x.FullName).HasMaxLength(200);
            u.Property(x => x.PasswordHash).HasMaxLength(400);
            u.Property(x => x.Role).HasMaxLength(32);
            u.HasIndex(x => x.Email).IsUnique();
        });

        modelBuilder.Entity<Registration>(r =>
        {
            r.Property(x => x.FullName).HasMaxLength(200);
            r.Property(x => x.Email).HasMaxLength(200);
            r.Property(x => x.Phone).HasMaxLength(32);
            r.Property(x => x.PaymentMethod).HasMaxLength(32);
            r.Property(x => x.ReferenceNumber).HasMaxLength(100);
            r.Property(x => x.PayerName).HasMaxLength(150);
            r.Property(x => x.EvidencePath).HasMaxLength(500);
            r.Property(x => x.EvidenceHash).HasMaxLength(64);
            r.Property(x => x.Amount).HasPrecision(18, 2);
            r.Property(x => x.Status).HasMaxLength(32);
            r.Property(x => x.TicketReference).HasMaxLength(32);
            r.HasOne(x => x.Client).WithMany().HasForeignKey(x => x.ClientId);
            r.HasOne(x => x.Event).WithMany().HasForeignKey(x => x.EventId);
        });

        modelBuilder.Entity<SupplierPayment>(sp =>
        {
            sp.Property(x => x.Description).HasMaxLength(300);
            sp.Property(x => x.PaymentMethod).HasMaxLength(32);
            sp.Property(x => x.ReferenceNumber).HasMaxLength(100);
            sp.Property(x => x.EvidencePath).HasMaxLength(500);
            sp.Property(x => x.EvidenceHash).HasMaxLength(64);
            sp.Property(x => x.Status).HasMaxLength(32);
            sp.Property(x => x.Amount).HasPrecision(18, 2);
            sp.HasOne(x => x.Supplier).WithMany().HasForeignKey(x => x.SupplierId);
            sp.HasOne(x => x.Event).WithMany().HasForeignKey(x => x.EventId);
        });

        modelBuilder.Entity<ReportSchedule>(rs =>
        {
            rs.Property(x => x.Name).HasMaxLength(200);
            rs.Property(x => x.ReportType).HasMaxLength(32);
            rs.Property(x => x.Frequency).HasMaxLength(32);
            rs.Property(x => x.Recipients).HasMaxLength(500);
        });
    }
}