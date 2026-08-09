import { drizzle as drizzleNode } from 'drizzle-orm/node-postgres';
import { drizzle as drizzlePglite } from 'drizzle-orm/pglite';
import { PGlite } from '@electric-sql/pglite';
import pkg from 'pg';
import * as schema from './schema.js';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';

dotenv.config();

const { Pool } = pkg;

let dbInstance: any;
let rawClient: { query: (sql: string, params?: any[]) => Promise<any>; exec?: (sql: string) => Promise<any> };

const connectionString = process.env.DATABASE_URL || process.env.POSTGRES_URL;

if (connectionString) {
  console.log('[DB] External PostgreSQL connection string detected. Connecting to remote PostgreSQL database...');
  
  const isLocal = connectionString.includes('localhost') || connectionString.includes('127.0.0.1');
  const pool = new Pool({
    connectionString,
    ssl: isLocal ? false : { rejectUnauthorized: false },
  });

  dbInstance = drizzleNode(pool, { schema });
  rawClient = {
    query: async (sql: string, params?: any[]) => {
      const res = await pool.query(sql, params);
      return res;
    }
  };
} else {
  console.log('[DB] Neither DATABASE_URL nor POSTGRES_URL provided. Initializing embedded PGlite PostgreSQL database...');
  const pglite = new PGlite('./.pglite_data');
  dbInstance = drizzlePglite(pglite, { schema });
  rawClient = {
    exec: async (sql: string) => {
      return await pglite.exec(sql);
    },
    query: async (sql: string, params?: any[]) => {
      const res = await pglite.query(sql, params);
      return {
        rows: res.rows,
        rowCount: res.affectedRows ?? res.rows.length,
      };
    }
  };
}

export const db = dbInstance;

