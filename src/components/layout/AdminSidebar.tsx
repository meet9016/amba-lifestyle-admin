'use client';

import React from 'react';
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
  LogOut
} from 'lucide-react';

const navItems = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Products', href: '/products', icon: Package },
  { name: 'Orders', href: '/orders', icon: ShoppingBag },
  { name: 'Vendors', href: '/vendors', icon: Store },
  { name: 'Categories', href: '/categories', icon: Layers },
  { name: 'Customers', href: '/customers', icon: Users },
  { name: 'Analytics', href: '/analytics', icon: BarChart3 },
  { name: 'Settings', href: '/settings', icon: Settings },
];

export const AdminSidebar = () => {
  const pathname = usePathname();

  return (
    <aside className="w-64 min-h-screen bg-white text-zinc-700 border-r border-zinc-200 flex flex-col shrink-0">
      {/* Brand Logo */}
      <div className="h-16 flex items-center px-6 border-b border-zinc-100">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center font-bold text-white shadow-sm shadow-indigo-200">
            A
          </div>
          <div>
            <h1 className="font-bold text-zinc-900 tracking-wide text-sm">AMBA LIFESTYLE</h1>
            <p className="text-[10px] text-zinc-400 font-semibold uppercase tracking-wider">Super Admin</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                isActive
                  ? 'bg-indigo-50 text-indigo-700 font-semibold shadow-xs'
                  : 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100/70'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-indigo-600' : 'text-zinc-500'}`} />
              <span>{item.name}</span>
            </Link>
          );
        })}
      </nav>

      {/* Footer / Logout */}
      <div className="p-4 border-t border-zinc-100">
        <button
          onClick={() => {
            if (typeof window !== 'undefined') {
              localStorage.removeItem('token');
              window.location.href = '/login';
            }
          }}
          className="flex items-center gap-3 w-full px-3.5 py-2.5 rounded-xl text-sm font-medium text-rose-600 hover:bg-rose-50 transition-colors"
        >
          <LogOut className="w-4 h-4" />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
};
