# EduAssign Portal - Role-Based Assignment & Submission Management System

## 1. Project Overview

**EduAssign Portal** is a production-grade, full-stack, role-based Assignment & Submission Management System engineered for modern educational institutions (schools, colleges, and universities).

The system streamlines academic workflows across three core user personas:
* **Admins**: System administration, user account management (Teachers/Students), class/course creation, subject assignment, teacher-subject mapping, and global system settings.
* **Teachers**: Assignment authoring (draft vs. published), setting deadlines & maximum marks, reviewing student submissions, scoring/grading, and providing detailed written feedback.
* **Students**: Course dashboard, viewing active assignment details and deadlines, submitting text & file-link responses, updating submissions prior to deadlines, and tracking real-time grades and feedback.

---

## 2. Default Test Account Credentials

The system supports three distinct user roles (**Admin**, **Teacher**, and **Student**). For quick evaluation, you can click the **"Instant Test Login"** button on the sign-in screen, or manually log in using the credentials below:

### 🔑 Default Test Account Credentials

| User Role | Full Name | Email Address | Password | Permissions & Dashboard Access |
| :--- | :--- | :--- | :--- | :--- |
| **Admin** | System Administrator | `admin@school.edu` | `Admin123!` | System settings, user account creation, class & subject mapping, global metrics |
| **Teacher** | Prof. John Doe | `john.doe@school.edu` | `Teacher123!` | Assignment authoring (Draft/Publish), setting deadlines & max marks, grading & feedback |
| **Student** | Alex Jones | `alex.jones@student.edu` | `Student123!` | Student dashboard, viewing assignments & deadlines, submitting solutions, tracking grades |

---

### 📋 Additional Seeded Test Accounts

| Role | Full Name | Email Address | Password |
| :--- | :--- | :--- | :--- |
| **Admin** | Principal Catherine | `principal@school.edu` | `Admin123!` |
| **Teacher** | Sarah Smith | `sarah.smith@school.edu` | `Teacher123!` |
| **Teacher** | Robert Johnson | `robert.johnson@school.edu` | `Teacher123!` |
| **Student** | Emily Davis | `emily.davis@student.edu` | `Student123!` |
| **Student** | Michael Brown | `michael.brown@student.edu` | `Student123!` |
| **Student** | Jessica Wilson | `jessica.wilson@student.edu` | `Student123!` |

> **Note on Role-Enforced Sign In**: On the login page, select the **Admin**, **Teacher**, or **Student** tab corresponding to the account role before signing in.

---

## 3. Live Deployed Backend & How to Run

### 🌐 Live Deployed C# Backend Server
The C# (.NET) Web API backend is deployed and running live on Render:
* **Live Backend API Base URL**: `https://eduassign-1.onrender.com/`
* **Live Interactive Swagger UI**: `https://eduassign-1.onrender.com/swagger`

---

### Step 1: Configure Environment Variables (`.env`)
Create or edit your `.env` file in the project root directory:

```env
# Enable C# .NET Backend Proxy
USE_DOTNET_BACKEND=true

# Connect to Live Deployed Render Backend (or http://localhost:5005 for local backend)
DOTNET_BACKEND_URL=https://eduassign-1.onrender.com

# PostgreSQL Connection String (e.g., Neon, Cloud SQL, or Local PostgreSQL)
POSTGRES_URL=postgresql://user:password@host:5432/neondb?sslmode=require
```

### Step 2: Run the C# Backend Server (Local Development)
To run the backend locally instead of using the live Render server:

```bash
cd Backend
dotnet build
dotnet run --urls "http://localhost:5005"
```

When running locally, set `DOTNET_BACKEND_URL=http://localhost:5005` in your `.env`.

The C# backend automatically:
1. Connects to PostgreSQL using **Entity Framework Core**.
2. Runs database migrations / `EnsureCreatedAsync()` to create all necessary tables (`users`, `subjects`, `classes`, `assignments`, `submissions`, `system_settings`, etc.).
3. Seeds default admin, teacher, and student accounts along with initial subject and class records.
4. Launches the live C# Web API service.

### Step 3: Run the Frontend 
In a terminal window at the project root:

```bash
npm install
npm run dev
```