export async function initializeDatabase() {
  try {
    console.log('[DB] Ensuring database tables exist...');
    
    const tableQueries = [
      `CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        email TEXT NOT NULL UNIQUE,
        role TEXT NOT NULL,
        password_hash TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
      );`,
      `CREATE TABLE IF NOT EXISTS classes (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        grade_level TEXT NOT NULL,
        code TEXT NOT NULL UNIQUE,
        description TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
      );`,
      `CREATE TABLE IF NOT EXISTS subjects (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        code TEXT NOT NULL UNIQUE,
        description TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
      );`,
      `CREATE TABLE IF NOT EXISTS student_classes (
        id TEXT PRIMARY KEY,
        student_id TEXT REFERENCES users(id) NOT NULL,
        class_id TEXT REFERENCES classes(id) NOT NULL,
        enrolled_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
      );`,
      `CREATE TABLE IF NOT EXISTS teacher_assignments (
        id TEXT PRIMARY KEY,
        teacher_id TEXT REFERENCES users(id) NOT NULL,
        subject_id TEXT REFERENCES subjects(id) NOT NULL,
        class_id TEXT REFERENCES classes(id) NOT NULL,
        assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
      );`,
      `CREATE TABLE IF NOT EXISTS assignments (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        description TEXT NOT NULL,
        class_id TEXT REFERENCES classes(id) NOT NULL,
        subject_id TEXT REFERENCES subjects(id) NOT NULL,
        teacher_id TEXT REFERENCES users(id) NOT NULL,
        deadline TIMESTAMP NOT NULL,
        max_marks INTEGER NOT NULL,
        status TEXT NOT NULL DEFAULT 'Published',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
      );`,
      `CREATE TABLE IF NOT EXISTS submissions (
        id TEXT PRIMARY KEY,
        assignment_id TEXT REFERENCES assignments(id) NOT NULL,
        student_id TEXT REFERENCES users(id) NOT NULL,
        content TEXT NOT NULL,
        submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
        marks INTEGER,
        feedback TEXT,
        status TEXT NOT NULL DEFAULT 'Submitted',
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
      );`,
      `CREATE TABLE IF NOT EXISTS system_settings (
        id TEXT PRIMARY KEY,
        portal_name TEXT NOT NULL DEFAULT 'EduAssign Portal',
        academic_year TEXT NOT NULL DEFAULT '2026-2027',
        allow_student_registration BOOLEAN NOT NULL DEFAULT true,
        require_teacher_approval BOOLEAN NOT NULL DEFAULT false,
        max_file_upload_mb INTEGER NOT NULL DEFAULT 25,
        default_passing_grade INTEGER NOT NULL DEFAULT 50,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
      );`
    ];

    for (const q of tableQueries) {
      if (rawClient.exec) {
        await rawClient.exec(q);
      } else {
        await rawClient.query(q);
      }
    }

    // Seed default settings row if not present
    await rawClient.query(`
      INSERT INTO system_settings (id, portal_name, academic_year, allow_student_registration, require_teacher_approval, max_file_upload_mb, default_passing_grade)
      VALUES ('default', 'EduAssign Portal', '2026-2027', true, false, 25, 50)
      ON CONFLICT (id) DO NOTHING;
    `);

    // Check if users exist
    const userCountRes = await rawClient.query('SELECT COUNT(*) as count FROM users');
    const userCount = parseInt(userCountRes.rows[0]?.count || '0', 10);

    if (userCount === 0) {
      console.log('[DB] Seeding initial users and sample data...');
      const salt = bcrypt.genSaltSync(10);
      const adminPass = bcrypt.hashSync('Admin123!', salt);
      const teacherPass = bcrypt.hashSync('Teacher123!', salt);
      const studentPass = bcrypt.hashSync('Student123!', salt);

      // Seed Multiple Admins
      await rawClient.query(`
        INSERT INTO users (id, name, email, role, password_hash) VALUES
        ('usr-admin-1', 'System Administrator', 'admin@school.edu', 'Admin', $1),
        ('usr-admin-2', 'Principal Catherine', 'principal@school.edu', 'Admin', $1)
        ON CONFLICT (email) DO NOTHING;
      `, [adminPass]);

      // Seed Multiple Teachers
      await rawClient.query(`
        INSERT INTO users (id, name, email, role, password_hash) VALUES
        ('usr-teacher-1', 'John Doe', 'john.doe@school.edu', 'Teacher', $1),
        ('usr-teacher-2', 'Sarah Smith', 'sarah.smith@school.edu', 'Teacher', $1),
        ('usr-teacher-3', 'Robert Johnson', 'robert.johnson@school.edu', 'Teacher', $1)
        ON CONFLICT (email) DO NOTHING;
      `, [teacherPass]);

      // Seed Multiple Students
      await rawClient.query(`
        INSERT INTO users (id, name, email, role, password_hash) VALUES
        ('usr-student-1', 'Alex Jones', 'alex.jones@student.edu', 'Student', $1),
        ('usr-student-2', 'Emily Davis', 'emily.davis@student.edu', 'Student', $1),
        ('usr-student-3', 'Michael Brown', 'michael.brown@student.edu', 'Student', $1),
        ('usr-student-4', 'Jessica Wilson', 'jessica.wilson@student.edu', 'Student', $1)
        ON CONFLICT (email) DO NOTHING;
      `, [studentPass]);

      // Seed Classes
      await rawClient.query(`
        INSERT INTO classes (id, name, grade_level, code, description) VALUES
        ('cls-10A', 'Grade 10-A Science', 'Grade 10', 'SCI10A', 'Advanced science and laboratory class'),
        ('cls-10B', 'Grade 10-B Mathematics', 'Grade 10', 'MATH10B', 'Algebra and Trigonometry focus'),
        ('cls-11A', 'Grade 11 Computer Science', 'Grade 11', 'CS11A', 'Programming and Data Structures')
        ON CONFLICT (code) DO NOTHING;
      `);

      // Seed Subjects
      await rawClient.query(`
        INSERT INTO subjects (id, name, code, description) VALUES
        ('sub-phy', 'Physics', 'PHY101', 'Classical mechanics and electromagnetism'),
        ('sub-mat', 'Mathematics', 'MAT101', 'Advanced algebra and calculus'),
        ('sub-cs', 'Computer Science', 'CS101', 'Intro to algorithms and web development')
        ON CONFLICT (code) DO NOTHING;
      `);

      // Seed Student Classes
      await rawClient.query(`
        INSERT INTO student_classes (id, student_id, class_id) VALUES
        ('sc-1', 'usr-student-1', 'cls-10A'),
        ('sc-2', 'usr-student-1', 'cls-10B'),
        ('sc-3', 'usr-student-2', 'cls-10A'),
        ('sc-4', 'usr-student-3', 'cls-11A'),
        ('sc-5', 'usr-student-4', 'cls-11A')
        ON CONFLICT DO NOTHING;
      `);

      // Seed Teacher Assignments
      await rawClient.query(`
        INSERT INTO teacher_assignments (id, teacher_id, subject_id, class_id) VALUES
        ('ta-1', 'usr-teacher-1', 'sub-phy', 'cls-10A'),
        ('ta-2', 'usr-teacher-2', 'sub-mat', 'cls-10B'),
        ('ta-3', 'usr-teacher-3', 'sub-cs', 'cls-11A')
        ON CONFLICT DO NOTHING;
      `);

      // Seed Assignments
      await rawClient.query(`
        INSERT INTO assignments (id, title, description, class_id, subject_id, teacher_id, deadline, max_marks, status) VALUES
        ('asn-1', 'Newton Laws Lab Report', 'Write a comprehensive report on pendulum motion experiments.', 'cls-10A', 'sub-phy', 'usr-teacher-1', NOW() + INTERVAL '7 days', 100, 'Published'),
        ('asn-2', 'Quadratic Equations Problem Set', 'Solve problems 1 through 20 in chapter 4.', 'cls-10B', 'sub-mat', 'usr-teacher-2', NOW() + INTERVAL '5 days', 50, 'Published'),
        ('asn-3', 'React Component Architecture', 'Build a multi-component dashboard with state management.', 'cls-11A', 'sub-cs', 'usr-teacher-3', NOW() + INTERVAL '10 days', 100, 'Published')
        ON CONFLICT DO NOTHING;
      `);

      console.log('[DB] Seeding completed successfully.');
    }
  } catch (err) {
    console.error('[DB] Initialization error:', err);
  }
}
