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
    public class TeacherAssignmentDto
    {
        public string Id { get; set; } = string.Empty;
        public string TeacherId { get; set; } = string.Empty;
        public string TeacherName { get; set; } = string.Empty;
        public string SubjectId { get; set; } = string.Empty;
        public string SubjectName { get; set; } = string.Empty;
        public string ClassId { get; set; } = string.Empty;
        public string ClassName { get; set; } = string.Empty;
        public DateTime AssignedAt { get; set; }
    }

    public class CreateTeacherAssignmentDto
    {
        public string TeacherId { get; set; } = string.Empty;
        public string SubjectId { get; set; } = string.Empty;
        public string ClassId { get; set; } = string.Empty;
    }

    [ApiController]
    [Route("api/teacher-assignments")]
    [Authorize]
    [Produces("application/json")]
    public class TeacherAssignmentsController : ControllerBase
    {
        private readonly ApplicationDbContext _db;

        public TeacherAssignmentsController(ApplicationDbContext db)
        {
            _db = db;
        }

        /// <summary>
        /// List teacher subject and class mappings
        /// </summary>
        [HttpGet]
        [ProducesResponseType(typeof(ApiResponse<List<TeacherAssignmentDto>>), StatusCodes.Status200OK)]
        public async Task<IActionResult> GetTeacherAssignments()
        {
            var list = await _db.TeacherSubjectClasses
                .Include(tsc => tsc.Teacher)
                .Include(tsc => tsc.Subject)
                .Include(tsc => tsc.Class)
                .Select(tsc => new TeacherAssignmentDto
                {
                    Id = tsc.Id,
                    TeacherId = tsc.TeacherId,
                    TeacherName = tsc.Teacher.Name,
                    SubjectId = tsc.SubjectId,
                    SubjectName = tsc.Subject.Name,
                    ClassId = tsc.ClassId,
                    ClassName = tsc.Class.Name,
                    AssignedAt = tsc.AssignedAt
                }).ToListAsync();

            return Ok(ApiResponse<List<TeacherAssignmentDto>>.SuccessResult(list));
        }

        /// <summary>
        /// Assign a teacher to a subject and class (Admin only)
        /// </summary>
        [HttpPost]
        [Authorize(Roles = "Admin")]
        [ProducesResponseType(typeof(ApiResponse<TeacherAssignmentDto>), StatusCodes.Status201Created)]
        public async Task<IActionResult> CreateTeacherAssignment([FromBody] CreateTeacherAssignmentDto dto)
        {
            if (!ModelState.IsValid)
                return BadRequest(ApiResponse<object>.ErrorResult("Invalid request payload"));

            var entity = new TeacherSubjectClass
            {
                Id = Guid.NewGuid().ToString(),
                TeacherId = dto.TeacherId,
                SubjectId = dto.SubjectId,
                ClassId = dto.ClassId,
                AssignedAt = DateTime.UtcNow
            };

            _db.TeacherSubjectClasses.Add(entity);
            await _db.SaveChangesAsync();

            var teacher = await _db.Users.FindAsync(dto.TeacherId);
            var subject = await _db.Subjects.FindAsync(dto.SubjectId);
            var cls = await _db.Classes.FindAsync(dto.ClassId);

            var result = new TeacherAssignmentDto
            {
                Id = entity.Id,
                TeacherId = entity.TeacherId,
                TeacherName = teacher?.Name ?? "",
                SubjectId = entity.SubjectId,
                SubjectName = subject?.Name ?? "",
                ClassId = entity.ClassId,
                ClassName = cls?.Name ?? "",
                AssignedAt = entity.AssignedAt
            };

            return Created("", ApiResponse<TeacherAssignmentDto>.SuccessResult(result, "Teacher assigned successfully"));
        }
    }
}
