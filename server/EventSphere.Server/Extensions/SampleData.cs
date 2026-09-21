using EventSphere.Server.Data;
using EventSphere.Server.Models;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;

namespace EventSphere.Server.Extensions;

public static class SampleData
{
    private static readonly string Password = "EventSphere@2026";

    public static void Seed(AppDbContext db)
    {
        if (db.Clients.Any() && db.Users.Any())
        {
            SeedStaffHR(db);
            return;
        }

        var today = DateTime.Today;

        SeedUsers(db);

        if (db.Clients.Any())
        {
            SeedStaffHR(db);
            return;
        }

        var clients = new List<Client>
        {
            new Client { CompanyName = "Acme Corporation", ContactPerson = "John Reyes", Email = "john@acme.com", Phone = "+63 917 555 0101", Address = "Ayala Ave, Makati", ClientType = "Corporate", Status = "Booked", DateOfInquiry = today.AddMonths(-8) },
            new Client { CompanyName = "BlueSky Tech", ContactPerson = "Maria Santos", Email = "maria@bluesky.tech", Phone = "+63 918 555 0102", Address = "BGC, Taguig", ClientType = "Corporate", Status = "Completed", DateOfInquiry = today.AddMonths(-6) },
            new Client { CompanyName = "Luna Events Co.", ContactPerson = "Ana Dela Cruz", Email = "ana@lunaevents.ph", Phone = "+63 919 555 0103", Address = "Quezon City", ClientType = "Corporate", Status = "New", DateOfInquiry = today.AddMonths(-4) },
            new Client { CompanyName = "Garcia Family", ContactPerson = "Miguel Garcia", Email = "miguel.garcia@gmail.com", Phone = "+63 920 555 0104", Address = "Muntinlupa", ClientType = "Private", Status = "Cancelled", DateOfInquiry = today.AddMonths(-2) },
            new Client { CompanyName = "Heritage Bank PH", ContactPerson = "Grace Lim", Email = "grace@heritagebank.ph", Phone = "+63 921 555 0105", Address = "Ortigas, Pasig", ClientType = "Corporate", Status = "New", DateOfInquiry = today.AddMonths(-1) },
        };

        var venues = new List<Venue>
        {
            new Venue { Name = "Grand Ballroom Manila", Address = "Roxas Blvd, Pasay", City = "Pasay", Capacity = 500, PricePerDay = 120000m, ContactPerson = "Ricky Tan", Phone = "+63 922 555 0201", Email = "events@grandballroom.com", Description = "Elegant ballroom with chandeliers and full catering kitchen." },
            new Venue { Name = "Sky Garden Events Place", Address = "BGC, Taguig", City = "Taguig", Capacity = 300, PricePerDay = 85000m, ContactPerson = "Bella Cruz", Phone = "+63 923 555 0202", Email = "book@skygarden.ph", Description = "Rooftop garden venue with city skyline views." },
            new Venue { Name = "Heritage Convention Center", Address = "Ortigas, Pasig", City = "Pasig", Capacity = 800, PricePerDay = 200000m, ContactPerson = "Marco Villanueva", Phone = "+63 924 555 0203", Email = "sales@heritagecc.ph", Description = "Large conference center with breakout rooms." },
            new Venue { Name = "Sunset Beach Resort", Address = "Nasugbu, Batangas", City = "Batangas", Capacity = 250, PricePerDay = 95000m, ContactPerson = "Carla Mendoza", Phone = "+63 925 555 0204", Email = "reservations@sunsetresort.ph", Description = "Beachfront resort ideal for corporate retreats." },
            new Venue { Name = "The Loft at 88", Address = "Greenhills, San Juan", City = "San Juan", Capacity = 150, PricePerDay = 60000m, ContactPerson = "Paolo Ramirez", Phone = "+63 926 555 0205", Email = "hello@loft88.ph", Description = "Industrial-style loft for intimate events." },
        };

        var employees = new List<Employee>
        {
            new Employee { FirstName = "Daniel", LastName = "Rivera", Role = "Event Manager", Email = "daniel.rivera@eventsphere.ph", Phone = "+63 927 555 0301", Salary = 45000m, HireDate = today.AddMonths(-30), Status = "Active" },
            new Employee { FirstName = "Sophia", LastName = "Mercado", Role = "Event Coordinator", Email = "sophia.mercado@eventsphere.ph", Phone = "+63 928 555 0302", Salary = 35000m, HireDate = today.AddMonths(-20), Status = "Active" },
            new Employee { FirstName = "James", LastName = "Tolentino", Role = "Audio-Visual Technician", Email = "james.tolentino@eventsphere.ph", Phone = "+63 929 555 0303", Salary = 28000m, HireDate = today.AddMonths(-14), Status = "Active" },
            new Employee { FirstName = "Ella", LastName = "Bautista", Role = "Designer", Email = "ella.bautista@eventsphere.ph", Phone = "+63 930 555 0304", Salary = 30000m, HireDate = today.AddMonths(-10), Status = "Active" },
            new Employee { FirstName = "Nathan", LastName = "Lopez", Role = "Operations Staff", Email = "nathan.lopez@eventsphere.ph", Phone = "+63 931 555 0305", Salary = 22000m, HireDate = today.AddMonths(-6), Status = "Active" },
            new Employee { FirstName = "Isabella", LastName = "Castro", Role = "Account Manager", Email = "isabella.castro@eventsphere.ph", Phone = "+63 932 555 0306", Salary = 40000m, HireDate = today.AddMonths(-8), Status = "Active" },
        };

        var suppliers = new List<Supplier>
        {
            new Supplier { Name = "Taste & Catering PH", Category = "Catering", ContactPerson = "Chef Ramon", Email = "catering@tasteph.com", Phone = "+63 933 555 0401", Rating = 5, Notes = "Full-service catering, in-house kitchen." },
            new Supplier { Name = "Bloom & Petal Florals", Category = "Decor", ContactPerson = "Liza Flores", Email = "liza@bloompetal.ph", Phone = "+63 934 555 0402", Rating = 4, Notes = "Floral arrangements and table styling." },
            new Supplier { Name = "StageSound Solutions", Category = "Audio-Visual", ContactPerson = "Ben Ocampo", Email = "ben@stagesound.com", Phone = "+63 935 555 0403", Rating = 5, Notes = "Lighting, sound systems, LED walls." },
            new Supplier { Name = "Shutter Story Photography", Category = "Photography", ContactPerson = "Mia Navarro", Email = "hello@shutterstory.ph", Phone = "+63 936 555 0404", Rating = 4, Notes = "Photography and videography packages." },
            new Supplier { Name = "GrooveLine Entertainment", Category = "Entertainment", ContactPerson = "DJ Marco", Email = "book@grooveline.ph", Phone = "+63 937 555 0405", Rating = 3, Notes = "Live bands, DJs, and emcees." },
            new Supplier { Name = "AceRide Transport", Category = "Transport", ContactPerson = "Jun Acebedo", Email = "rides@aceride.com", Phone = "+63 938 555 0406", Rating = 4, Notes = "Shuttle vans and luxury coaches." },
        };

        db.AddRange(clients);
        db.AddRange(venues);
        db.AddRange(employees);
        db.AddRange(suppliers);
        db.SaveChanges();

        var events = new List<Event>
        {
            new Event { Name = "Acme Annual Product Launch", EventType = "Product Launch", Status = "Completed", Client = clients[0], Venue = venues[0], StartDate = today.AddMonths(-3).AddDays(-5), EndDate = today.AddMonths(-3).AddDays(-4), Description = "Launch event for Acme's new product line with press coverage." },
            new Event { Name = "BlueSky Tech Summit 2026", EventType = "Conference", Status = "Completed", Client = clients[1], Venue = venues[2], StartDate = today.AddMonths(-1).AddDays(-10), EndDate = today.AddMonths(-1).AddDays(-9), Description = "Two-day technology conference with breakout sessions." },
            new Event { Name = "Luna Events Gala Night", EventType = "Gala Dinner", Status = "Pending", Client = clients[2], Venue = venues[1], StartDate = today.AddDays(-1), EndDate = today.AddDays(0), Description = "Charity gala dinner with auction and live entertainment." },
            new Event { Name = "Garcia Wedding", EventType = "Wedding", Status = "Pending", Client = clients[3], Venue = venues[3], StartDate = today.AddMonths(1).AddDays(10), EndDate = today.AddMonths(1).AddDays(10), Description = "Beach wedding ceremony and reception." },
            new Event { Name = "Heritage Bank Customer Appreciation", EventType = "Corporate Party", Status = "Pending", AccessType = "Public", Client = clients[4], Venue = venues[1], StartDate = today.AddMonths(2).AddDays(5), EndDate = today.AddMonths(2).AddDays(5), Description = "Evening party to thank top corporate clients." },
        };

        db.AddRange(events);
        db.SaveChanges();

        var assignments = new List<EmployeeAssignment>
        {
            new EmployeeAssignment { Event = events[0], Employee = employees[0], Role = "Lead Manager", AssignedDate = today.AddMonths(-3), Hours = 60m, Status = "Completed" },
            new EmployeeAssignment { Event = events[0], Employee = employees[1], Role = "Coordinator", AssignedDate = today.AddMonths(-3), Hours = 80m, Status = "Completed" },
            new EmployeeAssignment { Event = events[1], Employee = employees[0], Role = "Lead Manager", AssignedDate = today.AddMonths(-1), Hours = 50m, Status = "Completed" },
            new EmployeeAssignment { Event = events[1], Employee = employees[2], Role = "AV Technician", AssignedDate = today.AddMonths(-1), Hours = 30m, Status = "Completed" },
            new EmployeeAssignment { Event = events[2], Employee = employees[1], Role = "Coordinator", AssignedDate = today.AddDays(-7), Hours = 40m, Status = "In Progress" },
            new EmployeeAssignment { Event = events[2], Employee = employees[3], Role = "Designer", AssignedDate = today.AddDays(-5), Hours = 25m, Status = "In Progress" },
            new EmployeeAssignment { Event = events[3], Employee = employees[5], Role = "Account Manager", AssignedDate = today.AddDays(-3), Hours = 20m, Status = "Assigned" },
            new EmployeeAssignment { Event = events[3], Employee = employees[3], Role = "Designer", AssignedDate = today.AddDays(-2), Hours = 15m, Status = "Assigned" },
            new EmployeeAssignment { Event = events[4], Employee = employees[5], Role = "Account Manager", AssignedDate = today.AddDays(-1), Hours = 10m, Status = "Assigned" },
        };

        db.AddRange(assignments);

        var budgets = new List<Budget>
        {
            new Budget { Event = events[0], Category = "Venue", PlannedAmount = 240000m, ActualAmount = 240000m },
            new Budget { Event = events[0], Category = "Catering", PlannedAmount = 180000m, ActualAmount = 185000m, Notes = "Slight overage on upgraded menu." },
            new Budget { Event = events[0], Category = "AV & Production", PlannedAmount = 150000m, ActualAmount = 140000m },
            new Budget { Event = events[1], Category = "Venue", PlannedAmount = 400000m, ActualAmount = 400000m },
            new Budget { Event = events[1], Category = "Catering", PlannedAmount = 300000m, ActualAmount = 295000m },
            new Budget { Event = events[2], Category = "Venue", PlannedAmount = 85000m, ActualAmount = 85000m },
            new Budget { Event = events[2], Category = "Entertainment", PlannedAmount = 60000m, ActualAmount = 55000m },
            new Budget { Event = events[3], Category = "Venue", PlannedAmount = 95000m, ActualAmount = 0m },
            new Budget { Event = events[3], Category = "Catering", PlannedAmount = 120000m, ActualAmount = 0m },
            new Budget { Event = events[4], Category = "Venue", PlannedAmount = 85000m, ActualAmount = 0m },
            new Budget { Event = events[4], Category = "Catering", PlannedAmount = 100000m, ActualAmount = 0m },
        };

        db.AddRange(budgets);

        var eventSuppliers = new List<EventSupplier>
        {
            new EventSupplier { Event = events[0], Supplier = suppliers[0], ServiceType = "Catering", Cost = 180000m, Status = "Completed" },
            new EventSupplier { Event = events[0], Supplier = suppliers[2], ServiceType = "Audio-Visual", Cost = 140000m, Status = "Completed" },
            new EventSupplier { Event = events[1], Supplier = suppliers[0], ServiceType = "Catering", Cost = 295000m, Status = "Completed" },
            new EventSupplier { Event = events[2], Supplier = suppliers[1], ServiceType = "Floral Decor", Cost = 45000m, Status = "Confirmed" },
            new EventSupplier { Event = events[2], Supplier = suppliers[4], ServiceType = "Entertainment", Cost = 55000m, Status = "Confirmed" },
            new EventSupplier { Event = events[3], Supplier = suppliers[0], ServiceType = "Catering", Cost = 120000m, Status = "Booked" },
            new EventSupplier { Event = events[3], Supplier = suppliers[3], ServiceType = "Photography", Cost = 40000m, Status = "Booked" },
            new EventSupplier { Event = events[4], Supplier = suppliers[4], ServiceType = "Entertainment", Cost = 60000m, Status = "Booked" },
        };

        db.AddRange(eventSuppliers);

        var invoices = new List<Invoice>
        {
            new Invoice { Event = events[0], Client = clients[0], InvoiceNumber = "INV-2026-001", IssueDate = today.AddMonths(-2).AddDays(-15), DueDate = today.AddMonths(-1).AddDays(-15), Amount = 750000m, PaidAmount = 750000m, Status = "Paid", Notes = "Full payment received for Acme product launch." },
            new Invoice { Event = events[1], Client = clients[1], InvoiceNumber = "INV-2026-002", IssueDate = today.AddMonths(-1).AddDays(-5), DueDate = today.AddDays(20), Amount = 980000m, PaidAmount = 500000m, Status = "Partial", Notes = "Deposit paid, balance due on completion." },
            new Invoice { Event = events[2], Client = clients[2], InvoiceNumber = "INV-2026-003", IssueDate = today.AddDays(-10), DueDate = today.AddDays(20), Amount = 220000m, PaidAmount = 100000m, Status = "Partial", Notes = "Advance paid for gala night." },
            new Invoice { Event = events[3], Client = clients[3], InvoiceNumber = "INV-2026-004", IssueDate = today.AddDays(-5), DueDate = today.AddDays(25), Amount = 350000m, PaidAmount = 0m, Status = "Pending", Notes = "Wedding package, deposit due soon." },
            new Invoice { Event = events[4], Client = clients[4], InvoiceNumber = "INV-2026-005", IssueDate = today.AddDays(-1), DueDate = today.AddDays(29), Amount = 300000m, PaidAmount = 0m, Status = "Pending", Notes = "Quote accepted, awaiting deposit." },
        };

        db.AddRange(invoices);
        db.SaveChanges();

        db.AddRange(new List<Payment>
        {
            new Payment { Invoice = invoices[0], Amount = 750000m, PaymentDate = today.AddMonths(-2).AddDays(-10), Method = "Bank Transfer", Reference = "TRF-000123", Notes = "Full settlement." },
            new Payment { Invoice = invoices[1], Amount = 500000m, PaymentDate = today.AddMonths(-1).AddDays(-3), Method = "Bank Transfer", Reference = "TRF-000456", Notes = "Deposit." },
            new Payment { Invoice = invoices[2], Amount = 100000m, PaymentDate = today.AddDays(-8), Method = "Check", Reference = "CHK-00987", Notes = "Advance payment." },
        });

        db.AddRange(new List<Lead>
        {
            new Lead { CompanyName = "Novacorp Retail", ContactName = "Kevin Tan", Email = "kevin@novacorp.ph", Phone = "+63 939 555 0501", Source = "Website", EventType = "Store Opening", EstimatedBudget = 400000m, Status = "Pending", Notes = "Interested in grand opening event for new flagship store.", CreatedDate = today.AddDays(-1) },
            new Lead { CompanyName = "GreenFuture Inc.", ContactName = "Rose Dizon", Email = "rose@greenfuture.org", Phone = "+63 940 555 0502", Source = "Referral", EventType = "Conference", EstimatedBudget = 600000m, Status = "Contacted", Notes = "Annual sustainability conference, ~300 attendees.", CreatedDate = today.AddDays(-6) },
            new Lead { CompanyName = "SmartPay PH", ContactName = "Alex Ramos", Email = "alex@smartpay.ph", Phone = "+63 941 555 0503", Source = "LinkedIn", EventType = "Team Building", EstimatedBudget = 250000m, Status = "Qualified", Notes = "Looking at beach team building for Q3.", CreatedDate = today.AddDays(-12) },
            new Lead { CompanyName = "Golden Age Senior Home", ContactName = "Lorna Santiago", Email = "lorna@goldenage.ph", Phone = "+63 942 555 0504", Source = "Walk-in", EventType = "Anniversary", EstimatedBudget = 150000m, Status = "Qualified", Notes = "10th anniversary celebration, ~100 guests.", CreatedDate = today.AddDays(-18) },
            new Lead { CompanyName = "Fusion Coffee Co.", ContactName = "Bianca Uy", Email = "bianca@fusioncoffee.ph", Phone = "+63 943 555 0505", Source = "Website", EventType = "Product Launch", EstimatedBudget = 180000m, Status = "Converted", Notes = "Converted to client - contract signed.", CreatedDate = today.AddDays(-25) },
            new Lead { CompanyName = "Metro School Foundation", ContactName = "Ronald Pascual", Email = "r.pascual@metroschool.edu", Phone = "+63 944 555 0506", Source = "Referral", EventType = "Fundraiser", EstimatedBudget = 90000m, Status = "Lost", Notes = "Went with another vendor.", CreatedDate = today.AddDays(-40) },
        });

        db.SaveChanges();

        SeedStaffHR(db);
    }

