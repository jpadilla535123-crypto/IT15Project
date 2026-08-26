using System.Collections.Concurrent;
using System.Linq.Expressions;
using System.Reflection;

namespace EventSphere.Web.Data;

public static class AsyncLinqExtensions
{
    private static readonly ConcurrentDictionary<Type, PropertyInfo?> _idPropertyCache = new();

    public static Task<List<T>> ToListAsync<T>(this IEnumerable<T> source) =>
        Task.FromResult(source.ToList());

    public static Task<List<T>> ToListAsync<T>(this IQueryable<T> source) =>
        Task.FromResult(source.ToList());

    public static Task<int> CountAsync<T>(this IEnumerable<T> source) =>
        Task.FromResult(source.Count());

    public static Task<int> CountAsync<T>(this IEnumerable<T> source, Func<T, bool> predicate) =>
        Task.FromResult(source.Count(predicate));

    public static Task<int> CountAsync<T>(this IQueryable<T> source) =>
        Task.FromResult(source.Count());

    public static Task<int> CountAsync<T>(this IQueryable<T> source, Expression<Func<T, bool>> predicate) =>
        Task.FromResult(source.CompileExpression().Count(predicate.Compile()));

    public static Task<decimal?> SumAsync<T>(this IEnumerable<T> source, Func<T, decimal?> selector) =>
        Task.FromResult(source.Sum(selector));

    public static Task<decimal?> SumAsync<T>(this IQueryable<T> source, Expression<Func<T, decimal?>> selector) =>
        Task.FromResult(source.CompileExpression().Sum(selector.Compile()));

    public static Task<bool> AnyAsync<T>(this IEnumerable<T> source) =>
        Task.FromResult(source.Any());

    public static Task<bool> AnyAsync<T>(this IEnumerable<T> source, Func<T, bool> predicate) =>
        Task.FromResult(source.Any(predicate));

    public static Task<T?> FirstOrDefaultAsync<T>(this IEnumerable<T> source) =>
        Task.FromResult(source.FirstOrDefault());

    public static Task<T?> FirstOrDefaultAsync<T>(this IEnumerable<T> source, Func<T, bool> predicate) =>
        Task.FromResult(source.FirstOrDefault(predicate));

    public static Task<T?> FirstOrDefaultAsync<T>(this IQueryable<T> source, Expression<Func<T, bool>> predicate) =>
        Task.FromResult(source.CompileExpression().FirstOrDefault(predicate.Compile()));

    public static Task<T?> FindAsync<T>(this IList<T> source, params object[] keyValues) where T : class
    {
        if (keyValues.Length == 0) return Task.FromResult<T?>(null);

        var idProp = _idPropertyCache.GetOrAdd(typeof(T),
            t => t.GetProperty("Id", BindingFlags.Public | BindingFlags.Instance));

        if (idProp == null || keyValues[0] is not int id)
            return Task.FromResult<T?>(null);

        return Task.FromResult(source.FirstOrDefault(e =>
            idProp.GetValue(e) is int eid && eid == id));
    }

    public static Task<Dictionary<TKey, T>> ToDictionaryAsync<T, TKey>(this IEnumerable<T> source, Func<T, TKey> keySelector) where TKey : notnull =>
        Task.FromResult(source.ToDictionary(keySelector));

    public static Task<Dictionary<TKey, TElement>> ToDictionaryAsync<T, TKey, TElement>(
        this IEnumerable<T> source,
        Func<T, TKey> keySelector,
        Func<T, TElement> elementSelector) where TKey : notnull =>
        Task.FromResult(source.ToDictionary(keySelector, elementSelector));

    // Include / ThenInclude are no-ops - navigation properties are pre-wired by JsonDataContext
    public static IQueryable<T> Include<T, TProperty>(this IQueryable<T> source, Expression<Func<T, TProperty>> path) where T : class =>
        source;

    public static IQueryable<T> Include<T, TProperty>(this IEnumerable<T> source, Expression<Func<T, TProperty>> path) where T : class =>
        source.AsQueryable();

    public static IQueryable<T> ThenInclude<T, TPreviousProperty, TProperty>(
        this IQueryable<T> source,
        Expression<Func<TPreviousProperty, TProperty>> navigationPropertyPath) where T : class =>
        source;

    public static IQueryable<T> ThenInclude<T, TPreviousProperty, TProperty>(
        this IEnumerable<T> source,
        Expression<Func<TPreviousProperty, TProperty>> navigationPropertyPath) where T : class =>
        source.AsQueryable();

    // Helper to compile IQueryable to IEnumerable for in-memory operations
    private static IEnumerable<T> CompileExpression<T>(this IQueryable<T> source) => source;
}
