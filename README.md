# EduAssign Portal - Role-Based Assignment & Submission Management System

## 1. Project Overview

**EduAssign Portal** is a production-grade, full-stack, role-based Assignment & Submission Management System engineered for modern educational institutions (schools, colleges, and universities).

The system streamlines academic workflows across three core user personas:
* **Admins**: System administration, user account management (Teachers/Students), class/course creation, subject assignment, teacher-subject mapping, and global system settings.
* **Teachers**: Assignment authoring (draft vs. published), setting deadlines & maximum marks, reviewing student submissions, scoring/grading, and providing detailed written feedback.
* **Students**: Course dashboard, viewing active assignment details and deadlines, submitting text & file-link responses, updating submissions prior to deadlines, and tracking real-time grades and feedback.

---

## 2. Test Accounts & Instant Login Credentials

For quick testing and evaluation, the portal includes an **"Instant Test Login"** modal button on the sign-in page, as well as role-filtered manual authentication:

| Role | Default Email Address | Default Password | Access Privileges |
| :--- | :--- | :--- | :--- |
| **Admin** | `admin@school.edu` | `Admin123!` | Full admin panel, user management, system settings, global metrics |
| **Teacher** | `john.doe@school.edu` | `Teacher123!` | Assignment authoring, class gradebooks, student evaluation & scoring |
| **Student** | `alex.jones@student.edu` | `Student123!` | Student dashboard, assignment response submission, grade tracking |

 **Role-Enforced Manual Authentication**: On the manual sign-in form, selecting the **Admin**, **Teacher**, or **Student** role tab strictly enforces role verification. Logging in under a specific role tab requires credentials matching that exact role persona.

---

## 3. Full Architecture & System Design

The application follows a clean, modular multi-tier architecture separating presentation, API routing, business domain logic, and persistent storage.

```text
┌───────────────────────────────────────────────────────────────────────────────────┐
│                               FRONTEND LAYER                                      │
│  React 19 + TypeScript + Vite + Tailwind CSS v4 + Motion (Framer Motion)           │
│  - Single Page Application (SPA) with responsive desktop, tablet & mobile layouts │
│  - Form validation with reactive status indicators & error alerts                │
│  - Instant Test Login modal, role-filtered manual login & embedded Swagger UI     │
└─────────────────────────────────────────┬─────────────────────────────────────────┘
                                          │  HTTP / REST API (JSON) + Bearer JWT
                                          ▼
┌───────────────────────────────────────────────────────────────────────────────────┐
│                                BACKEND API LAYER                                  │
│                                                                                   │
│  Option A: ASP.NET Core Web API in C# (`backend-aspnet/` Enterprise Solution)     │
│  - Controllers: `AuthController.cs`, `AdminController.cs`, `TeacherController.cs` │
│  - RESTful API design with DTO request validation, error handling & logging        │
│  - Swashbuckle Swagger UI configuration & JWT Bearer authorization scheme         │
│  - ASP.NET Core 8.0 Web API architecture                                          │
│                                                                                   │
│  Option B: Node.js + Express + TypeScript (Active Container Live Server)          │
│  - RESTful Controllers & Router endpoints (`/api/auth`, `/api/admin`, etc.)        │
│  - Middleware: JWT authentication, Zod schema validation & RBAC role checkers      │
│  - Swagger / OpenAPI specifications mounted at `/api-docs`                        │
└─────────────────────────────────────────┬─────────────────────────────────────────┘
                                          │  SQL Queries / ORM Abstraction
                                          ▼
┌───────────────────────────────────────────────────────────────────────────────────┐
│                              DATABASE & STORAGE LAYER                             │
│  PostgreSQL Relational Database + Drizzle ORM / Entity Framework Core 8           │
│  - Strongly-typed relational schema (`users`, `classes`, `subjects`,              │
│    `teacher_assignments`, `assignments`, `submissions`, `system_settings`)        │
│  - Foreign key constraints & cascading data integrity                             │
└───────────────────────────────────────────────────────────────────────────────────┘
```

