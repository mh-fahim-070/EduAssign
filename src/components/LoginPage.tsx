import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  BookOpen, 
  Shield, 
  UserCheck, 
  GraduationCap, 
  Lock, 
  Mail, 
  ArrowRight, 
  Loader2, 
  Eye, 
  EyeOff, 
  CheckCircle2, 
  User, 
  KeyRound, 
  Sparkles,
  AlertCircle,
  X
} from 'lucide-react';
import { UserRole } from '../types';

type AuthMode = 'login' | 'register' | 'forgot';

interface QuickAccount {
  role: UserRole;
  name: string;
  email: string;
  pass: string;
  description: string;
  icon: React.FC<{ className?: string }>;
  color: {
    bg: string;
    border: string;
    hoverBg: string;
    text: string;
    badgeBg: string;
  };
}

const QUICK_ACCOUNTS: QuickAccount[] = [
  {
    role: 'Admin',
    name: 'Sarah Jenkins',
    email: 'admin@school.edu',
    pass: 'Admin123!',
    description: 'System Admin • Full portal control',
    icon: Shield,
    color: {
      bg: 'bg-purple-50/80',
      border: 'border-purple-200',
      hoverBg: 'hover:bg-purple-100/90',
      text: 'text-purple-900',
      badgeBg: 'bg-purple-600 text-white',
    },
  },
  {
    role: 'Teacher',
    name: 'Prof. John Doe',
    email: 'john.doe@school.edu',
    pass: 'Teacher123!',
    description: 'Instructor • Manage assignments & grades',
    icon: UserCheck,
    color: {
      bg: 'bg-indigo-50/80',
      border: 'border-indigo-200',
      hoverBg: 'hover:bg-indigo-100/90',
      text: 'text-indigo-900',
      badgeBg: 'bg-indigo-600 text-white',
    },
  },
  {
    role: 'Student',
    name: 'Alex Jones',
    email: 'alex.jones@student.edu',
    pass: 'Student123!',
    description: 'Student • Submit work & view scores',
    icon: GraduationCap,
    color: {
      bg: 'bg-emerald-50/80',
      border: 'border-emerald-200',
      hoverBg: 'hover:bg-emerald-100/90',
      text: 'text-emerald-900',
      badgeBg: 'bg-emerald-600 text-white',
    },
  },
];

