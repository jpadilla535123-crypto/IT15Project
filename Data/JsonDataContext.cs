using System.Collections;
using System.Collections.Concurrent;
using System.Reflection;
using System.Text.Json;
using EventSphere.Web.Models;

namespace EventSphere.Web.Data;

public class JsonDataContext
{
    public List<Client> Clients { get; set; } = new();
    public List<Event> Events { get; set; } = new();
    public List<Venue> Venues { get; set; } = new();
    public List<Supplier> Suppliers { get; set; } = new();
    public List<Employee> Employees { get; set; } = new();
    public List<EventAssignment> EventAssignments { get; set; } = new();
    public List<Budget> Budgets { get; set; } = new();
    public List<Invoice> Invoices { get; set; } = new();
    public List<Lead> Leads { get; set; } = new();

    private static readonly string DataFilePath =
        Path.Combine(AppContext.BaseDirectory, "eventsphere-data.json");

    private static readonly object _lock = new();
    private static bool _loaded;

    public JsonDataContext()
    {
        if (!_loaded)
            Load();
    }

    private void Load()
    {
        lock (_lock)
        {
            if (_loaded) return;

            if (File.Exists(DataFilePath))
            {
                try
                {
                    var json = File.ReadAllText(DataFilePath);
                    var data = JsonSerializer.Deserialize<StoredState>(json,
                        new JsonSerializerOptions { PropertyNameCaseInsensitive = true });
                    if (data != null)
                    {
                        Clients = data.Clients ?? new();
                        Events = data.Events ?? new();
                        Venues = data.Venues ?? new();
                        Suppliers = data.Suppliers ?? new();
                        Employees = data.Employees ?? new();
                        EventAssignments = data.EventAssignments ?? new();
                        Budgets = data.Budgets ?? new();
                        Invoices = data.Invoices ?? new();
                        Leads = data.Leads ?? new();
                    }
                }
                catch { Seed(); }
            }
            else
            {
                Seed();
            }

            WireNavigationProperties();
            _loaded = true;
        }
    }

    public void Save()
    {
        lock (_lock)
        {
            WireNavigationProperties();

            var state = new StoredState
            {
                Clients = Clients,
                Events = Events,
                Venues = Venues,
                Suppliers = Suppliers,
                Employees = Employees,
                EventAssignments = EventAssignments,
                Budgets = Budgets,
                Invoices = Invoices,
                Leads = Leads
            };

            var json = JsonSerializer.Serialize(state, new JsonSerializerOptions
            {
                WriteIndented = true
            });
            File.WriteAllText(DataFilePath, json);
        }
    }

    public int GetNextId<T>() where T : class
    {
        var list = GetList<T>();
        if (list == null) return 1;

        var maxId = 0;
        foreach (var item in list)
        {
            if (item is IIdentifiable ident && ident.Id > maxId)
                maxId = ident.Id;
        }
        return maxId + 1;
    }

    public void Add<T>(T entity) where T : class
    {
        if (entity is IIdentifiable ident && ident.Id == 0)
            ident.Id = GetNextId<T>();

        var list = GetList<T>();
        list?.Add(entity);
    }

    public void Update<T>(T entity) where T : class
    {
        if (entity is IIdentifiable ident)
        {
            var list = GetList<T>();
            if (list == null) return;

            for (int i = 0; i < list.Count; i++)
            {
                if (list[i] is IIdentifiable existing && existing.Id == ident.Id)
                {
                    list[i] = entity;
                    return;
                }
            }
        }
    }

    public void Remove<T>(T entity) where T : class
    {
        var list = GetList<T>();
        list?.Remove(entity);
    }

    public void RemoveRange<T>(IEnumerable<T> entities) where T : class
    {
        var list = GetList<T>();
        if (list == null) return;
        foreach (var entity in entities)
            list.Remove(entity);
    }

    public Task<int> SaveChangesAsync()
    {
        Save();
        return Task.FromResult(0);
    }

