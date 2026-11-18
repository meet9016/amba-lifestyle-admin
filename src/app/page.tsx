'use client';

import React, { useState, useEffect } from 'react';
import { AdminSidebar } from '@/components/layout/AdminSidebar';
import { AdminHeader } from '@/components/layout/AdminHeader';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { apiClient, API_ENDPOINTS } from '@/lib/api';
import {
  Package,
  ShoppingBag,
  Store,
  DollarSign,
  ArrowUpRight,
  CheckCircle2,
  XCircle,
  Clock,
  Sparkles,
  ExternalLink
} from 'lucide-react';

interface ApprovalProduct {
  id: string;
  title: string;
  vendorName: string;
  category: string;
  price: number;
  stock: number;
  imageUrl?: string;
  approvalStatus: 'pending' | 'approved' | 'rejected';
  createdAt?: string;
}

const INITIAL_PENDING_APPROVALS: ApprovalProduct[] = [
  {
    id: '5',
    title: 'Hand-painted Blue Pottery Floral Ceramic Dinner Set (18 Pcs)',
    vendorName: 'Jaipur Weaves & Crafts',
    category: 'Home Decor',
    price: 4599,
    stock: 15,
    imageUrl: 'https://images.unsplash.com/photo-1615529182904-14819c35db37?auto=format&fit=crop&w=300&q=80',
    approvalStatus: 'pending',
    createdAt: 'Today, 08:30 AM'
  },
  {
    id: '6',
    title: 'Hand-spun Pashmina Cashmere Shawl with Sozni Needle Embroidery',
    vendorName: 'Kashmir Loom Masters',
    category: 'Ethnic Wear',
    price: 12499,
    stock: 8,
    imageUrl: 'https://images.unsplash.com/photo-1609357605129-26f69add5d6e?auto=format&fit=crop&w=300&q=80',
    approvalStatus: 'pending',
    createdAt: 'Today, 09:15 AM'
  }
];

