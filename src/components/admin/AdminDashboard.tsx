import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { User, Class, Subject, TeacherSubjectClassAssignment, StudentClassAssignment, SystemStats, UserRole, Assignment, Submission, SubmissionStatus, AssignmentStatus } from '../../types';
import { Users, GraduationCap, BookOpen, School, UserPlus, Trash2, Plus, BarChart3, AlertCircle, CheckCircle, FileText, CheckSquare, Search, Eye, Clock, Award, X, Filter, Settings, ShieldCheck, Save, Database } from 'lucide-react';
import { DashboardSkeleton } from '../common/DashboardSkeleton';

export const AdminDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'stats' | 'users' | 'classes' | 'subjects' | 'teacherAssignments' | 'studentClasses' | 'assignments' | 'submissions' | 'settings'>('stats');

  const [stats, setStats] = useState<SystemStats | null>(null);
  const [usersList, setUsersList] = useState<User[]>([]);
  const [classesList, setClassesList] = useState<Class[]>([]);
  const [subjectsList, setSubjectsList] = useState<Subject[]>([]);
  const [teacherAssignmentsList, setTeacherAssignmentsList] = useState<TeacherSubjectClassAssignment[]>([]);
  const [studentClassesList, setStudentClassesList] = useState<StudentClassAssignment[]>([]);
  const [assignmentsList, setAssignmentsList] = useState<Assignment[]>([]);
  const [submissionsList, setSubmissionsList] = useState<Submission[]>([]);

  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Form states
  const [newUser, setNewUser] = useState({ name: '', email: '', password: '', role: 'Student' as UserRole });
  const [newClass, setNewClass] = useState({ name: '', gradeLevel: '', code: '', description: '' });
  const [newSubject, setNewSubject] = useState({ name: '', code: '', description: '' });
  const [newTeacherAssignment, setNewTeacherAssignment] = useState({ teacherId: '', subjectId: '', classId: '' });
  const [newStudentClass, setNewStudentClass] = useState({ studentId: '', classId: '' });

  // Application Settings State
  const [appSettings, setAppSettings] = useState({
    portalName: 'EduAssign Portal',
    academicYear: '2026-2027',
    allowStudentRegistration: true,
    requireTeacherApproval: false,
    maxFileUploadMB: 25,
    defaultPassingGrade: 50,
  });

  const [settingsSaved, setSettingsSaved] = useState(false);

  const handleSaveAppSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await api.updateSettings(appSettings);
      if (res.data) {
        setAppSettings(res.data);
      }
      setSettingsSaved(true);
      setMessage({ type: 'success', text: 'Application settings saved to database successfully!' });
      setTimeout(() => {
        setSettingsSaved(false);
      }, 3500);
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Failed to save application settings to database.' });
    }
  };

  // Filter & Search states
  const [assignmentSearch, setAssignmentSearch] = useState('');
  const [assignmentStatusFilter, setAssignmentStatusFilter] = useState<string>('All');

  const [submissionSearch, setSubmissionSearch] = useState('');
  const [submissionStatusFilter, setSubmissionStatusFilter] = useState<string>('All');

  // Modal / Detail states
  const [selectedAssignmentForView, setSelectedAssignmentForView] = useState<Assignment | null>(null);
  const [selectedSubmissionForGrade, setSelectedSubmissionForGrade] = useState<Submission | null>(null);
  const [gradeForm, setGradeForm] = useState<{ marks: number; feedback: string; status: SubmissionStatus }>({ marks: 0, feedback: '', status: 'Reviewed' });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [statsRes, usersRes, classesRes, subjectsRes, taRes, scRes, asgRes, subRes, settingsRes] = await Promise.all([
        api.getStats().catch(() => null),
        api.getUsers().catch(() => ({ data: [] })),
        api.getClasses().catch(() => ({ data: [] })),
        api.getSubjects().catch(() => ({ data: [] })),
        api.getTeacherAssignments().catch(() => ({ data: [] })),
        api.getStudentClasses().catch(() => ({ data: [] })),
        api.getAssignments().catch(() => ({ data: [] })),
        api.getSubmissions().catch(() => ({ data: [] })),
        api.getSettings().catch(() => null),
      ]);

      if (statsRes?.data) setStats(statsRes.data);
      if (usersRes?.data) setUsersList(usersRes.data);
      if (classesRes?.data) setClassesList(classesRes.data);
      if (subjectsRes?.data) setSubjectsList(subjectsRes.data);
      if (taRes?.data) setTeacherAssignmentsList(taRes.data);
      if (scRes?.data) setStudentClassesList(scRes.data);
      if (asgRes?.data) setAssignmentsList(asgRes.data);
      if (subRes?.data) setSubmissionsList(subRes.data);
      if (settingsRes?.data) setAppSettings(settingsRes.data);
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Failed to fetch admin dashboard data.' });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await api.createUser(newUser);
      setMessage({ type: 'success', text: `User ${res.data?.name} created successfully.` });
      setNewUser({ name: '', email: '', password: '', role: 'Student' });
      loadData();
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message });
    }
  };

  const handleDeleteUser = async (id: string) => {
    try {
      await api.deleteUser(id);
      setMessage({ type: 'success', text: 'User removed successfully.' });
      loadData();
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message });
    }
  };

  const handleDeleteClass = async (id: string) => {
    try {
      await api.deleteClass(id);
      setMessage({ type: 'success', text: 'Class deleted successfully.' });
      loadData();
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message });
    }
  };

  const handleDeleteSubject = async (id: string) => {
    try {
      await api.deleteSubject(id);
      setMessage({ type: 'success', text: 'Subject deleted successfully.' });
      loadData();
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message });
    }
  };

  const handleDeleteTeacherAssignment = async (id: string) => {
    try {
      await api.deleteTeacherAssignment(id);
      setMessage({ type: 'success', text: 'Teacher assignment removed.' });
      loadData();
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message });
    }
  };

  const handleDeleteStudentEnrollment = async (id: string) => {
    try {
      await api.deleteStudentEnrollment(id);
      setMessage({ type: 'success', text: 'Student enrollment removed.' });
      loadData();
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message });
    }
  };

  const handleCreateClass = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await api.createClass(newClass);
      setMessage({ type: 'success', text: `Class ${res.data?.name} created successfully.` });
      setNewClass({ name: '', gradeLevel: '', code: '', description: '' });
      loadData();
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message });
    }
  };

  const handleCreateSubject = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await api.createSubject(newSubject);
      setMessage({ type: 'success', text: `Subject ${res.data?.name} created successfully.` });
      setNewSubject({ name: '', code: '', description: '' });
      loadData();
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message });
    }
  };

  const handleAssignTeacher = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.assignTeacher(newTeacherAssignment);
      setMessage({ type: 'success', text: 'Teacher mapped to class and subject successfully.' });
      setNewTeacherAssignment({ teacherId: '', subjectId: '', classId: '' });
      loadData();
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message });
    }
  };

  const handleEnrollStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.enrollStudent(newStudentClass);
      setMessage({ type: 'success', text: 'Student enrolled in class successfully.' });
      setNewStudentClass({ studentId: '', classId: '' });
      loadData();
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message });
    }
  };

  const handleDeleteAssignment = async (id: string) => {
    try {
      await api.deleteAssignment(id);
      setMessage({ type: 'success', text: 'Assignment deleted successfully.' });
      if (selectedAssignmentForView?.id === id) setSelectedAssignmentForView(null);
      loadData();
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message });
    }
  };

  const handleUpdateAssignmentStatus = async (id: string, status: 'Draft' | 'Published' | 'Closed') => {
    try {
      await api.updateAssignmentStatus(id, status);
      setMessage({ type: 'success', text: `Assignment status updated to ${status}.` });
      loadData();
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message });
    }
  };

  const handleGradeSubmission = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSubmissionForGrade) return;
    try {
      await api.gradeSubmission(selectedSubmissionForGrade.id, gradeForm);
      setMessage({ type: 'success', text: 'Submission graded successfully.' });
      setSelectedSubmissionForGrade(null);
      loadData();
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message });
    }
  };

  // Filtered lists
  const filteredAssignments = assignmentsList.filter(a => {
    const matchesSearch =
      a.title.toLowerCase().includes(assignmentSearch.toLowerCase()) ||
      a.className?.toLowerCase().includes(assignmentSearch.toLowerCase()) ||
      a.subjectName?.toLowerCase().includes(assignmentSearch.toLowerCase()) ||
      a.teacherName?.toLowerCase().includes(assignmentSearch.toLowerCase());
    const matchesStatus = assignmentStatusFilter === 'All' || a.status === assignmentStatusFilter;
    return matchesSearch && matchesStatus;
  });

  const filteredSubmissions = submissionsList.filter(s => {
    const matchesSearch =
      s.studentName?.toLowerCase().includes(submissionSearch.toLowerCase()) ||
      s.studentEmail?.toLowerCase().includes(submissionSearch.toLowerCase()) ||
      s.assignmentTitle?.toLowerCase().includes(submissionSearch.toLowerCase());
    const matchesStatus = submissionStatusFilter === 'All' || s.status === submissionStatusFilter;
    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return <DashboardSkeleton type="admin" />;
  }

  const teachers = usersList.filter(u => u.role === 'Teacher');
  const students = usersList.filter(u => u.role === 'Student');

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Title & Banner */}
      <div className="bg-gradient-to-r from-purple-900 to-indigo-900 text-white p-6 rounded-2xl shadow-md flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">System Administration Control Panel</h1>
          <p className="text-purple-200 text-sm mt-1">
            Manage institutional users, class sections, subject curriculums, and teaching assignments.
          </p>
        </div>
      </div>

      {/* Alert Notification Banner */}
      {message && (
        <div
          className={`p-4 rounded-xl text-sm font-medium flex items-center justify-between ${
            message.type === 'success' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-rose-50 text-rose-800 border border-rose-200'
          }`}
        >
          <div className="flex items-center space-x-2">
            {message.type === 'success' ? <CheckCircle className="w-5 h-5 text-emerald-600" /> : <AlertCircle className="w-5 h-5 text-rose-600" />}
            <span>{message.text}</span>
          </div>
          <button onClick={() => setMessage(null)} className="text-xs font-bold underline ml-4">
            Dismiss
          </button>
        </div>
      )}

      {/* Nav Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-2">
        <button
          type="button"
          onClick={() => setActiveTab('stats')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center space-x-2 ${
            activeTab === 'stats' ? 'bg-purple-600 text-white shadow-xs' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
          }`}
        >
          <BarChart3 className="w-4 h-4" />
          <span>System Metrics</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('users')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center space-x-2 ${
            activeTab === 'users' ? 'bg-purple-600 text-white shadow-xs' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>User Directory ({usersList.length})</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('classes')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center space-x-2 ${
            activeTab === 'classes' ? 'bg-purple-600 text-white shadow-xs' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
          }`}
        >
          <School className="w-4 h-4" />
          <span>Class Sections ({classesList.length})</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('subjects')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center space-x-2 ${
            activeTab === 'subjects' ? 'bg-purple-600 text-white shadow-xs' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          <span>Subjects ({subjectsList.length})</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('teacherAssignments')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center space-x-2 ${
            activeTab === 'teacherAssignments' ? 'bg-purple-600 text-white shadow-xs' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
          }`}
        >
          <GraduationCap className="w-4 h-4" />
          <span>Teacher Mapping ({teacherAssignmentsList.length})</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('studentClasses')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center space-x-2 ${
            activeTab === 'studentClasses' ? 'bg-purple-600 text-white shadow-xs' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Student Enrollments ({studentClassesList.length})</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('assignments')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center space-x-2 ${
            activeTab === 'assignments' ? 'bg-purple-600 text-white shadow-xs' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>All Assignments ({assignmentsList.length})</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('submissions')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center space-x-2 ${
            activeTab === 'submissions' ? 'bg-purple-600 text-white shadow-xs' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
          }`}
        >
          <CheckSquare className="w-4 h-4" />
          <span>All Submissions ({submissionsList.length})</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('settings')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center space-x-2 ${
            activeTab === 'settings' ? 'bg-purple-600 text-white shadow-xs' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
          }`}
        >
          <Settings className="w-4 h-4" />
          <span>System Settings</span>
        </button>
      </div>

      {/* Tab Contents */}
      {activeTab === 'stats' && stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          <div
            onClick={() => setActiveTab('users')}
            className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs cursor-pointer hover:border-purple-300 transition-all"
          >
            <span className="text-xs font-semibold text-slate-400 block uppercase">Total Users</span>
            <div className="text-3xl font-extrabold text-slate-900 mt-1">{stats.totalUsers}</div>
            <div className="text-xs text-slate-500 mt-2">
              {stats.totalStudents} Students · {stats.totalTeachers} Teachers
            </div>
          </div>
          <div
            onClick={() => setActiveTab('classes')}
            className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs cursor-pointer hover:border-indigo-300 transition-all"
          >
            <span className="text-xs font-semibold text-slate-400 block uppercase">Classes & Subjects</span>
            <div className="text-3xl font-extrabold text-indigo-600 mt-1">{stats.totalClasses}</div>
            <div className="text-xs text-slate-500 mt-2">{stats.totalSubjects} Active Subjects</div>
          </div>
          <div
            onClick={() => setActiveTab('assignments')}
            className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs cursor-pointer hover:border-purple-300 transition-all"
          >
            <span className="text-xs font-semibold text-slate-400 block uppercase">Total Assignments</span>
            <div className="text-3xl font-extrabold text-purple-600 mt-1">{stats.totalAssignments}</div>
            <div className="text-xs text-slate-500 mt-2">{stats.totalSubmissions} Student Submissions</div>
          </div>
          <div
            onClick={() => {
              setActiveTab('submissions');
              setSubmissionStatusFilter('Submitted');
            }}
            className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs cursor-pointer hover:border-amber-300 transition-all"
          >
            <span className="text-xs font-semibold text-slate-400 block uppercase">Pending Grading</span>
            <div className="text-3xl font-extrabold text-amber-600 mt-1">{stats.pendingGradingCount}</div>
            <div className="text-xs text-slate-500 mt-2">Click to review pending submissions</div>
          </div>
        </div>
      )}

      {/* Users Tab */}
      {activeTab === 'users' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Create User Form */}
          <div className="lg:col-span-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <h3 className="text-base font-bold text-slate-900 flex items-center space-x-2">
              <UserPlus className="w-4 h-4 text-purple-600" />
              <span>Create New Account</span>
            </h3>
            <form onSubmit={handleCreateUser} className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={newUser.name}
                  onChange={e => setNewUser({ ...newUser, name: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-purple-500"
                  placeholder="e.g. Prof. Alan Turing"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Email Address</label>
                <input
                  type="email"
                  required
                  value={newUser.email}
                  onChange={e => setNewUser({ ...newUser, email: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-purple-500"
                  placeholder="user@school.edu"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Password</label>
                <input
                  type="password"
                  required
                  value={newUser.password}
                  onChange={e => setNewUser({ ...newUser, password: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-purple-500"
                  placeholder="••••••••"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Assigned Role</label>
                <select
                  value={newUser.role}
                  onChange={e => setNewUser({ ...newUser, role: e.target.value as UserRole })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-purple-500 bg-white"
                >
                  <option value="Student">Student</option>
                  <option value="Teacher">Teacher</option>
                  <option value="Admin">Admin</option>
                </select>
              </div>
              <button
                type="submit"
                className="w-full py-2.5 bg-purple-600 text-white rounded-xl text-xs font-bold hover:bg-purple-700 transition-all shadow-xs"
              >
                Register Account
              </button>
            </form>
          </div>

          {/* Users List */}
          <div className="lg:col-span-8 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
            <h3 className="text-base font-bold text-slate-900 mb-4">All System Accounts</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 text-xs text-slate-400 uppercase font-semibold">
                    <th className="py-2.5 px-3">Name</th>
                    <th className="py-2.5 px-3">Email</th>
                    <th className="py-2.5 px-3">Role</th>
                    <th className="py-2.5 px-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                  {usersList.map(u => (
                    <tr key={u.id} className="hover:bg-slate-50">
                      <td className="py-3 px-3 font-semibold text-slate-900">{u.name}</td>
                      <td className="py-3 px-3 text-slate-600 text-xs font-mono">{u.email}</td>
                      <td className="py-3 px-3">
                        <span
                          className={`px-2 py-0.5 rounded-md text-[11px] font-bold border ${
                            u.role === 'Admin'
                              ? 'bg-purple-100 text-purple-800 border-purple-200'
                              : u.role === 'Teacher'
                              ? 'bg-indigo-100 text-indigo-800 border-indigo-200'
                              : 'bg-emerald-100 text-emerald-800 border-emerald-200'
                          }`}
                        >
                          {u.role}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right">
                        <button
                          onClick={() => handleDeleteUser(u.id)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Classes Tab */}
      {activeTab === 'classes' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <h3 className="text-base font-bold text-slate-900 flex items-center space-x-2">
              <Plus className="w-4 h-4 text-purple-600" />
              <span>Create Class Section</span>
            </h3>
            <form onSubmit={handleCreateClass} className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Class Name</label>
                <input
                  type="text"
                  required
                  value={newClass.name}
                  onChange={e => setNewClass({ ...newClass, name: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm"
                  placeholder="e.g. Grade 10 - Section A"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Grade Level</label>
                <input
                  type="text"
                  required
                  value={newClass.gradeLevel}
                  onChange={e => setNewClass({ ...newClass, gradeLevel: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm"
                  placeholder="Grade 10"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Section Code</label>
                <input
                  type="text"
                  required
                  value={newClass.code}
                  onChange={e => setNewClass({ ...newClass, code: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm uppercase"
                  placeholder="10-A"
                />
              </div>
              <button
                type="submit"
                className="w-full py-2.5 bg-purple-600 text-white rounded-xl text-xs font-bold hover:bg-purple-700"
              >
                Add Class Section
              </button>
            </form>
          </div>

          <div className="lg:col-span-8 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
            <h3 className="text-base font-bold text-slate-900 mb-4">Class Sections</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {classesList.map(c => (
                <div key={c.id} className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex justify-between items-start">
                  <div>
                    <span className="px-2 py-0.5 bg-purple-100 text-purple-800 rounded font-mono text-[10px] font-bold">
                      {c.code}
                    </span>
                    <h4 className="font-bold text-slate-900 text-base mt-1">{c.name}</h4>
                    <p className="text-xs text-slate-500 mt-1">{c.description || c.gradeLevel}</p>
                  </div>
                  <button
                    onClick={() => handleDeleteClass(c.id)}
                    className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors ml-2"
                    title="Delete Class"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Subjects Tab */}
      {activeTab === 'subjects' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <h3 className="text-base font-bold text-slate-900 flex items-center space-x-2">
              <Plus className="w-4 h-4 text-purple-600" />
              <span>Create Subject</span>
            </h3>
            <form onSubmit={handleCreateSubject} className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Subject Name</label>
                <input
                  type="text"
                  required
                  value={newSubject.name}
                  onChange={e => setNewSubject({ ...newSubject, name: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm"
                  placeholder="Advanced Mathematics"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Subject Code</label>
                <input
                  type="text"
                  required
                  value={newSubject.code}
                  onChange={e => setNewSubject({ ...newSubject, code: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm uppercase"
                  placeholder="MATH-101"
                />
              </div>
              <button
                type="submit"
                className="w-full py-2.5 bg-purple-600 text-white rounded-xl text-xs font-bold hover:bg-purple-700"
              >
                Add Subject
              </button>
            </form>
          </div>

          <div className="lg:col-span-8 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
            <h3 className="text-base font-bold text-slate-900 mb-4">Subjects Catalog</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {subjectsList.map(s => (
                <div key={s.id} className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex justify-between items-start">
                  <div>
                    <span className="px-2 py-0.5 bg-indigo-100 text-indigo-800 rounded font-mono text-[10px] font-bold">
                      {s.code}
                    </span>
                    <h4 className="font-bold text-slate-900 text-base mt-1">{s.name}</h4>
                    <p className="text-xs text-slate-500 mt-1">{s.description || 'Core academic subject'}</p>
                  </div>
                  <button
                    onClick={() => handleDeleteSubject(s.id)}
                    className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors ml-2"
                    title="Delete Subject"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Teacher Assignments Tab */}
      {activeTab === 'teacherAssignments' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <h3 className="text-base font-bold text-slate-900 flex items-center space-x-2">
              <Plus className="w-4 h-4 text-purple-600" />
              <span>Map Teacher to Class & Subject</span>
            </h3>
            <form onSubmit={handleAssignTeacher} className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Select Teacher</label>
                <select
                  required
                  value={newTeacherAssignment.teacherId}
                  onChange={e => setNewTeacherAssignment({ ...newTeacherAssignment, teacherId: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm bg-white"
                >
                  <option value="">-- Choose Teacher --</option>
                  {teachers.map(t => (
                    <option key={t.id} value={t.id}>
                      {t.name} ({t.email})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Select Subject</label>
                <select
                  required
                  value={newTeacherAssignment.subjectId}
                  onChange={e => setNewTeacherAssignment({ ...newTeacherAssignment, subjectId: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm bg-white"
                >
                  <option value="">-- Choose Subject --</option>
                  {subjectsList.map(s => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.code})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Select Class Section</label>
                <select
                  required
                  value={newTeacherAssignment.classId}
                  onChange={e => setNewTeacherAssignment({ ...newTeacherAssignment, classId: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm bg-white"
                >
                  <option value="">-- Choose Class --</option>
                  {classesList.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.code})
                    </option>
                  ))}
                </select>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-purple-600 text-white rounded-xl text-xs font-bold hover:bg-purple-700"
              >
                Assign Teacher
              </button>
            </form>
          </div>

          <div className="lg:col-span-8 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
            <h3 className="text-base font-bold text-slate-900 mb-4">Active Teacher Assignments</h3>
            <div className="space-y-3">
              {teacherAssignmentsList.map(ta => (
                <div key={ta.id} className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex justify-between items-center">
                  <div>
                    <span className="font-bold text-slate-900 block text-sm">{ta.teacherName}</span>
                    <span className="text-xs text-indigo-600 font-semibold">{ta.subjectName}</span>
                    <span className="text-xs text-slate-400 mx-1.5">•</span>
                    <span className="text-xs text-purple-600 font-semibold">{ta.className}</span>
                  </div>
                  <button
                    onClick={() => handleDeleteTeacherAssignment(ta.id)}
                    className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors"
                    title="Remove Teacher Mapping"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Student Classes Tab */}
      {activeTab === 'studentClasses' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <h3 className="text-base font-bold text-slate-900 flex items-center space-x-2">
              <Plus className="w-4 h-4 text-purple-600" />
              <span>Enroll Student into Class</span>
            </h3>
            <form onSubmit={handleEnrollStudent} className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Select Student</label>
                <select
                  required
                  value={newStudentClass.studentId}
                  onChange={e => setNewStudentClass({ ...newStudentClass, studentId: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm bg-white"
                >
                  <option value="">-- Choose Student --</option>
                  {students.map(s => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.email})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Select Class Section</label>
                <select
                  required
                  value={newStudentClass.classId}
                  onChange={e => setNewStudentClass({ ...newStudentClass, classId: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm bg-white"
                >
                  <option value="">-- Choose Class --</option>
                  {classesList.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.code})
                    </option>
                  ))}
                </select>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-purple-600 text-white rounded-xl text-xs font-bold hover:bg-purple-700"
              >
                Enroll Student
              </button>
            </form>
          </div>

          <div className="lg:col-span-8 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
            <h3 className="text-base font-bold text-slate-900 mb-4">Student Enrollments</h3>
            <div className="space-y-3">
              {studentClassesList.map(sc => (
                <div key={sc.id} className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex justify-between items-center">
                  <div>
                    <span className="font-bold text-slate-900 block text-sm">{sc.studentName}</span>
                    <span className="text-xs text-slate-500 font-mono">{sc.studentEmail}</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 rounded-lg text-xs font-bold">
                      {sc.className}
                    </span>
                    <button
                      onClick={() => handleDeleteStudentEnrollment(sc.id)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors"
                      title="Unenroll Student"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* All Assignments Tab */}
      {activeTab === 'assignments' && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h3 className="text-lg font-bold text-slate-900">All Assignments</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Overview of all class assignments created across all teachers and subjects.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
              <div className="relative flex-1 sm:w-64">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Search title, class, teacher..."
                  value={assignmentSearch}
                  onChange={e => setAssignmentSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div className="flex items-center space-x-1.5 bg-slate-50 p-1 rounded-xl border border-slate-200">
                <Filter className="w-3.5 h-3.5 text-slate-400 ml-1.5" />
                <select
                  value={assignmentStatusFilter}
                  onChange={e => setAssignmentStatusFilter(e.target.value)}
                  className="text-xs font-medium bg-transparent text-slate-700 pr-2 py-1 focus:outline-none cursor-pointer"
                >
                  <option value="All">All Statuses</option>
                  <option value="Published">Published</option>
                  <option value="Draft">Draft</option>
                  <option value="Closed">Closed</option>
                </select>
              </div>
            </div>
          </div>

          {filteredAssignments.length === 0 ? (
            <div className="p-8 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200 text-slate-500 text-sm">
              No assignments found matching your filter criteria.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-600">
                <thead className="text-xs uppercase bg-slate-50 text-slate-500 border-b border-slate-200 font-semibold">
                  <tr>
                    <th className="px-4 py-3">Assignment Title</th>
                    <th className="px-4 py-3">Class & Subject</th>
                    <th className="px-4 py-3">Teacher Author</th>
                    <th className="px-4 py-3">Deadline</th>
                    <th className="px-4 py-3 text-center">Max Marks</th>
                    <th className="px-4 py-3 text-center">Status</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredAssignments.map(a => (
                    <tr key={a.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-4 py-3 font-semibold text-slate-900 max-w-xs">
                        <div className="truncate" title={a.title}>{a.title}</div>
                        <div className="text-[11px] text-slate-400 font-normal line-clamp-1">{a.description}</div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-medium text-slate-800">{a.className || 'Unknown Class'}</div>
                        <div className="text-xs text-indigo-600 font-medium">{a.subjectName || 'Unknown Subject'}</div>
                      </td>
                      <td className="px-4 py-3 font-medium text-slate-700">
                        {a.teacherName || 'Unknown Teacher'}
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-600 whitespace-nowrap">
                        <div className="flex items-center space-x-1">
                          <Clock className="w-3.5 h-3.5 text-slate-400" />
                          <span>{new Date(a.deadline).toLocaleDateString()}</span>
                        </div>
                        <div className="text-[10px] text-slate-400 pl-4">
                          {new Date(a.deadline).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center font-bold text-slate-900">
                        {a.maxMarks}
                      </td>
                      <td className="px-4 py-3 text-center whitespace-nowrap">
                        <select
                          value={a.status}
                          onChange={e => handleUpdateAssignmentStatus(a.id, e.target.value as any)}
                          className={`text-xs font-bold px-2.5 py-1 rounded-full border cursor-pointer focus:outline-none ${
                            a.status === 'Published'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : a.status === 'Closed'
                              ? 'bg-rose-50 text-rose-700 border-rose-200'
                              : 'bg-amber-50 text-amber-700 border-amber-200'
                          }`}
                        >
                          <option value="Draft">Draft</option>
                          <option value="Published">Published</option>
                          <option value="Closed">Closed</option>
                        </select>
                      </td>
                      <td className="px-4 py-3 text-right whitespace-nowrap space-x-2">
                        <button
                          onClick={() => setSelectedAssignmentForView(a)}
                          className="p-1.5 text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                          title="View Details & Submissions"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteAssignment(a.id)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                          title="Delete Assignment"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* All Submissions Tab */}
      {activeTab === 'submissions' && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h3 className="text-lg font-bold text-slate-900">All Student Submissions</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Inspect, review, or grade submissions submitted by students across all classes.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
              <div className="relative flex-1 sm:w-64">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Search student, email, assignment..."
                  value={submissionSearch}
                  onChange={e => setSubmissionSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div className="flex items-center space-x-1.5 bg-slate-50 p-1 rounded-xl border border-slate-200">
                <Filter className="w-3.5 h-3.5 text-slate-400 ml-1.5" />
                <select
                  value={submissionStatusFilter}
                  onChange={e => setSubmissionStatusFilter(e.target.value)}
                  className="text-xs font-medium bg-transparent text-slate-700 pr-2 py-1 focus:outline-none cursor-pointer"
                >
                  <option value="All">All Statuses</option>
                  <option value="Submitted">Submitted (Pending)</option>
                  <option value="Reviewed">Reviewed</option>
                  <option value="Returned">Returned</option>
                  <option value="Late">Late</option>
                </select>
              </div>
            </div>
          </div>

          {filteredSubmissions.length === 0 ? (
            <div className="p-8 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200 text-slate-500 text-sm">
              No submissions found matching your filter criteria.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-600">
                <thead className="text-xs uppercase bg-slate-50 text-slate-500 border-b border-slate-200 font-semibold">
                  <tr>
                    <th className="px-4 py-3">Student</th>
                    <th className="px-4 py-3">Assignment Title</th>
                    <th className="px-4 py-3">Submitted Date</th>
                    <th className="px-4 py-3 text-center">Marks / Max</th>
                    <th className="px-4 py-3 text-center">Status</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredSubmissions.map(s => (
                    <tr key={s.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-4 py-3">
                        <div className="font-bold text-slate-900">{s.studentName || 'Unknown Student'}</div>
                        <div className="text-xs text-slate-400 font-mono">{s.studentEmail}</div>
                      </td>
                      <td className="px-4 py-3 font-semibold text-slate-800 max-w-xs truncate" title={s.assignmentTitle}>
                        {s.assignmentTitle || 'Unknown Assignment'}
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-600 whitespace-nowrap">
                        <div className="flex items-center space-x-1">
                          <Clock className="w-3.5 h-3.5 text-slate-400" />
                          <span>{new Date(s.submittedAt).toLocaleDateString()}</span>
                        </div>
                        <div className="text-[10px] text-slate-400 pl-4">
                          {new Date(s.submittedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center whitespace-nowrap">
                        {s.marks !== undefined && s.marks !== null ? (
                          <span className="font-extrabold text-slate-900">
                            {s.marks} <span className="text-slate-400 font-normal">/ {s.maxMarks || 100}</span>
                          </span>
                        ) : (
                          <span className="text-xs font-semibold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-md">
                            Pending Grade
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center whitespace-nowrap">
                        <span
                          className={`text-xs font-bold px-2.5 py-1 rounded-full border ${
                            s.status === 'Reviewed'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : s.status === 'Returned'
                              ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
                              : s.status === 'Late'
                              ? 'bg-rose-50 text-rose-700 border-rose-200'
                              : 'bg-amber-50 text-amber-700 border-amber-200'
                          }`}
                        >
                          {s.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right whitespace-nowrap">
                        <button
                          onClick={() => {
                            setSelectedSubmissionForGrade(s);
                            setGradeForm({
                              marks: s.marks ?? 0,
                              feedback: s.feedback ?? '',
                              status: s.status || 'Reviewed',
                            });
                          }}
                          className="px-3 py-1.5 bg-purple-50 text-purple-700 hover:bg-purple-100 rounded-xl text-xs font-bold transition-all flex items-center space-x-1 ml-auto"
                        >
                          <Award className="w-3.5 h-3.5" />
                          <span>Inspect & Grade</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* View Assignment Modal */}
      {selectedAssignmentForView && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white w-full max-w-3xl rounded-2xl shadow-xl border border-slate-200 overflow-hidden my-8">
            <div className="p-6 bg-slate-900 text-white flex justify-between items-start">
              <div>
                <div className="flex items-center space-x-2 text-xs font-bold text-purple-300 mb-1">
                  <span>{selectedAssignmentForView.className}</span>
                  <span>•</span>
                  <span>{selectedAssignmentForView.subjectName}</span>
                </div>
                <h2 className="text-xl font-bold">{selectedAssignmentForView.title}</h2>
                <div className="text-xs text-slate-400 mt-1">
                  Created by <span className="text-white font-medium">{selectedAssignmentForView.teacherName}</span>
                </div>
              </div>
              <button
                onClick={() => setSelectedAssignmentForView(null)}
                className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
              <div className="grid grid-cols-3 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200 text-center">
                <div>
                  <span className="text-[11px] text-slate-400 uppercase font-semibold block">Deadline</span>
                  <span className="text-xs font-bold text-slate-900 mt-0.5 block">
                    {new Date(selectedAssignmentForView.deadline).toLocaleString()}
                  </span>
                </div>
                <div>
                  <span className="text-[11px] text-slate-400 uppercase font-semibold block">Max Marks</span>
                  <span className="text-xs font-bold text-purple-600 mt-0.5 block">
                    {selectedAssignmentForView.maxMarks} Points
                  </span>
                </div>
                <div>
                  <span className="text-[11px] text-slate-400 uppercase font-semibold block">Status</span>
                  <span className="text-xs font-bold text-emerald-600 mt-0.5 block">
                    {selectedAssignmentForView.status}
                  </span>
                </div>
              </div>

              <div>
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Instructions / Prompt</h4>
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">
                  {selectedAssignmentForView.description}
                </div>
              </div>

              <div>
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
                  Submissions Received for this Assignment
                </h4>
                {submissionsList.filter(s => s.assignmentId === selectedAssignmentForView.id).length === 0 ? (
                  <div className="text-center p-6 bg-slate-50 rounded-xl text-slate-500 text-xs">
                    No student submissions recorded for this assignment yet.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {submissionsList
                      .filter(s => s.assignmentId === selectedAssignmentForView.id)
                      .map(sub => (
                        <div key={sub.id} className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex justify-between items-center text-xs">
                          <div>
                            <span className="font-bold text-slate-900 block">{sub.studentName}</span>
                            <span className="text-slate-400">{new Date(sub.submittedAt).toLocaleString()}</span>
                          </div>
                          <div className="flex items-center space-x-3">
                            <span className="font-bold text-slate-700">
                              {sub.marks !== undefined ? `${sub.marks} / ${selectedAssignmentForView.maxMarks}` : 'Ungraded'}
                            </span>
                            <button
                              onClick={() => {
                                setSelectedSubmissionForGrade(sub);
                                setGradeForm({
                                  marks: sub.marks ?? 0,
                                  feedback: sub.feedback ?? '',
                                  status: sub.status || 'Reviewed',
                                });
                              }}
                              className="px-2.5 py-1 bg-purple-600 text-white rounded-lg font-bold text-[11px] hover:bg-purple-700"
                            >
                              Grade
                            </button>
                          </div>
                        </div>
                      ))}
                  </div>
                )}
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end">
              <button
                onClick={() => setSelectedAssignmentForView(null)}
                className="px-4 py-2 bg-slate-200 text-slate-800 rounded-xl text-xs font-bold hover:bg-slate-300"
              >
                Close View
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Grade / Inspect Submission Modal */}
      {selectedSubmissionForGrade && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white w-full max-w-2xl rounded-2xl shadow-xl border border-slate-200 overflow-hidden my-8">
            <div className="p-6 bg-purple-900 text-white flex justify-between items-start">
              <div>
                <span className="text-xs font-bold text-purple-300 uppercase block mb-1">
                  Submission Inspection
                </span>
                <h2 className="text-xl font-bold">{selectedSubmissionForGrade.assignmentTitle}</h2>
                <p className="text-xs text-purple-200 mt-1">
                  Student: <span className="font-semibold text-white">{selectedSubmissionForGrade.studentName}</span> ({selectedSubmissionForGrade.studentEmail})
                </p>
              </div>
              <button
                onClick={() => setSelectedSubmissionForGrade(null)}
                className="p-1 text-purple-300 hover:text-white rounded-lg hover:bg-purple-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleGradeSubmission} className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
              <div>
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-2">
                  Submitted Student Answer Content
                </label>
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-sm text-slate-800 whitespace-pre-wrap font-mono leading-relaxed">
                  {selectedSubmissionForGrade.content}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Awarded Marks (Max: {selectedSubmissionForGrade.maxMarks || 100})
                  </label>
                  <input
                    type="number"
                    min="0"
                    max={selectedSubmissionForGrade.maxMarks || 100}
                    required
                    value={gradeForm.marks}
                    onChange={e => setGradeForm({ ...gradeForm, marks: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm font-bold text-slate-900"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Update Status</label>
                  <select
                    value={gradeForm.status}
                    onChange={e => setGradeForm({ ...gradeForm, status: e.target.value as SubmissionStatus })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm bg-white font-medium"
                  >
                    <option value="Reviewed">Reviewed</option>
                    <option value="Returned">Returned</option>
                    <option value="Submitted">Submitted</option>
                    <option value="Late">Late</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Feedback / Comments for Student
                </label>
                <textarea
                  rows={3}
                  placeholder="Provide constructive feedback or notes on this submission..."
                  value={gradeForm.feedback}
                  onChange={e => setGradeForm({ ...gradeForm, feedback: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div className="flex justify-end space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedSubmissionForGrade(null)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl text-xs font-bold hover:bg-slate-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-purple-600 text-white rounded-xl text-xs font-bold hover:bg-purple-700 shadow-xs"
                >
                  Save Grade & Feedback
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* System Settings Tab */}
      {activeTab === 'settings' && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-6 max-w-4xl">
          <div className="flex items-center space-x-3 pb-4 border-b border-slate-100">
            <div className="p-3 bg-purple-50 text-purple-600 rounded-2xl">
              <Settings className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900">Application-Level System Settings</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Configure global portal metadata, registration policies, grading defaults, and security configurations.
              </p>
            </div>
          </div>

          <form onSubmit={handleSaveAppSettings} className="space-y-6">
            {settingsSaved && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-semibold flex items-center space-x-2 animate-fadeIn">
                <CheckCircle className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                <span>System settings updated and persisted successfully!</span>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Portal Name</label>
                <input
                  type="text"
                  required
                  value={appSettings.portalName}
                  onChange={e => setAppSettings({ ...appSettings, portalName: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Academic Term / Year</label>
                <input
                  type="text"
                  required
                  value={appSettings.academicYear}
                  onChange={e => setAppSettings({ ...appSettings, academicYear: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Default Passing Grade (%)</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  required
                  value={appSettings.defaultPassingGrade}
                  onChange={e => setAppSettings({ ...appSettings, defaultPassingGrade: Number(e.target.value) })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Max File Upload Limit (MB)</label>
                <input
                  type="number"
                  min="1"
                  max="100"
                  required
                  value={appSettings.maxFileUploadMB}
                  onChange={e => setAppSettings({ ...appSettings, maxFileUploadMB: Number(e.target.value) })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
            </div>

            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-4">
              <h4 className="text-xs font-bold uppercase text-slate-400 tracking-wider">Access & Registration Policies</h4>
              
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-sm font-bold text-slate-900 block">Allow Self-Registration for Students</span>
                  <span className="text-xs text-slate-500">Students can create accounts on the public login page without manual invitation.</span>
                </div>
                <input
                  type="checkbox"
                  checked={appSettings.allowStudentRegistration}
                  onChange={e => setAppSettings({ ...appSettings, allowStudentRegistration: e.target.checked })}
                  className="w-5 h-5 text-purple-600 rounded-md focus:ring-purple-500 cursor-pointer"
                />
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-slate-200">
                <div>
                  <span className="text-sm font-bold text-slate-900 block">Require Admin Approval for Teacher Accounts</span>
                  <span className="text-xs text-slate-500">Teacher registrations remain pending until explicitly verified by an Administrator.</span>
                </div>
                <input
                  type="checkbox"
                  checked={appSettings.requireTeacherApproval}
                  onChange={e => setAppSettings({ ...appSettings, requireTeacherApproval: e.target.checked })}
                  className="w-5 h-5 text-purple-600 rounded-md focus:ring-purple-500 cursor-pointer"
                />
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                className={`px-6 py-2.5 font-bold rounded-xl text-xs shadow-xs flex items-center space-x-2 cursor-pointer transition-all ${
                  settingsSaved
                    ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                    : 'bg-purple-600 text-white hover:bg-purple-700'
                }`}
              >
                {settingsSaved ? (
                  <>
                    <CheckCircle className="w-4 h-4 text-white" />
                    <span>Settings Saved Successfully!</span>
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    <span>Save Application Settings</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
