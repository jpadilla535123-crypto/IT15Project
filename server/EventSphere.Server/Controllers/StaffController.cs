using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using EventSphere.Server.Data;
using EventSphere.Server.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace EventSphere.Server.Controllers;

[ApiController]
[Route("api/staff")]
[Authorize]
public class StaffController : ControllerBase
{
    private readonly AppDbContext _db;

    public StaffController(AppDbContext db)
    {
        _db = db;
    }

    [HttpGet("dashboard")]
    public async Task<IActionResult> Dashboard()
    {
        var (user, employee) = await IdentityAsync();
        if (user == null)
            return Unauthorized(new { message = "Session expired. Please sign in again." });
        if (employee == null)
            return NotFound(new
            {
                message = "No employee profile is linked to this account. Ask an administrator to link your staff record."
            });

        var now = DateTime.Today;
        var monthStart = new DateTime(now.Year, now.Month, 1);
        var nextMonth = monthStart.AddMonths(1);
        var empId = employee.Id;

        var assignments = await _db.EmployeeAssignments
            .Include(a => a.Event).ThenInclude(e => e!.Venue)
            .Include(a => a.Event).ThenInclude(e => e!.Client)
            .Where(a => a.EmployeeId == empId)
            .ToListAsync();

        var monthAttendance = await _db.Attendance
            .Where(a => a.EmployeeId == empId && a.WorkDate >= monthStart && a.WorkDate < nextMonth)
            .ToListAsync();

        var recentAttendance = await _db.Attendance
            .Where(a => a.EmployeeId == empId)
            .OrderByDescending(a => a.WorkDate)
            .Take(45)
            .ToListAsync();

        var leaveBalance = await _db.LeaveBalances
            .FirstOrDefaultAsync(lb => lb.EmployeeId == empId && lb.Year == now.Year);

        var payslips = await _db.Payslips
            .Where(p => p.EmployeeId == empId)
            .OrderByDescending(p => p.Year)
            .ThenByDescending(p => p.Month)
            .ToListAsync();

        var monthAssignments = assignments
            .Where(a => a.Event!.StartDate >= monthStart && a.Event!.StartDate < nextMonth)
            .ToList();

        var workDays = monthAttendance.Count(a => a.Status == AttendanceStatus.Present || a.Status == AttendanceStatus.Late);
        var absences = monthAttendance.Count(a => a.Status == AttendanceStatus.Absent);
        var totalAttended = monthAttendance.Count;
        var attendanceRate = totalAttended == 0 ? 0 : (int)Math.Round(100m * workDays / totalAttended, 0);
        var hoursThisMonth = monthAssignments.Sum(a => a.Hours);
        var monthEvents = monthAssignments.Select(a => a.EventId).Distinct().Count();

        var upcoming = assignments
            .Where(a => a.Event!.Status != "Completed" && a.Event!.Status != "Cancelled" && a.Event!.StartDate >= now)
            .OrderBy(a => a.Event!.StartDate)
            .Select(AssignmentDto)
            .ToList();

        var worked = assignments
            .Where(a => a.Event!.Status == "Completed"
                || a.Status == "Completed"
                || (a.Event!.EndDate < now && a.Event!.Status != "Cancelled"))
            .OrderByDescending(a => a.Event!.EndDate)
            .Select(AssignmentDto)
            .ToList();

        return Ok(new
        {
            employee = new
            {
                employee.Id,
                employee.FirstName,
                employee.LastName,
                employee.FullName,
                employee.Role,
                employee.Email,
                employee.Phone,
                employee.Salary,
                employee.HireDate,
                employee.Status,
            },
            stats = new
            {
                workDays,
                absences,
                attendanceRate,
                hoursThisMonth,
                monthEvents,
                leaveBalance = leaveBalance == null
                    ? null
                    : new { leaveBalance.TotalDays, leaveBalance.UsedDays, leaveBalance.AvailableDays },
            },
            upcoming,
            worked,
            attendance = recentAttendance.Select(a => new { a.WorkDate, a.Status, a.Notes }),
            payslips = payslips.Select(p => new
            {
                p.Id,
                p.Month,
                p.Year,
                p.PeriodStart,
                p.PeriodEnd,
                p.DaysWorked,
                p.Absents,
                p.DailyRate,
                p.GrossPay,
                p.Deductions,
                p.NetPay,
                p.Status,
                p.GeneratedAt,
            }),
        });
    }

    [HttpGet("calendar")]
    public async Task<IActionResult> Calendar(int? month = null, int? year = null)
    {
        var (user, employee) = await IdentityAsync();
        if (user == null)
            return Unauthorized(new { message = "Session expired. Please sign in again." });
        if (employee == null)
            return NotFound(new
            {
                message = "No employee profile is linked to this account. Ask an administrator to link your staff record."
            });

        var now = DateTime.Today;
        var target = new DateTime(year ?? now.Year, Math.Clamp(month ?? now.Month, 1, 12), 1);
        var start = target;
        var end = target.AddMonths(1).AddDays(-1);

        var assignments = await _db.EmployeeAssignments
            .Include(a => a.Event).ThenInclude(e => e!.Venue)
            .Include(a => a.Event).ThenInclude(e => e!.Client)
            .Where(a => a.EmployeeId == employee.Id
                && a.Event!.StartDate <= end && a.Event!.EndDate >= start)
            .ToListAsync();

        var attendance = await _db.Attendance
            .Where(a => a.EmployeeId == employee.Id && a.WorkDate >= start && a.WorkDate <= end)
            .ToListAsync();

        var attMap = attendance.ToDictionary(a => a.WorkDate.Date);

        var days = new List<object>();
        for (var d = start; d <= end; d = d.AddDays(1))
        {
            attMap.TryGetValue(d.Date, out var att);
            days.Add(new
            {
                date = d,
                assignments = assignments
                    .Where(a => d.Date >= a.Event!.StartDate.Date && d.Date <= a.Event!.EndDate.Date)
                    .Select(AssignmentDto)
                    .ToList(),
                attendance = att == null ? null : new { att.Status, att.Notes },
            });
        }

        return Ok(new { month = target.Month, year = target.Year, days });
    }

    private async Task<(User? user, Employee? employee)> IdentityAsync()
    {
        var sub = User.FindFirstValue(ClaimTypes.NameIdentifier)
            ?? User.FindFirstValue(JwtRegisteredClaimNames.Sub);

        if (!int.TryParse(sub, out var id))
            return (null, null);

        var user = await _db.Users.Include(u => u.Employee).FirstOrDefaultAsync(u => u.Id == id);
        return (user, user?.Employee);
    }

    private static object AssignmentDto(EmployeeAssignment a) => new
    {
        a.Id,
        a.Role,
        a.Hours,
        a.Status,
        a.AssignedDate,
        eventId = a.Event!.Id,
        eventName = a.Event!.Name,
        eventStatus = a.Event!.Status,
        startDate = a.Event!.StartDate,
        endDate = a.Event!.EndDate,
        venueName = a.Event!.Venue?.Name,
        clientName = a.Event!.Client?.CompanyName,
    };
}