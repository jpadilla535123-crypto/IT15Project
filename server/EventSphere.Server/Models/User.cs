using System.ComponentModel.DataAnnotations;

namespace EventSphere.Server.Models;

public class User : BaseEntity
{
    [Required, EmailAddress, MaxLength(200)]
    public string Email { get; set; } = string.Empty;

    [Required, MaxLength(200)]
    public string FullName { get; set; } = string.Empty;

    [Required]
    public string PasswordHash { get; set; } = string.Empty;

    public string Role { get; set; } = Roles.Staff;

    public bool IsActive { get; set; } = true;
}

public static class Roles
{
    public const string Admin = "Admin";
    public const string Manager = "Manager";
    public const string Finance = "Finance";
    public const string Staff = "Staff";

    public static readonly string[] All = { Admin, Manager, Finance, Staff };
}