The frontend server will automatically  all `/api/*` and `/swagger` requests directly to the C# Backend (`https://eduassign-1.onrender.com` or local `http://localhost:5005`).

---

## 4. Testing C# Backend APIs Directly (cURL & Swagger)

### cURL Workflow Examples

#### 1. Authenticate & Obtain JWT Token (Live Render Server)
```bash
curl -s -X POST https://eduassign-1.onrender.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@school.edu","password":"Admin123!"}'
```

#### 2. Fetch All Subjects using Authorized JWT Token
```bash
# Save JWT token into environment variable
TOKEN=$(curl -s -X POST https://eduassign-1.onrender.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@school.edu","password":"Admin123!"}' \
  | python3 -c "import sys, json; print(json.load(sys.stdin)['data']['token'])")

# Query Subjects endpoint with Bearer token
curl -s -X GET https://eduassign-1.onrender.com/api/subjects \
  -H "Authorization: Bearer $TOKEN"
```

---

## 5. System Architecture & Design

```text
┌───────────────────────────────────────────────────────────────────────────────────┐
│                               FRONTEND LAYER                                      │
│  React 19 + TypeScript + Vite + Tailwind CSS v4 + Motion (Framer Motion)          │
│  - Single Page Application (SPA) with responsive desktop, tablet & mobile layouts │
│  - Form validation with reactive status indicators & error alerts                 │
│  - Instant Test Login modal, role-filtered manual login & embedded Swagger UI     │
└─────────────────────────────────────────┬─────────────────────────────────────────┘
                                          │  HTTP / REST API (JSON) + Bearer JWT
                                          ▼
┌───────────────────────────────────────────────────────────────────────────────────┐
│                                BACKEND API LAYER                                  │
│                                                                                   │
│  ASP.NET Core Web API in C# (`Backend/` Enterprise Solution)            │
│  - Controllers: `AuthController.cs`, `AdminController.cs`, `TeacherController.cs`,│
│    `StudentController.cs`, `SubjectController.cs`                                 │
│  - RESTful API design with DTO request validation, error handling & logging       │
│  - Swashbuckle Swagger UI configuration & JWT Bearer authorization scheme         │
│  - ASP.NET Core 8.0 Web API architecture                                          │
│                                                                                   │
│                       
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

## 6. Detailed Technology Stack & Backend Architecture

### 🎨 Frontend
* **Framework**: **React 19** with **TypeScript** for strict type safety and compile-time correctness.
* **Build System**: **Vite** for instant Hot Module Reloading (HMR) and optimized production bundling.
* **Styling**: **Tailwind CSS v4** providing utility-first, responsive design across all viewports.
* **Icons & Animation**: **Lucide React** icons and **Motion (Framer Motion)** for smooth UI transitions.
* **API Client**: Modular fetch service layer (`src/services/api.ts`) managing authentication headers, response normalization, and error handling.

### ⚙️ Backend Architecture & Web APIs

 **ASP.NET Core 8.0 Web API in C# (`Backend/`)**:
   * **Framework**: **ASP.NET Core Web API** built with **C#** and .NET 8.
   * **RESTful Controllers**: Strongly typed C# controllers (`AuthController.cs`, `AdminController.cs`, `TeacherController.cs`, `StudentController.cs`, `SubjectController.cs`).
   * **Validation**: Model validation using C# Data Annotations and DTO records.
   * **Error Handling & Logging**: Global exception handling middleware (`GlobalExceptionMiddleware.cs`) and structured logging.
   * **OpenAPI Documentation**: Integrated **Swashbuckle Swagger UI** mounted at `/swagger`.
   * **Authentication**: ASP.NET Core JWT Bearer authentication scheme (`Microsoft.AspNetCore.Authentication.JwtBearer`).
   

---

## 7. Key System Features & Capabilities

* **Instant Test Login Modal**: One-click login modal allowing instant evaluation without typing credentials.
* **Role-Specific Sign In**: Dedicated Admin, Teacher, and Student login role selector with server-side role validation.
* **Assignment Lifecycle**: Draft and publish workflows, setting max marks, and strict deadline enforcement.
* **Grading & Feedback Engine**: Teachers can score submissions out of total points and write feedback remarks.
* **System Settings**: Admin panel for managing portal title, academic year, self-registration rules, and file size limits.
* **Interactive API Documentation**: Embedded Swagger UI accessible directly inside the C# Backend or Node server.

---

## 8. Database Architecture & Schema Details

### 8.1 Database Overview & Providers
* **Database Provider**: **PostgreSQL** (Relational RDBMS)
* **Total Tables**: **8 Tables**
* **ORM Engines**:
  - `Entity Framework Core` (`Npgsql.EntityFrameworkCore.PostgreSQL`) for C# ASP.NET Core runtime (`Backend/`).
  - `Drizzle ORM` (`drizzle-orm` + `pg` client / PGlite) for Node.js / Express runtime.

### 8.2 Database Tables Breakdown

#### 1. `users` Table
Stores user accounts across all three system personas (**Admin**, **Teacher**, **Student**).
* `id` (`text` / `uuid`, Primary Key): Unique identifier.
* `name` (`text`, Not Null): Full name of the user.
* `email` (`text`, Not Null, Unique): Email address used for login.
* `role` (`text`, Not Null): Role enum (`'Admin'`, `'Teacher'`, `'Student'`).
* `password_hash` (`text`, Not Null): Bcrypt hashed password string.
* `created_at` (`timestamp`): User registration timestamp.

#### 2. `classes` Table
Represents academic grade levels, courses, or sections.
* `id` (`text` / `uuid`, Primary Key): Unique class identifier.
* `name` (`text`, Not Null): Class title (e.g., "Grade 10 - Science Section A").
* `grade_level` (`text`, Not Null): Academic level (e.g., "Grade 10").
* `code` (`text`, Not Null, Unique): Unique course code (e.g., "G10-SCI-A").

#### 3. `subjects` Table
Contains academic subjects offered across courses.
* `id` (`text` / `uuid`, Primary Key): Unique subject identifier.
* `name` (`text`, Not Null): Subject name (e.g., "Physics", "Mathematics").
* `code` (`text`, Not Null, Unique): Subject code (e.g., "PHYS-101").

#### 4. `student_classes` Table
Junction table mapping student enrollment into specific classes.
* `student_id` (Foreign Key -> `users.id`): Student user ID.
* `class_id` (Foreign Key -> `classes.id`): Enrolled class ID.

#### 5. `teacher_assignments` Table
Junction table allocating Teachers to specific Class + Subject combinations.
* `teacher_id` (Foreign Key -> `users.id`): Assigned teacher ID.
* `subject_id` (Foreign Key -> `subjects.id`): Subject taught.
* `class_id` (Foreign Key -> `classes.id`): Target class ID.

#### 6. `assignments` Table
Assignments created and published by Teachers.
* `id` (`text` / `uuid`, Primary Key): Assignment identifier.
* `title` (`text`, Not Null): Title of the assignment.
* `description` (`text`, Not Null): Instructions and assignment details.
* `class_id` (Foreign Key -> `classes.id`): Target class.
* `subject_id` (Foreign Key -> `subjects.id`): Target subject.
* `teacher_id` (Foreign Key -> `users.id`): Authoring teacher ID.
* `deadline` (`timestamp`, Not Null): Submission deadline date/time.
* `max_marks` (`integer`, Not Null): Maximum possible score.
* `status` (`text`, Enum): `'Draft'`, `'Published'`, or `'Closed'`.

#### 7. `submissions` Table
Student assignment submissions and teacher evaluations.
* `id` (`text` / `uuid`, Primary Key): Submission identifier.
* `assignment_id` (Foreign Key -> `assignments.id`): Target assignment.
* `student_id` (Foreign Key -> `users.id`): Submitting student ID.
* `content` (`text`, Not Null): Student's text response/solution.
* `marks` (`integer`, Nullable): Score assigned by teacher.
* `feedback` (`text`, Nullable): Teacher evaluation remarks.
* `status` (`text`, Enum): `'Submitted'`, `'Late'`, or `'Reviewed'`.

#### 8. `system_settings` Table
Application-level configurations managed by Administrators.
* `id` (`text`, Primary Key): Setting key (`'default'`).
* `portal_name` (`text`, Not Null): Portal title.
* `academic_year` (`text`, Not Null): Active academic term.
* `allow_student_registration` (`boolean`): Toggle self-service student signups.
* `require_teacher_approval` (`boolean`): Require admin approval for teachers.

---


```
