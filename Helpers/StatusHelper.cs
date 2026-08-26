namespace EventSphere.Web.Helpers;

public static class StatusHelper
{
    public static string Badge(string? status)
    {
        if (string.IsNullOrEmpty(status)) return "badge-secondary";
        return status switch
        {
            "Active" or "Completed" or "Paid" or "Confirmed" or "Converted" or "Available" => "badge-success",
            "Pending" or "Planned" or "New" => "badge-secondary",
            "In Progress" or "Qualified" or "Booked" or "Assigned" => "badge-info",
            "Partial" or "Contacted" => "badge-warning",
            "Overdue" or "Cancelled" or "Lost" or "Inactive" or "Rejected" => "badge-danger",
            "Warning" => "badge-warning",
            _ => "badge-info"
        };
    }

    public static string CalendarCss(string? status)
    {
        if (string.IsNullOrEmpty(status)) return "cal-event";
        return status switch
        {
            "Completed" => "cal-event cal-completed",
            "In Progress" => "cal-event cal-progress",
            "Confirmed" => "cal-event cal-confirmed",
            "Cancelled" => "cal-event cal-cancelled",
            _ => "cal-event"
        };
    }

    public static string Money(decimal amount) => amount.ToString("C0");
}
