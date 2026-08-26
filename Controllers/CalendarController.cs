using Microsoft.AspNetCore.Mvc;
using EventSphere.Web.Data;

namespace EventSphere.Web.Controllers;

public class CalendarController : Controller
{
    private readonly JsonDataContext _context;

    public CalendarController(JsonDataContext context)
    {
        _context = context;
    }

    public async Task<IActionResult> Index(int? year, int? month)
    {
        var now = DateTime.Today;
        var y = year ?? now.Year;
        var m = month ?? now.Month;

        if (m < 1) { m = 12; y--; }
        if (m > 12) { m = 1; y++; }

        var firstDay = new DateTime(y, m, 1);
        var daysInMonth = DateTime.DaysInMonth(y, m);

        var events = await _context.Events
            .Include(e => e.Client)
            .Where(e => e.StartDate.Year == y && e.StartDate.Month == m)
            .OrderBy(e => e.StartDate)
            .ToListAsync();

        var eventsByDay = events
            .GroupBy(e => e.StartDate.Day)
            .ToDictionary(g => g.Key, g => g.ToList());

        var startOffset = ((int)firstDay.DayOfWeek + 6) % 7; // Monday first

        ViewData["Year"] = y;
        ViewData["Month"] = m;
        ViewData["MonthName"] = firstDay.ToString("MMMM yyyy");
        ViewData["DaysInMonth"] = daysInMonth;
        ViewData["StartOffset"] = startOffset;
        ViewData["EventsByDay"] = eventsByDay;
        ViewData["PrevMonth"] = m == 1 ? 12 : m - 1;
        ViewData["PrevYear"] = m == 1 ? y - 1 : y;
        ViewData["NextMonth"] = m == 12 ? 1 : m + 1;
        ViewData["NextYear"] = m == 12 ? y + 1 : y;
        ViewData["Upcoming"] = await _context.Events
            .Include(e => e.Client)
            .Include(e => e.Venue)
            .Where(e => e.StartDate >= DateTime.Today)
            .OrderBy(e => e.StartDate)
            .Take(8)
            .ToListAsync();

        return View();
    }
}
