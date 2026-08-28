using EventSphere.Server.Data;
using EventSphere.Server.Models;
using Microsoft.AspNetCore.Mvc;

namespace EventSphere.Server.Controllers;

[ApiController]
[Route("api/[controller]")]
public class EmployeeAssignmentsController : ControllerBase
{
    private readonly InMemoryDataContext _data;

    public EmployeeAssignmentsController(InMemoryDataContext data)
    {
        _data = data;
    }

    [HttpGet]
    public IActionResult GetAll(int? eventId = null, int? employeeId = null, string? status = null)
    {
        var query = _data.EmployeeAssignments.AsQueryable();

        if (eventId.HasValue)
            query = query.Where(a => a.EventId == eventId);

        if (employeeId.HasValue)
            query = query.Where(a => a.EmployeeId == employeeId);

        if (!string.IsNullOrEmpty(status))
            query = query.Where(a => a.Status == status);

        return Ok(query.OrderByDescending(a => a.AssignedDate).ToList());
    }

    [HttpGet("{id}")]
    public IActionResult GetById(int id)
    {
        var assignment = _data.EmployeeAssignments.FirstOrDefault(a => a.Id == id);
        if (assignment == null)
            return NotFound();

        return Ok(assignment);
    }

    [HttpPost]
    public IActionResult Create([FromBody] EmployeeAssignment assignment)
    {
        if (!ModelState.IsValid)
            return BadRequest(ModelState);

        assignment.Id = _data.NextId(_data.EmployeeAssignments);
        assignment.CreatedAt = DateTime.UtcNow;
        assignment.UpdatedAt = DateTime.UtcNow;
        _data.EmployeeAssignments.Add(assignment);

        return CreatedAtAction(nameof(GetById), new { id = assignment.Id }, assignment);
    }

    [HttpPut("{id}")]
    public IActionResult Update(int id, [FromBody] EmployeeAssignment assignment)
    {
        var existing = _data.EmployeeAssignments.FirstOrDefault(a => a.Id == id);
        if (existing == null)
            return NotFound();

        existing.EventId = assignment.EventId;
        existing.EmployeeId = assignment.EmployeeId;
        existing.Role = assignment.Role;
        existing.AssignedDate = assignment.AssignedDate;
        existing.Hours = assignment.Hours;
        existing.Status = assignment.Status;
        existing.UpdatedAt = DateTime.UtcNow;

        return NoContent();
    }

    [HttpDelete("{id}")]
    public IActionResult Delete(int id)
    {
        var assignment = _data.EmployeeAssignments.FirstOrDefault(a => a.Id == id);
        if (assignment == null)
            return NotFound();

        _data.EmployeeAssignments.Remove(assignment);
        return NoContent();
    }
}