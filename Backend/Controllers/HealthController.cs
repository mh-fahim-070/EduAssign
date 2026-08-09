using System;
using System.Threading.Tasks;
using AssignmentSystem.Data;
using AssignmentSystem.DTOs;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace AssignmentSystem.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Produces("application/json")]
    public class HealthController : ControllerBase
    {
        private readonly ApplicationDbContext _db;

        public HealthController(ApplicationDbContext db)
        {
            _db = db;
        }

        /// <summary>
        /// Check API health and test active database connection
        /// </summary>
        [HttpGet]
        public async Task<IActionResult> CheckHealth()
        {
            try
            {
                bool canConnect = await _db.Database.CanConnectAsync();
                var dbProvider = _db.Database.ProviderName;
                var userCount = canConnect ? await _db.Users.CountAsync() : 0;

                if (!canConnect)
                {
                    return StatusCode(StatusCodes.Status503ServiceUnavailable, 
                        ApiResponse<object>.ErrorResult("Database connection failed: Cannot reach server"));
                }

                return Ok(ApiResponse<object>.SuccessResult(new
                {
                    status = "Healthy",
                    databaseConnected = true,
                    provider = dbProvider,
                    userRecords = userCount,
                    timestamp = DateTime.UtcNow
                }, "Database connection verified successfully"));
            }
            catch (Exception ex)
            {
                return StatusCode(StatusCodes.Status500InternalServerError, 
                    ApiResponse<object>.ErrorResult($"Database connection error: {ex.Message}"));
            }
        }
    }
}
