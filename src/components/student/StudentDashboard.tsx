import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { Assignment, Submission, StudentClassAssignment } from '../../types';
import { Clock, CheckCircle2, AlertCircle, Send, Award, BookOpen, FileCheck } from 'lucide-react';
import { DashboardSkeleton } from '../common/DashboardSkeleton';

export const StudentDashboard: React.FC = () => {
  const [assignmentsList, setAssignmentsList] = useState<Assignment[]>([]);
  const [enrollments, setEnrollments] = useState<StudentClassAssignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(null);
  const [answerContent, setAnswerContent] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [asgRes, enrRes] = await Promise.all([
        api.getAssignments().catch(() => ({ data: [] })),
        api.getStudentClasses().catch(() => ({ data: [] })),
      ]);

      if (asgRes?.data) setAssignmentsList(asgRes.data);
      if (enrRes?.data) setEnrollments(enrRes.data);
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Failed to load student dashboard.' });
    } finally {
      setLoading(false);
    }
  };

  const handleOpenSubmitModal = (asg: Assignment) => {
    setSelectedAssignment(asg);
    setAnswerContent(asg.mySubmission?.content || '');
  };

  const handleSubmitAssignment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAssignment) return;

    if (!answerContent.trim()) {
      setMessage({ type: 'error', text: 'Please enter your solution or response before submitting.' });
      return;
    }

    try {
      await api.submitAssignment({
        assignmentId: selectedAssignment.id,
        content: answerContent,
      });

      setMessage({ type: 'success', text: 'Assignment response submitted successfully!' });
      setSelectedAssignment(null);
      loadData();
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message });
    }
  };

  if (loading) {
    return <DashboardSkeleton type="student" />;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Banner */}
      <div className="bg-gradient-to-r from-emerald-900 to-teal-900 text-white p-6 rounded-2xl shadow-md flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Student Academic Portal</h1>
          <p className="text-emerald-200 text-sm mt-1">
            Enrolled Class Sections: {enrollments.map(e => e.className).join(', ') || 'Class 10-A'}
          </p>
        </div>
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

      {/* Available Published Assignments */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-slate-900 flex items-center space-x-2">
          <BookOpen className="w-5 h-5 text-emerald-600" />
          <span>My Class Assignments ({assignmentsList.length})</span>
        </h2>

        {assignmentsList.length === 0 ? (
          <div className="p-12 bg-white rounded-2xl border border-slate-200 text-center text-slate-500">
            No published assignments for your enrolled class sections at this time.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {assignmentsList.map(asg => {
              const sub = asg.mySubmission;
              const isPastDeadline = new Date() > new Date(asg.deadline);

              return (
                <div key={asg.id} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="px-2.5 py-0.5 bg-emerald-100 text-emerald-800 rounded font-semibold text-xs">
                        {asg.subjectName}
                      </span>
                      <span className="text-xs font-bold text-slate-500">{asg.className}</span>
                    </div>

                    <h3 className="font-bold text-slate-900 text-base">{asg.title}</h3>
                    <p className="text-xs text-slate-600 mt-2 leading-relaxed">{asg.description}</p>
                  </div>

                  <div className="pt-3 border-t border-slate-100 space-y-2">
                    <div className="flex items-center justify-between text-xs text-slate-500">
                      <span className="flex items-center space-x-1">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        <span>Deadline: {new Date(asg.deadline).toLocaleString()}</span>
                      </span>
                      <span className="font-bold text-emerald-800">Max Marks: {asg.maxMarks}</span>
                    </div>

                    {/* Submission status & actions */}
                    {sub ? (
                      <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-bold text-emerald-700 flex items-center space-x-1">
                            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                            <span>Submitted ({sub.status})</span>
                          </span>

                          {sub.marks !== undefined && sub.marks !== null ? (
                            <span className="font-extrabold text-indigo-700 text-sm">
                              Score: {sub.marks} / {asg.maxMarks}
                            </span>
                          ) : (
                            <span className="text-amber-600 font-medium italic">Pending Grading</span>
                          )}
                        </div>

                        <div className="text-xs text-slate-700 bg-white p-2 rounded-lg border border-slate-200">
                          <span className="font-semibold text-slate-800 block mb-0.5">Submitted Solution:</span>
                          <p className="font-mono text-[11px] whitespace-pre-wrap text-slate-600 max-h-20 overflow-y-auto">{sub.content}</p>
                        </div>

                        {sub.feedback && (
                          <div className="text-xs text-slate-700 bg-amber-50 p-2 rounded-lg border border-amber-200">
                            <strong>Teacher Feedback:</strong> {sub.feedback}
                          </div>
                        )}

                        {!isPastDeadline && sub.status !== 'Reviewed' && (
                          <button
                            onClick={() => handleOpenSubmitModal(asg)}
                            className="mt-2 w-full py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-bold rounded-lg transition-colors"
                          >
                            Update Answer Before Deadline
                          </button>
                        )}
                      </div>
                    ) : (
                      <div>
                        {isPastDeadline ? (
                          <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-xl text-xs font-semibold text-rose-700 text-center">
                            Submission Closed (Deadline Passed)
                          </div>
                        ) : (
                          <button
                            onClick={() => handleOpenSubmitModal(asg)}
                            className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center justify-center space-x-1.5"
                          >
                            <Send className="w-3.5 h-3.5" />
                            <span>Submit Solution</span>
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal for Submitting Solution */}
      {selectedAssignment && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border border-slate-200 space-y-4">
            <h3 className="text-lg font-bold text-slate-900">
              Submit Solution: {selectedAssignment.title}
            </h3>
            <p className="text-xs text-slate-500">
              Max Marks: {selectedAssignment.maxMarks} · Deadline: {new Date(selectedAssignment.deadline).toLocaleString()}
            </p>

            <form onSubmit={handleSubmitAssignment} className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Your Solution / Written Answer</label>
                <textarea
                  required
                  rows={6}
                  value={answerContent}
                  onChange={e => setAnswerContent(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm font-mono"
                  placeholder="Type or paste your complete solution here..."
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedAssignment(null)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl text-xs font-bold hover:bg-slate-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 text-white rounded-xl text-xs font-bold hover:bg-emerald-700"
                >
                  Submit Response
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
