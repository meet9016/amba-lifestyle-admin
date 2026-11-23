'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  ClipboardList,
  CheckSquare,
  ShoppingBag,
  LogOut,
  Sparkles
} from 'lucide-react';
import { apiClient, API_ENDPOINTS } from '@/lib/api';

export const AdminSidebar = () => {
  const pathname = usePathname();
  const [userRole, setUserRole] = useState<'admin' | 'checker'>('admin');
  const [userName, setUserName] = useState<string>('Super Admin');
  const [pendingInquiriesCount, setPendingInquiriesCount] = useState<number>(0);

  useEffect(() => {
    try {
      const stored = localStorage.getItem('user');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed.role === 'checker') {
          setUserRole('checker');
          setUserName(parsed.name || 'Product Checker');
        } else {
          setUserRole('admin');
          setUserName(parsed.name || 'Super Admin');
        }
      }
    } catch (_) { }

    // Fetch live inquiries count
    const fetchPendingCount = async () => {
      try {
        const res = await apiClient.get(API_ENDPOINTS.INQUIRIES.LIST, {
          headers: { 'x-user-role': 'admin' }
        });
        if (res.data?.data) {
          const pending = res.data.data.filter((i: any) => i.status === 'pending').length;
          setPendingInquiriesCount(pending);
        }
      } catch (_) { }
    };
    fetchPendingCount();
  }, []);

  const navItems = [
    { name: 'Dashboard', href: '/', icon: LayoutDashboard },
    {
      name: 'Inquiries',
      href: '/inquiries',
      icon: ClipboardList,
      badge: pendingInquiriesCount > 0 ? `${pendingInquiriesCount} new` : null
    },
    {
      name: 'Products',
      href: '/products',
      icon: ShoppingBag
    },
  ];

  return (
    <aside className="w-68 min-h-screen bg-white text-zinc-800 border-r border-zinc-200/80 flex flex-col shrink-0 select-none shadow-xs">
      {/* Brand Logo Header */}
      <div className="h-20 flex items-center px-6 border-b border-zinc-100">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-indigo-700 via-indigo-600 to-indigo-500 flex items-center justify-center font-bold text-white shadow-md shadow-indigo-600/20 text-lg">
            A
          </div>
          <div>
            <h1 className="font-extrabold text-zinc-900 tracking-tight text-base">AMBA LIFESTYLE</h1>
            <p className="text-xs font-semibold text-indigo-600 uppercase tracking-wider flex items-center gap-1 mt-0.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              {userRole === 'checker' ? 'Quality Inspector' : 'Admin Control Panel'}
            </p>
          </div>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 p-5 space-y-2">
        <div className="px-3 pb-2 text-xs font-bold uppercase tracking-wider text-zinc-400">
          Core Workflows
        </div>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center justify-between px-4 py-3 rounded-xl text-sm font-semibold transition-all cursor-pointer ${isActive
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                  : 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100/80'
                }`}
            >
              <div className="flex items-center gap-3">
                <Icon className={`w-5 h-5 ${isActive ? 'text-white' : 'text-zinc-500'}`} />
                <span className="text-sm">{item.name}</span>
              </div>
              {item.badge && (
                <span
                  className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${isActive
                      ? 'bg-white text-indigo-700'
                      : 'bg-amber-100 text-amber-800 border border-amber-300'
                    }`}
                >
                  {item.badge}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* User Info & Sign Out */}
      <div className="p-5 border-t border-zinc-100 space-y-3 bg-zinc-50/50">
        <div className="p-3 bg-white rounded-xl border border-zinc-200/80 shadow-2xs">
          <p className="font-bold text-zinc-900 text-sm truncate">{userName}</p>
          <p className="text-xs text-zinc-500 font-medium">superadmin@ambalifestyle.com</p>
        </div>
        <button
          onClick={() => {
            if (typeof window !== 'undefined') {
              localStorage.removeItem('token');
              localStorage.removeItem('user');
              window.location.href = '/login';
            }
          }}
          className="flex items-center gap-3 w-full px-4 py-2.5 rounded-xl text-sm font-semibold text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
        >
          <LogOut className="w-4 h-4" />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  );
};
