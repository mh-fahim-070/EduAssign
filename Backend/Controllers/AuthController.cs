using System;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using System.Threading.Tasks;
using AssignmentSystem.Data;
using AssignmentSystem.DTOs;
using AssignmentSystem.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;

namespace AssignmentSystem.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Produces("application/json")]
    public class AuthController : ControllerBase
    {
        private readonly ApplicationDbContext _db;
        private readonly IConfiguration _config;

        public AuthController(ApplicationDbContext db, IConfiguration config)
        {
            _db = db;
            _config = config;
        }

        /// <summary>
        /// Authenticate user credentials and return JWT token
        /// </summary>
        [HttpPost("login")]
        [ProducesResponseType(typeof(ApiResponse<AuthResponseDto>), StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status401Unauthorized)]
        public async Task<IActionResult> Login([FromBody] LoginRequestDto dto)
        {
            if (!ModelState.IsValid)
                return BadRequest(ApiResponse<object>.ErrorResult("Invalid request payload"));

            var user = await _db.Users.FirstOrDefaultAsync(u => u.Email.ToLower() == dto.Email.ToLower());

            // Mock/Seed fallbacks for testing if DB is unseeded
            if (user == null)
            {
                if (dto.Email == "admin@school.edu" && dto.Password == "Admin123!")
                {
                    user = new User
                    {
                        Id = Guid.NewGuid().ToString(),
                        Name = "Sarah Jenkins",
                        Email = dto.Email,
                        Role = UserRole.Admin
                    };
                }
                else if (dto.Email == "john.doe@school.edu" && dto.Password == "Teacher123!")
                {
                    user = new User
                    {
                        Id = Guid.NewGuid().ToString(),
                        Name = "Prof. John Doe",
                        Email = dto.Email,
                        Role = UserRole.Teacher
                    };
                }
                else if (dto.Email == "alex.jones@student.edu" && dto.Password == "Student123!")
                {
                    user = new User
                    {
                        Id = Guid.NewGuid().ToString(),
                        Name = "Alex Jones",
                        Email = dto.Email,
                        Role = UserRole.Student
                    };
                }
                else
                {
                    return Unauthorized(ApiResponse<object>.ErrorResult("Invalid email or password"));
                }

                _db.Users.Add(user);
                await _db.SaveChangesAsync();
            }

            var token = GenerateJwtToken(user);
            var userDto = new UserDto
            {
                Id = user.Id,
                Name = user.Name,
                Email = user.Email,
                Role = user.Role,
                CreatedAt = user.CreatedAt
            };

            return Ok(ApiResponse<AuthResponseDto>.SuccessResult(new AuthResponseDto
            {
                Token = token,
                User = userDto
            }, "Login successful"));
        }

        /// <summary>
        /// Get currently logged in user profile from JWT claim
        /// </summary>
        [HttpGet("me")]
        [Authorize]
        [ProducesResponseType(typeof(ApiResponse<UserDto>), StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status401Unauthorized)]
        public async Task<IActionResult> GetCurrentUser()
        {
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userId))
            {
                return Unauthorized(ApiResponse<object>.ErrorResult("Invalid authorization token claims"));
            }

            var user = await _db.Users.FindAsync(userId);
            if (user == null)
            {
                var email = User.FindFirst(ClaimTypes.Email)?.Value ?? "user@school.edu";
                var name = User.FindFirst(ClaimTypes.Name)?.Value ?? "User";
                var roleStr = User.FindFirst(ClaimTypes.Role)?.Value ?? "Student";
                Enum.TryParse<UserRole>(roleStr, out var role);

                return Ok(ApiResponse<UserDto>.SuccessResult(new UserDto
                {
                    Id = userId,
                    Name = name,
                    Email = email,
                    Role = role,
                    CreatedAt = DateTime.UtcNow
                }));
            }

            return Ok(ApiResponse<UserDto>.SuccessResult(new UserDto
            {
                Id = user.Id,
                Name = user.Name,
                Email = user.Email,
                Role = user.Role,
                CreatedAt = user.CreatedAt
            }));
        }

        /// <summary>
        /// Register a new account
        /// </summary>
        [HttpPost("register")]
        [ProducesResponseType(typeof(ApiResponse<AuthResponseDto>), StatusCodes.Status201Created)]
        public async Task<IActionResult> Register([FromBody] CreateUserDto dto)
        {
            if (!ModelState.IsValid)
                return BadRequest(ApiResponse<object>.ErrorResult("Validation failed"));

            var existing = await _db.Users.AnyAsync(u => u.Email.ToLower() == dto.Email.ToLower());
            if (existing)
                return BadRequest(ApiResponse<object>.ErrorResult("An account with this email already exists"));

            var user = new User
            {
                Id = Guid.NewGuid().ToString(),
                Name = dto.Name,
                Email = dto.Email,
                PasswordHash = dto.Password, // In production, hash with BCrypt / Argon2
                Role = dto.Role,
                CreatedAt = DateTime.UtcNow
            };

            _db.Users.Add(user);
            await _db.SaveChangesAsync();

            var token = GenerateJwtToken(user);
            var userDto = new UserDto
            {
                Id = user.Id,
                Name = user.Name,
                Email = user.Email,
                Role = user.Role,
                CreatedAt = user.CreatedAt
            };

            return Created("", ApiResponse<AuthResponseDto>.SuccessResult(new AuthResponseDto
            {
                Token = token,
                User = userDto
            }, "Account registered successfully"));
        }

        private string GenerateJwtToken(User user)
        {
            var jwtSettings = _config.GetSection("JwtSettings");
            var key = Encoding.UTF8.GetBytes(jwtSettings["SecretKey"] ?? "SuperSecretJwtKeyForAssignmentSystemMinimum32CharactersLong!");

            // Using standard JWT claim names reduces token size
            var claims = new[]
            {
                new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()),
                new Claim(ClaimTypes.Name, user.Name),
                new Claim(ClaimTypes.Email, user.Email),
                new Claim(ClaimTypes.Role, user.Role.ToString()),
                new Claim("sub", user.Id.ToString()),
                new Claim("role", user.Role.ToString())
            };

            var expMinutes = int.TryParse(jwtSettings["ExpirationInMinutes"], out var m) ? m : 10080; // Default 7 days

            var tokenDescriptor = new SecurityTokenDescriptor
            {
                Subject = new ClaimsIdentity(claims),
                Expires = DateTime.UtcNow.AddMinutes(expMinutes),
                Issuer = jwtSettings["Issuer"] ?? "AssignmentSystemServer",
                Audience = jwtSettings["Audience"] ?? "AssignmentSystemClient",
                SigningCredentials = new SigningCredentials(new SymmetricSecurityKey(key), SecurityAlgorithms.HmacSha256Signature)
            };

            var tokenHandler = new JwtSecurityTokenHandler();
            var token = tokenHandler.CreateToken(tokenDescriptor);
            return tokenHandler.WriteToken(token);
        }
    }
}
