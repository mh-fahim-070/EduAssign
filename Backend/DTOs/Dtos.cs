using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using AssignmentSystem.Models;
// using System.ComponentModel.DataAnnotations;

namespace AssignmentSystem.DTOs
{
    public class ApiResponse<T>
    {
        public bool Success { get; set; }
        public string Message { get; set; } = string.Empty;
        public T? Data { get; set; }
        public List<string>? Errors { get; set; }

        public static ApiResponse<T> SuccessResult(T data, string message = "Success") =>
            new() { Success = true, Message = message, Data = data };

        public static ApiResponse<T> ErrorResult(string message, List<string>? errors = null) =>
            new() { Success = false, Message = message, Errors = errors ?? new List<string>() };
    }

    public class LoginRequestDto
    {
        [Required, EmailAddress]
        public string Email { get; set; } = string.Empty;

        [Required]
        public string Password { get; set; } = string.Empty;
    }

    public class AuthResponseDto
    {
        public string Token { get; set; } = string.Empty;
        public UserDto User { get; set; } = null!;
    }

    public class UserDto
    {
        public string Id { get; set; } = string.Empty;
        public string Name { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public UserRole Role { get; set; }
        public DateTime CreatedAt { get; set; }
    }

    public class CreateUserDto
    {
        [Required, MaxLength(100)]
        public string Name { get; set; } = string.Empty;

        [Required, EmailAddress, MaxLength(150)]
        public string Email { get; set; } = string.Empty;

        [Required, MinLength(6)]
        public string Password { get; set; } = string.Empty;

        [Required]
        public UserRole Role { get; set; }
    }

    public class ClassDto
    {
        public string Id { get; set; } = string.Empty;
        public string Name { get; set; } = string.Empty;
        public string GradeLevel { get; set; } = string.Empty;
        public string Code { get; set; } = string.Empty;
        public string? Description { get; set; }
    }

    public class SubjectDto
    {
        public string Id { get; set; } = string.Empty;
        public string Name { get; set; } = string.Empty;
        public string Code { get; set; } = string.Empty;
        public string? Description { get; set; }
    }

    public class CreateAssignmentDto
    {
        [Required, MaxLength(200)]
        public string Title { get; set; } = string.Empty;

        [Required]
        public string Description { get; set; } = string.Empty;

        [Required]
        public string ClassId { get; set; } = string.Empty;

        [Required]
        public string SubjectId { get; set; } = string.Empty;

        [Required]
        public DateTime Deadline { get; set; }

        [Required, Range(1, 1000)]
        public int MaxMarks { get; set; }

        public AssignmentStatus Status { get; set; } = AssignmentStatus.Draft;
    }
//     public class UpdateAssignmentStatusDto
//    {
//     [Required]
//     public string Id { get; set; } = string.Empty;

//     [Required]
//     public AssignmentStatus Status { get; set; }
//     }   
 


    public class UpdateAssignmentDto
    {
        [Required, MaxLength(200)]
        public string Title { get; set; } = string.Empty;

        [Required]
        public string Description { get; set; } = string.Empty;

        [Required]
        public DateTime Deadline { get; set; }

        [Required, Range(1, 1000)]
        public int MaxMarks { get; set; }

        public AssignmentStatus Status { get; set; }
    }

    public class AssignmentDto
    {
        public string Id { get; set; } = string.Empty;
        public string Title { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public string ClassId { get; set; } = string.Empty;
        public string ClassName { get; set; } = string.Empty;
        public string SubjectId { get; set; } = string.Empty;
        public string SubjectName { get; set; } = string.Empty;
        public string TeacherId { get; set; } = string.Empty;
        public string TeacherName { get; set; } = string.Empty;
        public DateTime Deadline { get; set; }
        public int MaxMarks { get; set; }
        public AssignmentStatus Status { get; set; }
        public DateTime CreatedAt { get; set; }
        public int SubmissionCount { get; set; }
        public SubmissionDto? MySubmission { get; set; }
    }

    public class CreateSubmissionDto
    {
        [Required]
        public string AssignmentId { get; set; } = string.Empty;

        [Required]
        public string Content { get; set; } = string.Empty;
    }

    public class GradeSubmissionDto
    {
        [Required, Range(0, 1000)]
        public int Marks { get; set; }

        public string? Feedback { get; set; }

        public SubmissionStatus Status { get; set; } = SubmissionStatus.Reviewed;
    }

    public class SubmissionDto
    {
        public string Id { get; set; } = string.Empty;
        public string AssignmentId { get; set; } = string.Empty;
        public string AssignmentTitle { get; set; } = string.Empty;
        public string StudentId { get; set; } = string.Empty;
        public string StudentName { get; set; } = string.Empty;
        public string StudentEmail { get; set; } = string.Empty;
        public string Content { get; set; } = string.Empty;
        public DateTime SubmittedAt { get; set; }
        public int? Marks { get; set; }
        public string? Feedback { get; set; }
        public SubmissionStatus Status { get; set; }
        public int MaxMarks { get; set; }
    }

    public class SystemSettingsDto
    {
        public string PortalName { get; set; } = "EduAssign Portal";
        public string AcademicYear { get; set; } = "2025-2026";
        public bool AllowStudentSelfRegistration { get; set; } = true;
        public int MaxFileUploadMb { get; set; } = 25;
        public bool MaintenanceMode { get; set; } = false;
    }
}
