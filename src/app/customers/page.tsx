'use client';

import React, { useState, useEffect } from 'react';
import { AdminSidebar } from '@/components/layout/AdminSidebar';
import { AdminHeader } from '@/components/layout/AdminHeader';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { apiClient, API_ENDPOINTS } from '@/lib/api';
import {
  Users,
  Search,
  CheckCircle2,
  Calendar,
  Mail,
  Phone,
  ShieldCheck,
  Eye,
  UserCheck,
  Clock,
  Sparkles,
  ShoppingBag,
  ExternalLink
} from 'lucide-react';

interface CustomerItem {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  role: string;
  isActive?: boolean;
  avatar?: string;
  createdAt?: string;
  storeName?: string;
}

export default function AdminCustomersPage() {
  const [customers, setCustomers] = useState<CustomerItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'active' | 'recent'>('all');

  // Customer inspection modal
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerItem | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    setIsLoading(true);
    try {
      // Query users endpoint with role=customer
      const res = await apiClient.get(API_ENDPOINTS.AUTH.CUSTOMERS, {
        headers: { 'x-user-role': 'admin' }
      });

      if (res.data?.data) {
        setCustomers(res.data.data);
      }
    } catch (err) {
      console.error('Error fetching customers:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenDetails = (c: CustomerItem) => {
    setSelectedCustomer(c);
    setIsModalOpen(true);
  };

  // Filter logic
  const filteredCustomers = customers.filter((c) => {
    const matchesSearch =
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (c.phone && c.phone.includes(searchQuery));

    if (!matchesSearch) return false;

    if (activeTab === 'active') {
      return c.isActive !== false;
    }
    if (activeTab === 'recent') {
      if (!c.createdAt) return true;
      const daysOld = (Date.now() - new Date(c.createdAt).getTime()) / (1000 * 60 * 60 * 24);
      return daysOld <= 7;
    }

    return true;
  });

  const totalCount = customers.length;
  const activeCount = customers.filter((c) => c.isActive !== false).length;
  const recentCount = customers.filter((c) => {
    if (!c.createdAt) return false;
    const days = (Date.now() - new Date(c.createdAt).getTime()) / (1000 * 60 * 60 * 24);
    return days <= 7;
  }).length;

  return (
    <div className="flex min-h-screen bg-zinc-50 text-zinc-900">
      <AdminSidebar />

      <div className="flex-1 flex flex-col min-w-0">
        <AdminHeader title="Customer Directory & Accounts" />

        <main className="flex-1 p-8 space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-zinc-900">Registered Storefront Customers</h1>
              <p className="text-xs text-zinc-500 mt-1">
                Real-time directory of all patrons and clients registered via the Amba Lifestyle storefront.
              </p>
            </div>
            <a
              href="http://localhost:3000/register"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-zinc-200 rounded-xl text-xs font-semibold text-zinc-700 hover:bg-zinc-100 transition-colors shadow-xs"
            >
              <ExternalLink className="w-3.5 h-3.5" /> Open Storefront Signup
            </a>
          </div>

          {/* Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Card className="p-5 bg-white border border-zinc-200/80 shadow-xs flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shrink-0">
                <Users className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs text-zinc-500 font-medium">Total Registered Patrons</p>
                <h3 className="text-xl font-bold text-zinc-900 mt-0.5">{totalCount} Customers</h3>
                <span className="text-[10px] text-emerald-600 font-semibold flex items-center gap-1 mt-0.5">
                  <UserCheck className="w-3 h-3" /> Storefront Connected
                </span>
              </div>
            </Card>

            <Card className="p-5 bg-white border border-zinc-200/80 shadow-xs flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 shrink-0">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs text-zinc-500 font-medium">Active Accounts</p>
                <h3 className="text-xl font-bold text-zinc-900 mt-0.5">{activeCount} Verified</h3>
                <span className="text-[10px] text-zinc-400 font-medium">100% Good Standing</span>
              </div>
            </Card>

            <Card className="p-5 bg-white border border-zinc-200/80 shadow-xs flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600 shrink-0">
                <Sparkles className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs text-zinc-500 font-medium">Recent Signups (7 Days)</p>
                <h3 className="text-xl font-bold text-zinc-900 mt-0.5">{recentCount} New Patrons</h3>
                <span className="text-[10px] text-amber-700 font-medium">High Acquisition Rate</span>
              </div>
            </Card>
          </div>

          {/* Filter Bar */}
          <Card className="bg-white p-4 space-y-4">
            <div className="flex border-b border-zinc-100 overflow-x-auto gap-2">
              <button
                onClick={() => setActiveTab('all')}
                className={`pb-3 px-3 text-xs font-bold border-b-2 transition-all ${
                  activeTab === 'all'
                    ? 'border-indigo-600 text-indigo-700'
                    : 'border-transparent text-zinc-500 hover:text-zinc-800'
                }`}
              >
                All Patrons ({totalCount})
              </button>
              <button
                onClick={() => setActiveTab('active')}
                className={`pb-3 px-3 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 ${
                  activeTab === 'active'
                    ? 'border-emerald-600 text-emerald-700'
                    : 'border-transparent text-zinc-500 hover:text-zinc-800'
                }`}
              >
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                Active ({activeCount})
              </button>
              <button
                onClick={() => setActiveTab('recent')}
                className={`pb-3 px-3 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 ${
                  activeTab === 'recent'
                    ? 'border-amber-600 text-amber-700'
                    : 'border-transparent text-zinc-500 hover:text-zinc-800'
                }`}
              >
                <Clock className="w-3.5 h-3.5 text-amber-600" />
                Recent Signups ({recentCount})
              </button>
            </div>

            {/* Search */}
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
              <input
                type="text"
                placeholder="Search customers by full name, email, or phone number..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs bg-zinc-50 border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-zinc-800"
              />
            </div>
          </Card>

          {/* Customers Table */}
          <Card className="bg-white">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-zinc-200 text-xs font-semibold text-zinc-500">
                    <th className="pb-3 px-4">Customer</th>
                    <th className="pb-3 px-4">Contact Details</th>
                    <th className="pb-3 px-4">Account Type</th>
                    <th className="pb-3 px-4">Joined Date</th>
                    <th className="pb-3 px-4">Status</th>
                    <th className="pb-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100">
                  {isLoading ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-xs text-zinc-400">
                        Loading registered customer database...
                      </td>
                    </tr>
                  ) : filteredCustomers.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-xs text-zinc-400">
                        {customers.length === 0
                          ? 'No customers registered yet. Once a user signs up on the storefront, their profile will appear here.'
                          : 'No customers found matching search query.'}
                      </td>
                    </tr>
                  ) : (
                    filteredCustomers.map((c) => {
                      const initial = c.name?.charAt(0).toUpperCase() || 'U';
                      const formattedDate = c.createdAt
                        ? new Date(c.createdAt).toLocaleDateString('en-IN', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric'
                          })
                        : 'Recently';

                      return (
                        <tr key={c._id} className="text-zinc-700 hover:bg-zinc-50/50">
                          {/* Customer Name & Avatar */}
                          <td className="py-3.5 px-4">
                            <div
                              onClick={() => handleOpenDetails(c)}
                              className="flex items-center gap-3 cursor-pointer group"
                            >
                              <div className="w-10 h-10 rounded-full bg-amber-100 text-amber-800 font-bold text-sm flex items-center justify-center border border-amber-200/80 group-hover:scale-105 transition-transform shrink-0">
                                {initial}
                              </div>
                              <div>
                                <p className="font-semibold text-zinc-900 text-xs group-hover:text-indigo-600 transition-colors">
                                  {c.name}
                                </p>
                                <p className="text-[10px] text-zinc-400 font-mono mt-0.5">
                                  ID: {c._id}
                                </p>
                              </div>
                            </div>
                          </td>

                          {/* Contact Details */}
                          <td className="py-3.5 px-4 text-xs">
                            <div className="flex items-center gap-1.5 text-zinc-700">
                              <Mail className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                              <span className="font-medium truncate max-w-xs">{c.email}</span>
                            </div>
                            {c.phone && (
                              <div className="flex items-center gap-1.5 text-zinc-500 mt-1 text-[11px]">
                                <Phone className="w-3 h-3 text-zinc-400 shrink-0" />
                                <span>{c.phone}</span>
                              </div>
                            )}
                          </td>

                          {/* Account Role */}
                          <td className="py-3.5 px-4">
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-zinc-100 text-zinc-700 border border-zinc-200">
                              Customer
                            </span>
                          </td>

                          {/* Registered Date */}
                          <td className="py-3.5 px-4 text-xs text-zinc-600">
                            <div className="flex items-center gap-1.5">
                              <Calendar className="w-3.5 h-3.5 text-zinc-400" />
                              <span>{formattedDate}</span>
                            </div>
                          </td>

                          {/* Status */}
                          <td className="py-3.5 px-4">
                            <Badge variant="success" dot size="sm">
                              Active
                            </Badge>
                          </td>

                          {/* Actions */}
                          <td className="py-3.5 px-4 text-right">
                            <button
                              onClick={() => handleOpenDetails(c)}
                              className="inline-flex items-center gap-1 px-2.5 py-1 text-xs border border-zinc-200 text-zinc-700 hover:bg-zinc-100 hover:text-zinc-900 rounded-lg font-medium transition-colors shadow-2xs"
                            >
                              <Eye className="w-3.5 h-3.5 text-zinc-500" />
                              <span>Details</span>
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </main>
      </div>

      {/* CUSTOMER INSPECTION MODAL */}
      {selectedCustomer && (
        <Modal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title="Customer Profile & Verification"
          maxWidth="max-w-lg"
          footer={
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsModalOpen(false)}
            >
              Close
            </Button>
          }
        >
          <div className="space-y-5">
            {/* Customer Avatar & Header */}
            <div className="flex items-center gap-3.5 p-4 bg-zinc-50 rounded-2xl border border-zinc-200/80">
              <div className="w-14 h-14 rounded-full bg-amber-100 border border-amber-300 text-amber-900 font-bold text-lg flex items-center justify-center shrink-0">
                {selectedCustomer.name.charAt(0).toUpperCase()}
              </div>
              <div>
                <h3 className="font-bold text-base text-zinc-900">{selectedCustomer.name}</h3>
                <p className="text-xs text-zinc-500">{selectedCustomer.email}</p>
                <div className="flex items-center gap-2 mt-1.5">
                  <Badge variant="success" dot size="sm">
                    Verified Customer
                  </Badge>
                  <span className="text-[10px] text-zinc-400 font-mono">
                    ID: {selectedCustomer._id}
                  </span>
                </div>
              </div>
            </div>

            {/* Information Grid */}
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 bg-zinc-50 rounded-xl border border-zinc-200 text-xs">
                <span className="text-[10px] text-zinc-400 font-medium uppercase tracking-wider block">
                  Registered Email
                </span>
                <span className="font-semibold text-zinc-800 mt-0.5 block truncate">
                  {selectedCustomer.email}
                </span>
              </div>

              <div className="p-3 bg-zinc-50 rounded-xl border border-zinc-200 text-xs">
                <span className="text-[10px] text-zinc-400 font-medium uppercase tracking-wider block">
                  Phone Number
                </span>
                <span className="font-semibold text-zinc-800 mt-0.5 block truncate">
                  {selectedCustomer.phone || 'Not provided'}
                </span>
              </div>

              <div className="p-3 bg-zinc-50 rounded-xl border border-zinc-200 text-xs">
                <span className="text-[10px] text-zinc-400 font-medium uppercase tracking-wider block">
                  Registration Date
                </span>
                <span className="font-semibold text-zinc-800 mt-0.5 block truncate">
                  {selectedCustomer.createdAt
                    ? new Date(selectedCustomer.createdAt).toLocaleString('en-IN')
                    : 'Recent Signup'}
                </span>
              </div>

              <div className="p-3 bg-zinc-50 rounded-xl border border-zinc-200 text-xs">
                <span className="text-[10px] text-zinc-400 font-medium uppercase tracking-wider block">
                  Loyalty Tier
                </span>
                <span className="font-semibold text-amber-700 mt-0.5 block truncate flex items-center gap-1">
                  <Sparkles className="w-3 h-3" /> Connoisseur Club
                </span>
              </div>
            </div>

            {/* Quick Summary Notice */}
            <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-start gap-2.5 text-xs text-emerald-900">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-emerald-800">Direct Storefront Account</p>
                <p className="text-emerald-700 text-[11px] mt-0.5">
                  This user signed up via the official Amba Lifestyle customer portal and can browse products, place orders, and save favorites.
                </p>
              </div>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