    // --- Navigation wiring ---

    private void WireNavigationProperties()
    {
        var clientById = Clients.ToDictionary(c => c.Id);
        var venueById = Venues.ToDictionary(v => v.Id);
        var eventById = Events.ToDictionary(e => e.Id);
        var employeeById = Employees.ToDictionary(e => e.Id);

        foreach (var evt in Events)
        {
            evt.Client = evt.ClientId.HasValue && clientById.TryGetValue(evt.ClientId.Value, out var c) ? c : null;
            evt.Venue = evt.VenueId.HasValue && venueById.TryGetValue(evt.VenueId.Value, out var v) ? v : null;

            evt.Assignments = EventAssignments.Where(a => a.EventId == evt.Id).ToList();
            evt.Budgets = Budgets.Where(b => b.EventId == evt.Id).ToList();
            evt.Invoices = Invoices.Where(i => i.EventId == evt.Id).ToList();
        }

        foreach (var a in EventAssignments)
        {
            a.Event = eventById.TryGetValue(a.EventId, out var ev) ? ev : null;
            a.Employee = employeeById.TryGetValue(a.EmployeeId, out var em) ? em : null;
        }

        foreach (var b in Budgets)
            b.Event = eventById.TryGetValue(b.EventId, out var be) ? be : null;

        foreach (var inv in Invoices)
        {
            inv.Event = inv.EventId.HasValue && eventById.TryGetValue(inv.EventId.Value, out var ie) ? ie : null;
            inv.Client = clientById.TryGetValue(inv.ClientId, out var ic) ? ic : null;
        }

        foreach (var emp in Employees)
            emp.Assignments = EventAssignments.Where(a => a.EmployeeId == emp.Id).ToList();

        foreach (var client in Clients)
        {
            client.Events = Events.Where(e => e.ClientId == client.Id).ToList();
            client.Invoices = Invoices.Where(i => i.ClientId == client.Id).ToList();
        }

        foreach (var venue in Venues)
            venue.Events = Events.Where(e => e.VenueId == venue.Id).ToList();
    }

    // --- Seed data (moved from ApplicationDbContext) ---

