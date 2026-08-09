export type UserRole = 'Admin' | 'Teacher' | 'Student';

export type AssignmentStatus = 'Draft' | 'Published' | 'Closed';

export type SubmissionStatus = 'Submitted' | 'Late' | 'Reviewed' | 'Returned';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  createdAt: string;
  updatedAt: string;
}

export interface Class {
  id: string;
  name: string;
  gradeLevel: string;
  code: string;
  description?: string;
  createdAt: string;
}

export interface Subject {
  id: string;
  name: string;
  code: string;
  description?: string;
  createdAt: string;
}

export interface StudentClassAssignment {
  id: string;
  studentId: string;
  classId: string;
  studentName?: string;
  studentEmail?: string;
  className?: string;
  enrolledAt: string;
}

export interface TeacherSubjectClassAssignment {
  id: string;
  teacherId: string;
  subjectId: string;
  classId: string;
  teacherName?: string;
  subjectName?: string;
  className?: string;
  assignedAt: string;
}

export interface Assignment {
  id: string;
  title: string;
  description: string;
  classId: string;
  subjectId: string;
  teacherId: string;
  className?: string;
  subjectName?: string;
  teacherName?: string;
  deadline: string;
  maxMarks: number;
  status: AssignmentStatus;
  createdAt: string;
  updatedAt: string;
  submissionCount?: number;
  mySubmission?: Submission;
}

export interface Submission {
  id: string;
  assignmentId: string;
  studentId: string;
  studentName?: string;
  studentEmail?: string;
  assignmentTitle?: string;
  content: string;
  submittedAt: string;
  marks?: number;
  feedback?: string;
  status: SubmissionStatus;
  maxMarks?: number;
  updatedAt: string;
}

export interface SystemStats {
  totalUsers: number;
  totalStudents: number;
  totalTeachers: number;
  totalClasses: number;
  totalSubjects: number;
  totalAssignments: number;
  totalSubmissions: number;
  pendingGradingCount: number;
}

export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  errors?: string[];
}

export interface AuthResponse {
  token: string;
  user: User;
}
