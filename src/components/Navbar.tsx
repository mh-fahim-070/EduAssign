import React from 'react';
import { useAuth } from '../context/AuthContext';
import { GraduationCap, Shield, UserCheck, BookOpen, LogOut, Code } from 'lucide-react';
import { UserRole } from '../types';

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ activeTab, setActiveTab }) => {
  const { user, logout, quickSwitchRole } = useAuth();

  const getRoleIcon = (role?: UserRole) => {
    switch (role) {
      case 'Admin':
        return <Shield className="w-3.5 h-3.5 text-purple-600" />;
      case 'Teacher':
        return <UserCheck className="w-3.5 h-3.5 text-indigo-600" />;
      case 'Student':
        return <GraduationCap className="w-3.5 h-3.5 text-emerald-600" />;
      default:
        return null;
    }
  };

  const getRoleBadgeStyle = (role?: UserRole) => {
    switch (role) {
      case 'Admin':
        return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'Teacher':
        return 'bg-indigo-50 text-indigo-700 border-indigo-200';
      case 'Student':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      default:
        return 'bg-slate-50 text-slate-700 border-slate-200';
    }
  };

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-x-4">
          
          {/* Logo & Brand Name */}
          <div 
            className="flex items-center space-x-3 cursor-pointer shrink-0 select-none" 
            onClick={() => setActiveTab('dashboard')}
          >
            <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-xs shrink-0">
              <BookOpen className="w-5 h-5" />
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-slate-900 text-lg leading-tight tracking-tight">
                EduAssign
              </span>
              <span className="text-[11px] text-slate-500 font-medium leading-tight">
                Portal
              </span>
            </div>
          </div>

          {/* Quick Role Switcher Pills */}
          <div className="flex items-center bg-slate-100/80 p-1 rounded-xl border border-slate-200/80 space-x-1 shrink-0">
            <span className="text-xs font-semibold text-slate-400 px-2 hidden sm:inline">Role:</span>
            <button
              type="button"
              onClick={() => quickSwitchRole('Admin')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                user?.role === 'Admin'
                  ? 'bg-purple-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
            >
              Admin
            </button>
            <button
              type="button"
              onClick={() => quickSwitchRole('Teacher')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                user?.role === 'Teacher'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
            >
              Teacher
            </button>
            <button
              type="button"
              onClick={() => quickSwitchRole('Student')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                user?.role === 'Student'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
            >
              Student
            </button>
          </div>

          {/* Actions & User Info */}
          <div className="flex items-center space-x-3 shrink-0">
            {/* API Docs Button */}
            <button
              type="button"
              onClick={() => setActiveTab(activeTab === 'swagger' ? 'dashboard' : 'swagger')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                activeTab === 'swagger'
                  ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                  : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50 hover:border-slate-300'
              }`}
              title="Open REST API Specs"
            >
              <Code className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Swagger API Docs</span>
              <span className="sm:hidden">API</span>
            </button>

            {user && (
              <div className="flex items-center space-x-2.5 pl-3 border-l border-slate-200">
                <div className="text-right hidden lg:block">
                  <div className="text-xs font-bold text-slate-900 leading-tight">{user.name}</div>
                  <div className="text-[10px] text-slate-500 leading-none mt-0.5">{user.email}</div>
                </div>

                <div className={`flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-xs font-bold border ${getRoleBadgeStyle(user.role)}`}>
                  {getRoleIcon(user.role)}
                  <span>{user.role}</span>
                </div>

                <button
                  type="button"
                  onClick={logout}
                  className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
                  title="Sign Out"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>

        </div>
      </div>
    </header>
  );
};