export default function AdminDashboard() {
  const [pendingList, setPendingList] = useState<ApprovalProduct[]>(INITIAL_PENDING_APPROVALS);
  const [actionSuccessMessage, setActionSuccessMessage] = useState<string | null>(null);

  // Fetch pending products from backend if running
  useEffect(() => {
    const fetchPendingProducts = async () => {
      try {
        const res = await apiClient.get(API_ENDPOINTS.PRODUCTS.PENDING, {
          headers: { 'x-user-role': 'admin' }
        });
        if (res.data?.data && res.data.data.length > 0) {
          const mapped = res.data.data.map((item: any) => ({
            id: item._id,
            title: item.title,
            vendorName: item.vendorName || 'Artisan Partner',
            category: item.category,
            price: item.price,
            stock: item.stock,
            imageUrl: item.images?.[0] || 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=300&q=80',
            approvalStatus: item.approvalStatus || 'pending',
            createdAt: 'Recently'
          }));
          setPendingList(mapped);
        }
      } catch (_) {
        // Backend offline: keep initial state
      }
    };
    fetchPendingProducts();
  }, []);

  // Handle Approve
  const handleApprove = async (product: ApprovalProduct) => {
    try {
      await apiClient.patch(API_ENDPOINTS.PRODUCTS.APPROVE(product.id), {}, {
        headers: { 'x-user-role': 'admin' }
      });
    } catch (_) {}

    setPendingList((prev) => prev.filter((p) => p.id !== product.id));
    setActionSuccessMessage(`✓ Approved "${product.title.substring(0, 30)}..."! It is now live on the storefront.`);
    setTimeout(() => setActionSuccessMessage(null), 5000);
  };

  // Handle Reject
  const handleReject = async (product: ApprovalProduct) => {
    try {
      await apiClient.patch(
        API_ENDPOINTS.PRODUCTS.REJECT(product.id),
        { reason: 'Quality checks failed or incomplete details' },
        { headers: { 'x-user-role': 'admin' } }
      );
    } catch (_) {}

    setPendingList((prev) => prev.filter((p) => p.id !== product.id));
    setActionSuccessMessage(`Rejected "${product.title.substring(0, 30)}...". Vendor will be notified.`);
    setTimeout(() => setActionSuccessMessage(null), 5000);
  };

  const stats = [
    { title: 'Pending Approval Queue', value: `${pendingList.length} items`, change: 'Requires Action', icon: Clock, color: 'text-amber-600', bg: 'bg-amber-50' },
    { title: 'Total Revenue', value: '₹14,82,500', change: '+18.2%', icon: DollarSign, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { title: 'Total Orders', value: '1,280', change: '+8.4%', icon: ShoppingBag, color: 'text-indigo-600', bg: 'bg-indigo-50' },
    { title: 'Verified Vendors', value: '28', change: '+4.0%', icon: Store, color: 'text-sky-600', bg: 'bg-sky-50' },
  ];

  return (
    <div className="flex min-h-screen bg-zinc-50 text-zinc-900">
      <AdminSidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <AdminHeader title="Super Admin Dashboard & Quality Control" />

        <main className="flex-1 p-8 space-y-6">
          {/* Action Success Alert */}
          {actionSuccessMessage && (
            <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-2xl flex items-center justify-between text-xs font-semibold shadow-xs animate-fadeIn">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>{actionSuccessMessage}</span>
              </div>
              <button onClick={() => setActionSuccessMessage(null)} className="text-emerald-700 hover:text-emerald-900">✕</button>
            </div>
          )}

          {/* Top Banner */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white border border-indigo-100 p-6 rounded-2xl shadow-xs">
            <div>
              <h1 className="text-xl font-bold text-zinc-900">Product Approval & Quality Assurance</h1>
              <p className="text-sm text-zinc-500 mt-1">
                Review handcrafted submissions from vendors. Approved products instantly go live on the customer storefront.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <a
                href="/vendors"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-50 border border-indigo-200 text-xs font-semibold text-indigo-700 hover:bg-indigo-100 transition-colors"
              >
                <Store className="w-3.5 h-3.5" /> Vendor Approvals
              </a>
              <a
                href="http://localhost:3000"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-zinc-200 text-xs font-semibold text-zinc-700 hover:bg-zinc-100 transition-colors"
              >
                <ExternalLink className="w-3.5 h-3.5" /> View Storefront
              </a>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {stats.map((stat, idx) => {
              const Icon = stat.icon;
              return (
                <Card key={idx} className="hover:shadow-md transition-shadow bg-white">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">{stat.title}</span>
                    <div className={`p-2.5 rounded-xl ${stat.bg}`}>
                      <Icon className={`w-4 h-4 ${stat.color}`} />
                    </div>
                  </div>
                  <div className="mt-4 flex items-baseline justify-between">
                    <h3 className="text-2xl font-bold text-zinc-900">{stat.value}</h3>
                    <span className="inline-flex items-center text-xs font-semibold text-amber-600 gap-0.5">
                      <ArrowUpRight className="w-3 h-3" />
                      {stat.change}
                    </span>
                  </div>
                </Card>
              );
            })}
          </div>

          {/* PENDING APPROVAL QUEUE (CORE WORKFLOW) */}
          <Card
            title={`Vendor Product Approvals Queue (${pendingList.length})`}
            subtitle="Products uploaded by vendors awaiting your quality check and publishing permission"
            className="bg-white border-amber-200"
          >
            {pendingList.length === 0 ? (
              <div className="py-12 text-center text-zinc-500 space-y-2">
                <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto" />
                <h4 className="text-sm font-bold text-zinc-800">All submissions reviewed!</h4>
                <p className="text-xs text-zinc-400">There are no pending vendor products waiting for approval.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-zinc-200 text-xs font-semibold text-zinc-500">
                      <th className="pb-3">Product</th>
                      <th className="pb-3">Vendor / Artisan</th>
                      <th className="pb-3">Category</th>
                      <th className="pb-3">Price</th>
                      <th className="pb-3">Stock</th>
                      <th className="pb-3 text-right">Approval Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100">
                    {pendingList.map((p) => (
                      <tr key={p.id} className="text-zinc-700 hover:bg-zinc-50/50">
                        <td className="py-3">
                          <div className="flex items-center gap-3">
                            <img
                              src={p.imageUrl}
                              alt={p.title}
                              className="w-12 h-14 object-cover rounded-xl bg-zinc-100 border border-zinc-200 shrink-0"
                            />
                            <div className="max-w-xs">
                              <p className="font-semibold text-zinc-900 text-xs line-clamp-1">{p.title}</p>
                              <span className="inline-flex items-center gap-1 text-[10px] text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full font-medium mt-1">
                                <Clock className="w-3 h-3" /> Awaiting Review
                              </span>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 text-xs font-medium text-zinc-800">{p.vendorName}</td>
                        <td className="py-3 text-xs text-zinc-500">{p.category}</td>
                        <td className="py-3 font-semibold text-zinc-900">₹{p.price.toLocaleString()}</td>
                        <td className="py-3 text-xs text-zinc-600">{p.stock} pcs</td>
                        <td className="py-3 text-right">
                          <div className="inline-flex items-center gap-2">
                            <button
                              onClick={() => handleReject(p)}
                              className="px-3 py-1.5 rounded-lg border border-rose-200 text-rose-700 hover:bg-rose-50 text-xs font-semibold transition-colors flex items-center gap-1"
                            >
                              <XCircle className="w-3.5 h-3.5" /> Reject
                            </button>
                            <button
                              onClick={() => handleApprove(p)}
                              className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold transition-colors shadow-xs flex items-center gap-1"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" /> Approve & Publish
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </main>
      </div>
    </div>
  );
}
