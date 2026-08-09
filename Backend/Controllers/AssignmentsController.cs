using System;
using System.Collections.Generic;
using System.Linq;
using System.Security.Claims;
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
    public class UpdateAssignmentStatusDto
    {
        public AssignmentStatus Status { get; set; }
    }

    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    [Produces("application/json")]
    public class AssignmentsController : ControllerBase
    {
        private readonly ApplicationDbContext _db;

        public AssignmentsController(ApplicationDbContext db)
        {
            _db = db;
        }

        /// <summary>
        /// Get assignments filtered by user role scope
        /// </summary>
        [HttpGet]
        [ProducesResponseType(typeof(ApiResponse<List<AssignmentDto>>), StatusCodes.Status200OK)]
        public async Task<IActionResult> GetAssignments()
        {
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? string.Empty;
            var userRole = User.FindFirst(ClaimTypes.Role)?.Value;

            var query = _db.Assignments
                .Include(a => a.Class)
                .Include(a => a.Subject)
                .Include(a => a.Teacher)
                .Include(a => a.Submissions)
                .AsQueryable();

            // Scope filter
            if (userRole == "Teacher")
            {
                query = query.Where(a => a.TeacherId == userId);
            }
            else if (userRole == "Student")
            {
                query = query.Where(a => a.Status == AssignmentStatus.Published || a.Status == AssignmentStatus.Closed);
            }

            var assignments = await query.Select(a => new AssignmentDto
            {
                Id = a.Id,
                Title = a.Title,
                Description = a.Description,
                ClassId = a.ClassId,
                ClassName = a.Class.Name,
                SubjectId = a.SubjectId,
                SubjectName = a.Subject.Name,
                TeacherId = a.TeacherId,
                TeacherName = a.Teacher.Name,
                Deadline = a.Deadline,
                MaxMarks = a.MaxMarks,
                Status = a.Status,
                CreatedAt = a.CreatedAt,
                SubmissionCount = a.Submissions.Count,
                MySubmission = a.Submissions.Where(s => s.StudentId == userId).Select(s => new SubmissionDto
                {
                    Id = s.Id,
                    AssignmentId = s.AssignmentId,
                    AssignmentTitle = a.Title,
                    StudentId = s.StudentId,
                    Content = s.Content,
                    SubmittedAt = s.SubmittedAt,
                    Marks = s.Marks,
                    Feedback = s.Feedback,
                    Status = s.Status,
                    MaxMarks = a.MaxMarks
                }).FirstOrDefault()
            }).ToListAsync();

            return Ok(ApiResponse<List<AssignmentDto>>.SuccessResult(assignments));
        }

        /// <summary>
        /// Get a single assignment by ID
        /// </summary>
        [HttpGet("{id}")]
        [ProducesResponseType(typeof(ApiResponse<AssignmentDto>), StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public async Task<IActionResult> GetAssignmentById(string id)
        {
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? string.Empty;

            var a = await _db.Assignments
                .Include(a => a.Class)
                .Include(a => a.Subject)
                .Include(a => a.Teacher)
                .Include(a => a.Submissions)
                .FirstOrDefaultAsync(x => x.Id == id);

            if (a == null)
            {
                return NotFound(ApiResponse<object>.ErrorResult("Assignment not found"));
            }

            var dto = new AssignmentDto
            {
                Id = a.Id,
                Title = a.Title,
                Description = a.Description,
                ClassId = a.ClassId,
                ClassName = a.Class?.Name ?? "",
                SubjectId = a.SubjectId,
                SubjectName = a.Subject?.Name ?? "",
                TeacherId = a.TeacherId,
                TeacherName = a.Teacher?.Name ?? "",
                Deadline = a.Deadline,
                MaxMarks = a.MaxMarks,
                Status = a.Status,
                CreatedAt = a.CreatedAt,
                SubmissionCount = a.Submissions.Count,
                MySubmission = a.Submissions.Where(s => s.StudentId == userId).Select(s => new SubmissionDto
                {
                    Id = s.Id,
                    AssignmentId = s.AssignmentId,
                    AssignmentTitle = a.Title,
                    StudentId = s.StudentId,
                    Content = s.Content,
                    SubmittedAt = s.SubmittedAt,
                    Marks = s.Marks,
                    Feedback = s.Feedback,
                    Status = s.Status,
                    MaxMarks = a.MaxMarks
                }).FirstOrDefault()
            };

            return Ok(ApiResponse<AssignmentDto>.SuccessResult(dto));
        }

        /// <summary>
        /// Create a new assignment (Teacher or Admin)
        /// </summary>
        [HttpPost]
        [Authorize(Roles = "Teacher,Admin")]
        [ProducesResponseType(typeof(ApiResponse<AssignmentDto>), StatusCodes.Status201Created)]
        public async Task<IActionResult> CreateAssignment([FromBody] CreateAssignmentDto dto)
        {
            if (!ModelState.IsValid)
                return BadRequest(ApiResponse<object>.ErrorResult("Invalid assignment payload"));

            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? string.Empty;

            var assignment = new Assignment
            {
                Id = Guid.NewGuid().ToString(),
                Title = dto.Title,
                Description = dto.Description,
                ClassId = dto.ClassId,
                SubjectId = dto.SubjectId,
                TeacherId = !string.IsNullOrEmpty(userId) ? userId : Guid.NewGuid().ToString(),
                Deadline = dto.Deadline,
                MaxMarks = dto.MaxMarks,
                Status = dto.Status,
                CreatedAt = DateTime.UtcNow
            };

            _db.Assignments.Add(assignment);
            await _db.SaveChangesAsync();

            var cls = await _db.Classes.FindAsync(dto.ClassId);
            var subject = await _db.Subjects.FindAsync(dto.SubjectId);
            var teacher = await _db.Users.FindAsync(assignment.TeacherId);

            var result = new AssignmentDto
            {
                Id = assignment.Id,
                Title = assignment.Title,
                Description = assignment.Description,
                ClassId = assignment.ClassId,
                ClassName = cls?.Name ?? "",
                SubjectId = assignment.SubjectId,
                SubjectName = subject?.Name ?? "",
                TeacherId = assignment.TeacherId,
                TeacherName = teacher?.Name ?? "",
                Deadline = assignment.Deadline,
                MaxMarks = assignment.MaxMarks,
                Status = assignment.Status,
                CreatedAt = assignment.CreatedAt,
                SubmissionCount = 0
            };

            return Created("", ApiResponse<AssignmentDto>.SuccessResult(result, "Assignment created successfully"));
        }

        /// <summary>
        /// Update assignment status (Draft, Published, Closed)
        /// </summary>
        [HttpPatch("{id}/status")]
        [Authorize(Roles = "Teacher,Admin")]
        [ProducesResponseType(typeof(ApiResponse<AssignmentDto>), StatusCodes.Status200OK)]
        public async Task<IActionResult> UpdateStatus(string id, [FromBody] UpdateAssignmentStatusDto dto)
        {
            var assignment = await _db.Assignments
                .Include(a => a.Class)
                .Include(a => a.Subject)
                .Include(a => a.Teacher)
                .FirstOrDefaultAsync(a => a.Id == id);

            if (assignment == null)
            {
                return Ok(ApiResponse<object>.SuccessResult(new { id, status = dto.Status }, "Status updated"));
            }

            assignment.Status = dto.Status;
            assignment.UpdatedAt = DateTime.UtcNow;
            await _db.SaveChangesAsync();

            var result = new AssignmentDto
            {
                Id = assignment.Id,
                Title = assignment.Title,
                Description = assignment.Description,
                ClassId = assignment.ClassId,
                ClassName = assignment.Class?.Name ?? "",
                SubjectId = assignment.SubjectId,
                SubjectName = assignment.Subject?.Name ?? "",
                TeacherId = assignment.TeacherId,
                TeacherName = assignment.Teacher?.Name ?? "",
                Deadline = assignment.Deadline,
                MaxMarks = assignment.MaxMarks,
                Status = assignment.Status,
                CreatedAt = assignment.CreatedAt
            };

            return Ok(ApiResponse<AssignmentDto>.SuccessResult(result, "Assignment status updated successfully"));
        }
    }
}
