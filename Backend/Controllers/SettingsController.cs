using System.Threading.Tasks;
using AssignmentSystem.DTOs;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

namespace AssignmentSystem.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    [Produces("application/json")]
    public class SettingsController : ControllerBase
    {
        private static SystemSettingsDto _settings = new SystemSettingsDto();

        /// <summary>
        /// Get system settings
        /// </summary>
        [HttpGet]
        [ProducesResponseType(typeof(ApiResponse<SystemSettingsDto>), StatusCodes.Status200OK)]
        public IActionResult GetSettings()
        {
            return Ok(ApiResponse<SystemSettingsDto>.SuccessResult(_settings));
        }

        /// <summary>
        /// Update system settings (Admin only)
        /// </summary>
        [HttpPut]
        [Authorize(Roles = "Admin")]
        [ProducesResponseType(typeof(ApiResponse<SystemSettingsDto>), StatusCodes.Status200OK)]
        public IActionResult UpdateSettings([FromBody] SystemSettingsDto dto)
        {
            if (!ModelState.IsValid)
                return BadRequest(ApiResponse<object>.ErrorResult("Invalid settings payload"));

            _settings = dto;
            return Ok(ApiResponse<SystemSettingsDto>.SuccessResult(_settings, "System settings updated successfully"));
        }
    }
}
