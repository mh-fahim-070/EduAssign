using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace AssignmentSystem.Models
{
    public abstract class BaseEntity
    {
        [Key]
        public string Id { get; set; } = Guid.NewGuid().ToString();
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    }

    public class User : BaseEntity
    {
        [Required]
        [MaxLength(100)]
        public string Name { get; set; } = string.Empty;

        [Required]
        [EmailAddress]
        [MaxLength(150)]
        public string Email { get; set; } = string.Empty;

        [Required]
        public string PasswordHash { get; set; } = string.Empty;

        [Required]
        public UserRole Role { get; set; }

        public ICollection<StudentClass> StudentClasses { get; set; } = new List<StudentClass>();
        public ICollection<TeacherSubjectClass> TeacherAssignments { get; set; } = new List<TeacherSubjectClass>();
        public ICollection<Assignment> CreatedAssignments { get; set; } = new List<Assignment>();
        public ICollection<Submission> Submissions { get; set; } = new List<Submission>();
    }

    public class Class : BaseEntity
    {
        [Required]
        [MaxLength(100)]
        public string Name { get; set; } = string.Empty;

        [Required]
        [MaxLength(50)]
        public string GradeLevel { get; set; } = string.Empty;

        [Required]
        [MaxLength(50)]
        public string Code { get; set; } = string.Empty;

        public string? Description { get; set; }

        public ICollection<StudentClass> StudentClasses { get; set; } = new List<StudentClass>();
        public ICollection<TeacherSubjectClass> TeacherAssignments { get; set; } = new List<TeacherSubjectClass>();
        public ICollection<Assignment> Assignments { get; set; } = new List<Assignment>();
    }

    public class Subject : BaseEntity
    {
        [Required]
        [MaxLength(100)]
        public string Name { get; set; } = string.Empty;

        [Required]
        [MaxLength(50)]
        public string Code { get; set; } = string.Empty;

        public string? Description { get; set; }

        public ICollection<TeacherSubjectClass> TeacherAssignments { get; set; } = new List<TeacherSubjectClass>();
        public ICollection<Assignment> Assignments { get; set; } = new List<Assignment>();
    }

    public class StudentClass
    {
        [Key]
        public string Id { get; set; } = Guid.NewGuid().ToString();

        [Required]
        public string StudentId { get; set; } = string.Empty;
        [ForeignKey(nameof(StudentId))]
        public User Student { get; set; } = null!;

        [Required]
        public string ClassId { get; set; } = string.Empty;
        [ForeignKey(nameof(ClassId))]
        public Class Class { get; set; } = null!;

        public DateTime EnrolledAt { get; set; } = DateTime.UtcNow;
    }

    public class TeacherSubjectClass
    {
        [Key]
        public string Id { get; set; } = Guid.NewGuid().ToString();

        [Required]
        public string TeacherId { get; set; } = string.Empty;
        [ForeignKey(nameof(TeacherId))]
        public User Teacher { get; set; } = null!;

        [Required]
        public string SubjectId { get; set; } = string.Empty;
        [ForeignKey(nameof(SubjectId))]
        public Subject Subject { get; set; } = null!;

        [Required]
        public string ClassId { get; set; } = string.Empty;
        [ForeignKey(nameof(ClassId))]
        public Class Class { get; set; } = null!;

        public DateTime AssignedAt { get; set; } = DateTime.UtcNow;
    }

    public class Assignment : BaseEntity
    {
        [Required]
        [MaxLength(200)]
        public string Title { get; set; } = string.Empty;

        [Required]
        public string Description { get; set; } = string.Empty;

        [Required]
        public string ClassId { get; set; } = string.Empty;
        [ForeignKey(nameof(ClassId))]
        public Class Class { get; set; } = null!;

        [Required]
        public string SubjectId { get; set; } = string.Empty;
        [ForeignKey(nameof(SubjectId))]
        public Subject Subject { get; set; } = null!;

        [Required]
        public string TeacherId { get; set; } = string.Empty;
        [ForeignKey(nameof(TeacherId))]
        public User Teacher { get; set; } = null!;

        [Required]
        public DateTime Deadline { get; set; }

        [Required]
        [Range(1, 1000)]
        public int MaxMarks { get; set; }

        [Required]
        public AssignmentStatus Status { get; set; } = AssignmentStatus.Draft;

        public ICollection<Submission> Submissions { get; set; } = new List<Submission>();
    }

    public class Submission 
    {
        [Key]
    public string Id { get; set; } = Guid.NewGuid().ToString();

    [Required]
    public string AssignmentId { get; set; } = string.Empty;

    [ForeignKey(nameof(AssignmentId))]
    public Assignment Assignment { get; set; } = null!;

    [Required]
    public string StudentId { get; set; } = string.Empty;

    [ForeignKey(nameof(StudentId))]
    public User Student { get; set; } = null!;

    [Required]
    public string Content { get; set; } = string.Empty;

    public DateTime SubmittedAt { get; set; } = DateTime.UtcNow;

    public int? Marks { get; set; }

    public string? Feedback { get; set; }

    [Required]
    public SubmissionStatus Status { get; set; } = SubmissionStatus.Submitted;

    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    }
}
