import { pgTable, text, timestamp, integer, boolean, uuid } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

export const users = pgTable('users', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  role: text('role', { enum: ['Admin', 'Teacher', 'Student'] }).notNull(),
  passwordHash: text('password_hash').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const classes = pgTable('classes', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  gradeLevel: text('grade_level').notNull(),
  code: text('code').notNull().unique(),
  description: text('description'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const subjects = pgTable('subjects', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  code: text('code').notNull().unique(),
  description: text('description'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const studentClasses = pgTable('student_classes', {
  id: text('id').primaryKey(),
  studentId: text('student_id').references(() => users.id).notNull(),
  classId: text('class_id').references(() => classes.id).notNull(),
  enrolledAt: timestamp('enrolled_at').defaultNow().notNull(),
});

export const teacherAssignments = pgTable('teacher_assignments', {
  id: text('id').primaryKey(),
  teacherId: text('teacher_id').references(() => users.id).notNull(),
  subjectId: text('subject_id').references(() => subjects.id).notNull(),
  classId: text('class_id').references(() => classes.id).notNull(),
  assignedAt: timestamp('assigned_at').defaultNow().notNull(),
});

export const assignments = pgTable('assignments', {
  id: text('id').primaryKey(),
  title: text('title').notNull(),
  description: text('description').notNull(),
  classId: text('class_id').references(() => classes.id).notNull(),
  subjectId: text('subject_id').references(() => subjects.id).notNull(),
  teacherId: text('teacher_id').references(() => users.id).notNull(),
  deadline: timestamp('deadline').notNull(),
  maxMarks: integer('max_marks').notNull(),
  status: text('status', { enum: ['Draft', 'Published', 'Closed'] }).notNull().default('Draft'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const submissions = pgTable('submissions', {
  id: text('id').primaryKey(),
  assignmentId: text('assignment_id').references(() => assignments.id).notNull(),
  studentId: text('student_id').references(() => users.id).notNull(),
  content: text('content').notNull(),
  submittedAt: timestamp('submitted_at').defaultNow().notNull(),
  marks: integer('marks'),
  feedback: text('feedback'),
  status: text('status', { enum: ['Submitted', 'Late', 'Reviewed'] }).notNull().default('Submitted'),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const systemSettings = pgTable('system_settings', {
  id: text('id').primaryKey(),
  portalName: text('portal_name').notNull().default('EduAssign Portal'),
  academicYear: text('academic_year').notNull().default('2026-2027'),
  allowStudentRegistration: boolean('allow_student_registration').notNull().default(true),
  requireTeacherApproval: boolean('require_teacher_approval').notNull().default(false),
  maxFileUploadMB: integer('max_file_upload_mb').notNull().default(25),
  defaultPassingGrade: integer('default_passing_grade').notNull().default(50),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  studentClasses: many(studentClasses),
  teacherAssignments: many(teacherAssignments),
  assignments: many(assignments),
  submissions: many(submissions),
}));

export const classesRelations = relations(classes, ({ many }) => ({
  studentClasses: many(studentClasses),
  teacherAssignments: many(teacherAssignments),
  assignments: many(assignments),
}));

export const subjectsRelations = relations(subjects, ({ many }) => ({
  teacherAssignments: many(teacherAssignments),
  assignments: many(assignments),
}));

export const studentClassesRelations = relations(studentClasses, ({ one }) => ({
  student: one(users, {
    fields: [studentClasses.studentId],
    references: [users.id],
  }),
  class: one(classes, {
    fields: [studentClasses.classId],
    references: [classes.id],
  }),
}));

export const teacherAssignmentsRelations = relations(teacherAssignments, ({ one }) => ({
  teacher: one(users, {
    fields: [teacherAssignments.teacherId],
    references: [users.id],
  }),
  subject: one(subjects, {
    fields: [teacherAssignments.subjectId],
    references: [subjects.id],
  }),
  class: one(classes, {
    fields: [teacherAssignments.classId],
    references: [classes.id],
  }),
}));

export const assignmentsRelations = relations(assignments, ({ one, many }) => ({
  class: one(classes, {
    fields: [assignments.classId],
    references: [classes.id],
  }),
  subject: one(subjects, {
    fields: [assignments.subjectId],
    references: [subjects.id],
  }),
  teacher: one(users, {
    fields: [assignments.teacherId],
    references: [users.id],
  }),
  submissions: many(submissions),
}));

export const submissionsRelations = relations(submissions, ({ one }) => ({
  assignment: one(assignments, {
    fields: [submissions.assignmentId],
    references: [assignments.id],
  }),
  student: one(users, {
    fields: [submissions.studentId],
    references: [users.id],
  }),
}));