export const LoginPage: React.FC = () => {
  const { login, register, forgotPassword, quickSwitchRole, error, clearError } = useAuth();
  
  const [mode, setMode] = useState<AuthMode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [registerRole, setRegisterRole] = useState<UserRole>('Student');
  const [rememberMe, setRememberMe] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  
  const [loginRole, setLoginRole] = useState<UserRole>('Admin');
  const [loading, setLoading] = useState(false);
  const [showInstantModal, setShowInstantModal] = useState(false);
  const [activeQuickRole, setActiveQuickRole] = useState<UserRole | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleModeChange = (newMode: AuthMode) => {
    setMode(newMode);
    clearError();
    setSuccessMessage(null);
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    setLoading(true);
    setSuccessMessage(null);
    try {
      await login(email, password, loginRole);
    } catch (err) {
      // Error handled in AuthContext
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    setLoading(true);
    setSuccessMessage(null);
    try {
      await register({
        name: fullName,
        email,
        password,
        role: registerRole,
      });
    } catch (err) {
      // Error handled in AuthContext
    } finally {
      setLoading(false);
    }
  };

  const handleForgotSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    setLoading(true);
    clearError();
    setSuccessMessage(null);
    try {
      const msg = await forgotPassword(email);
      setSuccessMessage(msg);
    } catch (err) {
      // Error handled in AuthContext
    } finally {
      setLoading(false);
    }
  };

  const handleQuickAccountClick = async (account: QuickAccount) => {
    if (loading) return;
    setLoading(true);
    setActiveQuickRole(account.role);
    clearError();
    setSuccessMessage(null);

    // Fill form for visual clarity
    setEmail(account.email);
    setPassword(account.pass);

    try {
      await quickSwitchRole(account.role);
    } catch (err) {
      // Handled in context
    } finally {
      setLoading(false);
      setActiveQuickRole(null);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 sm:p-6 lg:p-8 relative overflow-hidden">
      {/* Background Decorative Gradients */}
      <div className="absolute top-0 -left-20 w-96 h-96 bg-indigo-600/20 rounded-full filter blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 -right-20 w-96 h-96 bg-purple-600/20 rounded-full filter blur-3xl pointer-events-none" />

      <div className="max-w-md w-full bg-white rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 relative z-10 border border-slate-100">
        
        {/* Header Branding */}
        <div className="text-center space-y-2">
          <div className="w-14 h-14 bg-gradient-to-tr from-indigo-600 to-indigo-500 rounded-2xl flex items-center justify-center text-white mx-auto shadow-lg shadow-indigo-200">
            <BookOpen className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">EduAssign Portal</h1>
          <p className="text-xs text-slate-500 font-medium max-w-xs mx-auto">
            Role-Based Assignment & Academic Submission System
          </p>
        </div>

        {/* Mode Selector Tabs */}
        <div className="flex bg-slate-100 p-1 rounded-2xl border border-slate-200 text-xs font-semibold">
          <button
            type="button"
            onClick={() => handleModeChange('login')}
            className={`flex-1 py-2 rounded-xl transition-all cursor-pointer ${
              mode === 'login' ? 'bg-white text-slate-900 shadow-xs font-bold' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => handleModeChange('register')}
            className={`flex-1 py-2 rounded-xl transition-all cursor-pointer ${
              mode === 'register' ? 'bg-white text-slate-900 shadow-xs font-bold' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Create Account
          </button>
          <button
            type="button"
            onClick={() => handleModeChange('forgot')}
            className={`flex-1 py-2 rounded-xl transition-all cursor-pointer ${
              mode === 'forgot' ? 'bg-white text-slate-900 shadow-xs font-bold' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Reset Pass
          </button>
        </div>

        {/* Alerts & Messages */}
        {error && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-2xl text-xs text-rose-800 font-semibold flex items-start space-x-2 animate-in fade-in">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <div className="flex-1">
              <span>{error}</span>
            </div>
            <button type="button" onClick={clearError} className="text-xs underline font-bold text-rose-700 hover:text-rose-900 cursor-pointer">
              Dismiss
            </button>
          </div>
        )}

        {successMessage && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs text-emerald-800 font-semibold flex items-start space-x-2 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <div className="flex-1">
              <span>{successMessage}</span>
            </div>
            <button type="button" onClick={() => setSuccessMessage(null)} className="text-xs underline font-bold text-emerald-700 hover:text-emerald-900 cursor-pointer">
              Dismiss
            </button>
          </div>
        )}

        {/* 1. SIGN IN MODE */}
        {mode === 'login' && (
          <div className="space-y-5">
            {/* Instant Test Login Button Banner */}
            <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-700 p-0.5 rounded-2xl shadow-md">
              <button
                type="button"
                onClick={() => setShowInstantModal(true)}
                disabled={loading}
                className="w-full bg-white hover:bg-slate-50 text-slate-900 p-3.5 rounded-[14px] font-bold text-sm transition-all flex items-center justify-between group cursor-pointer"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-sm group-hover:scale-105 transition-transform">
                    <Sparkles className="w-5 h-5 text-amber-300 animate-pulse" />
                  </div>
                  <div className="text-left">
                    <div className="flex items-center space-x-1.5">
                      <span className="font-extrabold text-slate-900 text-sm">Instant Test Login</span>
                      <span className="text-[10px] bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">Quick</span>
                    </div>
                    <span className="text-xs text-slate-500 font-medium block">
                      One-click login as Admin, Teacher, or Student
                    </span>
                  </div>
                </div>
                <div className="flex items-center space-x-1 text-xs font-bold text-indigo-600 group-hover:translate-x-1 transition-transform">
                  <span>Open Login</span>
                  <ArrowRight className="w-4 h-4" />
                </div>
              </button>
            </div>

            <div className="relative flex items-center justify-center my-2">
              <div className="border-t border-slate-200 w-full" />
              <span className="bg-white px-3 text-[11px] text-slate-400 font-semibold absolute uppercase tracking-wider">
                or sign in manually
              </span>
            </div>

            {/* Login Form */}
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              {/* Role Selection Buttons */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 block">Sign In Role:</label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => { setLoginRole('Admin'); clearError(); }}
                    className={`py-2 px-2 rounded-xl border text-xs font-bold transition-all flex items-center justify-center space-x-1.5 cursor-pointer ${
                      loginRole === 'Admin'
                        ? 'bg-purple-600 text-white border-purple-700 shadow-sm ring-2 ring-purple-500/30'
                        : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <Shield className="w-3.5 h-3.5 shrink-0" />
                    <span>Admin</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => { setLoginRole('Teacher'); clearError(); }}
                    className={`py-2 px-2 rounded-xl border text-xs font-bold transition-all flex items-center justify-center space-x-1.5 cursor-pointer ${
                      loginRole === 'Teacher'
                        ? 'bg-indigo-600 text-white border-indigo-700 shadow-sm ring-2 ring-indigo-500/30'
                        : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <UserCheck className="w-3.5 h-3.5 shrink-0" />
                    <span>Teacher</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => { setLoginRole('Student'); clearError(); }}
                    className={`py-2 px-2 rounded-xl border text-xs font-bold transition-all flex items-center justify-center space-x-1.5 cursor-pointer ${
                      loginRole === 'Student'
                        ? 'bg-emerald-600 text-white border-emerald-700 shadow-sm ring-2 ring-emerald-500/30'
                        : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <GraduationCap className="w-3.5 h-3.5 shrink-0" />
                    <span>Student</span>
                  </button>
                </div>
                <p className="text-[11px] text-slate-500 font-medium">
                  {loginRole === 'Admin' && '🔒 Only Admin credentials work under Admin role.'}
                  {loginRole === 'Teacher' && '📚 Only Teacher credentials work under Teacher role.'}
                  {loginRole === 'Student' && '🎓 Only Student credentials work under Student role.'}
                </p>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Email Address</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                    placeholder={
                      loginRole === 'Admin' 
                        ? 'admin@school.edu' 
                        : loginRole === 'Teacher' 
                          ? 'john.doe@school.edu' 
                          : 'alex.jones@student.edu'
                    }
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-xs font-semibold text-slate-700">Password</label>
                  <button
                    type="button"
                    onClick={() => handleModeChange('forgot')}
                    className="text-[11px] font-semibold text-indigo-600 hover:underline cursor-pointer"
                  >
                    Forgot?
                  </button>
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    className="w-full pl-9 pr-10 py-2.5 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3 text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between pt-1">
                <label className="flex items-center space-x-2 text-xs text-slate-600 font-medium cursor-pointer">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={e => setRememberMe(e.target.checked)}
                    className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  <span>Remember me on this device</span>
                </label>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-sm shadow-md transition-all flex items-center justify-center space-x-2 disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
              >
                {loading && !activeQuickRole ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Authenticating...</span>
                  </>
                ) : (
                  <>
                    <span>Sign In to Portal</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          </div>
        )}

        {/* 2. REGISTER MODE */}
        {mode === 'register' && (
          <form onSubmit={handleRegisterSubmit} className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">Select Account Type</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setRegisterRole('Student')}
                  className={`p-2.5 border rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center space-x-2 ${
                    registerRole === 'Student'
                      ? 'bg-emerald-50 border-emerald-300 text-emerald-900 ring-2 ring-emerald-500/20'
                      : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <GraduationCap className="w-4 h-4 text-emerald-600" />
                  <span>Student</span>
                </button>
                <button
                  type="button"
                  onClick={() => setRegisterRole('Teacher')}
                  className={`p-2.5 border rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center space-x-2 ${
                    registerRole === 'Teacher'
                      ? 'bg-indigo-50 border-indigo-300 text-indigo-900 ring-2 ring-indigo-500/20'
                      : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <UserCheck className="w-4 h-4 text-indigo-600" />
                  <span>Teacher</span>
                </button>
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">Full Name</label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={e => setFullName(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                  placeholder="e.g. Michael Smith"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">Email Address</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                  placeholder="name@school.edu"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">Set Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  minLength={6}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="w-full pl-9 pr-10 py-2.5 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                  placeholder="At least 6 characters"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <span className="text-[10px] text-slate-400 block mt-1">
                Must contain at least 6 characters.
              </span>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-sm shadow-md transition-all flex items-center justify-center space-x-2 disabled:opacity-60 cursor-pointer"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Creating Account...</span>
                </>
              ) : (
                <>
                  <span>Create Account & Sign In</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        )}

        {/* 3. FORGOT PASSWORD MODE */}
        {mode === 'forgot' && (
          <form onSubmit={handleForgotSubmit} className="space-y-4">
            <div className="text-center space-y-1">
              <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center mx-auto mb-2">
                <KeyRound className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold text-slate-900">Reset Password</h3>
              <p className="text-xs text-slate-500">
                Enter your account email to receive reset instructions.
              </p>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">Email Address</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                  placeholder="user@school.edu"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-sm shadow-md transition-all flex items-center justify-center space-x-2 disabled:opacity-60 cursor-pointer"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Sending Request...</span>
                </>
              ) : (
                <>
                  <span>Send Reset Link</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>

            <div className="text-center pt-2">
              <button
                type="button"
                onClick={() => handleModeChange('login')}
                className="text-xs text-indigo-600 font-semibold hover:underline cursor-pointer"
              >
                Back to Sign In
              </button>
            </div>
          </form>
        )}

        {/* Footer info */}
        <div className="text-center pt-2 border-t border-slate-100">
          <span className="text-[11px] text-slate-400 block font-medium">
            Protected by SSL Encryption • Assignment System Portal
          </span>
        </div>

      </div>

      {/* INSTANT TEST LOGIN MODAL */}
      {showInstantModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-7 shadow-2xl border border-slate-100 space-y-5 relative">
            
            {/* Modal Close Button */}
            <button
              type="button"
              onClick={() => setShowInstantModal(false)}
              className="absolute top-5 right-5 text-slate-400 hover:text-slate-600 p-1.5 rounded-full hover:bg-slate-100 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Modal Header */}
            <div className="text-left space-y-1 pr-8">
              <div className="inline-flex items-center space-x-2 bg-indigo-50 text-indigo-700 px-3 py-1 rounded-full text-xs font-bold border border-indigo-100">
                <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                <span>Instant Test Login</span>
              </div>
              <h2 className="text-xl font-extrabold text-slate-900 tracking-tight pt-1">
                Select Test Account
              </h2>
              <p className="text-xs text-slate-500 font-medium leading-relaxed">
                Choose any role below to instantly log in without typing credentials:
              </p>
            </div>

            {/* Quick Accounts Options */}
            <div className="grid grid-cols-1 gap-2.5 pt-1">
              {QUICK_ACCOUNTS.map(acc => {
                const Icon = acc.icon;
                const isLoadingThis = loading && activeQuickRole === acc.role;

                return (
                  <button
                    key={acc.role}
                    type="button"
                    onClick={async () => {
                      await handleQuickAccountClick(acc);
                      setShowInstantModal(false);
                    }}
                    disabled={loading}
                    className={`p-3.5 border rounded-2xl text-left transition-all flex items-center justify-between group disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer shadow-xs ${acc.color.bg} ${acc.color.border} ${acc.color.hoverBg}`}
                  >
                    <div className="flex items-center space-x-3.5">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-xs ${acc.color.badgeBg}`}>
                        {isLoadingThis ? (
                          <Loader2 className="w-5 h-5 animate-spin text-white" />
                        ) : (
                          <Icon className="w-4 h-4 text-white group-hover:scale-110 transition-transform" />
                        )}
                      </div>
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className={`text-sm font-bold ${acc.color.text}`}>{acc.name}</span>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white/90 border border-slate-200 text-slate-700">
                            {acc.role}
                          </span>
                        </div>
                        <span className="text-xs text-slate-500 block font-medium mt-0.5">
                          {acc.description}
                        </span>
                      </div>
                    </div>

                    <div className="text-right shrink-0 ml-2">
                      <span className="text-xs font-bold text-indigo-600 group-hover:translate-x-1 transition-transform inline-flex items-center space-x-1 bg-white/80 px-2.5 py-1 rounded-xl border border-indigo-100 shadow-2xs">
                        <span>Sign In</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Modal Footer */}
            <div className="pt-2 text-center border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowInstantModal(false)}
                className="text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
              >
                Cancel and return to standard login
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
};