    private void Seed()
    {
        var today = DateTime.Today;

        Clients = new List<Client>
        {
            new Client { Id = 1, CompanyName = "Acme Corporation", ContactPerson = "John Reyes", Email = "john@acme.com", Phone = "+63 917 555 0101", Address = "Ayala Ave, Makati", ClientType = "Corporate", Status = "Booked", DateOfInquiry = today.AddMonths(-8) },
            new Client { Id = 2, CompanyName = "BlueSky Tech", ContactPerson = "Maria Santos", Email = "maria@bluesky.tech", Phone = "+63 918 555 0102", Address = "BGC, Taguig", ClientType = "Corporate", Status = "Completed", DateOfInquiry = today.AddMonths(-6) },
            new Client { Id = 3, CompanyName = "Luna Events Co.", ContactPerson = "Ana Dela Cruz", Email = "ana@lunaevents.ph", Phone = "+63 919 555 0103", Address = "Quezon City", ClientType = "Corporate", Status = "New", DateOfInquiry = today.AddMonths(-4) },
            new Client { Id = 4, CompanyName = "Garcia Family", ContactPerson = "Miguel Garcia", Email = "miguel.garcia@gmail.com", Phone = "+63 920 555 0104", Address = "Muntinlupa", ClientType = "Private", Status = "Cancelled", DateOfInquiry = today.AddMonths(-2) },
            new Client { Id = 5, CompanyName = "Heritage Bank PH", ContactPerson = "Grace Lim", Email = "grace@heritagebank.ph", Phone = "+63 921 555 0105", Address = "Ortigas, Pasig", ClientType = "Corporate", Status = "New", DateOfInquiry = today.AddMonths(-1) },
        };

        Venues = new List<Venue>
        {
            new Venue { Id = 1, Name = "Grand Ballroom Manila", Address = "Roxas Blvd, Pasay", City = "Pasay", Capacity = 500, PricePerDay = 120000m, ContactPerson = "Ricky Tan", Phone = "+63 922 555 0201", Email = "events@grandballroom.com", Description = "Elegant ballroom with chandeliers and full catering kitchen." },
            new Venue { Id = 2, Name = "Sky Garden Events Place", Address = "BGC, Taguig", City = "Taguig", Capacity = 300, PricePerDay = 85000m, ContactPerson = "Bella Cruz", Phone = "+63 923 555 0202", Email = "book@skygarden.ph", Description = "Rooftop garden venue with city skyline views." },
            new Venue { Id = 3, Name = "Heritage Convention Center", Address = "Ortigas, Pasig", City = "Pasig", Capacity = 800, PricePerDay = 200000m, ContactPerson = "Marco Villanueva", Phone = "+63 924 555 0203", Email = "sales@heritagecc.ph", Description = "Large conference center with breakout rooms." },
            new Venue { Id = 4, Name = "Sunset Beach Resort", Address = "Nasugbu, Batangas", City = "Batangas", Capacity = 250, PricePerDay = 95000m, ContactPerson = "Carla Mendoza", Phone = "+63 925 555 0204", Email = "reservations@sunsetresort.ph", Description = "Beachfront resort ideal for corporate retreats." },
            new Venue { Id = 5, Name = "The Loft at 88", Address = "Greenhills, San Juan", City = "San Juan", Capacity = 150, PricePerDay = 60000m, ContactPerson = "Paolo Ramirez", Phone = "+63 926 555 0205", Email = "hello@loft88.ph", Description = "Industrial-style loft for intimate events." },
        };

        Employees = new List<Employee>
        {
            new Employee { Id = 1, FirstName = "Daniel", LastName = "Rivera", Role = "Event Manager", Email = "daniel.rivera@eventsphere.ph", Phone = "+63 927 555 0301", Salary = 45000m, HireDate = today.AddMonths(-30), Status = "Active" },
            new Employee { Id = 2, FirstName = "Sophia", LastName = "Mercado", Role = "Event Coordinator", Email = "sophia.mercado@eventsphere.ph", Phone = "+63 928 555 0302", Salary = 35000m, HireDate = today.AddMonths(-20), Status = "Active" },
            new Employee { Id = 3, FirstName = "James", LastName = "Tolentino", Role = "Audio-Visual Technician", Email = "james.tolentino@eventsphere.ph", Phone = "+63 929 555 0303", Salary = 28000m, HireDate = today.AddMonths(-14), Status = "Active" },
            new Employee { Id = 4, FirstName = "Ella", LastName = "Bautista", Role = "Designer", Email = "ella.bautista@eventsphere.ph", Phone = "+63 930 555 0304", Salary = 30000m, HireDate = today.AddMonths(-10), Status = "Active" },
            new Employee { Id = 5, FirstName = "Nathan", LastName = "Lopez", Role = "Operations Staff", Email = "nathan.lopez@eventsphere.ph", Phone = "+63 931 555 0305", Salary = 22000m, HireDate = today.AddMonths(-6), Status = "Active" },
            new Employee { Id = 6, FirstName = "Isabella", LastName = "Castro", Role = "Account Manager", Email = "isabella.castro@eventsphere.ph", Phone = "+63 932 555 0306", Salary = 40000m, HireDate = today.AddMonths(-8), Status = "Active" },
        };

        Suppliers = new List<Supplier>
        {
            new Supplier { Id = 1, Name = "Taste & Catering PH", Category = "Catering", ContactPerson = "Chef Ramon", Email = "catering@tasteph.com", Phone = "+63 933 555 0401", Rating = 5, Notes = "Full-service catering, in-house kitchen." },
            new Supplier { Id = 2, Name = "Bloom & Petal Florals", Category = "Decor", ContactPerson = "Liza Flores", Email = "liza@bloompetal.ph", Phone = "+63 934 555 0402", Rating = 4, Notes = "Floral arrangements and table styling." },
            new Supplier { Id = 3, Name = "StageSound Solutions", Category = "Audio-Visual", ContactPerson = "Ben Ocampo", Email = "ben@stagesound.com", Phone = "+63 935 555 0403", Rating = 5, Notes = "Lighting, sound systems, LED walls." },
            new Supplier { Id = 4, Name = "Shutter Story Photography", Category = "Photography", ContactPerson = "Mia Navarro", Email = "hello@shutterstory.ph", Phone = "+63 936 555 0404", Rating = 4, Notes = "Photography and videography packages." },
            new Supplier { Id = 5, Name = "GrooveLine Entertainment", Category = "Entertainment", ContactPerson = "DJ Marco", Email = "book@grooveline.ph", Phone = "+63 937 555 0405", Rating = 3, Notes = "Live bands, DJs, and emcees." },
            new Supplier { Id = 6, Name = "AceRide Transport", Category = "Transport", ContactPerson = "Jun Acebedo", Email = "rides@aceride.com", Phone = "+63 938 555 0406", Rating = 4, Notes = "Shuttle vans and luxury coaches." },
        };

        Events = new List<Event>
        {
            new Event { Id = 1, Name = "Acme Annual Product Launch", EventType = "Product Launch", Status = "Completed", ClientId = 1, VenueId = 1, StartDate = today.AddMonths(-3).AddDays(-5), EndDate = today.AddMonths(-3).AddDays(-4), Description = "Launch event for Acme's new product line with press coverage." },
            new Event { Id = 2, Name = "BlueSky Tech Summit 2026", EventType = "Conference", Status = "Completed", ClientId = 2, VenueId = 3, StartDate = today.AddMonths(-1).AddDays(-10), EndDate = today.AddMonths(-1).AddDays(-9), Description = "Two-day technology conference with breakout sessions." },
            new Event { Id = 3, Name = "Luna Events Gala Night", EventType = "Gala Dinner", Status = "Pending", ClientId = 3, VenueId = 2, StartDate = today.AddDays(-1), EndDate = today.AddDays(0), Description = "Charity gala dinner with auction and live entertainment." },
            new Event { Id = 4, Name = "Garcia Wedding", EventType = "Wedding", Status = "Pending", ClientId = 4, VenueId = 4, StartDate = today.AddMonths(1).AddDays(10), EndDate = today.AddMonths(1).AddDays(10), Description = "Beach wedding ceremony and reception." },
            new Event { Id = 5, Name = "Heritage Bank Customer Appreciation", EventType = "Corporate Party", Status = "Pending", ClientId = 5, VenueId = 2, StartDate = today.AddMonths(2).AddDays(5), EndDate = today.AddMonths(2).AddDays(5), Description = "Evening party to thank top corporate clients." },
        };

        EventAssignments = new List<EventAssignment>
        {
            new EventAssignment { Id = 1, EventId = 1, EmployeeId = 1, Role = "Lead Manager", AssignedDate = today.AddMonths(-3), Hours = 60m, Status = "Completed" },
            new EventAssignment { Id = 2, EventId = 1, EmployeeId = 2, Role = "Coordinator", AssignedDate = today.AddMonths(-3), Hours = 80m, Status = "Completed" },
            new EventAssignment { Id = 3, EventId = 2, EmployeeId = 1, Role = "Lead Manager", AssignedDate = today.AddMonths(-1), Hours = 50m, Status = "Completed" },
            new EventAssignment { Id = 4, EventId = 2, EmployeeId = 3, Role = "AV Technician", AssignedDate = today.AddMonths(-1), Hours = 30m, Status = "Completed" },
            new EventAssignment { Id = 5, EventId = 3, EmployeeId = 2, Role = "Coordinator", AssignedDate = today.AddDays(-7), Hours = 40m, Status = "In Progress" },
            new EventAssignment { Id = 6, EventId = 3, EmployeeId = 4, Role = "Designer", AssignedDate = today.AddDays(-5), Hours = 25m, Status = "In Progress" },
            new EventAssignment { Id = 7, EventId = 4, EmployeeId = 6, Role = "Account Manager", AssignedDate = today.AddDays(-3), Hours = 20m, Status = "Assigned" },
            new EventAssignment { Id = 8, EventId = 4, EmployeeId = 4, Role = "Designer", AssignedDate = today.AddDays(-2), Hours = 15m, Status = "Assigned" },
            new EventAssignment { Id = 9, EventId = 5, EmployeeId = 6, Role = "Account Manager", AssignedDate = today.AddDays(-1), Hours = 10m, Status = "Assigned" },
        };

        Budgets = new List<Budget>
        {
            new Budget { Id = 1, EventId = 1, Category = "Venue", PlannedAmount = 240000m, ActualAmount = 240000m },
            new Budget { Id = 2, EventId = 1, Category = "Catering", PlannedAmount = 180000m, ActualAmount = 185000m, Notes = "Slight overage on upgraded menu." },
            new Budget { Id = 3, EventId = 1, Category = "AV & Production", PlannedAmount = 150000m, ActualAmount = 140000m },
            new Budget { Id = 4, EventId = 2, Category = "Venue", PlannedAmount = 400000m, ActualAmount = 400000m },
            new Budget { Id = 5, EventId = 2, Category = "Catering", PlannedAmount = 300000m, ActualAmount = 295000m },
            new Budget { Id = 6, EventId = 3, Category = "Venue", PlannedAmount = 85000m, ActualAmount = 85000m },
            new Budget { Id = 7, EventId = 3, Category = "Entertainment", PlannedAmount = 60000m, ActualAmount = 55000m },
            new Budget { Id = 8, EventId = 4, Category = "Venue", PlannedAmount = 95000m, ActualAmount = 0m },
            new Budget { Id = 9, EventId = 4, Category = "Catering", PlannedAmount = 120000m, ActualAmount = 0m },
            new Budget { Id = 10, EventId = 5, Category = "Venue", PlannedAmount = 85000m, ActualAmount = 0m },
            new Budget { Id = 11, EventId = 5, Category = "Catering", PlannedAmount = 100000m, ActualAmount = 0m },
        };

        Invoices = new List<Invoice>
        {
            new Invoice { Id = 1, EventId = 1, ClientId = 1, InvoiceNumber = "INV-2026-001", IssueDate = today.AddMonths(-2).AddDays(-15), DueDate = today.AddMonths(-1).AddDays(-15), Amount = 750000m, PaidAmount = 750000m, Status = "Paid", Notes = "Full payment received for Acme product launch." },
            new Invoice { Id = 2, EventId = 2, ClientId = 2, InvoiceNumber = "INV-2026-002", IssueDate = today.AddMonths(-1).AddDays(-5), DueDate = today.AddDays(20), Amount = 980000m, PaidAmount = 500000m, Status = "Partial", Notes = "Deposit paid, balance due on completion." },
            new Invoice { Id = 3, EventId = 3, ClientId = 3, InvoiceNumber = "INV-2026-003", IssueDate = today.AddDays(-10), DueDate = today.AddDays(20), Amount = 220000m, PaidAmount = 100000m, Status = "Partial", Notes = "Advance paid for gala night." },
            new Invoice { Id = 4, EventId = 4, ClientId = 4, InvoiceNumber = "INV-2026-004", IssueDate = today.AddDays(-5), DueDate = today.AddDays(25), Amount = 350000m, PaidAmount = 0m, Status = "Pending", Notes = "Wedding package, deposit due soon." },
            new Invoice { Id = 5, EventId = 5, ClientId = 5, InvoiceNumber = "INV-2026-005", IssueDate = today.AddDays(-1), DueDate = today.AddDays(29), Amount = 300000m, PaidAmount = 0m, Status = "Pending", Notes = "Quote accepted, awaiting deposit." },
        };

        Leads = new List<Lead>
        {
            new Lead { Id = 1, CompanyName = "Novacorp Retail", ContactName = "Kevin Tan", Email = "kevin@novacorp.ph", Phone = "+63 939 555 0501", Source = "Website", EventType = "Store Opening", EstimatedBudget = 400000m, Status = "New", Notes = "Interested in grand opening event for new flagship store.", CreatedDate = today.AddDays(-1) },
            new Lead { Id = 2, CompanyName = "GreenFuture Inc.", ContactName = "Rose Dizon", Email = "rose@greenfuture.org", Phone = "+63 940 555 0502", Source = "Referral", EventType = "Conference", EstimatedBudget = 600000m, Status = "Contacted", Notes = "Annual sustainability conference, ~300 attendees.", CreatedDate = today.AddDays(-6) },
            new Lead { Id = 3, CompanyName = "SmartPay PH", ContactName = "Alex Ramos", Email = "alex@smartpay.ph", Phone = "+63 941 555 0503", Source = "LinkedIn", EventType = "Team Building", EstimatedBudget = 250000m, Status = "Qualified", Notes = "Looking at beach team building for Q3.", CreatedDate = today.AddDays(-12) },
            new Lead { Id = 4, CompanyName = "Golden Age Senior Home", ContactName = "Lorna Santiago", Email = "lorna@goldenage.ph", Phone = "+63 942 555 0504", Source = "Walk-in", EventType = "Anniversary", EstimatedBudget = 150000m, Status = "Qualified", Notes = "10th anniversary celebration, ~100 guests.", CreatedDate = today.AddDays(-18) },
            new Lead { Id = 5, CompanyName = "Fusion Coffee Co.", ContactName = "Bianca Uy", Email = "bianca@fusioncoffee.ph", Phone = "+63 943 555 0505", Source = "Website", EventType = "Product Launch", EstimatedBudget = 180000m, Status = "Converted", Notes = "Converted to client - contract signed.", CreatedDate = today.AddDays(-25) },
            new Lead { Id = 6, CompanyName = "Metro School Foundation", ContactName = "Ronald Pascual", Email = "r.pascual@metroschool.edu", Phone = "+63 944 555 0506", Source = "Referral", EventType = "Fundraiser", EstimatedBudget = 90000m, Status = "Lost", Notes = "Went with another vendor.", CreatedDate = today.AddDays(-40) },
        };
    }

