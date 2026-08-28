using EventSphere.Server.Data;
using EventSphere.Server.Models;
using Microsoft.AspNetCore.Mvc;

namespace EventSphere.Server.Controllers;

[ApiController]
[Route("api/[controller]")]
public class EmployeesController : ControllerBase
{
    private readonly InMemoryDataContext _data;

    public EmployeesController(InMemoryDataContext data)
    {
        _data = data;
    }

    [HttpGet]
    public IActionResult GetAll(string? role = null, string? search = null)
    {
        var query = _data.Employees.AsQueryable();

        if (!string.IsNullOrEmpty(role))
            query = query.Where(e => e.Role == role);

        if (!string.IsNullOrEmpty(search))
            query = query.Where(e =>
                e.FirstName.Contains(search) ||
                e.LastName.Contains(search) ||
                (e.Email != null && e.Email.Contains(search)));

        return Ok(query.OrderBy(e => e.LastName).ToList());
    }

    [HttpGet("{id}")]
    public IActionResult GetById(int id)
    {
        var employee = _data.Employees.FirstOrDefault(e => e.Id == id);
        if (employee == null)
            return NotFound();

        return Ok(employee);
    }

    [HttpPost]
    public IActionResult Create([FromBody] Employee employee)
    {
        if (!ModelState.IsValid)
            return BadRequest(ModelState);

        employee.Id = _data.NextId(_data.Employees);
        employee.CreatedAt = DateTime.UtcNow;
        employee.UpdatedAt = DateTime.UtcNow;
        _data.Employees.Add(employee);

        return CreatedAtAction(nameof(GetById), new { id = employee.Id }, employee);
    }

    [HttpPut("{id}")]
    public IActionResult Update(int id, [FromBody] Employee employee)
    {
        var existing = _data.Employees.FirstOrDefault(e => e.Id == id);
        if (existing == null)
            return NotFound();

        existing.FirstName = employee.FirstName;
        existing.LastName = employee.LastName;
        existing.Role = employee.Role;
        existing.Email = employee.Email;
        existing.Phone = employee.Phone;
        existing.Salary = employee.Salary;
        existing.HireDate = employee.HireDate;
        existing.Status = employee.Status;
        existing.UpdatedAt = DateTime.UtcNow;

        return NoContent();
    }

    [HttpDelete("{id}")]
    public IActionResult Delete(int id)
    {
        var employee = _data.Employees.FirstOrDefault(e => e.Id == id);
        if (employee == null)
            return NotFound();

        _data.Employees.Remove(employee);
        return NoContent();
    }
}