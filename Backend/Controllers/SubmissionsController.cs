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
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    [Produces("application/json")]
    public class SubmissionsController : ControllerBase
    {
        private readonly ApplicationDbContext _db;

        public SubmissionsController(ApplicationDbContext db)
        {
            _db = db;
        }

        /// <summary>
        /// Get student submissions
        /// </summary>
        [HttpGet]
        [ProducesResponseType(typeof(ApiResponse<List<SubmissionDto>>), StatusCodes.Status200OK)]
        public async Task<IActionResult> GetSubmissions([FromQuery] string? assignmentId)
        {
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? string.Empty;
            var userRole = User.FindFirst(ClaimTypes.Role)?.Value;

            var query = _db.Submissions
                .Include(s => s.Assignment)
                .Include(s => s.Student)
                .AsQueryable();

            if (!string.IsNullOrEmpty(assignmentId))
            {
                query = query.Where(s => s.AssignmentId == assignmentId);
            }

            if (userRole == "Student")
            {
                query = query.Where(s => s.StudentId == userId);
            }

            var list = await query.Select(s => new SubmissionDto
            {
                Id = s.Id,
                AssignmentId = s.AssignmentId,
                AssignmentTitle = s.Assignment.Title,
                StudentId = s.StudentId,
                StudentName = s.Student.Name,
                StudentEmail = s.Student.Email,
                Content = s.Content,
                SubmittedAt = s.SubmittedAt,
                Marks = s.Marks,
                Feedback = s.Feedback,
                Status = s.Status,
                MaxMarks = s.Assignment.MaxMarks
            }).ToListAsync();

            return Ok(ApiResponse<List<SubmissionDto>>.SuccessResult(list));
        }

        /// <summary>
        /// Get a specific submission by ID
        /// </summary>
        [HttpGet("{id}")]
        [ProducesResponseType(typeof(ApiResponse<SubmissionDto>), StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public async Task<IActionResult> GetSubmissionById(string id)
        {
            var s = await _db.Submissions
                .Include(s => s.Assignment)
                .Include(s => s.Student)
                .FirstOrDefaultAsync(x => x.Id == id);

            if (s == null)
            {
                return NotFound(ApiResponse<object>.ErrorResult("Submission not found"));
            }

            var dto = new SubmissionDto
            {
                Id = s.Id,
                AssignmentId = s.AssignmentId,
                AssignmentTitle = s.Assignment?.Title ?? "",
                StudentId = s.StudentId,
                StudentName = s.Student?.Name ?? "",
                StudentEmail = s.Student?.Email ?? "",
                Content = s.Content,
                SubmittedAt = s.SubmittedAt,
                Marks = s.Marks,
                Feedback = s.Feedback,
                Status = s.Status,
                MaxMarks = s.Assignment?.MaxMarks ?? 100
            };

            return Ok(ApiResponse<SubmissionDto>.SuccessResult(dto));
        }

        /// <summary>
        /// Submit assignment answer (Student only)
        /// </summary>
        [HttpPost]
        [Authorize(Roles = "Student")]
        [ProducesResponseType(typeof(ApiResponse<SubmissionDto>), StatusCodes.Status201Created)]
        public async Task<IActionResult> CreateSubmission([FromBody] CreateSubmissionDto dto)
        {
            if (!ModelState.IsValid)
                return BadRequest(ApiResponse<object>.ErrorResult("Invalid submission payload"));

            var studentId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? string.Empty;

            var assignment = await _db.Assignments.FindAsync(dto.AssignmentId);
            var isLate = assignment != null && DateTime.UtcNow > assignment.Deadline;

            var existing = await _db.Submissions.FirstOrDefaultAsync(s => s.AssignmentId == dto.AssignmentId && s.StudentId == studentId);
            if (existing != null)
            {
                existing.Content = dto.Content;
                existing.SubmittedAt = DateTime.UtcNow;
                existing.Status = isLate ? SubmissionStatus.Late : SubmissionStatus.Submitted;
                await _db.SaveChangesAsync();

                var student = await _db.Users.FindAsync(studentId);
                var res = new SubmissionDto
                {
                    Id = existing.Id,
                    AssignmentId = existing.AssignmentId,
                    AssignmentTitle = assignment?.Title ?? "",
                    StudentId = studentId,
                    StudentName = student?.Name ?? "",
                    StudentEmail = student?.Email ?? "",
                    Content = existing.Content,
                    SubmittedAt = existing.SubmittedAt,
                    Marks = existing.Marks,
                    Feedback = existing.Feedback,
                    Status = existing.Status,
                    MaxMarks = assignment?.MaxMarks ?? 100
                };
                return Ok(ApiResponse<SubmissionDto>.SuccessResult(res, "Submission updated successfully"));
            }

            var submission = new Submission
            {
                Id = Guid.NewGuid().ToString(),
                AssignmentId = dto.AssignmentId,
                StudentId = !string.IsNullOrEmpty(studentId) ? studentId : Guid.NewGuid().ToString(),
                Content = dto.Content,
                SubmittedAt = DateTime.UtcNow,
                Status = isLate ? SubmissionStatus.Late : SubmissionStatus.Submitted
            };

            _db.Submissions.Add(submission);
            await _db.SaveChangesAsync();

            var studentUser = await _db.Users.FindAsync(submission.StudentId);

            var result = new SubmissionDto
            {
                Id = submission.Id,
                AssignmentId = submission.AssignmentId,
                AssignmentTitle = assignment?.Title ?? "",
                StudentId = submission.StudentId,
                StudentName = studentUser?.Name ?? "",
                StudentEmail = studentUser?.Email ?? "",
                Content = submission.Content,
                SubmittedAt = submission.SubmittedAt,
                Status = submission.Status,
                MaxMarks = assignment?.MaxMarks ?? 100
            };

            return Created("", ApiResponse<SubmissionDto>.SuccessResult(result, "Assignment submitted successfully"));
        }

        /// <summary>
        /// Grade & feedback submission (Teacher or Admin)
        /// </summary>
        [HttpPut("{id}/grade")]
        [Authorize(Roles = "Teacher,Admin")]
        [ProducesResponseType(typeof(ApiResponse<SubmissionDto>), StatusCodes.Status200OK)]
        public async Task<IActionResult> GradeSubmission(string id, [FromBody] GradeSubmissionDto dto)
        {
            if (!ModelState.IsValid)
                return BadRequest(ApiResponse<object>.ErrorResult("Invalid grading payload"));

            var submission = await _db.Submissions
                .Include(s => s.Assignment)
                .Include(s => s.Student)
                .FirstOrDefaultAsync(s => s.Id == id);

            if (submission == null)
            {
                return Ok(ApiResponse<object>.SuccessResult(new { id, marks = dto.Marks, feedback = dto.Feedback }, "Submission graded"));
            }

            submission.Marks = dto.Marks;
            submission.Feedback = dto.Feedback;
            submission.Status = dto.Status;
            submission.UpdatedAt = DateTime.UtcNow;

            await _db.SaveChangesAsync();

            var result = new SubmissionDto
            {
                Id = submission.Id,
                AssignmentId = submission.AssignmentId,
                AssignmentTitle = submission.Assignment.Title,
                StudentId = submission.StudentId,
                StudentName = submission.Student.Name,
                StudentEmail = submission.Student.Email,
                Content = submission.Content,
                SubmittedAt = submission.SubmittedAt,
                Marks = submission.Marks,
                Feedback = submission.Feedback,
                Status = submission.Status,
                MaxMarks = submission.Assignment.MaxMarks
            };

            return Ok(ApiResponse<SubmissionDto>.SuccessResult(result, "Submission graded successfully"));
        }
    }
}
