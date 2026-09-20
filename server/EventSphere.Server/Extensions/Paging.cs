namespace EventSphere.Server.Extensions;

public static class Paging
{
    public const int MaxPageSize = 100;

    public static Paged<T> Page<T>(this IQueryable<T> query, int? page, int? pageSize)
    {
        var size = pageSize ?? query.Count();
        if (size <= 0) size = 1;
        size = Math.Clamp(size, 1, MaxPageSize);

        var count = query.Count();
        var current = Math.Max(page ?? 1, 1);
        if (page.HasValue)
            query = query.Skip((current - 1) * size).Take(size);

        return new Paged<T>
        {
            Items = query.ToList(),
            Total = count,
            Page = page.HasValue ? current : 1,
            PageSize = page.HasValue ? size : count,
            TotalPages = page.HasValue ? (size == 0 ? 0 : (int)Math.Ceiling(count / (double)size)) : (count == 0 ? 0 : 1),
        };
    }
}

public class Paged<T>
{
    public List<T> Items { get; set; } = new();
    public int Total { get; set; }
    public int Page { get; set; }
    public int PageSize { get; set; }
    public int TotalPages { get; set; }
}