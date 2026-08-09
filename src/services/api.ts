import { ApiResponse, AuthResponse, User, Class, Subject, StudentClassAssignment, TeacherSubjectClassAssignment, Assignment, Submission, SystemStats, UserRole } from '../types/index.js';

const API_BASE = '/api';

class ApiClient {
  private getHeaders(): HeadersInit {
    const token = localStorage.getItem('jwt_token');
    return {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
  }

  private async handleResponse<T>(res: Response): Promise<ApiResponse<T>> {
    let data: any;
    const text = await res.text();

    if (text && text.trim().length > 0) {
      try {
        data = JSON.parse(text);
      } catch {
        data = {
          success: false,
          message: !res.ok
            ? `Server error (${res.status} ${res.statusText || ''}). Please try again.`
            : 'Server returned a non-JSON response.',
        };
      }
    } else {
      data = {
        success: res.ok,
        message: res.ok ? '' : `Server returned empty response (HTTP ${res.status})`,
      };
    }

    if (res.status === 401) {
      // Clear expired token if 401
      localStorage.removeItem('jwt_token');
      localStorage.removeItem('auth_user');
    }

    if (!res.ok) {
      throw new Error(data.message || `Server returned status code ${res.status}`);
    }

    return data;
  }

  async login(email: string, password: string, expectedRole?: UserRole): Promise<ApiResponse<AuthResponse>> {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, expectedRole }),
    });
    return this.handleResponse<AuthResponse>(res);
  }

  async register(data: { name: string; email: string; password: string; role: UserRole }): Promise<ApiResponse<AuthResponse>> {
    const res = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return this.handleResponse<AuthResponse>(res);
  }

  async forgotPassword(email: string): Promise<ApiResponse<void>> {
    const res = await fetch(`${API_BASE}/auth/forgot-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });
    return this.handleResponse<void>(res);
  }

  async getCurrentUser(): Promise<ApiResponse<User>> {
    const res = await fetch(`${API_BASE}/auth/me`, {
      headers: this.getHeaders(),
    });
    return this.handleResponse<User>(res);
  }

  // Admin Users
  async getUsers(role?: string): Promise<ApiResponse<User[]>> {
    const url = role ? `${API_BASE}/users?role=${role}` : `${API_BASE}/users`;
    const res = await fetch(url, { headers: this.getHeaders() });
    return this.handleResponse<User[]>(res);
  }

  async createUser(data: { name: string; email: string; password: string; role: UserRole }): Promise<ApiResponse<User>> {
    const res = await fetch(`${API_BASE}/users`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(data),
    });
    return this.handleResponse<User>(res);
  }

  async deleteUser(id: string): Promise<ApiResponse<void>> {
    const res = await fetch(`${API_BASE}/users/${id}`, {
      method: 'DELETE',
      headers: this.getHeaders(),
    });
    return this.handleResponse<void>(res);
  }

  // Classes
  async getClasses(): Promise<ApiResponse<Class[]>> {
    const res = await fetch(`${API_BASE}/classes`, { headers: this.getHeaders() });
    return this.handleResponse<Class[]>(res);
  }

  async createClass(data: { name: string; gradeLevel: string; code: string; description?: string }): Promise<ApiResponse<Class>> {
    const res = await fetch(`${API_BASE}/classes`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(data),
    });
    return this.handleResponse<Class>(res);
  }

  async deleteClass(id: string): Promise<ApiResponse<void>> {
    const res = await fetch(`${API_BASE}/classes/${id}`, {
      method: 'DELETE',
      headers: this.getHeaders(),
    });
    return this.handleResponse<void>(res);
  }

  // Subjects
  async getSubjects(): Promise<ApiResponse<Subject[]>> {
    const res = await fetch(`${API_BASE}/subjects`, { headers: this.getHeaders() });
    return this.handleResponse<Subject[]>(res);
  }

  async createSubject(data: { name: string; code: string; description?: string }): Promise<ApiResponse<Subject>> {
    const res = await fetch(`${API_BASE}/subjects`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(data),
    });
    return this.handleResponse<Subject>(res);
  }

  async deleteSubject(id: string): Promise<ApiResponse<void>> {
    const res = await fetch(`${API_BASE}/subjects/${id}`, {
      method: 'DELETE',
      headers: this.getHeaders(),
    });
    return this.handleResponse<void>(res);
  }

  // Teacher Assignments
  async getTeacherAssignments(teacherId?: string): Promise<ApiResponse<TeacherSubjectClassAssignment[]>> {
    const url = teacherId ? `${API_BASE}/teacher-assignments?teacherId=${teacherId}` : `${API_BASE}/teacher-assignments`;
    const res = await fetch(url, { headers: this.getHeaders() });
    return this.handleResponse<TeacherSubjectClassAssignment[]>(res);
  }

  async assignTeacher(data: { teacherId: string; subjectId: string; classId: string }): Promise<ApiResponse<TeacherSubjectClassAssignment>> {
    const res = await fetch(`${API_BASE}/teacher-assignments`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(data),
    });
    return this.handleResponse<TeacherSubjectClassAssignment>(res);
  }

  async deleteTeacherAssignment(id: string): Promise<ApiResponse<void>> {
    const res = await fetch(`${API_BASE}/teacher-assignments/${id}`, {
      method: 'DELETE',
      headers: this.getHeaders(),
    });
    return this.handleResponse<void>(res);
  }

  // Student Enrollments
  async getStudentClasses(studentId?: string, classId?: string): Promise<ApiResponse<StudentClassAssignment[]>> {
    let query = '';
    if (studentId) query += `studentId=${studentId}&`;
    if (classId) query += `classId=${classId}&`;
    const url = `${API_BASE}/student-classes?${query}`;

    const res = await fetch(url, { headers: this.getHeaders() });
    return this.handleResponse<StudentClassAssignment[]>(res);
  }

  async enrollStudent(data: { studentId: string; classId: string }): Promise<ApiResponse<StudentClassAssignment>> {
    const res = await fetch(`${API_BASE}/student-classes`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(data),
    });
    return this.handleResponse<StudentClassAssignment>(res);
  }

  async deleteStudentEnrollment(id: string): Promise<ApiResponse<void>> {
    const res = await fetch(`${API_BASE}/student-classes/${id}`, {
      method: 'DELETE',
      headers: this.getHeaders(),
    });
    return this.handleResponse<void>(res);
  }

  // Assignments
  async getAssignments(): Promise<ApiResponse<Assignment[]>> {
    const res = await fetch(`${API_BASE}/assignments`, { headers: this.getHeaders() });
    return this.handleResponse<Assignment[]>(res);
  }

  async createAssignment(data: { title: string; description: string; classId: string; subjectId: string; deadline: string; maxMarks: number; status: string }): Promise<ApiResponse<Assignment>> {
    const res = await fetch(`${API_BASE}/assignments`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(data),
    });
    return this.handleResponse<Assignment>(res);
  }

  async updateAssignment(id: string, data: { title?: string; description?: string; deadline?: string; maxMarks?: number; status?: string }): Promise<ApiResponse<Assignment>> {
    const res = await fetch(`${API_BASE}/assignments/${id}`, {
      method: 'PUT',
      headers: this.getHeaders(),
      body: JSON.stringify(data),
    });
    return this.handleResponse<Assignment>(res);
  }

  async updateAssignmentStatus(id: string, status: 'Draft' | 'Published' | 'Closed'): Promise<ApiResponse<Assignment>> {
    const res = await fetch(`${API_BASE}/assignments/${id}/status`, {
      method: 'PATCH',
      headers: this.getHeaders(),
      body: JSON.stringify({ status }),
    });
    return this.handleResponse<Assignment>(res);
  }

  async deleteAssignment(id: string): Promise<ApiResponse<void>> {
    const res = await fetch(`${API_BASE}/assignments/${id}`, {
      method: 'DELETE',
      headers: this.getHeaders(),
    });
    return this.handleResponse<void>(res);
  }

  // Submissions
  async getSubmissions(assignmentId?: string, studentId?: string): Promise<ApiResponse<Submission[]>> {
    let query = '';
    if (assignmentId) query += `assignmentId=${assignmentId}&`;
    if (studentId) query += `studentId=${studentId}&`;
    const url = `${API_BASE}/submissions?${query}`;

    const res = await fetch(url, { headers: this.getHeaders() });
    return this.handleResponse<Submission[]>(res);
  }

  async submitAssignment(data: { assignmentId: string; content: string }): Promise<ApiResponse<Submission>> {
    const res = await fetch(`${API_BASE}/submissions`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(data),
    });
    return this.handleResponse<Submission>(res);
  }

  async gradeSubmission(id: string, data: { marks: number; feedback?: string; status?: string }): Promise<ApiResponse<Submission>> {
    const res = await fetch(`${API_BASE}/submissions/${id}/grade`, {
      method: 'PUT',
      headers: this.getHeaders(),
      body: JSON.stringify(data),
    });
    return this.handleResponse<Submission>(res);
  }

  // Stats
  async getStats(): Promise<ApiResponse<SystemStats>> {
    const res = await fetch(`${API_BASE}/stats`, { headers: this.getHeaders() });
    return this.handleResponse<SystemStats>(res);
  }

  // System Settings
  async getSettings(): Promise<ApiResponse<any>> {
    const res = await fetch(`${API_BASE}/settings`, { headers: this.getHeaders() });
    return this.handleResponse<any>(res);
  }

  async updateSettings(data: any): Promise<ApiResponse<any>> {
    const res = await fetch(`${API_BASE}/settings`, {
      method: 'PUT',
      headers: this.getHeaders(),
      body: JSON.stringify(data),
    });
    return this.handleResponse<any>(res);
  }
}

export const api = new ApiClient();
