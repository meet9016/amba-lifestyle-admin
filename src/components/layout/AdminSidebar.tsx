'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Package,
  ShoppingBag,
  Users,
  Store,
  Layers,
  Settings,
  BarChart3,
  CheckSquare,
  MessageSquare,
  ShieldCheck,
  LogOut
} from 'lucide-react';

const adminNavItems = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Products', href: '/products', icon: Package },
  { name: 'Orders', href: '/orders', icon: ShoppingBag },
  { name: 'Quality Inspection', href: '/inspections', icon: CheckSquare },
  { name: 'Product Checkers', href: '/checkers', icon: ShieldCheck },
  { name: 'Vendors', href: '/vendors', icon: Store },
  { name: 'Categories', href: '/categories', icon: Layers },
  { name: 'Customers', href: '/customers', icon: Users },
  { name: 'Customer Support', href: '/support', icon: MessageSquare },
  { name: 'Analytics', href: '/analytics', icon: BarChart3 },
];

const checkerNavItems = [
  { name: 'Quality Inspection', href: '/inspections', icon: CheckSquare },
  { name: 'Inspected Orders', href: '/orders', icon: ShoppingBag },
];

export const AdminSidebar = () => {
  const pathname = usePathname();
  const [userRole, setUserRole] = useState<'admin' | 'checker'>('admin');
  const [userName, setUserName] = useState<string>('Super Admin');

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
    } catch (_) {}
  }, []);

  const items = userRole === 'checker' ? checkerNavItems : adminNavItems;

  return (
    <aside className="w-64 min-h-screen bg-white text-zinc-700 border-r border-zinc-200 flex flex-col shrink-0">
      {/* Brand Logo */}
      <div className="h-16 flex items-center px-6 border-b border-zinc-100">
        <div className="flex items-center gap-2.5">
          <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-white shadow-sm ${userRole === 'checker' ? 'bg-emerald-600 shadow-emerald-200' : 'bg-indigo-600 shadow-indigo-200'}`}>
            {userRole === 'checker' ? 'C' : 'A'}
          </div>
          <div>
            <h1 className="font-bold text-zinc-900 tracking-wide text-sm">AMBA LIFESTYLE</h1>
            <p className="text-[10px] text-zinc-400 font-semibold uppercase tracking-wider">
              {userRole === 'checker' ? 'Product Checker' : 'Super Admin'}
            </p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1">
        {items.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all cursor-pointer ${
                isActive
                  ? userRole === 'checker'
                    ? 'bg-emerald-50 text-emerald-700 font-semibold shadow-xs'
                    : 'bg-indigo-50 text-indigo-700 font-semibold shadow-xs'
                  : 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100/70'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? (userRole === 'checker' ? 'text-emerald-600' : 'text-indigo-600') : 'text-zinc-500'}`} />
              <span>{item.name}</span>
            </Link>
          );
        })}
      </nav>

      {/* User Info & Logout */}
      <div className="p-4 border-t border-zinc-100 space-y-2">
        <div className="px-3 py-2 bg-zinc-50 rounded-xl border border-zinc-100 text-xs">
          <p className="font-bold text-zinc-900 truncate">{userName}</p>
          <p className="text-[10px] text-zinc-500 capitalize">{userRole === 'checker' ? 'Quality Inspector' : 'Administrator'}</p>
        </div>
        <button
          onClick={() => {
            if (typeof window !== 'undefined') {
              localStorage.removeItem('token');
              localStorage.removeItem('user');
              window.location.href = '/login';
            }
          }}
          className="flex items-center gap-3 w-full px-3.5 py-2.5 rounded-xl text-sm font-medium text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
        >
          <LogOut className="w-4 h-4" />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
};
