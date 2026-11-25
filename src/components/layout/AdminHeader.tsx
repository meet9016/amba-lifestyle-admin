'use client';

import React from 'react';
import { Bell, Search, User } from 'lucide-react';

interface AdminHeaderProps {
  title?: string;
}

export const AdminHeader: React.FC<AdminHeaderProps> = ({ title = 'Dashboard Overview' }) => {
  return (
    <header className="h-20 bg-white border-b border-zinc-200/80 px-8 flex items-center justify-between sticky top-0 z-30 shadow-2xs">
      <div>
        <h2 className="text-xl font-bold text-zinc-900 tracking-tight">{title}</h2>
        <p className="text-xs text-zinc-500 font-medium mt-0.5">Real-time artisan inquiries and operations monitoring</p>
      </div>

      <div className="flex items-center gap-5">
        {/* Profile Card */}
        <div className="flex items-center gap-3 pl-4 border-l border-zinc-200">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-500 to-indigo-600 text-white flex items-center justify-center font-bold text-sm shadow-sm shadow-indigo-500/20">
            AD
          </div>
          <div className="hidden sm:block text-left">
            <p className="text-sm font-bold text-zinc-900 leading-tight">Administrator</p>
            <p className="text-xs text-emerald-600 font-semibold flex items-center gap-1 mt-0.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Online
            </p>
          </div>
        </div>
      </div>
    </header>
  );
};
