using System.ComponentModel.DataAnnotations;
using EventSphere.Server.Data;
using EventSphere.Server.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace EventSphere.Server.Controllers;

[ApiController]
[Route("api/[controller]")]
public class UsersController : ControllerBase
{
    private readonly AppDbContext _db;
    private readonly IPasswordHasher<User> _hasher;

    public UsersController(AppDbContext db, IPasswordHasher<User> hasher)
    {
        _db = db;
        _hasher = hasher;
    }

    public record CreateUserRequest(
        [Required, EmailAddress, MaxLength(200)] string Email,
        [Required, MaxLength(200)] string FullName,
        string Role,
        [Required, MinLength(6)] string Password,
        int? EmployeeId = null);

    [HttpGet]
    [Authorize(Roles = "Admin,Manager")]
    public async Task<IActionResult> GetAll()
    {
        var users = await _db.Users
            .OrderBy(u => u.Email)
            .Select(u => new { u.Id, u.Email, u.FullName, u.Role, u.IsActive, u.EmployeeId })
            .ToListAsync();

        return Ok(new { items = users, total = users.Count, page = 1, pageSize = users.Count, totalPages = 1 });
    }

    [HttpPost]
    [Authorize(Roles = "Admin,Manager")]
    public async Task<IActionResult> Create([FromBody] CreateUserRequest request)
    {
        if (!ModelState.IsValid)
            return BadRequest(ModelState);

        var normalized = request.Email.Trim().ToLowerInvariant();

        if (await _db.Users.AnyAsync(u => u.Email.ToLower() == normalized))
            return Conflict(new { message = "An account with that email already exists." });

        var role = Roles.All.Contains(request.Role) ? request.Role : Roles.Staff;

        var user = new User
        {
            Email = normalized,
            FullName = request.FullName.Trim(),
            Role = role,
            IsActive = true,
            EmployeeId = request.EmployeeId,
            PasswordHash = _hasher.HashPassword(new User(), request.Password),
        };

        _db.Users.Add(user);

        if (request.EmployeeId.HasValue)
        {
            var employee = await _db.Employees.FindAsync(request.EmployeeId.Value);
            if (employee != null && string.IsNullOrEmpty(employee.Email))
                employee.Email = normalized;
        }

        await _db.SaveChangesAsync();

        return CreatedAtAction(nameof(GetAll), new { id = user.Id },
            new { user.Id, user.Email, user.FullName, user.Role, user.IsActive, user.EmployeeId });
    }
}