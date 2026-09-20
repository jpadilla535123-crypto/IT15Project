using System.ComponentModel.DataAnnotations;
using EventSphere.Server.Data;
using EventSphere.Server.Models;
using EventSphere.Server.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace EventSphere.Server.Controllers;

[ApiController]
[Route("api/auth")]
public class AuthController : ControllerBase
{
    private readonly AppDbContext _db;
    private readonly TokenService _tokens;
    private readonly IPasswordHasher<User> _hasher;

    public AuthController(AppDbContext db, TokenService tokens, IPasswordHasher<User> hasher)
    {
        _db = db;
        _tokens = tokens;
        _hasher = hasher;
    }

    public record LoginRequest([Required, EmailAddress] string Email, [Required] string Password);

    [HttpPost("login")]
    [AllowAnonymous]
    public async Task<IActionResult> Login([FromBody] LoginRequest request)
    {
        var user = await _db.Users.FirstOrDefaultAsync(u => u.Email == request.Email);
        if (user == null)
            return Unauthorized(new { message = "Invalid email or password." });

        var result = _hasher.VerifyHashedPassword(user, user.PasswordHash, request.Password);
        if (result != PasswordVerificationResult.Success && result != PasswordVerificationResult.SuccessRehashNeeded)
            return Unauthorized(new { message = "Invalid email or password." });

        if (!user.IsActive)
            return Unauthorized(new { message = "Account is disabled." });

        return Ok(new
        {
            token = _tokens.CreateToken(user),
            user = new { user.Id, user.Email, user.FullName, user.Role, user.EmployeeId }
        });
    }
}