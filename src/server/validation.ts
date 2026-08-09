import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().email('Invalid email address format'),
  password: z.string().min(1, 'Password is required'),
  expectedRole: z.enum(['Admin', 'Teacher', 'Student'] as const).optional(),
});

export const createUserSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters long'),
  email: z.string().email('Invalid email address format'),
  password: z.string().min(6, 'Password must be at least 6 characters long'),
  role: z.enum(['Admin', 'Teacher', 'Student'] as const),
});

export const createClassSchema = z.object({
  name: z.string().min(2, 'Class name is required'),
  gradeLevel: z.string().min(1, 'Grade level is required'),
  code: z.string().min(1, 'Class code is required'),
  description: z.string().optional(),
});

export const createSubjectSchema = z.object({
  name: z.string().min(2, 'Subject name is required'),
  code: z.string().min(1, 'Subject code is required'),
  description: z.string().optional(),
});

export const assignTeacherSchema = z.object({
  teacherId: z.string().min(1, 'Teacher ID is required'),
  subjectId: z.string().min(1, 'Subject ID is required'),
  classId: z.string().min(1, 'Class ID is required'),
});

export const enrollStudentSchema = z.object({
  studentId: z.string().min(1, 'Student ID is required'),
  classId: z.string().min(1, 'Class ID is required'),
});

export const createAssignmentSchema = z.object({
  title: z.string().min(3, 'Assignment title must be at least 3 characters'),
  description: z.string().min(5, 'Description must be at least 5 characters'),
  classId: z.string().min(1, 'Class ID is required'),
  subjectId: z.string().min(1, 'Subject ID is required'),
  deadline: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: 'Invalid deadline date format',
  }),
  maxMarks: z.number().min(1, 'Max marks must be greater than 0').max(1000, 'Max marks cannot exceed 1000'),
  status: z.enum(['Draft', 'Published', 'Closed'] as const).optional(),
});

export const updateAssignmentSchema = z.object({
  title: z.string().min(3).optional(),
  description: z.string().min(5).optional(),
  deadline: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: 'Invalid deadline date format',
  }).optional(),
  maxMarks: z.number().min(1).max(1000).optional(),
  status: z.enum(['Draft', 'Published', 'Closed'] as const).optional(),
});

export const updateAssignmentStatusSchema = z.object({
  status: z.enum(['Draft', 'Published', 'Closed'] as const),
});

export const submitAssignmentSchema = z.object({
  assignmentId: z.string().min(1, 'Assignment ID is required'),
  content: z.string().min(1, 'Answer content cannot be empty'),
});

export const gradeSubmissionSchema = z.object({
  marks: z.number().min(0, 'Marks cannot be negative').max(1000, 'Marks cannot exceed max marks'),
  feedback: z.string().optional(),
  status: z.enum(['Submitted', 'Late', 'Reviewed', 'Returned'] as const).optional(),
});
