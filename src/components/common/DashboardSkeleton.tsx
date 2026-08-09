import React from 'react';

interface DashboardSkeletonProps {
  type?: 'admin' | 'teacher' | 'student';
}

export const DashboardSkeleton: React.FC<DashboardSkeletonProps> = ({ type = 'admin' }) => {
  const getGradient = () => {
    switch (type) {
      case 'teacher':
        return 'from-indigo-900/40 to-slate-900/40';
      case 'student':
        return 'from-emerald-900/40 to-teal-900/40';
      default:
        return 'from-purple-900/40 to-indigo-900/40';
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-pulse">
      {/* Banner Skeleton */}
      <div className={`bg-gradient-to-r ${getGradient()} p-6 rounded-2xl border border-slate-200/20 flex justify-between items-center h-28`}>
        <div className="space-y-3 w-2/3">
          <div className="h-6 bg-white/20 rounded-lg w-1/2"></div>
          <div className="h-4 bg-white/10 rounded-lg w-3/4"></div>
        </div>
        <div className="h-10 bg-white/20 rounded-xl w-32 hidden sm:block"></div>
      </div>

      {/* Tabs / Filter Bar Skeleton */}
      <div className="flex gap-2 border-b border-slate-200 pb-3">
        <div className="h-9 w-32 bg-slate-200 rounded-xl"></div>
        <div className="h-9 w-36 bg-slate-200/60 rounded-xl"></div>
        <div className="h-9 w-28 bg-slate-200/60 rounded-xl"></div>
        <div className="h-9 w-32 bg-slate-200/60 rounded-xl hidden md:block"></div>
      </div>

      {/* Stats Cards Grid Skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs space-y-3">
            <div className="flex justify-between items-center">
              <div className="h-4 bg-slate-200 rounded-md w-24"></div>
              <div className="w-8 h-8 bg-slate-100 rounded-xl"></div>
            </div>
            <div className="h-8 bg-slate-200 rounded-lg w-16"></div>
            <div className="h-3 bg-slate-100 rounded-md w-32"></div>
          </div>
        ))}
      </div>

      {/* Main Content Area Skeleton */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-2xs space-y-4">
        <div className="flex justify-between items-center border-b border-slate-100 pb-4">
          <div className="h-6 bg-slate-200 rounded-lg w-48"></div>
          <div className="h-9 bg-slate-100 rounded-xl w-28"></div>
        </div>

        <div className="space-y-3 pt-2">
          {[1, 2, 3, 4, 5].map((row) => (
            <div key={row} className="flex items-center justify-between p-3.5 bg-slate-50/70 rounded-xl border border-slate-100">
              <div className="flex items-center space-x-3 w-1/3">
                <div className="w-8 h-8 bg-slate-200 rounded-lg shrink-0"></div>
                <div className="space-y-1.5 w-full">
                  <div className="h-4 bg-slate-200 rounded-md w-3/4"></div>
                  <div className="h-3 bg-slate-100 rounded-md w-1/2"></div>
                </div>
              </div>
              <div className="h-4 bg-slate-200 rounded-md w-24 hidden sm:block"></div>
              <div className="h-6 bg-slate-200 rounded-full w-16"></div>
              <div className="h-8 bg-slate-200 rounded-lg w-20"></div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
