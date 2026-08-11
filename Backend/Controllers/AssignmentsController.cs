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
        [Authorize(Roles = "Teacher")]
        [ProducesResponseType(typeof(ApiResponse<AssignmentDto>), StatusCodes.Status201Created)]
       public async Task<IActionResult> CreateAssignment([FromBody] CreateAssignmentDto dto)
       {
       if (!ModelState.IsValid)
        return BadRequest(
            ApiResponse<object>.ErrorResult("Invalid assignment payload")
        );

    var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

    if (string.IsNullOrWhiteSpace(userId))
    {
        return Unauthorized(
            ApiResponse<object>.ErrorResult("User identity not found")
        );
    }

    // Make sure the deadline is UTC before sending it to PostgreSQL
    DateTime deadlineUtc;

    if (dto.Deadline.Kind == DateTimeKind.Utc)
    {
        deadlineUtc = dto.Deadline;
    }
    else if (dto.Deadline.Kind == DateTimeKind.Local)
    {
        deadlineUtc = dto.Deadline.ToUniversalTime();
    }
    else
    {
        // The value has no timezone information.
        // Treat it as UTC.
        deadlineUtc = DateTime.SpecifyKind(
            dto.Deadline,
            DateTimeKind.Utc
        );
    }

    // Verify Class exists
    var cls = await _db.Classes.FindAsync(dto.ClassId);

    if (cls == null)
    {
        return BadRequest(
            ApiResponse<object>.ErrorResult(
                $"Class '{dto.ClassId}' not found"
            )
        );
    }

    // Verify Subject exists
    var subject = await _db.Subjects.FindAsync(dto.SubjectId);

    if (subject == null)
    {
        return BadRequest(
            ApiResponse<object>.ErrorResult(
                $"Subject '{dto.SubjectId}' not found"
            )
        );
    }

    // Verify Teacher exists
    var teacher = await _db.Users.FindAsync(userId);

    if (teacher == null)
    {
        return Unauthorized(
            ApiResponse<object>.ErrorResult(
                "Teacher/Admin user not found"
            )
        );
    }

    var nowUtc = DateTime.UtcNow;

    var assignment = new Assignment
    {
        Id = Guid.NewGuid().ToString(),
        Title = dto.Title,
        Description = dto.Description,
        ClassId = dto.ClassId,
        SubjectId = dto.SubjectId,
        TeacherId = userId,

        // IMPORTANT: UTC
        Deadline = deadlineUtc,

        MaxMarks = dto.MaxMarks,
        Status = dto.Status,

        // IMPORTANT: UTC
        CreatedAt = nowUtc,
        UpdatedAt = nowUtc
    };

    _db.Assignments.Add(assignment);

    await _db.SaveChangesAsync();

    var result = new AssignmentDto
    {
        Id = assignment.Id,
        Title = assignment.Title,
        Description = assignment.Description,

        ClassId = assignment.ClassId,
        ClassName = cls.Name,

        SubjectId = assignment.SubjectId,
        SubjectName = subject.Name,

        TeacherId = assignment.TeacherId,
        TeacherName = teacher.Name,

        Deadline = assignment.Deadline,
        MaxMarks = assignment.MaxMarks,
        Status = assignment.Status,

        CreatedAt = assignment.CreatedAt,
        SubmissionCount = 0
    };

    return Created(
        "",
        ApiResponse<AssignmentDto>.SuccessResult(
            result,
            "Assignment created successfully"
        )
    );
}

         /// <summary>
/// Update assignment
/// </summary>
[HttpPut("{id}")]
[Authorize(Roles = "Teacher")]
[ProducesResponseType(
    typeof(ApiResponse<AssignmentDto>),
    StatusCodes.Status200OK
)]
[ProducesResponseType(StatusCodes.Status404NotFound)]
public async Task<IActionResult> UpdateAssignment(
    string id,
    [FromBody] UpdateAssignmentDto dto)
{
    var assignment = await _db.Assignments
        .Include(a => a.Class)
        .Include(a => a.Subject)
        .Include(a => a.Teacher)
        .FirstOrDefaultAsync(a => a.Id == id);

    if (assignment == null)
    {
        return NotFound(
            ApiResponse<object>.ErrorResult(
                "Assignment not found"
            )
        );
    }

    // Update fields
    assignment.Title = dto.Title;
    assignment.Description = dto.Description;
    assignment.Deadline = dto.Deadline.Kind == DateTimeKind.Utc
        ? dto.Deadline
        : DateTime.SpecifyKind(dto.Deadline, DateTimeKind.Utc);

    assignment.MaxMarks = dto.MaxMarks;
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

        CreatedAt = assignment.CreatedAt,
        SubmissionCount = assignment.Submissions?.Count ?? 0
    };

    return Ok(
        ApiResponse<AssignmentDto>.SuccessResult(
            result,
            "Assignment updated successfully"
        )
    );
}

    

        /// <summary>
        /// Update assignment status (Draft, Published, Closed)
        /// </summary>
   /// <summary>
        /// Update assignment status (Draft, Published, Closed)
        /// </summary>
        [HttpPatch("{id}/status")]
        [Authorize(Roles = "Teacher")]
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
          
        
        /// <summary>
       /// Delete an assignment (Teacher or Admin)
     /// </summary>
       [HttpDelete("{id}")]
       [Authorize(Roles = "Teacher")]
       [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status200OK)]
       [ProducesResponseType(StatusCodes.Status404NotFound)]
public async Task<IActionResult> DeleteAssignment(string id)
{
    var assignment = await _db.Assignments
        .FirstOrDefaultAsync(a => a.Id == id);

    if (assignment == null)
    {
        return NotFound(
            ApiResponse<object>.ErrorResult("Assignment not found")
        );
    }

    // Check whether students have submitted anything
    var hasSubmissions = await _db.Submissions
        .AnyAsync(s => s.AssignmentId == id);

    if (hasSubmissions)
    {
        return Conflict(
            ApiResponse<object>.ErrorResult(
                "Assignment cannot be deleted because students have already submitted work for this assignment."
            )
        );
    }

    _db.Assignments.Remove(assignment);
    await _db.SaveChangesAsync();

    return Ok(
        ApiResponse<object>.SuccessResult(
            new { id },
            "Assignment deleted successfully"
        )
      );
     }


    
    }
}
