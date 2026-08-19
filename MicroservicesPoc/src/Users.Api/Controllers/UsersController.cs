using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Users.Api.Data;
using Users.Api.Models;

namespace Users.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class UsersController : ControllerBase
{
    private readonly UsersDbContext _context;

    public UsersController(UsersDbContext context)
    {
        _context = context;
    }

    // GET api/users
    [HttpGet]
    public async Task<ActionResult<IEnumerable<User>>> GetUsers()
    {
        var users = await _context.Users.ToListAsync();
        return Ok(users);
    }

    // GET api/users/{id}
    [HttpGet("{id:guid}")]
    public async Task<ActionResult<User>> GetUser(Guid id)
    {
        var user = await _context.Users.FindAsync(id);

        if (user is null)
            return NotFound(new { message = $"Utilisateur {id} introuvable." });

        return Ok(user);
    }

    // POST api/users
    [HttpPost]
    public async Task<ActionResult<User>> CreateUser(CreateUserRequest request)
    {
        var user = new User
        {
            Email = request.Email,
            FullName = request.FullName
        };

        _context.Users.Add(user);
        await _context.SaveChangesAsync();

        return CreatedAtAction(nameof(GetUser), new { id = user.Id }, user);
    }

    // PUT api/users/{id}
    [HttpPut("{id:guid}")]
    public async Task<IActionResult> UpdateUser(Guid id, UpdateUserRequest request)
    {
        var user = await _context.Users.FindAsync(id);

        if (user is null)
            return NotFound(new { message = $"Utilisateur {id} introuvable." });

        user.Email = request.Email;
        user.FullName = request.FullName;

        await _context.SaveChangesAsync();

        return NoContent();
    }

    // DELETE api/users/{id}
    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> DeleteUser(Guid id)
    {
        var user = await _context.Users.FindAsync(id);

        if (user is null)
            return NotFound(new { message = $"Utilisateur {id} introuvable." });

        _context.Users.Remove(user);
        await _context.SaveChangesAsync();

        return NoContent();
    }
}

public record CreateUserRequest(string Email, string FullName);
public record UpdateUserRequest(string Email, string FullName);
