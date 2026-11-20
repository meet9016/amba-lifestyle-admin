'use client';

import React, { useState, useEffect } from 'react';
import { AdminSidebar } from '@/components/layout/AdminSidebar';
import { AdminHeader } from '@/components/layout/AdminHeader';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { apiClient, API_ENDPOINTS } from '@/lib/api';
import {
  ShieldCheck,
  Plus,
  Trash2,
  Mail,
  Phone,
  Building2,
  BadgeCheck,
  CheckCircle2,
  AlertCircle,
  Search,
  Lock,
  User,
  KeyRound,
  ExternalLink
} from 'lucide-react';

interface CheckerItem {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  employeeId?: string;
  department?: string;
  role: string;
  createdAt?: string;
}

export default function CheckersManagementPage() {
  const [checkers, setCheckers] = useState<CheckerItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [notification, setNotification] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
    department: 'Handloom & Textiles QA',
    employeeId: ''
  });

  const fetchCheckers = async () => {
    setIsLoading(true);
    try {
      const res = await apiClient.get(API_ENDPOINTS.AUTH.CHECKERS, {
        headers: { 'x-user-role': 'admin' }
      });
      if (res.data?.data) {
        setCheckers(res.data.data);
      }
    } catch (_) {
      setCheckers([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCheckers();
  }, []);

  const handleOpenCreateModal = () => {
    setFormData({
      name: '',
      email: '',
      password: 'checker' + Math.floor(100 + Math.random() * 900),
      phone: '',
      department: 'Handloom & Textiles QA',
      employeeId: `CHK-${Math.floor(1000 + Math.random() * 9000)}`
    });
    setErrorMessage(null);
    setIsCreateModalOpen(true);
  };

  const handleCreateChecker = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.email.trim() || !formData.password.trim()) {
      setErrorMessage('Name, email, and password are required');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const res = await apiClient.post(
        API_ENDPOINTS.AUTH.CHECKERS,
        {
          name: formData.name.trim(),
          email: formData.email.trim(),
          password: formData.password.trim(),
          phone: formData.phone.trim(),
          department: formData.department,
          employeeId: formData.employeeId.trim()
        },
        {
          headers: { 'x-user-role': 'admin' }
        }
      );

      if (res.data?.data) {
        setCheckers(prev => [res.data.data, ...prev]);
        setNotification(`Product Checker "${formData.name}" created successfully! They can now log in at the Admin Portal.`);
        setIsCreateModalOpen(false);
        setTimeout(() => setNotification(null), 5000);
      }
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message;
      setErrorMessage(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteChecker = async (checker: CheckerItem) => {
    if (!confirm(`Are you sure you want to remove Product Checker "${checker.name}"?`)) return;

    try {
      await apiClient.delete(API_ENDPOINTS.AUTH.DELETE_CHECKER(checker._id), {
        headers: { 'x-user-role': 'admin' }
      });
      setCheckers(prev => prev.filter(c => c._id !== checker._id));
      setNotification(`Checker "${checker.name}" removed.`);
      setTimeout(() => setNotification(null), 4000);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Error removing checker');
    }
  };

  const filteredCheckers = checkers.filter(c =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (c.department && c.department.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (c.employeeId && c.employeeId.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="flex min-h-screen bg-zinc-50 text-zinc-900">
      <AdminSidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <AdminHeader title="Product Checker & Quality Assurance Staff" />

        <main className="flex-1 p-8 space-y-6">
          {/* Notification */}
          {notification && (
            <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-2xl flex items-center justify-between text-xs font-semibold shadow-xs">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{notification}</span>
              </div>
              <button onClick={() => setNotification(null)} className="text-emerald-700 hover:text-emerald-900">✕</button>
            </div>
          )}

          {/* Top Banner & Action */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white border border-zinc-200 p-6 rounded-2xl shadow-xs">
            <div>
              <h1 className="text-xl font-bold text-zinc-900 flex items-center gap-2">
                <span>Product Checker Management</span>
                <Badge variant="success" size="sm" className="gap-1">
                  <ShieldCheck className="w-3.5 h-3.5" /> Quality Control
                </Badge>
              </h1>
              <p className="text-sm text-zinc-500 mt-1">
                Create and manage Product Quality Inspectors. Checkers sign in directly through the Admin Portal to inspect batches submitted by vendors.
              </p>
            </div>
            <Button
              onClick={handleOpenCreateModal}
              variant="primary"
              className="gap-2 bg-indigo-600 hover:bg-indigo-700 shadow-xs cursor-pointer text-white"
            >
              <Plus className="w-4 h-4" />
              <span>Create Product Checker</span>
            </Button>
          </div>

          {/* Quick Info Box */}
          <div className="p-4 bg-indigo-50/70 border border-indigo-100 rounded-2xl flex items-start gap-3 text-xs text-indigo-900">
            <BadgeCheck className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="font-bold">How Product Checking Works:</p>
              <p className="text-indigo-700">
                1. Vendor prepares the handcrafted order and clicks <strong>"Pass to Product Checker"</strong>.
                <br />
                2. The selected Checker signs into the <strong>Admin Portal</strong> (<a href="/login" className="underline font-bold">http://localhost:3000/login</a>) and inspects the physical order against the customer's reference photos & 3-point checklist.
                <br />
                3. Once the Checker approves, the order moves to <strong>Quality Approved</strong> and customer visual tracking updates live.
              </p>
            </div>
          </div>

          {/* Search bar */}
          <div className="flex items-center gap-4 bg-white p-4 rounded-2xl border border-zinc-200 shadow-xs">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
              <input
                type="text"
                placeholder="Search checkers by name, email, employee ID, or department..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 text-xs bg-zinc-50 border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          {/* Checkers Table */}
          <Card className="overflow-hidden border border-zinc-200 shadow-xs p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-zinc-200 bg-zinc-50 text-zinc-500 font-semibold uppercase tracking-wider">
                    <th className="py-3.5 px-5">Inspector / Checker</th>
                    <th className="py-3.5 px-5">Employee ID</th>
                    <th className="py-3.5 px-5">Department & Specialty</th>
                    <th className="py-3.5 px-5">Contact Details</th>
                    <th className="py-3.5 px-5">Portal Access</th>
                    <th className="py-3.5 px-5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100">
                  {isLoading ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-zinc-400">
                        Loading Product Checkers...
                      </td>
                    </tr>
                  ) : filteredCheckers.length > 0 ? (
                    filteredCheckers.map((checker) => (
                      <tr key={checker._id} className="hover:bg-zinc-50/80 transition-colors">
                        <td className="py-4 px-5">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-xs">
                              {checker.name.substring(0, 2).toUpperCase()}
                            </div>
                            <div>
                              <p className="font-bold text-zinc-900">{checker.name}</p>
                              <p className="text-[10px] text-zinc-500">Quality Assurance Officer</p>
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-5">
                          <span className="font-mono font-bold text-indigo-700 bg-indigo-50 px-2 py-1 rounded-md border border-indigo-100">
                            {checker.employeeId || 'CHK-OFFICIAL'}
                          </span>
                        </td>
                        <td className="py-4 px-5">
                          <p className="font-semibold text-zinc-800">{checker.department || 'General Quality Inspection'}</p>
                          <p className="text-[10px] text-zinc-400">Handcrafts / Textiles / Metals</p>
                        </td>
                        <td className="py-4 px-5">
                          <div className="space-y-0.5">
                            <p className="text-zinc-700 flex items-center gap-1.5">
                              <Mail className="w-3 h-3 text-zinc-400" />
                              <span>{checker.email}</span>
                            </p>
                            {checker.phone && (
                              <p className="text-zinc-500 flex items-center gap-1.5">
                                <Phone className="w-3 h-3 text-zinc-400" />
                                <span>{checker.phone}</span>
                              </p>
                            )}
                          </div>
                        </td>
                        <td className="py-4 px-5">
                          <Badge variant="success" size="sm" className="gap-1">
                            <CheckCircle2 className="w-3 h-3" /> Admin Portal Login
                          </Badge>
                        </td>
                        <td className="py-4 px-5 text-right">
                          <button
                            onClick={() => handleDeleteChecker(checker)}
                            className="p-1.5 text-zinc-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                            title="Remove checker"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-zinc-400">
                        No Product Checkers created yet. Click "Create Product Checker" to add quality inspection staff.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </main>
      </div>

      {/* Create Checker Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Create New Product Quality Checker"
      >
        <form onSubmit={handleCreateChecker} className="space-y-4 text-xs">
          {errorMessage && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          <Input
            label="Full Name *"
            placeholder="e.g. Vikram Singh"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
          />

          <Input
            label="Work Email (Login ID) *"
            type="email"
            placeholder="e.g. vikram.checker@ambalifestyle.com"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            required
          />

          <Input
            label="Password (for Admin Portal sign-in) *"
            type="text"
            placeholder="Set secure password"
            value={formData.password}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            required
          />

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Phone Number"
              placeholder="+91 9876543210"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            />

            <Input
              label="Employee ID"
              placeholder="e.g. CHK-2026-01"
              value={formData.employeeId}
              onChange={(e) => setFormData({ ...formData, employeeId: e.target.value })}
            />
          </div>

          <div>
            <label className="block font-semibold text-zinc-700 mb-1.5">
              QA Department & Specialty
            </label>
            <select
              value={formData.department}
              onChange={(e) => setFormData({ ...formData, department: e.target.value })}
              className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
            >
              <option value="Handloom & Textiles QA">Handloom & Textiles QA (Sarees, Silks, Lehengas)</option>
              <option value="Jewelry & Silverware QA">Jewelry & Silverware QA (Kundan, Silver, Precious)</option>
              <option value="Pottery & Ceramic Crafts QA">Pottery & Ceramic Crafts QA (Blue Pottery, Glaze)</option>
              <option value="Home Decor & Metalcraft QA">Home Decor & Metalcraft QA (Brassware, Carvings)</option>
              <option value="General Artisan Inspection">General Artisan Inspection (All Categories)</option>
            </select>
          </div>

          <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 text-[11px] flex items-center gap-2">
            <Lock className="w-4 h-4 text-amber-600 shrink-0" />
            <span>This checker will be able to log in at <strong>http://localhost:3000/login</strong> using these credentials.</span>
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-zinc-100">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsCreateModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              isLoading={isSubmitting}
              className="bg-indigo-600 hover:bg-indigo-700 text-white"
            >
              Save & Create Checker
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