---

## 4. Detailed Technology Stack & Backend Architecture

### 🎨 Frontend
* **Framework**: **React 19** with **TypeScript** for strict type safety and compile-time correctness.
* **Build System**: **Vite** for instant Hot Module Reloading (HMR) and optimized production bundling.
* **Styling**: **Tailwind CSS v4** providing utility-first, responsive design across all viewports.
* **Icons & Animation**: **Lucide React** icons and **Motion (Framer Motion)** for smooth UI transitions.
* **API Client**: Modular fetch service layer (`src/services/api.ts`) managing authentication headers, response normalization, and error handling.

### ⚙️ Backend Architecture & Web APIs

1. **ASP.NET Core 8.0 Web API in C# (`backend-aspnet/`)**:
   * **Framework**: **ASP.NET Core Web API** built with **C#** and .NET 8.
   * **RESTful Controllers**: Strongly typed C# controllers (`AuthController.cs`, `AdminController.cs`, `TeacherController.cs`, `StudentController.cs`).
   * **Validation**: Model validation using C# Data Annotations and DTO records.
   * **Error Handling & Logging**: Global exception handling middleware and structured logging.
   * **OpenAPI Documentation**: Integrated **Swashbuckle Swagger UI** for REST API exploration.
   * **Authentication**: ASP.NET Core JWT Bearer authentication scheme (`Microsoft.AspNetCore.Authentication.JwtBearer`).

2. **Live Container Runtime Engine (Node.js + Express + TypeScript)**:
   * **Node.js**: The Linux container runtime executing the live web application.
   * **Express.js & TypeScript**: RESTful API endpoints matching the backend service contract.
   * **Zod Validation**: DTO payload schema validation and error responses.
   * **Swagger UI Express**: Interactive OpenAPI documentation mounted live at `/api-docs`.

---

## 5. Key System Features & Capabilities

* **Instant Test Login Modal**: One-click login modal allowing instant evaluation without typing credentials.
* **Role-Specific Sign In**: Dedicated Admin, Teacher, and Student login role selector with server-side role validation.
* **Assignment Lifecycle**: Draft and publish workflows, setting max marks, and strict deadline enforcement.
* **Grading & Feedback Engine**: Teachers can score submissions out of total points and write feedback remarks.
* **System Settings**: Admin panel for managing portal title, academic year, self-registration rules, and file size limits.
* **Interactive API Documentation**: Embedded Swagger UI tab accessible directly inside the web portal.