    private static void SeedUsers(AppDbContext db)
    {
        if (db.Users.Any(u => new[] { Roles.Admin, Roles.Manager, Roles.Finance, Roles.Staff }.Contains(u.Role)))
            return;

        var hasher = new PasswordHasher<User>();

        var users = new[]
        {
            new User { Email = "admin@eventsphere.ph", FullName = "System Admin", Role = Roles.Admin },
            new User { Email = "manager@eventsphere.ph", FullName = "Event Manager", Role = Roles.Manager },
            new User { Email = "finance@eventsphere.ph", FullName = "Finance Officer", Role = Roles.Finance },
            new User { Email = "staff@eventsphere.ph", FullName = "Event Staff", Role = Roles.Staff },
        };

        foreach (var user in users)
            user.PasswordHash = hasher.HashPassword(user, Password);

        db.Users.AddRange(users);
        db.SaveChanges();
    }

    /* Demo HR layer for the staff portal: links the staff@ login to an Employee,
       then builds three months of attendance, leave balances and payslips.
       Runs after the main seed so it works on both fresh and live databases.
       Each block is guarded so it never overwrites real HR data. */
    private static void SeedStaffHR(AppDbContext db)
    {
        var today = DateTime.Today;

        var staff = db.Users.FirstOrDefault(u => u.Email == "staff@eventsphere.ph");
        var nathan = db.Employees.FirstOrDefault(e => e.Email == "nathan.lopez@eventsphere.ph");
        if (staff != null && nathan != null && staff.EmployeeId == null)
        {
            staff.EmployeeId = nathan.Id;
            staff.FullName = nathan.FullName;
            staff.UpdatedAt = DateTime.UtcNow;
            db.SaveChanges();
        }

        var employees = db.Employees.ToList();
        if (employees.Count == 0)
            return;

        if (nathan != null && !db.EmployeeAssignments.Any(a => a.EmployeeId == nathan.Id))
        {
            var byName = db.Events.ToDictionary(e => e.Name.Trim(), e => e, StringComparer.OrdinalIgnoreCase);
            var rows = new List<EmployeeAssignment>();
            foreach (var (name, role, hours, offsetDays, status) in new[]
            {
                ("Acme Annual Product Launch", "Operations Staff", 40m, -90, "Completed"),
                ("Garcia Wedding", "Operations Staff", 12m, 40, "Assigned"),
                ("Heritage Bank Customer Appreciation", "Operations Staff", 10m, 65, "Assigned"),
            })
            {
                if (!byName.TryGetValue(name, out var ev))
                    continue;
                rows.Add(new EmployeeAssignment
                {
                    EventId = ev.Id,
                    EmployeeId = nathan.Id,
                    Role = role,
                    AssignedDate = today.AddDays(offsetDays),
                    Hours = hours,
                    Status = status,
                });
            }
            if (rows.Count > 0)
                db.AddRange(rows);
        }

        if (!db.Attendance.Any())
        {
            var assignments = db.EmployeeAssignments.Include(a => a.Event).ToList();

            var baseMonth = new DateTime(today.Year, today.Month, 1);
            var months = Enumerable.Range(0, 3).Select(i => baseMonth.AddMonths(-2 + i)).ToList();

            var rows = new List<Attendance>();

            for (var i = 0; i < employees.Count; i++)
            {
                var employee = employees[i];
                if (employee.HireDate > today.AddMonths(-3))
                    continue;

                foreach (var month in months)
                {
                    var monthOffset = months.IndexOf(month);
                    var absDay = 7 + (i + monthOffset) % 5;
                    var leaveDay = 12 + (i + monthOffset) % 3;
                    var lateDays = new[] { 3 + (i + monthOffset) % 7, 18 };

                    for (var day = 1; day <= DateTime.DaysInMonth(month.Year, month.Month); day++)
                    {
                        var d = new DateTime(month.Year, month.Month, day);
                        if (d > today || d < employee.HireDate)
                            continue;

                        var isWeekend = d.DayOfWeek == DayOfWeek.Saturday || d.DayOfWeek == DayOfWeek.Sunday;
                        var eventAssignment = assignments.FirstOrDefault(a => a.EmployeeId == employee.Id
                            && d >= a.Event!.StartDate.Date && d <= a.Event!.EndDate.Date);

                        if (eventAssignment?.Event != null)
                        {
                            rows.Add(new Attendance
                            {
                                EmployeeId = employee.Id,
                                WorkDate = d,
                                Status = AttendanceStatus.Present,
                                Notes = $"On duty — {eventAssignment.Event.Name}",
                            });
                            continue;
                        }

                        if (isWeekend)
                            continue;

                        var status = AttendanceStatus.Present;
                        string? notes = null;

                        if (day == absDay)
                            status = AttendanceStatus.Absent;
                        else if (day == leaveDay)
                        {
                            status = AttendanceStatus.Leave;
                            notes = "Filed leave";
                        }
                        else if (lateDays.Contains(day))
                            status = AttendanceStatus.Late;

                        rows.Add(new Attendance
                        {
                            EmployeeId = employee.Id,
                            WorkDate = d,
                            Status = status,
                            Notes = notes,
                        });
                    }
                }
            }

            db.AddRange(rows);
        }

        if (!db.LeaveBalances.Any())
        {
            var balances = new List<LeaveBalance>();
            for (var i = 0; i < employees.Count; i++)
            {
                balances.Add(new LeaveBalance
                {
                    EmployeeId = employees[i].Id,
                    Year = today.Year,
                    TotalDays = 15,
                    UsedDays = i % 4 + 1,
                });
            }
            db.AddRange(balances);
        }

        /* Persist attendance + assignments so the payslip block below can read
           them from the database (a query would not see the un-saved changes). */
        db.SaveChanges();

        if (!db.Payslips.Any())
        {
            var payslips = new List<Payslip>();
            var baseMonth = new DateTime(today.Year, today.Month, 1);

            foreach (var employee in employees)
            {
                for (var i = 0; i < 3; i++)
                {
                    var periodStart = baseMonth.AddMonths(-2 + i);
                    var periodEnd = periodStart.AddMonths(1).AddDays(-1);
                    if (periodEnd < employee.HireDate)
                        continue;

                    var attendanceInMonth = db.Attendance
                        .Where(a => a.EmployeeId == employee.Id
                            && a.WorkDate >= periodStart && a.WorkDate <= periodEnd)
                        .ToList();
                    var daysWorked = attendanceInMonth.Count(a => a.Status == AttendanceStatus.Present || a.Status == AttendanceStatus.Late);
                    var absents = attendanceInMonth.Count(a => a.Status == AttendanceStatus.Absent);
                    if (daysWorked == 0 && absents == 0)
                        continue;

                    var dailyRate = Math.Round(employee.Salary / 22m, 2);
                    var gross = daysWorked * dailyRate;
                    var deductions = Math.Round(gross * 0.115m, 2);

                    payslips.Add(new Payslip
                    {
                        EmployeeId = employee.Id,
                        Month = periodStart.Month,
                        Year = periodStart.Year,
                        PeriodStart = periodStart,
                        PeriodEnd = periodEnd,
                        DaysWorked = daysWorked,
                        Absents = absents,
                        DailyRate = dailyRate,
                        GrossPay = gross,
                        Deductions = deductions,
                        NetPay = gross - deductions,
                        Status = "Generated",
                        GeneratedAt = DateTime.UtcNow.AddDays(-(2 - i)),
                    });
                }
            }

            db.AddRange(payslips);
        }

        db.SaveChanges();
    }
}