    // --- Storage model ---

    private class StoredState
    {
        public List<Client> Clients { get; set; } = new();
        public List<Event> Events { get; set; } = new();
        public List<Venue> Venues { get; set; } = new();
        public List<Supplier> Suppliers { get; set; } = new();
        public List<Employee> Employees { get; set; } = new();
        public List<EventAssignment> EventAssignments { get; set; } = new();
        public List<Budget> Budgets { get; set; } = new();
        public List<Invoice> Invoices { get; set; } = new();
        public List<Lead> Leads { get; set; } = new();
    }

    // --- Interface for auto-increment IDs ---

    public interface IIdentifiable
    {
        int Id { get; set; }
    }

    // --- Generic list accessor ---

    private IList? GetList<T>() where T : class
    {
        return typeof(T) switch
        {
            Type t when t == typeof(Client) => Clients,
            Type t when t == typeof(Event) => Events,
            Type t when t == typeof(Venue) => Venues,
            Type t when t == typeof(Supplier) => Suppliers,
            Type t when t == typeof(Employee) => Employees,
            Type t when t == typeof(EventAssignment) => EventAssignments,
            Type t when t == typeof(Budget) => Budgets,
            Type t when t == typeof(Invoice) => Invoices,
            Type t when t == typeof(Lead) => Leads,
            _ => null
        };
    }
}