### 🗄️ Database & Persistence
* **Database Engine**: **PostgreSQL** relational database.
* **ORM & Database Providers**:
  - **Node.js / Express**: **Drizzle ORM** with the `pg` (node-postgres) driver package.
  - **ASP.NET Core (C#)**: **Entity Framework Core 8** with **Npgsql** (`Npgsql.EntityFrameworkCore.PostgreSQL`).

---

## 4. Key Design Decisions & FAQs

### Why use TypeScript on the backend with Node.js?
Node.js natively executes JavaScript. TypeScript adds a static type layer on top of Node.js to enforce type safety across both frontend and backend code, preventing common bugs like data mismatch errors, null reference issues, and invalid payload structures before code runs.

### Why does the backend include both Express/TypeScript and ASP.NET Core C#?
* **Node.js + Express (TypeScript)** powers the active, self-contained server environment inside the cloud execution container so the web app can run live without external compiler dependencies.
* **ASP.NET Core C# (`backend-aspnet/`)** provides a ready-to-deploy, enterprise C# solution featuring ASP.NET Core controllers, C# models, DTOs, and Swashbuckle OpenAPI configuration to fulfill requirements for a C# / .NET backend.

### Why Drizzle ORM for PostgreSQL? (Brief Summary)
* **Type-Safe SQL**: Infer TypeScript types automatically from SQL schemas without code generators.
* **Zero Runtime Overhead**: Lightweight execution with minimal memory footprint and fast cold-start performance.
* **SQL-First Flexibility**: Write readable SQL-like queries while maintaining type safety.
* **Declarative Migrations**: Instant schema management using `drizzle-kit push`.

---

## 5. Detailed Database Architecture & Connection Guide

### 5.1 Database Overview & Provider Information
* **Database Provider**: **PostgreSQL** (Relational Database Management System)
* **Total Tables**: **8 Tables**
* **ORM Engines**:
  - `Drizzle ORM` (`drizzle-orm` + `pg` client) for TypeScript/Express runtime.
  - `Entity Framework Core` (`Npgsql.EntityFrameworkCore.PostgreSQL`) for C#/ASP.NET Core runtime.

### 5.2 Complete Database Schema & Table Breakdown

#### 1. `users` Table
Stores user accounts across all three system personas (**Admin**, **Teacher**, **Student**).
* `id` (`text` / `uuid`, Primary Key): Unique identifier.
* `name` (`text`, Not Null): Full name of the user.
* `email` (`text`, Not Null, Unique): Email address used for login.
* `role` (`text`, Not Null): Role enum (`'Admin'`, `'Teacher'`, `'Student'`).
* `password_hash` (`text`, Not Null): Bcrypt hashed password string.
* `created_at` (`timestamp`, Default NOW): User registration timestamp.
* `updated_at` (`timestamp`, Default NOW): Account update timestamp.

#### 2. `classes` Table
Represents academic grade levels, courses, or sections.
* `id` (`text` / `uuid`, Primary Key): Unique class identifier.
* `name` (`text`, Not Null): Class title (e.g., "Grade 10 - Science Section A").
* `grade_level` (`text`, Not Null): Academic level (e.g., "Grade 10").
* `code` (`text`, Not Null, Unique): Unique course code (e.g., "G10-SCI-A").
* `description` (`text`, Nullable): Class overview.
* `created_at` (`timestamp`, Default NOW): Record creation timestamp.

#### 3. `subjects` Table
Contains academic subjects offered across courses.
* `id` (`text` / `uuid`, Primary Key): Unique subject identifier.
* `name` (`text`, Not Null): Subject name (e.g., "Physics", "Computer Science").
* `code` (`text`, Not Null, Unique): Subject code (e.g., "PHYS-101").
* `description` (`text`, Nullable): Subject description.
* `created_at` (`timestamp`, Default NOW): Record creation timestamp.

#### 4. `student_classes` Table
Junction table mapping student enrollment into specific classes.
* `id` (`text` / `uuid`, Primary Key): Enrollment record identifier.
* `student_id` (`text` / `uuid`, Foreign Key -> `users.id`): Student user ID.
* `class_id` (`text` / `uuid`, Foreign Key -> `classes.id`): Enrolled class ID.
* `enrolled_at` (`timestamp`, Default NOW): Enrollment timestamp.

#### 5. `teacher_assignments` Table
Junction table allocating Teachers to specific Class + Subject combinations.
* `id` (`text` / `uuid`, Primary Key): Allocation identifier.
* `teacher_id` (`text` / `uuid`, Foreign Key -> `users.id`): Assigned teacher ID.
* `subject_id` (`text` / `uuid`, Foreign Key -> `subjects.id`): Subject taught.
* `class_id` (`text` / `uuid`, Foreign Key -> `classes.id`): Target class ID.
* `assigned_at` (`timestamp`, Default NOW): Allocation timestamp.

#### 6. `assignments` Table
Assignments created and published by Teachers.
* `id` (`text` / `uuid`, Primary Key): Assignment identifier.
* `title` (`text`, Not Null): Title of the assignment.
* `description` (`text`, Not Null): Instructions and assignment details.
* `class_id` (`text` / `uuid`, Foreign Key -> `classes.id`): Target class.
* `subject_id` (`text` / `uuid`, Foreign Key -> `subjects.id`): Target subject.
* `teacher_id` (`text` / `uuid`, Foreign Key -> `users.id`): Authoring teacher ID.
* `deadline` (`timestamp`, Not Null): Submission deadline date/time.
* `max_marks` (`integer`, Not Null): Maximum possible score (e.g., 100).
* `status` (`text`, Enum): `'Draft'`, `'Published'`, or `'Closed'`.
* `created_at` (`timestamp`, Default NOW): Creation timestamp.
* `updated_at` (`timestamp`, Default NOW): Last modification timestamp.

#### 7. `submissions` Table
Student assignment submissions and teacher evaluations/marks.
* `id` (`text` / `uuid`, Primary Key): Submission identifier.
* `assignment_id` (`text` / `uuid`, Foreign Key -> `assignments.id`): Target assignment.
* `student_id` (`text` / `uuid`, Foreign Key -> `users.id`): Submitting student ID.
* `content` (`text`, Not Null): Student's text response/solution.
* `submitted_at` (`timestamp`, Default NOW): Submission timestamp.
* `marks` (`integer`, Nullable): Score assigned by teacher (0 to `max_marks`).
* `feedback` (`text`, Nullable): Teacher evaluation remarks.
* `status` (`text`, Enum): `'Submitted'`, `'Late'`, or `'Reviewed'`.
* `updated_at` (`timestamp`, Default NOW): Evaluation timestamp.

#### 8. `system_settings` Table
Application-level configurations managed by Administrators.
* `id` (`text`, Primary Key): Unique setting key (default `'default'`).
* `portal_name` (`text`, Not Null): Application portal title (e.g. `'EduAssign Portal'`).
* `academic_year` (`text`, Not Null): Active academic term (e.g. `'2026-2027'`).
* `allow_student_registration` (`boolean`, Not Null): Toggle self-service student signups.
* `require_teacher_approval` (`boolean`, Not Null): Require admin approval for teacher registrations.
* `max_file_upload_mb` (`integer`, Not Null): Maximum file upload size limit in MB.
* `default_passing_grade` (`integer`, Not Null): Standard passing threshold percentage.
* `updated_at` (`timestamp`, Default NOW): Timestamp of last settings update.

---

### 5.3 How to Connect to the PostgreSQL Database in Detail

#### Connection String Format
PostgreSQL connection strings follow standard URI format:
```env
DATABASE_URL=postgres://<username>:<password>@<host>:<port>/<database_name>?sslmode=disable
```
* **Example**: `postgres://postgres:password123@localhost:5432/eduassign_db`

---

#### Connecting via Node.js / TypeScript (Drizzle ORM)

1. **Environment Configuration (`.env`)**:
   ```env
   DATABASE_URL=postgres://postgres:password123@localhost:5432/eduassign_db
   ```

2. **Database Client Initialization (`src/db/index.ts`)**:
   ```typescript
   import { drizzle } from 'drizzle-orm/node-postgres';
   import { Pool } from 'pg';
   import * as schema from './schema';

   const pool = new Pool({
     connectionString: process.env.DATABASE_URL,
   });

   export const db = drizzle(pool, { schema });
   ```

3. **Running Database Migrations / Schema Push**:
   ```bash
   # Push schema changes directly to the PostgreSQL database
   npx drizzle-kit push
   ```

---

#### Connecting via ASP.NET Core C# (Entity Framework Core)

1. **Configuration (`backend-aspnet/appsettings.json`)**:
   ```json
   {
     "ConnectionStrings": {
       "DefaultConnection": "Host=localhost;Port=5432;Database=eduassign_db;Username=postgres;Password=password123"
     }
   }
   ```

2. **Register DbContext in `Program.cs`**:
   ```csharp
   using Microsoft.EntityFrameworkCore;
   using EduAssign.Data;

   var builder = WebApplication.CreateBuilder(args);

   // Configure PostgreSQL via Npgsql Entity Framework Core Provider
   builder.Services.AddDbContext<EduAssignDbContext>(options =>
       options.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection")));
   ```

3. **Applying Entity Framework Migrations**:
   ```bash
   cd backend-aspnet

   # Create migration
   dotnet ef migrations add InitialCreate

   # Update PostgreSQL database schema
   dotnet ef database update
   ```

---

## 6. Domain Entity Relationships Summary

```text
User
 ├── Admin (Global privileges: user & curriculum setup)
 ├── Teacher (Manages assignments & grades)
 └── Student (Submits work & tracks progress)

Class / Course (e.g., Grade 10 - Science, CS 101)
Subject (e.g., Physics, Mathematics, Computer Science)

TeacherAssignment
 ├── Teacher (User ID)
 ├── Class (Class ID)
 └── Subject (Subject ID)

Assignment
 ├── Teacher (Creator)
 ├── Class & Subject
 ├── Title, Description, Maximum Marks, Deadline
 └── Status: 'Draft' | 'Published'

Submission
 ├── Student (Submitter)
 ├── Assignment
 ├── Content & Submission Link
 ├── Status: 'Submitted' | 'Graded' | 'Returned'
 └── Marks Obtained & Teacher Feedback
```

---

## 6. How to Run and Use the Project

### 6.1 Quick Start (Live Container Web App)
1. Open the live application preview URL in your browser.
2. Use the **Role Switcher** at the top header to instantly switch between active demo accounts:
   - **Admin**: Logged in as System Administrator (Manage Users, Classes, Subjects).
   - **Teacher**: Logged in as Prof. John Doe (Create/Manage Assignments, Grade Submissions).
   - **Student**: Logged in as Alex Jones (View Assignments, Submit Work, View Grades & Feedback).
3. Alternatively, sign out and test manual **Sign In**, **Registration**, or **Password Reset**.

### 6.2 Running the Node.js / Express Backend Locally
```bash
# 1. Clone the repository and install dependencies
npm install

# 2. Run dev server (Frontend + Express backend on port 3000)
npm run dev

# 3. Run automated unit tests
npm run test

# 4. Build for production
npm run build
npm run start
```

### 6.3 Running the ASP.NET Core Web API (C#) Backend
```bash
# Navigate to ASP.NET Core subproject directory
cd backend-aspnet

# Restore NuGet dependencies
dotnet restore

# Run the ASP.NET Core API server
dotnet run
```
Once started, navigate to `http://localhost:5000/swagger` to inspect the C# API OpenAPI documentation.

---

## 7. Interactive API Documentation (Swagger / OpenAPI)

The project includes live Swagger API documentation:
* In the live web application, click the **Swagger API Docs** button in the top navigation bar or browse directly to `/api-docs`.
* Available endpoints include:
  - `POST /api/auth/login` - Authenticate user & receive JWT.
  - `POST /api/auth/register` - Register new Student or Teacher account.
  - `GET /api/admin/stats` - Fetch global administration metrics.
  - `GET /api/settings` - Retrieve persisted application system settings.
  - `PUT /api/settings` - Update application system settings (Admin only).
  - `POST /api/teacher/assignments` - Create draft or published assignment.
  - `POST /api/student/submissions` - Submit assignment response.
  - `POST /api/teacher/submissions/:id/grade` - Assign marks & feedback.

---

## 8. Automated Testing & Verification

The repository includes a TypeScript unit testing suite (`src/tests/`) verifying critical domain rules:
* **`assignments.test.ts`**: Validates assignment parameter constraints, positive integer bounds on maximum marks, and deadline date parsing.
* **`auth.test.ts`**: Tests password hashing algorithms, JWT generation/verification, and Zod DTO validation.
* **`submissions.test.ts`**: Verifies submission payload limits, grading boundary rules, and status transitions.

Run the test suite anytime using:
```bash
npm run test
```
