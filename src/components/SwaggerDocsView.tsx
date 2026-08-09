import React, { useState } from 'react';
import { Code, Terminal, Server, Key, CheckCircle, Copy, Send } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const SwaggerDocsView: React.FC = () => {
  const { token } = useAuth();
  const [copied, setCopied] = useState(false);
  const [activeEndpoint, setActiveEndpoint] = useState<string>('GET /api/assignments');
  const [testResult, setTestResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const endpoints = [
    { method: 'POST', path: '/api/auth/login', desc: 'Authenticate user & issue JWT', auth: false, body: '{\n  "email": "admin@school.edu",\n  "password": "Admin123!"\n}' },
    { method: 'GET', path: '/api/auth/me', desc: 'Get authenticated user profile', auth: true },
    { method: 'GET', path: '/api/users', desc: 'List all users (Admin only)', auth: true },
    { method: 'POST', path: '/api/users', desc: 'Create new user (Admin only)', auth: true, body: '{\n  "name": "Jane Smith",\n  "email": "jane@school.edu",\n  "password": "Teacher123!",\n  "role": "Teacher"\n}' },
    { method: 'GET', path: '/api/classes', desc: 'List all classes', auth: true },
    { method: 'POST', path: '/api/classes', desc: 'Create new class (Admin only)', auth: true, body: '{\n  "name": "Grade 12 - A",\n  "gradeLevel": "Grade 12",\n  "code": "12-A",\n  "description": "Senior Class"\n}' },
    { method: 'GET', path: '/api/subjects', desc: 'List all subjects', auth: true },
    { method: 'POST', path: '/api/subjects', desc: 'Create new subject (Admin only)', auth: true, body: '{\n  "name": "Chemistry",\n  "code": "CHEM-101",\n  "description": "General Chemistry"\n}' },
    { method: 'GET', path: '/api/teacher-assignments', desc: 'List teacher class & subject mappings', auth: true },
    { method: 'POST', path: '/api/teacher-assignments', desc: 'Assign teacher to subject & class (Admin)', auth: true, body: '{\n  "teacherId": "usr-teacher-1",\n  "subjectId": "sbj-math",\n  "classId": "cls-10a"\n}' },
    { method: 'GET', path: '/api/student-classes', desc: 'List student class enrollments', auth: true },
    { method: 'POST', path: '/api/student-classes', desc: 'Enroll student in class (Admin)', auth: true, body: '{\n  "studentId": "usr-student-1",\n  "classId": "cls-10a"\n}' },
    { method: 'GET', path: '/api/assignments', desc: 'List assignments (role-filtered scope)', auth: true },
    { method: 'POST', path: '/api/assignments', desc: 'Create assignment (Teacher/Admin)', auth: true, body: '{\n  "title": "Calculus Integration",\n  "description": "Solve problems 1-10",\n  "classId": "cls-101",\n  "subjectId": "sbj-math101",\n  "deadline": "2026-08-30T23:59:59.000Z",\n  "maxMarks": 100,\n  "status": "Published"\n}' },
    { method: 'PATCH', path: '/api/assignments/asg-1/status', desc: 'Update assignment status (Draft/Published/Closed)', auth: true, body: '{\n  "status": "Closed"\n}' },
    { method: 'GET', path: '/api/submissions', desc: 'List student submissions', auth: true },
    { method: 'POST', path: '/api/submissions', desc: 'Submit assignment answer (Student)', auth: true, body: '{\n  "assignmentId": "asg-1",\n  "content": "My step by step mathematical proof..."\n}' },
    { method: 'PUT', path: '/api/submissions/sub-2/grade', desc: 'Grade & feedback submission (Teacher)', auth: true, body: '{\n  "marks": 92,\n  "feedback": "Great work on problem set!",\n  "status": "Reviewed"\n}' },
    { method: 'GET', path: '/api/stats', desc: 'Get system analytics & counts', auth: true },
  ];

  const handleCopyToken = () => {
    if (token) {
      navigator.clipboard.writeText(token);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleRunEndpoint = async (ep: typeof endpoints[0]) => {
    setLoading(true);
    setTestResult(null);
    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (ep.auth && token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const options: RequestInit = {
        method: ep.method,
        headers,
      };

      if (ep.body && (ep.method === 'POST' || ep.method === 'PUT' || ep.method === 'PATCH')) {
        options.body = ep.body;
      }

      const res = await fetch(ep.path, options);
      const json = await res.json();
      setTestResult({ status: res.status, ok: res.ok, data: json });
    } catch (err: any) {
      setTestResult({ status: 500, ok: false, error: err.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="bg-slate-900 text-white p-6 rounded-2xl shadow-md border border-slate-800 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center space-x-3 mb-2">
            <Server className="w-6 h-6 text-indigo-400" />
            <h1 className="text-2xl font-bold tracking-tight">OpenAPI & Swagger Documentation</h1>
          </div>
          <p className="text-sm text-slate-400">
            Interactive REST API playground for the Assignment & Submission Management System.
          </p>
        </div>

        {/* Active JWT Indicator */}
        <div className="bg-slate-800 p-3 rounded-xl border border-slate-700 flex items-center space-x-3 text-xs w-full md:w-auto">
          <Key className="w-4 h-4 text-amber-400 shrink-0" />
          <div className="truncate max-w-[200px]">
            <span className="text-slate-400 block font-mono">Active JWT Token:</span>
            <span className="text-slate-200 font-mono text-[11px] truncate block">{token || 'No token active'}</span>
          </div>
          {token && (
            <button
              onClick={handleCopyToken}
              className="p-1.5 bg-slate-700 hover:bg-slate-600 rounded-lg text-slate-300 transition-colors shrink-0"
              title="Copy Bearer Token"
            >
              {copied ? <CheckCircle className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Endpoint Selector List */}
        <div className="lg:col-span-5 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h2 className="text-base font-bold text-slate-900 flex items-center space-x-2">
              <Terminal className="w-4 h-4 text-indigo-600" />
              <span>Available REST Endpoints ({endpoints.length})</span>
            </h2>
          </div>

          <div className="space-y-2 max-h-[600px] overflow-y-auto pr-1">
            {endpoints.map((ep, idx) => {
              const key = `${ep.method} ${ep.path}`;
              const isSelected = activeEndpoint === key;

              const getMethodColor = (m: string) => {
                switch (m) {
                  case 'GET':
                    return 'bg-blue-100 text-blue-700 border-blue-200';
                  case 'POST':
                    return 'bg-emerald-100 text-emerald-700 border-emerald-200';
                  case 'PUT':
                    return 'bg-amber-100 text-amber-700 border-amber-200';
                  case 'DELETE':
                    return 'bg-rose-100 text-rose-700 border-rose-200';
                  default:
                    return 'bg-slate-100 text-slate-700';
                }
              };

              return (
                <div
                  key={idx}
                  onClick={() => {
                    setActiveEndpoint(key);
                    setTestResult(null);
                  }}
                  className={`p-3 rounded-xl border text-left cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-indigo-50 border-indigo-300 ring-2 ring-indigo-200'
                      : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <div className="flex items-center space-x-2 mb-1">
                    <span className={`px-2 py-0.5 rounded-md text-[11px] font-bold border ${getMethodColor(ep.method)}`}>
                      {ep.method}
                    </span>
                    <span className="font-mono text-xs font-bold text-slate-800">{ep.path}</span>
                    {ep.auth && (
                      <span className="ml-auto px-1.5 py-0.5 rounded text-[10px] bg-slate-200 text-slate-600 font-semibold">
                        JWT
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 line-clamp-1">{ep.desc}</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Live Test Panel */}
        <div className="lg:col-span-7 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-5">
          {(() => {
            const ep = endpoints.find(e => `${e.method} ${e.path}` === activeEndpoint) || endpoints[0];

            return (
              <>
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div>
                    <span className="text-xs font-semibold text-slate-400 block uppercase">Selected Endpoint</span>
                    <h3 className="text-lg font-bold text-slate-900 font-mono">{ep.method} {ep.path}</h3>
                  </div>
                  <button
                    onClick={() => handleRunEndpoint(ep)}
                    disabled={loading}
                    className="flex items-center space-x-2 px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold hover:bg-indigo-700 shadow-sm transition-all disabled:opacity-50"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>{loading ? 'Sending...' : 'Test Request'}</span>
                  </button>
                </div>

                <div className="space-y-2">
                  <span className="text-xs font-bold text-slate-700 block">Description:</span>
                  <p className="text-sm text-slate-600">{ep.desc}</p>
                </div>

                {ep.body && (
                  <div className="space-y-2">
                    <span className="text-xs font-bold text-slate-700 block">Request Payload (JSON):</span>
                    <pre className="p-3 bg-slate-900 text-emerald-400 rounded-xl text-xs font-mono overflow-x-auto">
                      {ep.body}
                    </pre>
                  </div>
                )}

                {testResult && (
                  <div className="space-y-2 pt-3 border-t border-slate-100">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-700">Response Status:</span>
                      <span
                        className={`px-2 py-0.5 rounded text-xs font-bold ${
                          testResult.ok ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        HTTP {testResult.status}
                      </span>
                    </div>
                    <pre className="p-4 bg-slate-900 text-slate-200 rounded-xl text-xs font-mono overflow-x-auto max-h-[300px]">
                      {JSON.stringify(testResult.data || testResult.error, null, 2)}
                    </pre>
                  </div>
                )}
              </>
            );
          })()}
        </div>
      </div>
    </div>
  );
};
