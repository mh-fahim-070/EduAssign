using AssignmentSystem.Models;
using Microsoft.EntityFrameworkCore;

namespace AssignmentSystem.Data
{
    public class ApplicationDbContext : DbContext
    {
        public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options)
            : base(options)
        {
        }

        public DbSet<User> Users => Set<User>();
        public DbSet<Class> Classes => Set<Class>();
        public DbSet<Subject> Subjects => Set<Subject>();
        public DbSet<StudentClass> StudentClasses => Set<StudentClass>();
        public DbSet<TeacherSubjectClass> TeacherSubjectClasses => Set<TeacherSubjectClass>();
        public DbSet<Assignment> Assignments => Set<Assignment>();
        public DbSet<Submission> Submissions => Set<Submission>();

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            // Map C# entities to exact database table names
            modelBuilder.Entity<User>().ToTable("users");
            modelBuilder.Entity<Class>().ToTable("classes");
            modelBuilder.Entity<Subject>().ToTable("subjects");
            modelBuilder.Entity<TeacherSubjectClass>().ToTable("teacher_assignments");
            modelBuilder.Entity<StudentClass>().ToTable("student_classes");
            modelBuilder.Entity<Assignment>().ToTable("assignments");
            modelBuilder.Entity<Submission>().ToTable("submissions");

            // Convert all entity column names to snake_case for PostgreSQL database schema compatibility
            foreach (var entity in modelBuilder.Model.GetEntityTypes())
            {
                foreach (var property in entity.GetProperties())
                {
                    property.SetColumnName(ToSnakeCase(property.GetColumnName()));
                }
            }

            // User configuration
            modelBuilder.Entity<User>(entity =>
            {
                entity.HasIndex(u => u.Email).IsUnique();
                entity.Property(u => u.Role).HasConversion<string>();
            });

            // StudentClass join entity configuration
            modelBuilder.Entity<StudentClass>(entity =>
            {
                entity.HasIndex(sc => new { sc.StudentId, sc.ClassId }).IsUnique();
                entity.HasOne(sc => sc.Student)
                    .WithMany(u => u.StudentClasses)
                    .HasForeignKey(sc => sc.StudentId)
                    .OnDelete(DeleteBehavior.Cascade);
                entity.HasOne(sc => sc.Class)
                    .WithMany(c => c.StudentClasses)
                    .HasForeignKey(sc => sc.ClassId)
                    .OnDelete(DeleteBehavior.Cascade);
            });

            // TeacherSubjectClass join entity configuration
            modelBuilder.Entity<TeacherSubjectClass>(entity =>
            {
                entity.HasIndex(tsc => new { tsc.TeacherId, tsc.SubjectId, tsc.ClassId }).IsUnique();
                entity.HasOne(tsc => tsc.Teacher)
                    .WithMany(u => u.TeacherAssignments)
                    .HasForeignKey(tsc => tsc.TeacherId)
                    .OnDelete(DeleteBehavior.Cascade);
                entity.HasOne(tsc => tsc.Subject)
                    .WithMany(s => s.TeacherAssignments)
                    .HasForeignKey(tsc => tsc.SubjectId)
                    .OnDelete(DeleteBehavior.Cascade);
                entity.HasOne(tsc => tsc.Class)
                    .WithMany(c => c.TeacherAssignments)
                    .HasForeignKey(tsc => tsc.ClassId)
                    .OnDelete(DeleteBehavior.Cascade);
            });

            // Assignment configuration
            modelBuilder.Entity<Assignment>(entity =>
            {
                entity.Property(a => a.Status).HasConversion<string>();
                entity.HasOne(a => a.Teacher)
                    .WithMany(u => u.CreatedAssignments)
                    .HasForeignKey(a => a.TeacherId)
                    .OnDelete(DeleteBehavior.Restrict);
                entity.HasOne(a => a.Class)
                    .WithMany(c => c.Assignments)
                    .HasForeignKey(a => a.ClassId)
                    .OnDelete(DeleteBehavior.Restrict);
                entity.HasOne(a => a.Subject)
                    .WithMany(s => s.Assignments)
                    .HasForeignKey(a => a.SubjectId)
                    .OnDelete(DeleteBehavior.Restrict);
            });

            // Submission configuration
            modelBuilder.Entity<Submission>(entity =>
            {
                entity.HasIndex(s => new { s.AssignmentId, s.StudentId }).IsUnique();
                entity.Property(s => s.Status).HasConversion<string>();
                entity.HasOne(s => s.Assignment)
                    .WithMany(a => a.Submissions)
                    .HasForeignKey(s => s.AssignmentId)
                    .OnDelete(DeleteBehavior.Cascade);
                entity.HasOne(s => s.Student)
                    .WithMany(u => u.Submissions)
                    .HasForeignKey(s => s.StudentId)
                    .OnDelete(DeleteBehavior.Restrict);
            });
        }

        private static string ToSnakeCase(string name)
        {
            if (string.IsNullOrEmpty(name)) return name;
            return System.Text.RegularExpressions.Regex.Replace(name, @"(?<!^)(?=[A-Z])", "_").ToLower();
        }
    }
}
