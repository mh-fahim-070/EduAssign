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
    public class StudentClassDto
    {
        public string Id { get; set; } = string.Empty;
        public string StudentId { get; set; } = string.Empty;
        public string StudentName { get; set; } = string.Empty;
        public string ClassId { get; set; } = string.Empty;
        public string ClassName { get; set; } = string.Empty;
        public DateTime EnrolledAt { get; set; }
    }

    public class EnrollStudentDto
    {
        public string StudentId { get; set; } = string.Empty;
        public string ClassId { get; set; } = string.Empty;
    }

    [ApiController]
    [Route("api/student-classes")]
    [Authorize]
    [Produces("application/json")]
    public class StudentClassesController : ControllerBase
    {
        private readonly ApplicationDbContext _db;

        public StudentClassesController(ApplicationDbContext db)
        {
            _db = db;
        }

        /// <summary>
        /// List student class enrollments
        /// </summary>
        [HttpGet]
        [ProducesResponseType(typeof(ApiResponse<List<StudentClassDto>>), StatusCodes.Status200OK)]
        public async Task<IActionResult> GetStudentClasses()
        {
            var list = await _db.StudentClasses
                .Include(sc => sc.Student)
                .Include(sc => sc.Class)
                .Select(sc => new StudentClassDto
                {
                    Id = sc.Id,
                    StudentId = sc.StudentId,
                    StudentName = sc.Student.Name,
                    ClassId = sc.ClassId,
                    ClassName = sc.Class.Name,
                    EnrolledAt = sc.EnrolledAt
                }).ToListAsync();

            return Ok(ApiResponse<List<StudentClassDto>>.SuccessResult(list));
        }

        /// <summary>
        /// Enroll a student in a class (Admin only)
        /// </summary>
        [HttpPost]
        [Authorize(Roles = "Admin")]
        [ProducesResponseType(typeof(ApiResponse<StudentClassDto>), StatusCodes.Status201Created)]
        public async Task<IActionResult> EnrollStudent([FromBody] EnrollStudentDto dto)
        {
            if (!ModelState.IsValid)
                return BadRequest(ApiResponse<object>.ErrorResult("Invalid enrollment payload"));

            var entity = new StudentClass
            {
                Id = Guid.NewGuid().ToString(),
                StudentId = dto.StudentId,
                ClassId = dto.ClassId,
                EnrolledAt = DateTime.UtcNow
            };

            _db.StudentClasses.Add(entity);
            await _db.SaveChangesAsync();

            var student = await _db.Users.FindAsync(dto.StudentId);
            var cls = await _db.Classes.FindAsync(dto.ClassId);

            var result = new StudentClassDto
            {
                Id = entity.Id,
                StudentId = entity.StudentId,
                StudentName = student?.Name ?? "",
                ClassId = entity.ClassId,
                ClassName = cls?.Name ?? "",
                EnrolledAt = entity.EnrolledAt
            };

            return Created("", ApiResponse<StudentClassDto>.SuccessResult(result, "Student enrolled successfully"));
        }
    }
}
