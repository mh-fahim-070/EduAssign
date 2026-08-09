using AssignmentSystem.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Storage;
using Microsoft.Extensions.Logging;

namespace AssignmentSystem.Data
{
    public static class DatabaseInitializer
    {
        public static async Task InitializeAsync(IServiceProvider services)
        {
            using var scope = services.CreateScope();
            var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
            var logger = scope.ServiceProvider.GetRequiredService<ILogger<ApplicationDbContext>>();

            try
            {
                logger.LogInformation("Ensuring database schema is created...");
                var databaseCreator = db.Database.GetService<IDatabaseCreator>() as RelationalDatabaseCreator;
                if (databaseCreator != null)
                {
                    if (!await databaseCreator.ExistsAsync())
                    {
                        await databaseCreator.CreateAsync();
                    }
                    if (!await databaseCreator.HasTablesAsync())
                    {
                        await databaseCreator.CreateTablesAsync();
                        logger.LogInformation("Database tables created successfully.");
                    }
                }

                await SeedAsync(db, logger);
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "An error occurred while initializing the database.");
                throw;
            }
        }

        private static async Task SeedAsync(ApplicationDbContext db, ILogger logger)
        {
            logger.LogInformation("Checking database tables for seeding...");

            var adminPass = BCrypt.Net.BCrypt.HashPassword("Admin123!");
            var teacherPass = BCrypt.Net.BCrypt.HashPassword("Teacher123!");
            var studentPass = BCrypt.Net.BCrypt.HashPassword("Student123!");

            var admin1 = "11111111-1111-1111-1111-111111111101";
            var admin2 = "11111111-1111-1111-1111-111111111102";
            var teacher1 = "22222222-2222-2222-2222-222222222201";
            var teacher2 = "22222222-2222-2222-2222-222222222202";
            var teacher3 = "22222222-2222-2222-2222-222222222203";
            var student1 = "33333333-3333-3333-3333-333333333301";
            var student2 = "33333333-3333-3333-3333-333333333302";
            var student3 = "33333333-3333-3333-3333-333333333303";
            var student4 = "33333333-3333-3333-3333-333333333304";

            var class10A = "44444444-4444-4444-4444-444444444401";
            var class10B = "44444444-4444-4444-4444-444444444402";
            var class11A = "44444444-4444-4444-4444-444444444403";

            var subPhy = "55555555-5555-5555-5555-555555555501";
            var subMat = "55555555-5555-5555-5555-555555555502";
            var subCs = "55555555-5555-5555-5555-555555555503";

            // 1. Seed Users
            var existingEmails = (await db.Users.Select(u => u.Email).ToListAsync()).ToHashSet();
            var usersToSeed = new[]
            {
                new User { Id = admin1, Name = "System Administrator", Email = "admin@school.edu", PasswordHash = adminPass, Role = UserRole.Admin },
                new User { Id = admin2, Name = "Principal Catherine", Email = "principal@school.edu", PasswordHash = adminPass, Role = UserRole.Admin },
                new User { Id = teacher1, Name = "John Doe", Email = "john.doe@school.edu", PasswordHash = teacherPass, Role = UserRole.Teacher },
                new User { Id = teacher2, Name = "Sarah Smith", Email = "sarah.smith@school.edu", PasswordHash = teacherPass, Role = UserRole.Teacher },
                new User { Id = teacher3, Name = "Robert Johnson", Email = "robert.johnson@school.edu", PasswordHash = teacherPass, Role = UserRole.Teacher },
                new User { Id = student1, Name = "Alex Jones", Email = "alex.jones@student.edu", PasswordHash = studentPass, Role = UserRole.Student },
                new User { Id = student2, Name = "Emily Davis", Email = "emily.davis@student.edu", PasswordHash = studentPass, Role = UserRole.Student },
                new User { Id = student3, Name = "Michael Brown", Email = "michael.brown@student.edu", PasswordHash = studentPass, Role = UserRole.Student },
                new User { Id = student4, Name = "Jessica Wilson", Email = "jessica.wilson@student.edu", PasswordHash = studentPass, Role = UserRole.Student }
            };

            bool changesMade = false;
            foreach (var user in usersToSeed)
            {
                if (!existingEmails.Contains(user.Email))
                {
                    db.Users.Add(user);
                    changesMade = true;
                }
            }
            if (changesMade)
            {
                await db.SaveChangesAsync();
                changesMade = false;
            }

            // 2. Seed Classes
            if (!await db.Classes.AnyAsync())
            {
                db.Classes.AddRange(
                    new Class { Id = class10A, Name = "Grade 10-A Science", GradeLevel = "Grade 10", Code = "SCI10A", Description = "Advanced science and laboratory class" },
                    new Class { Id = class10B, Name = "Grade 10-B Mathematics", GradeLevel = "Grade 10", Code = "MATH10B", Description = "Algebra and Trigonometry focus" },
                    new Class { Id = class11A, Name = "Grade 11 Computer Science", GradeLevel = "Grade 11", Code = "CS11A", Description = "Programming and Data Structures" }
                );
                await db.SaveChangesAsync();
                logger.LogInformation("Classes seeded.");
            }

            // 3. Seed Subjects
            if (!await db.Subjects.AnyAsync())
            {
                db.Subjects.AddRange(
                    new Subject { Id = subPhy, Name = "Physics", Code = "PHY101", Description = "Classical mechanics and electromagnetism" },
                    new Subject { Id = subMat, Name = "Mathematics", Code = "MAT101", Description = "Advanced algebra and calculus" },
                    new Subject { Id = subCs, Name = "Computer Science", Code = "CS101", Description = "Intro to algorithms and web development" }
                );
                await db.SaveChangesAsync();
                logger.LogInformation("Subjects seeded.");
            }

            // 4. Seed Student Classes
            if (!await db.StudentClasses.AnyAsync())
            {
                db.StudentClasses.AddRange(
                    new StudentClass { StudentId = student1, ClassId = class10A },
                    new StudentClass { StudentId = student1, ClassId = class10B },
                    new StudentClass { StudentId = student2, ClassId = class10A },
                    new StudentClass { StudentId = student3, ClassId = class11A },
                    new StudentClass { StudentId = student4, ClassId = class11A }
                );
                await db.SaveChangesAsync();
                logger.LogInformation("StudentClasses seeded.");
            }

            // 5. Seed Teacher Subject Classes
            if (!await db.TeacherSubjectClasses.AnyAsync())
            {
                db.TeacherSubjectClasses.AddRange(
                    new TeacherSubjectClass { TeacherId = teacher1, SubjectId = subPhy, ClassId = class10A },
                    new TeacherSubjectClass { TeacherId = teacher2, SubjectId = subMat, ClassId = class10B },
                    new TeacherSubjectClass { TeacherId = teacher3, SubjectId = subCs, ClassId = class11A }
                );
                await db.SaveChangesAsync();
                logger.LogInformation("TeacherSubjectClasses seeded.");
            }

            // 6. Seed Assignments
            if (!await db.Assignments.AnyAsync())
            {
                db.Assignments.AddRange(
                    new Assignment
                    {
                        Title = "Newton Laws Lab Report",
                        Description = "Write a comprehensive report on pendulum motion experiments.",
                        ClassId = class10A,
                        SubjectId = subPhy,
                        TeacherId = teacher1,
                        Deadline = DateTime.UtcNow.AddDays(7),
                        MaxMarks = 100,
                        Status = AssignmentStatus.Published
                    },
                    new Assignment
                    {
                        Title = "Quadratic Equations Problem Set",
                        Description = "Solve problems 1 through 20 in chapter 4.",
                        ClassId = class10B,
                        SubjectId = subMat,
                        TeacherId = teacher2,
                        Deadline = DateTime.UtcNow.AddDays(5),
                        MaxMarks = 50,
                        Status = AssignmentStatus.Published
                    },
                    new Assignment
                    {
                        Title = "React Component Architecture",
                        Description = "Build a multi-component dashboard with state management.",
                        ClassId = class11A,
                        SubjectId = subCs,
                        TeacherId = teacher3,
                        Deadline = DateTime.UtcNow.AddDays(10),
                        MaxMarks = 100,
                        Status = AssignmentStatus.Published
                    }
                );
                await db.SaveChangesAsync();
                logger.LogInformation("Assignments seeded.");
            }

            logger.LogInformation("Database initialization and seeding completed.");
        }
    }
}
