'use client';

import React from 'react';
import { Bell, Search, User } from 'lucide-react';

interface AdminHeaderProps {
  title?: string;
}

export const AdminHeader: React.FC<AdminHeaderProps> = ({ title = 'Dashboard Overview' }) => {
  return (
    <header className="h-16 bg-white border-b border-zinc-200 px-6 flex items-center justify-between sticky top-0 z-30 shadow-xs">
      <div>
        <h2 className="text-lg font-bold text-zinc-900">{title}</h2>
      </div>

      <div className="flex items-center gap-4">
        {/* Search */}
        <div className="relative w-64 hidden md:block">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
          <input
            type="text"
            placeholder="Search orders, products..."
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-zinc-50 border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-zinc-800 placeholder-zinc-400"
          />
        </div>

        {/* Notifications */}
        <button className="relative p-2 rounded-lg text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 transition-colors">
          <Bell className="w-4 h-4" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-indigo-600 rounded-full"></span>
        </button>

        {/* Profile */}
        <div className="flex items-center gap-3 pl-3 border-l border-zinc-200">
          <div className="w-8 h-8 rounded-full bg-indigo-50 text-indigo-700 flex items-center justify-center font-semibold text-xs border border-indigo-100">
            <User className="w-4 h-4" />
          </div>
          <div className="hidden sm:block text-left">
            <p className="text-xs font-semibold text-zinc-900">Admin</p>
            <p className="text-[10px] text-zinc-500">admin@ambalifestyle.com</p>
          </div>
        </div>
      </div>
    </header>
  );
};
