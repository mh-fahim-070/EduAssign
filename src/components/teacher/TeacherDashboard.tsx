import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { Assignment, Submission, TeacherSubjectClassAssignment, AssignmentStatus } from '../../types';
import { Plus, Edit2, Trash2, CheckCircle2, Clock, AlertCircle, Eye, Award, FileText, Send } from 'lucide-react';
import { DashboardSkeleton } from '../common/DashboardSkeleton';

export const TeacherDashboard: React.FC = () => {
  const [assignmentsList, setAssignmentsList] = useState<Assignment[]>([]);
  const [submissionsList, setSubmissionsList] = useState<Submission[]>([]);
  const [teacherScopes, setTeacherScopes] = useState<TeacherSubjectClassAssignment[]>([]);

  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const [showModal, setShowModal] = useState(false);
  const [editingAssignment, setEditingAssignment] = useState<Assignment | null>(null);

  const [selectedAssignmentForReview, setSelectedAssignmentForReview] = useState<Assignment | null>(null);

  // Form State for Create/Edit Assignment
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    classId: '',
    subjectId: '',
    deadline: '',
    maxMarks: 100,
    status: 'Draft' as AssignmentStatus,
  });

  // Form State for Grading
  const [gradingSubmission, setGradingSubmission] = useState<Submission | null>(null);
  const [gradeData, setGradeData] = useState({
    marks: 0,
    feedback: '',
    status: 'Reviewed',
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [asgRes, scopesRes] = await Promise.all([
        api.getAssignments().catch(() => ({ data: [] })),
        api.getTeacherAssignments().catch(() => ({ data: [] })),
      ]);

      if (asgRes?.data) setAssignmentsList(asgRes.data);
      if (scopesRes?.data) setTeacherScopes(scopesRes.data);
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Failed to load teacher dashboard data.' });
    } finally {
      setLoading(false);
    }
  };

  const loadSubmissionsForAssignment = async (asg: Assignment) => {
    setSelectedAssignmentForReview(asg);
    try {
      const res = await api.getSubmissions(asg.id);
      if (res?.data) setSubmissionsList(res.data);
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message });
    }
  };

  const handleOpenCreateModal = () => {
    setEditingAssignment(null);
    setFormData({
      title: '',
      description: '',
      classId: teacherScopes[0]?.classId || '',
      subjectId: teacherScopes[0]?.subjectId || '',
      deadline: new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 16),
      maxMarks: 100,
      status: 'Published',
    });
    setShowModal(true);
  };

  const handleOpenEditModal = (asg: Assignment) => {
    setEditingAssignment(asg);
    setFormData({
      title: asg.title,
      description: asg.description,
      classId: asg.classId,
      subjectId: asg.subjectId,
      deadline: new Date(asg.deadline).toISOString().slice(0, 16),
      maxMarks: asg.maxMarks,
      status: asg.status,
    });
    setShowModal(true);
  };

  const handleSaveAssignment = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingAssignment) {
        await api.updateAssignment(editingAssignment.id, {
          title: formData.title,
          description: formData.description,
          deadline: formData.deadline,
          maxMarks: Number(formData.maxMarks),
          status: formData.status,
        });
        setMessage({ type: 'success', text: `Assignment '${formData.title}' updated successfully.` });
      } else {
        await api.createAssignment({
          title: formData.title,
          description: formData.description,
          classId: formData.classId,
          subjectId: formData.subjectId,
          deadline: formData.deadline,
          maxMarks: Number(formData.maxMarks),
          status: formData.status,
        });
        setMessage({ type: 'success', text: `Assignment '${formData.title}' created successfully.` });
      }

      setShowModal(false);
      loadData();
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message });
    }
  };

  const handleStatusChange = async (id: string, newStatus: AssignmentStatus) => {
    try {
      await api.updateAssignmentStatus(id, newStatus);
      setMessage({ type: 'success', text: `Assignment status changed to '${newStatus}'.` });
      loadData();
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message });
    }
  };

  const handleDeleteAssignment = async (id: string) => {
    try {
      await api.deleteAssignment(id);
      setMessage({ type: 'success', text: 'Assignment deleted successfully.' });
      loadData();
      if (selectedAssignmentForReview?.id === id) {
        setSelectedAssignmentForReview(null);
        setSubmissionsList([]);
      }
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message });
    }
  };

  const handleOpenGradeModal = (sub: Submission) => {
    setGradingSubmission(sub);
    setGradeData({
      marks: sub.marks !== undefined && sub.marks !== null ? sub.marks : selectedAssignmentForReview?.maxMarks || 100,
      feedback: sub.feedback || '',
      status: sub.status === 'Submitted' || sub.status === 'Late' ? 'Reviewed' : sub.status,
    });
  };

  const handleSaveGrade = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!gradingSubmission || !selectedAssignmentForReview) return;

    if (gradeData.marks < 0) {
      setMessage({ type: 'error', text: 'Validation Error: Marks cannot be negative.' });
      return;
    }

    if (gradeData.marks > selectedAssignmentForReview.maxMarks) {
      setMessage({
        type: 'error',
        text: `Validation Error: Marks cannot exceed maximum marks (${selectedAssignmentForReview.maxMarks}).`,
      });
      return;
    }

    try {
      await api.gradeSubmission(gradingSubmission.id, {
        marks: Number(gradeData.marks),
        feedback: gradeData.feedback,
        status: gradeData.status,
      });

      setMessage({ type: 'success', text: 'Submission graded successfully.' });
      setGradingSubmission(null);
      loadSubmissionsForAssignment(selectedAssignmentForReview);
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message });
    }
  };

  if (loading) {
    return <DashboardSkeleton type="teacher" />;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Banner */}
      <div className="bg-gradient-to-r from-indigo-900 to-slate-900 text-white p-6 rounded-2xl shadow-md flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Teacher Assignment & Grading Console</h1>
          <p className="text-indigo-200 text-sm mt-1">
            Authorized Scope: {teacherScopes.length} Class/Subject Mappings
          </p>
        </div>
        <button
          onClick={handleOpenCreateModal}
          className="flex items-center space-x-2 px-4 py-2.5 bg-indigo-500 hover:bg-indigo-600 text-white rounded-xl font-bold text-xs shadow-sm transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>Create New Assignment</span>
        </button>
      </div>

      {/* Messages */}
      {message && (
        <div
          className={`p-4 rounded-xl text-sm font-medium flex items-center justify-between ${
            message.type === 'success' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-rose-50 text-rose-800 border border-rose-200'
          }`}
        >
          <span>{message.text}</span>
          <button onClick={() => setMessage(null)} className="text-xs font-bold underline ml-4">
            Dismiss
          </button>
        </div>
      )}

      {/* Authorized Scopes */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <h3 className="text-sm font-bold text-slate-700 uppercase mb-3">Your Authorized Teaching Classes</h3>
        <div className="flex flex-wrap gap-3">
          {teacherScopes.map(scope => (
            <div key={scope.id} className="px-3 py-2 bg-indigo-50 border border-indigo-200 rounded-xl text-xs font-semibold text-indigo-900 flex items-center space-x-2">
              <span className="w-2 h-2 rounded-full bg-indigo-600"></span>
              <span>{scope.className}</span>
              <span className="text-slate-400">•</span>
              <span className="text-indigo-700">{scope.subjectName}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Main Grid: Assignments List + Submission Review Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Assignments List */}
        <div className="lg:col-span-6 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <h2 className="text-base font-bold text-slate-900 flex items-center justify-between">
            <span>Created Assignments ({assignmentsList.length})</span>
          </h2>

          <div className="space-y-3">
            {assignmentsList.map(asg => {
              const isSelected = selectedAssignmentForReview?.id === asg.id;

              return (
                <div
                  key={asg.id}
                  className={`p-4 rounded-xl border transition-all ${
                    isSelected ? 'bg-indigo-50 border-indigo-300 ring-2 ring-indigo-200' : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center space-x-2 mb-1">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${
                            asg.status === 'Published'
                              ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
                              : asg.status === 'Closed'
                              ? 'bg-slate-200 text-slate-800 border-slate-300'
                              : 'bg-amber-100 text-amber-800 border-amber-200'
                          }`}
                        >
                          {asg.status}
                        </span>
                        <span className="text-xs font-semibold text-indigo-700">{asg.className}</span>
                        <span className="text-slate-300">•</span>
                        <span className="text-xs font-semibold text-slate-600">{asg.subjectName}</span>
                      </div>
                      <h3 className="font-bold text-slate-900 text-base">{asg.title}</h3>
                      <p className="text-xs text-slate-500 mt-1 line-clamp-2">{asg.description}</p>
                    </div>
                  </div>

                  <div className="mt-3 pt-3 border-t border-slate-200 flex items-center justify-between text-xs text-slate-600">
                    <div className="flex items-center space-x-3">
                      <span className="flex items-center space-x-1">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        <span>Deadline: {new Date(asg.deadline).toLocaleDateString()}</span>
                      </span>
                      <span className="font-bold text-indigo-900">Max Marks: {asg.maxMarks}</span>
                    </div>

                    <div className="flex items-center space-x-1">
                      {asg.status === 'Draft' && (
                        <button
                          onClick={() => handleStatusChange(asg.id, 'Published')}
                          className="px-2 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[11px] font-bold"
                          title="Publish Assignment"
                        >
                          Publish
                        </button>
                      )}
                      {asg.status === 'Published' && (
                        <button
                          onClick={() => handleStatusChange(asg.id, 'Closed')}
                          className="px-2 py-1 bg-slate-700 hover:bg-slate-800 text-white rounded-lg text-[11px] font-bold"
                          title="Close Assignment"
                        >
                          Close
                        </button>
                      )}
                      {asg.status === 'Closed' && (
                        <button
                          onClick={() => handleStatusChange(asg.id, 'Published')}
                          className="px-2 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-[11px] font-bold"
                          title="Re-open Assignment"
                        >
                          Re-open
                        </button>
                      )}
                      <button
                        onClick={() => loadSubmissionsForAssignment(asg)}
                        className="p-1.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-semibold flex items-center space-x-1"
                        title="View & Grade Submissions"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span className="text-[11px]">Submissions ({asg.submissionCount})</span>
                      </button>
                      <button
                        onClick={() => handleOpenEditModal(asg)}
                        className="p-1.5 text-slate-600 hover:text-indigo-600 hover:bg-slate-200 rounded-lg"
                        title="Edit Assignment"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteAssignment(asg.id)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg"
                        title="Delete Assignment"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Submissions & Grading Review Panel */}
        <div className="lg:col-span-6 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          {selectedAssignmentForReview ? (
            <>
              <div className="pb-3 border-b border-slate-100">
                <span className="text-xs font-bold text-indigo-600 uppercase block">Grading Review Panel</span>
                <h3 className="text-lg font-bold text-slate-900">{selectedAssignmentForReview.title}</h3>
                <p className="text-xs text-slate-500">{selectedAssignmentForReview.className} · {selectedAssignmentForReview.subjectName}</p>
              </div>

              <div className="space-y-3 max-h-[500px] overflow-y-auto">
                {submissionsList.length === 0 ? (
                  <div className="p-8 text-center text-slate-400 text-xs italic">
                    No student submissions recorded for this assignment yet.
                  </div>
                ) : (
                  submissionsList.map(sub => (
                    <div key={sub.id} className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="font-bold text-slate-900 text-sm block">{sub.studentName}</span>
                          <span className="text-xs text-slate-500 font-mono">{sub.studentEmail}</span>
                        </div>
                        <span
                          className={`px-2 py-0.5 rounded text-xs font-bold ${
                            sub.status === 'Reviewed'
                              ? 'bg-emerald-100 text-emerald-800'
                              : sub.status === 'Late'
                              ? 'bg-rose-100 text-rose-800'
                              : 'bg-indigo-100 text-indigo-800'
                          }`}
                        >
                          {sub.status}
                        </span>
                      </div>

                      <div className="p-3 bg-white rounded-lg border border-slate-200 text-xs text-slate-700 font-mono whitespace-pre-wrap">
                        {sub.content}
                      </div>

                      <div className="flex items-center justify-between pt-2">
                        <div className="text-xs">
                          {sub.marks !== undefined && sub.marks !== null ? (
                            <span className="font-bold text-emerald-700 text-sm">
                              Marks: {sub.marks} / {selectedAssignmentForReview.maxMarks}
                            </span>
                          ) : (
                            <span className="text-amber-600 font-semibold italic">Not graded yet</span>
                          )}
                        </div>

                        <button
                          onClick={() => handleOpenGradeModal(sub)}
                          className="px-3 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold flex items-center space-x-1"
                        >
                          <Award className="w-3.5 h-3.5" />
                          <span>Grade Work</span>
                        </button>
                      </div>

                      {sub.feedback && (
                        <div className="text-xs bg-indigo-50 p-2 rounded-lg text-indigo-900 font-medium">
                          <strong>Teacher Feedback:</strong> {sub.feedback}
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </>
          ) : (
            <div className="p-12 text-center text-slate-400 space-y-2">
              <FileText className="w-8 h-8 mx-auto text-slate-300" />
              <p className="text-sm font-semibold text-slate-600">Select an assignment to view student submissions</p>
              <p className="text-xs">Click 'Submissions' on any assignment on the left panel to review & grade answers.</p>
            </div>
          )}
        </div>
      </div>

      {/* Modal for Create/Edit Assignment */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border border-slate-200 space-y-4">
            <h3 className="text-lg font-bold text-slate-900">
              {editingAssignment ? 'Edit Assignment' : 'Create New Assignment'}
            </h3>

            <form onSubmit={handleSaveAssignment} className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Title</label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={e => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm"
                  placeholder="Assignment title"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Description</label>
                <textarea
                  required
                  rows={3}
                  value={formData.description}
                  onChange={e => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm"
                  placeholder="Instructions and problems to solve"
                />
              </div>

              {!editingAssignment && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-slate-700 block mb-1">Target Scope</label>
                    <select
                      required
                      value={`${formData.classId}:${formData.subjectId}`}
                      onChange={e => {
                        const [cId, sId] = e.target.value.split(':');
                        setFormData({ ...formData, classId: cId, subjectId: sId });
                      }}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm bg-white"
                    >
                      {teacherScopes.map(ts => (
                        <option key={ts.id} value={`${ts.classId}:${ts.subjectId}`}>
                          {ts.className} - {ts.subjectName}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-700 block mb-1">Max Marks</label>
                    <input
                      type="number"
                      required
                      min={1}
                      max={1000}
                      value={formData.maxMarks}
                      onChange={e => setFormData({ ...formData, maxMarks: Number(e.target.value) })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm"
                    />
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Submission Deadline</label>
                  <input
                    type="datetime-local"
                    required
                    value={formData.deadline}
                    onChange={e => setFormData({ ...formData, deadline: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Publication Status</label>
                  <select
                    value={formData.status}
                    onChange={e => setFormData({ ...formData, status: e.target.value as AssignmentStatus })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm bg-white"
                  >
                    <option value="Draft">Save as Draft</option>
                    <option value="Published">Publish Immediately</option>
                    <option value="Closed">Close Assignment</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl text-xs font-bold hover:bg-slate-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold hover:bg-indigo-700"
                >
                  Save Assignment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal for Grading Submission */}
      {gradingSubmission && selectedAssignmentForReview && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border border-slate-200 space-y-4">
            <h3 className="text-lg font-bold text-slate-900">
              Grade Submission: {gradingSubmission.studentName}
            </h3>

            <form onSubmit={handleSaveGrade} className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Marks Awarded (Max Allowed: {selectedAssignmentForReview.maxMarks})
                </label>
                <input
                  type="number"
                  required
                  min={0}
                  max={selectedAssignmentForReview.maxMarks}
                  value={gradeData.marks}
                  onChange={e => setGradeData({ ...gradeData, marks: Number(e.target.value) })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm font-bold text-indigo-900"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Teacher Feedback</label>
                <textarea
                  rows={3}
                  value={gradeData.feedback}
                  onChange={e => setGradeData({ ...gradeData, feedback: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm"
                  placeholder="Provide constructive feedback for student..."
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Submission Status</label>
                <select
                  value={gradeData.status}
                  onChange={e => setGradeData({ ...gradeData, status: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm bg-white"
                >
                  <option value="Reviewed">Reviewed (Graded)</option>
                  <option value="Returned">Returned (Needs revision)</option>
                </select>
              </div>

              <div className="flex justify-end space-x-2 pt-4">
                <button
                  type="button"
                  onClick={() => setGradingSubmission(null)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl text-xs font-bold hover:bg-slate-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold hover:bg-indigo-700"
                >
                  Submit Grade
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
