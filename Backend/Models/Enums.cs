namespace AssignmentSystem.Models
{
    public enum UserRole
    {
        Admin = 1,
        Teacher = 2,
        Student = 3
    }

    public enum AssignmentStatus
    {
        Draft = 1,
        Published = 2,
        Closed = 3
    }

    public enum SubmissionStatus
    {
        Submitted = 1,
        Late = 2,
        Reviewed = 3,
        Returned = 4
    }
}
