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
    public class SubjectsController : ControllerBase
    {
        private readonly ApplicationDbContext _db;

        public SubjectsController(ApplicationDbContext db)
        {
            _db = db;
        }

        /// <summary>
        /// List all curriculum subjects
        /// </summary>
        [HttpGet]
        [ProducesResponseType(typeof(ApiResponse<List<SubjectDto>>), StatusCodes.Status200OK)]
        public async Task<IActionResult> GetSubjects()
        {
            var subjects = await _db.Subjects.Select(s => new SubjectDto
            {
                Id = s.Id,
                Name = s.Name,
                Code = s.Code,
                Description = s.Description
            }).ToListAsync();

            return Ok(ApiResponse<List<SubjectDto>>.SuccessResult(subjects));
        }

        /// <summary>
        /// Get subject by ID
        /// </summary>
        [HttpGet("{id}")]
        [ProducesResponseType(typeof(ApiResponse<SubjectDto>), StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public async Task<IActionResult> GetSubjectById(string id)
        {
            var subject = await _db.Subjects.FindAsync(id);
            if (subject == null)
            {
                return NotFound(ApiResponse<object>.ErrorResult("Subject not found"));
            }

            var dto = new SubjectDto
            {
                Id = subject.Id,
                Name = subject.Name,
                Code = subject.Code,
                Description = subject.Description
            };

            return Ok(ApiResponse<SubjectDto>.SuccessResult(dto));
        }

        /// <summary>
        /// Create a new subject (Admin only)
        /// </summary>
        [HttpPost]
        [Authorize(Roles = "Admin")]
        [ProducesResponseType(typeof(ApiResponse<SubjectDto>), StatusCodes.Status201Created)]
        public async Task<IActionResult> CreateSubject([FromBody] SubjectDto dto)
        {
            if (!ModelState.IsValid)
                return BadRequest(ApiResponse<object>.ErrorResult("Invalid subject payload"));

            var subject = new Subject
            {
                Id = !string.IsNullOrEmpty(dto.Id) ? dto.Id : Guid.NewGuid().ToString(),
                Name = dto.Name,
                Code = dto.Code,
                Description = dto.Description
            };

            _db.Subjects.Add(subject);
            await _db.SaveChangesAsync();

            dto.Id = subject.Id;
            return Created("", ApiResponse<SubjectDto>.SuccessResult(dto, "Subject created successfully"));
        }
    }
}
