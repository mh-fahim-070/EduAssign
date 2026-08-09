using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using AssignmentSystem.Data;
using AssignmentSystem.DTOs;
using AssignmentSystem.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace AssignmentSystem.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    [Produces("application/json")]
    public class ClassesController : ControllerBase
    {
        private readonly ApplicationDbContext _db;

        public ClassesController(ApplicationDbContext db)
        {
            _db = db;
        }

        /// <summary>
        /// List all academic classes
        /// </summary>
        [HttpGet]
        [ProducesResponseType(typeof(ApiResponse<List<ClassDto>>), StatusCodes.Status200OK)]
        public async Task<IActionResult> GetClasses()
        {
            var classes = await _db.Classes.Select(c => new ClassDto
            {
                Id = c.Id,
                Name = c.Name,
                GradeLevel = c.GradeLevel,
                Code = c.Code,
                Description = c.Description
            }).ToListAsync();

            return Ok(ApiResponse<List<ClassDto>>.SuccessResult(classes));
        }

        /// <summary>
        /// Get academic class by ID
        /// </summary>
        [HttpGet("{id}")]
        [ProducesResponseType(typeof(ApiResponse<ClassDto>), StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public async Task<IActionResult> GetClassById(string id)
        {
            var cls = await _db.Classes.FindAsync(id);
            if (cls == null)
            {
                return NotFound(ApiResponse<object>.ErrorResult("Class not found"));
            }

            var dto = new ClassDto
            {
                Id = cls.Id,
                Name = cls.Name,
                GradeLevel = cls.GradeLevel,
                Code = cls.Code,
                Description = cls.Description
            };

            return Ok(ApiResponse<ClassDto>.SuccessResult(dto));
        }

        /// <summary>
        /// Create a new academic class (Admin only)
        /// </summary>
        [HttpPost]
        [Authorize(Roles = "Admin")]
        [ProducesResponseType(typeof(ApiResponse<ClassDto>), StatusCodes.Status201Created)]
        public async Task<IActionResult> CreateClass([FromBody] ClassDto dto)
        {
            if (!ModelState.IsValid)
                return BadRequest(ApiResponse<object>.ErrorResult("Invalid class payload"));

            var newClass = new Class
            {
                Id = !string.IsNullOrEmpty(dto.Id) ? dto.Id : Guid.NewGuid().ToString(),
                Name = dto.Name,
                GradeLevel = dto.GradeLevel,
                Code = dto.Code,
                Description = dto.Description
            };

            _db.Classes.Add(newClass);
            await _db.SaveChangesAsync();

            dto.Id = newClass.Id;
            return Created("", ApiResponse<ClassDto>.SuccessResult(dto, "Class created successfully"));
        }
    }
}
