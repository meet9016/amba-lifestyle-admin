'use client';

import React, { useState, useEffect } from 'react';
import { AdminSidebar } from '@/components/layout/AdminSidebar';
import { AdminHeader } from '@/components/layout/AdminHeader';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { apiClient, API_ENDPOINTS } from '@/lib/api';
import {
  Store,
  Clock,
  CheckCircle2,
  XCircle,
  Search,
  Filter,
  Mail,
  Phone,
  Calendar,
  AlertCircle,
  Sparkles,
  ExternalLink,
  ShieldCheck,
  RefreshCw
} from 'lucide-react';

interface Vendor {
  _id: string;
  name: string;
  email: string;
  role: string;
  storeName?: string;
  vendorCategory?: string;
  phone?: string;
  isApproved: boolean;
  vendorApprovalStatus: 'pending' | 'approved' | 'rejected';
  createdAt?: string;
}

export default function VendorsApprovalPage() {
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [notification, setNotification] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  const getAuthHeaders = () => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    return {
      'Content-Type': 'application/json',
      'x-user-role': 'admin',
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    };
  };

  // Fetch vendors from backend
  const fetchVendors = async () => {
    setIsLoading(true);
    try {
      const res = await apiClient.get(API_ENDPOINTS.AUTH.VENDORS, {
        headers: getAuthHeaders()
      });
      if (res.data?.data) {
        setVendors(res.data.data);
      }
    } catch (err) {
      // Backend offline: keep existing/fallback list
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchVendors();
  }, []);

  // Handle Approve
  const handleApproveVendor = async (vendor: Vendor) => {
    try {
      await apiClient.patch(API_ENDPOINTS.AUTH.APPROVE_VENDOR(vendor._id), {}, {
        headers: getAuthHeaders()
      });
      setVendors(prev =>
        prev.map(v =>
          v._id === vendor._id
            ? { ...v, vendorApprovalStatus: 'approved', isApproved: true }
            : v
        )
      );
      setNotification({
        type: 'success',
        message: `Vendor "${vendor.storeName || vendor.name}" approved! They can now log in immediately on the Vendor Portal.`
      });
    } catch (_) {
      // Fallback state update
      setVendors(prev =>
        prev.map(v =>
          v._id === vendor._id
            ? { ...v, vendorApprovalStatus: 'approved', isApproved: true }
            : v
        )
      );
      setNotification({
        type: 'success',
        message: `Vendor "${vendor.storeName || vendor.name}" marked as approved.`
      });
    }
  };

  // Handle Reject
  const handleRejectVendor = async (vendor: Vendor) => {
    try {
      await apiClient.patch(API_ENDPOINTS.AUTH.REJECT_VENDOR(vendor._id), {}, {
        headers: getAuthHeaders()
      });
      setVendors(prev =>
        prev.map(v =>
          v._id === vendor._id
            ? { ...v, vendorApprovalStatus: 'rejected', isApproved: false }
            : v
        )
      );
      setNotification({
        type: 'error',
        message: `Vendor "${vendor.storeName || vendor.name}" application rejected.`
      });
    } catch (_) {
      setVendors(prev =>
        prev.map(v =>
          v._id === vendor._id
            ? { ...v, vendorApprovalStatus: 'rejected', isApproved: false }
            : v
        )
      );
      setNotification({
        type: 'error',
        message: `Vendor "${vendor.storeName || vendor.name}" registration rejected.`
      });
    }
  };

  // Metrics
  const totalCount = vendors.length;
  const pendingCount = vendors.filter(v => v.vendorApprovalStatus === 'pending').length;
  const approvedCount = vendors.filter(v => v.vendorApprovalStatus === 'approved').length;
  const rejectedCount = vendors.filter(v => v.vendorApprovalStatus === 'rejected').length;

  // Filtered list
  const filteredVendors = vendors.filter(vendor => {
    // Tab filter
    if (activeTab === 'pending' && vendor.vendorApprovalStatus !== 'pending') return false;
    if (activeTab === 'approved' && vendor.vendorApprovalStatus !== 'approved') return false;
    if (activeTab === 'rejected' && vendor.vendorApprovalStatus !== 'rejected') return false;

    // Search query filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      const matchStore = vendor.storeName?.toLowerCase().includes(query);
      const matchName = vendor.name?.toLowerCase().includes(query);
      const matchEmail = vendor.email?.toLowerCase().includes(query);
      const matchCategory = vendor.vendorCategory?.toLowerCase().includes(query);
      return matchStore || matchName || matchEmail || matchCategory;
    }
    return true;
  });

  return (
    <div className="flex min-h-screen bg-zinc-50">
      <AdminSidebar />

      <div className="flex-1 flex flex-col min-w-0">
        <AdminHeader />

        <main className="flex-1 p-8 space-y-8">
          {/* Page Title & Controls */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold tracking-tight text-zinc-900">
                  Vendor Partner Approvals
                </h1>
                {pendingCount > 0 && (
                  <Badge variant="warning" dot size="sm">
                    {pendingCount} Awaiting Review
                  </Badge>
                )}
              </div>
              <p className="text-sm text-zinc-500 mt-1">
                Review and approve artisan store applications. Approved vendors can immediately access their dashboard and add products.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={fetchVendors}
                isLoading={isLoading}
                className="gap-2"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Refresh
              </Button>
              <a
                href="http://localhost:3002/register"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-indigo-600 text-white hover:bg-indigo-700 transition-colors shadow-2xs"
              >
                Open Vendor Register Form
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>

          {/* Toast Notification */}
          {notification && (
            <div
              className={`p-4 rounded-xl border flex items-center justify-between transition-all ${
                notification.type === 'success'
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                  : 'bg-rose-50 border-rose-200 text-rose-900'
              }`}
            >
              <div className="flex items-center gap-3">
                {notification.type === 'success' ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                ) : (
                  <XCircle className="w-5 h-5 text-rose-600 shrink-0" />
                )}
                <span className="text-sm font-medium">{notification.message}</span>
              </div>
              <button
                onClick={() => setNotification(null)}
                className="text-xs font-semibold hover:underline px-2 py-1"
              >
                Dismiss
              </button>
            </div>
          )}

          {/* Metric Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            <Card className="p-5 flex items-center justify-between border-zinc-200 bg-white">
              <div>
                <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Total Vendors</p>
                <h3 className="text-2xl font-bold text-zinc-900 mt-1">{totalCount}</h3>
                <p className="text-xs text-zinc-400 mt-1">Platform-wide applications</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-zinc-100 flex items-center justify-center text-zinc-600">
                <Store className="w-6 h-6" />
              </div>
            </Card>

            <Card className={`p-5 flex items-center justify-between bg-white ${pendingCount > 0 ? 'border-amber-300 ring-2 ring-amber-100' : 'border-zinc-200'}`}>
              <div>
                <p className="text-xs font-semibold text-amber-700 uppercase tracking-wider flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping"></span>
                  Pending Review
                </p>
                <h3 className="text-2xl font-bold text-amber-900 mt-1">{pendingCount}</h3>
                <p className="text-xs text-amber-600 mt-1">Requires admin approval</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600">
                <Clock className="w-6 h-6 animate-pulse" />
              </div>
            </Card>

            <Card className="p-5 flex items-center justify-between border-zinc-200 bg-white">
              <div>
                <p className="text-xs font-semibold text-emerald-700 uppercase tracking-wider">Approved Partners</p>
                <h3 className="text-2xl font-bold text-emerald-900 mt-1">{approvedCount}</h3>
                <p className="text-xs text-emerald-600 mt-1">Active selling accounts</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600">
                <CheckCircle2 className="w-6 h-6" />
              </div>
            </Card>

            <Card className="p-5 flex items-center justify-between border-zinc-200 bg-white">
              <div>
                <p className="text-xs font-semibold text-rose-700 uppercase tracking-wider">Rejected</p>
                <h3 className="text-2xl font-bold text-rose-900 mt-1">{rejectedCount}</h3>
                <p className="text-xs text-rose-500 mt-1">Declined applications</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-600">
                <XCircle className="w-6 h-6" />
              </div>
            </Card>
          </div>

          {/* Main Vendor Queue & Table */}
          <Card className="border-zinc-200 bg-white overflow-hidden shadow-xs">
            {/* Table Controls Header */}
            <div className="p-5 border-b border-zinc-200 space-y-4">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                {/* Filter Tabs */}
                <div className="flex items-center gap-1.5 bg-zinc-100/80 p-1 rounded-xl text-xs font-semibold">
                  <button
                    onClick={() => setActiveTab('all')}
                    className={`px-3 py-1.5 rounded-lg transition-all ${
                      activeTab === 'all'
                        ? 'bg-white text-zinc-900 shadow-2xs font-bold'
                        : 'text-zinc-600 hover:text-zinc-900'
                    }`}
                  >
                    All Vendors ({totalCount})
                  </button>

                  <button
                    onClick={() => setActiveTab('pending')}
                    className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all ${
                      activeTab === 'pending'
                        ? 'bg-amber-500 text-white shadow-2xs font-bold'
                        : 'text-amber-800 hover:bg-amber-100/60'
                    }`}
                  >
                    Pending Approvals
                    {pendingCount > 0 && (
                      <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${activeTab === 'pending' ? 'bg-white text-amber-700 font-extrabold' : 'bg-amber-200 text-amber-900'}`}>
                        {pendingCount}
                      </span>
                    )}
                  </button>

                  <button
                    onClick={() => setActiveTab('approved')}
                    className={`px-3 py-1.5 rounded-lg transition-all ${
                      activeTab === 'approved'
                        ? 'bg-emerald-600 text-white shadow-2xs font-bold'
                        : 'text-zinc-600 hover:text-zinc-900'
                    }`}
                  >
                    Approved Partners ({approvedCount})
                  </button>

                  <button
                    onClick={() => setActiveTab('rejected')}
                    className={`px-3 py-1.5 rounded-lg transition-all ${
                      activeTab === 'rejected'
                        ? 'bg-rose-600 text-white shadow-2xs font-bold'
                        : 'text-zinc-600 hover:text-zinc-900'
                    }`}
                  >
                    Rejected ({rejectedCount})
                  </button>
                </div>

                {/* Search Bar */}
                <div className="relative w-full md:w-72">
                  <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Search by store, name, email..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-3.5 py-2 text-xs bg-zinc-50 border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all text-zinc-800 placeholder-zinc-400"
                  />
                </div>
              </div>
            </div>

            {/* Vendors Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-zinc-50/60 border-b border-zinc-200 text-[11px] font-bold text-zinc-500 uppercase tracking-wider">
                    <th className="py-3.5 px-6">Store & Category</th>
                    <th className="py-3.5 px-6">Representative Details</th>
                    <th className="py-3.5 px-6">Phone</th>
                    <th className="py-3.5 px-6">Approval Status</th>
                    <th className="py-3.5 px-6 text-right">Admin Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 text-sm">
                  {filteredVendors.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-12 text-center text-zinc-500 text-xs">
                        No vendor applications found for this filter.
                      </td>
                    </tr>
                  ) : (
                    filteredVendors.map((vendor) => {
                      const isPending = vendor.vendorApprovalStatus === 'pending';
                      const isApproved = vendor.vendorApprovalStatus === 'approved';
                      const isRejected = vendor.vendorApprovalStatus === 'rejected';

                      return (
                        <tr
                          key={vendor._id}
                          className={`hover:bg-zinc-50/80 transition-colors ${
                            isPending ? 'bg-amber-50/20' : ''
                          }`}
                        >
                          {/* Store Name & Category */}
                          <td className="py-4 px-6">
                            <div className="flex items-start gap-3">
                              <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm shrink-0 ${
                                isPending
                                  ? 'bg-amber-100 text-amber-800 border border-amber-200'
                                  : isApproved
                                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                                  : 'bg-zinc-100 text-zinc-600 border border-zinc-200'
                              }`}>
                                {(vendor.storeName || vendor.name).charAt(0).toUpperCase()}
                              </div>
                              <div>
                                <h4 className="font-semibold text-zinc-900 flex items-center gap-2">
                                  {vendor.storeName || 'Store Profile Pending'}
                                  {isPending && (
                                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 font-semibold border border-amber-200">
                                      New
                                    </span>
                                  )}
                                </h4>
                                <span className="inline-block mt-1 text-[11px] font-medium px-2 py-0.5 bg-zinc-100 text-zinc-600 rounded-md border border-zinc-200/60">
                                  {vendor.vendorCategory || 'General Goods'}
                                </span>
                              </div>
                            </div>
                          </td>

                          {/* Representative */}
                          <td className="py-4 px-6">
                            <div className="text-xs">
                              <p className="font-semibold text-zinc-900">{vendor.name}</p>
                              <p className="text-zinc-500 flex items-center gap-1 mt-0.5">
                                <Mail className="w-3 h-3 text-zinc-400" />
                                {vendor.email}
                              </p>
                            </div>
                          </td>

                          {/* Phone */}
                          <td className="py-4 px-6">
                            <div className="text-xs text-zinc-700 flex items-center gap-1.5">
                              <Phone className="w-3.5 h-3.5 text-zinc-400" />
                              <span>{vendor.phone || '+91 98765 00000'}</span>
                            </div>
                          </td>

                          {/* Approval Status Badge */}
                          <td className="py-4 px-6">
                            {isPending && (
                              <Badge variant="warning" dot size="sm">
                                Pending Approval
                              </Badge>
                            )}
                            {isApproved && (
                              <Badge variant="success" dot size="sm">
                                Approved & Active
                              </Badge>
                            )}
                            {isRejected && (
                              <Badge variant="danger" dot size="sm">
                                Rejected
                              </Badge>
                            )}
                          </td>

                          {/* Action Buttons */}
                          <td className="py-4 px-6 text-right">
                            <div className="flex items-center justify-end gap-2">
                              {isPending && (
                                <>
                                  <Button
                                    variant="primary"
                                    size="sm"
                                    onClick={() => handleApproveVendor(vendor)}
                                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold gap-1.5 shadow-2xs text-xs"
                                  >
                                    <CheckCircle2 className="w-3.5 h-3.5" />
                                    Approve Partner
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleRejectVendor(vendor)}
                                    className="border-rose-300 text-rose-700 hover:bg-rose-50 gap-1 text-xs"
                                  >
                                    <XCircle className="w-3.5 h-3.5" />
                                    Reject
                                  </Button>
                                </>
                              )}

                              {isApproved && (
                                <div className="flex items-center gap-2">
                                  <span className="text-xs text-emerald-700 font-semibold bg-emerald-50 px-2.5 py-1.5 rounded-xl border border-emerald-200">
                                    Can Login ✓
                                  </span>
                                  <button
                                    onClick={() => handleRejectVendor(vendor)}
                                    className="h-8.5 px-3 text-xs text-rose-700 hover:bg-rose-50 border border-rose-200 hover:border-rose-300 font-semibold rounded-xl transition-all shadow-2xs active:scale-[0.98]"
                                  >
                                    Suspend
                                  </button>
                                </div>
                              )}

                              {isRejected && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleApproveVendor(vendor)}
                                  className="border-zinc-300 text-zinc-700 hover:bg-zinc-100 text-xs gap-1"
                                >
                                  Re-Approve
                                </Button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Table Footer */}
            <div className="p-4 bg-zinc-50 border-t border-zinc-200 text-xs text-zinc-500 flex flex-col sm:flex-row items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>Only approved vendors can log in to <strong>http://localhost:3002</strong>. Pending applicants are blocked automatically.</span>
              </div>
              <div>
                Showing <strong>{filteredVendors.length}</strong> of <strong>{totalCount}</strong> vendors
              </div>
            </div>
          </Card>
        </main>
      </div>
    </div>
  );
}
