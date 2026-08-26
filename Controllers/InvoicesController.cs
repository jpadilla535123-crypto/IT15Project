using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Rendering;
using EventSphere.Web.Data;
using EventSphere.Web.Models;

namespace EventSphere.Web.Controllers;

public class InvoicesController : Controller
{
    private readonly JsonDataContext _context;

    public InvoicesController(JsonDataContext context)
    {
        _context = context;
    }

    public async Task<IActionResult> Index(string? status = null, int? clientId = null)
    {
        var query = _context.Invoices
            .Include(i => i.Client)
            .Include(i => i.Event)
            .AsQueryable();

        if (!string.IsNullOrEmpty(status))
            query = query.Where(i => i.Status == status);
        if (clientId.HasValue)
            query = query.Where(i => i.ClientId == clientId);

        ViewData["Status"] = status;
        ViewData["ClientId"] = clientId;
        ViewData["Statuses"] = new[] { "Pending", "Partial", "Paid", "Overdue" };
        ViewData["Clients"] = new SelectList(await _context.Clients.OrderBy(c => c.CompanyName).ToListAsync(), "Id", "CompanyName", clientId);
        ViewData["TotalBilled"] = await query.SumAsync(i => (decimal?)i.Amount) ?? 0;
        ViewData["TotalPaid"] = await query.SumAsync(i => (decimal?)i.PaidAmount) ?? 0;

        return View(await query.OrderByDescending(i => i.IssueDate).ToListAsync());
    }

    public async Task<IActionResult> Details(int? id)
    {
        if (id == null) return NotFound();
        var invoice = await _context.Invoices
            .Include(i => i.Client)
            .Include(i => i.Event)
            .FirstOrDefaultAsync(i => i.Id == id);
        if (invoice == null) return NotFound();
        return View(invoice);
    }

    public async Task<IActionResult> Create()
    {
        await PopulateDropdownsAsync();
        return View();
    }

    [HttpPost]
    [ValidateAntiForgeryToken]
    public async Task<IActionResult> Create([Bind("EventId,ClientId,InvoiceNumber,IssueDate,DueDate,Amount,PaidAmount,Status,Notes")] Invoice invoice)
    {
        if (string.IsNullOrWhiteSpace(invoice.InvoiceNumber))
            invoice.InvoiceNumber = $"INV-{DateTime.Now.Year}-{DateTime.Now:MMddHHmmss}";

        if (ModelState.IsValid)
        {
            _context.Add(invoice);
            await _context.SaveChangesAsync();
            return RedirectToAction(nameof(Index));
        }
        await PopulateDropdownsAsync(invoice);
        return View(invoice);
    }

    public async Task<IActionResult> Edit(int? id)
    {
        if (id == null) return NotFound();
        var invoice = await _context.Invoices.FindAsync(id);
        if (invoice == null) return NotFound();
        await PopulateDropdownsAsync(invoice);
        return View(invoice);
    }

    [HttpPost]
    [ValidateAntiForgeryToken]
    public async Task<IActionResult> Edit(int id, [Bind("Id,EventId,ClientId,InvoiceNumber,IssueDate,DueDate,Amount,PaidAmount,Status,Notes")] Invoice invoice)
    {
        if (id != invoice.Id) return NotFound();
        if (ModelState.IsValid)
        {
            _context.Update(invoice);
            await _context.SaveChangesAsync();
            return RedirectToAction(nameof(Index));
        }
        await PopulateDropdownsAsync(invoice);
        return View(invoice);
    }

    public async Task<IActionResult> Delete(int? id)
    {
        if (id == null) return NotFound();
        var invoice = await _context.Invoices
            .Include(i => i.Client)
            .Include(i => i.Event)
            .FirstOrDefaultAsync(i => i.Id == id);
        if (invoice == null) return NotFound();
        return View(invoice);
    }

    [HttpPost, ActionName("Delete")]
    [ValidateAntiForgeryToken]
    public async Task<IActionResult> DeleteConfirmed(int id)
    {
        var invoice = await _context.Invoices.FindAsync(id);
        if (invoice != null)
        {
            _context.Invoices.Remove(invoice);
            await _context.SaveChangesAsync();
        }
        return RedirectToAction(nameof(Index));
    }

    public async Task<IActionResult> RecordPayment(int? id)
    {
        if (id == null) return NotFound();
        var invoice = await _context.Invoices.FindAsync(id);
        if (invoice == null) return NotFound();
        return View(invoice);
    }

    [HttpPost]
    [ValidateAntiForgeryToken]
    public async Task<IActionResult> RecordPayment(int id, decimal amount)
    {
        var invoice = await _context.Invoices.FindAsync(id);
        if (invoice == null) return NotFound();

        invoice.PaidAmount = Math.Min(invoice.Amount, invoice.PaidAmount + amount);
        invoice.Status = invoice.PaidAmount >= invoice.Amount ? "Paid" : invoice.PaidAmount > 0 ? "Partial" : "Pending";
        await _context.SaveChangesAsync();
        return RedirectToAction(nameof(Details), new { id });
    }

    private async Task PopulateDropdownsAsync(Invoice? selected = null)
    {
        ViewBag.ClientList = new SelectList(await _context.Clients.OrderBy(c => c.CompanyName).ToListAsync(), "Id", "CompanyName", selected?.ClientId);
        ViewBag.EventList = new SelectList(await _context.Events.OrderBy(e => e.Name).ToListAsync(), "Id", "Name", selected?.EventId);
        ViewBag.Statuses = new[] { "Pending", "Partial", "Paid", "Overdue" };
    }
}
