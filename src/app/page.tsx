'use client';

import React, { useState, useEffect } from 'react';
import { AdminSidebar } from '@/components/layout/AdminSidebar';
import { AdminHeader } from '@/components/layout/AdminHeader';
import { apiClient, API_ENDPOINTS } from '@/lib/api';
import { CountryFlag } from '@/components/ui/CountryFlag';
import {
  ClipboardList,
  Clock,
  Sparkles,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  Calendar,
  DollarSign,
  TrendingUp,
  Eye,
  Edit3,
  RefreshCw,
  X,
  Layers,
  Search,
  ArrowRight,
  ShieldCheck,
  Check,
  Trash2,
  LayoutGrid,
  Scissors,
  Crown,
  Armchair,
  Wand2,
  MessageSquare,
  Send,
  ShoppingBag,
  ImageOff,
  ChevronLeft,
  ChevronRight,
  ChevronDown
} from 'lucide-react';

export interface InquiryMessage {
  _id?: string;
  sender: 'customer' | 'admin';
  senderName: string;
  message: string;
  attachments?: string[];
  isSeen?: boolean;
  readByAdmin?: boolean;
  createdAt: string;
}

interface CustomerInquiry {
  _id: string;
  inquiryNumber: string;
  email: string;
  name: string;
  country?: string;
  category?: 'fashion' | 'jewelry' | 'home_decor' | 'other' | string;
  size: string;
  specifications?: Record<string, any>;
  quantity: number;
  description?: string;
  phone?: string;
  images?: string[];
  status: 'pending' | 'in_review' | 'quoted' | 'approved' | 'rejected';
  quotedPrice?: number;
  adminNotes?: string;
  inquiryType?: 'custom_requirement' | 'artisan_product' | string;
  isDirectProductInquiry?: boolean;
  messages?: InquiryMessage[];
  timeline?: Array<{
    status: string;
    note: string;
    updatedAt: string;
  }>;
  createdAt: string;
}

export default function AdminDashboard() {
  const [inquiries, setInquiries] = useState<CustomerInquiry[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [dashboardTimeframe, setDashboardTimeframe] = useState<'all' | 'today' | 'week' | 'month'>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [inquiryTypeFilter, setInquiryTypeFilter] = useState<'all' | 'custom_requirement' | 'artisan_product'>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [actionSuccessMessage, setActionSuccessMessage] = useState<string | null>(null);

  // Dynamic Pagination State
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [itemsPerPage, setItemsPerPage] = useState<number>(10);

  // Review Modal State
  const [selectedInquiry, setSelectedInquiry] = useState<CustomerInquiry | null>(null);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [modalStatus, setModalStatus] = useState<CustomerInquiry['status']>('pending');
  const [modalPrice, setModalPrice] = useState<string>('');
  const [modalNotes, setModalNotes] = useState<string>('');
  const [adminReplyText, setAdminReplyText] = useState<string>('');
  const [isSendingReply, setIsSendingReply] = useState<boolean>(false);
  const [isRefreshingInquiry, setIsRefreshingInquiry] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [previewImageModal, setPreviewImageModal] = useState<string | null>(null);

  // Fetch Inquiries dynamically from API
  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const inqRes = await apiClient.get(API_ENDPOINTS.INQUIRIES.LIST, {
        headers: { 'x-user-role': 'admin' }
      });
      if (inqRes.data?.data) {
        setInquiries(inqRes.data.data);
      }
    } catch (err) {
      console.error('Error fetching dashboard inquiries:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  // Date Check Helpers
  const isToday = (dateStr?: string) => {
    if (!dateStr) return false;
    const d = new Date(dateStr);
    const now = new Date();
    return d.toDateString() === now.toDateString();
  };

  const isThisWeek = (dateStr?: string) => {
    if (!dateStr) return false;
    const d = new Date(dateStr).getTime();
    const now = new Date().getTime();
    const diffDays = (now - d) / (1000 * 3600 * 24);
    return diffDays >= 0 && diffDays <= 7;
  };

  const isThisMonth = (dateStr?: string) => {
    if (!dateStr) return false;
    const d = new Date(dateStr);
    const now = new Date();
    return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
  };

  // Helper to distinguish Artisan Product Inquiry vs Custom Requirement Studio
  const isArtisanProductInquiry = (inq: CustomerInquiry): boolean => {
    if (inq.inquiryType === 'artisan_product' || inq.isDirectProductInquiry) return true;
    if (inq.size && (inq.size.includes('Catalog Price') || inq.size.includes('Catalog Product'))) return true;
    if (inq.description && inq.description.includes('I am interested in') && inq.description.includes('(Price:')) return true;
    return false;
  };

  // Dynamic calculations across all inquiries
  const totalCount = inquiries.length;
  const artisanProductCount = inquiries.filter(isArtisanProductInquiry).length;
  const customRequirementCount = inquiries.filter((i) => !isArtisanProductInquiry(i)).length;
  const todayCount = inquiries.filter((i) => isToday(i.createdAt)).length;
  const thisWeekCount = inquiries.filter((i) => isThisWeek(i.createdAt)).length;
  const thisMonthCount = inquiries.filter((i) => isThisMonth(i.createdAt)).length;
  const pendingCount = inquiries.filter((i) => i.status === 'pending').length;
  const inReviewCount = inquiries.filter((i) => i.status === 'in_review').length;
  const quotedCount = inquiries.filter((i) => i.status === 'quoted').length;
  const approvedCount = inquiries.filter((i) => i.status === 'approved').length;

  // Category counts
  const fashionCount = inquiries.filter((i) => i.category === 'fashion').length;
  const jewelryCount = inquiries.filter((i) => i.category === 'jewelry').length;
  const homeDecorCount = inquiries.filter((i) => i.category === 'home_decor').length;
  const otherCount = inquiries.filter((i) => !i.category || i.category === 'other').length;

  // Total Quoted Value in Rupees
  const totalQuotedValue = inquiries.reduce((sum, item) => sum + (Number(item.quotedPrice) || 0), 0);

  // Filtered list based on selected timeframe, category & search
  const displayedInquiries = inquiries.filter((item) => {
    let matchesTimeframe = true;
    if (dashboardTimeframe === 'today') matchesTimeframe = isToday(item.createdAt);
    else if (dashboardTimeframe === 'week') matchesTimeframe = isThisWeek(item.createdAt);
    else if (dashboardTimeframe === 'month') matchesTimeframe = isThisMonth(item.createdAt);

    const matchesCategory =
      categoryFilter === 'all' ||
      item.category === categoryFilter ||
      (!item.category && categoryFilter === 'other');

    const isArtisan = isArtisanProductInquiry(item);
    const matchesInquiryType =
      inquiryTypeFilter === 'all' ||
      (inquiryTypeFilter === 'artisan_product' && isArtisan) ||
      (inquiryTypeFilter === 'custom_requirement' && !isArtisan);

    const q = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !q ||
      item.inquiryNumber.toLowerCase().includes(q) ||
      item.name.toLowerCase().includes(q) ||
      item.email.toLowerCase().includes(q) ||
      item.size.toLowerCase().includes(q);

    return matchesTimeframe && matchesCategory && matchesSearch && matchesInquiryType;
  });

  // Reset page when filters or search change
  useEffect(() => {
    setCurrentPage(1);
  }, [dashboardTimeframe, categoryFilter, inquiryTypeFilter, searchQuery, itemsPerPage]);

  // Dynamic Pagination Calculations
  const totalInquiriesCount = displayedInquiries.length;
  const totalPages = Math.max(1, Math.ceil(totalInquiriesCount / itemsPerPage));
  const paginatedInquiries = displayedInquiries.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handlePageChange = (newPage: number) => {
    if (newPage < 1 || newPage > totalPages || newPage === currentPage) return;
    setCurrentPage(newPage);
  };

  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      if (currentPage <= 4) {
        pages.push(1, 2, 3, 4, 5, '...', totalPages);
      } else if (currentPage >= totalPages - 3) {
        pages.push(1, '...', totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
      } else {
        pages.push(1, '...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages);
      }
    }
    return pages;
  };

  const getUnseenCount = (inq: CustomerInquiry) => {
    if (!inq.messages || inq.messages.length === 0) return 0;
    return inq.messages.filter(
      (m) => (m.sender === 'customer' || !m.sender) && !m.isSeen && !m.readByAdmin
    ).length;
  };

  const refreshSelectedInquiry = async (inq: CustomerInquiry, silent = false) => {
    const inqKey = inq.inquiryNumber || inq._id;
    if (!inqKey) return;
    if (!silent) setIsRefreshingInquiry(true);
    try {
      const res = await apiClient.get(API_ENDPOINTS.INQUIRIES.BY_ID(inqKey), {
        headers: { 'x-user-role': 'admin' }
      });
      if (res.data?.data) {
        const freshInq = res.data.data;
        const markedMsgs = (freshInq.messages || []).map((m: any) => ({
          ...m,
          isSeen: true,
          readByAdmin: true
        }));
        const updated = { ...freshInq, messages: markedMsgs };
        setSelectedInquiry(updated);
        setInquiries((prev) =>
          prev.map((item) =>
            (item._id === updated._id || item.inquiryNumber === updated.inquiryNumber) ? updated : item
          )
        );
      }
    } catch (err) {
      console.error('Failed to refresh inquiry details:', err);
    } finally {
      if (!silent) setIsRefreshingInquiry(false);
    }
  };

  // Open Quick Update Modal
  const openReviewModal = (inq: CustomerInquiry) => {
    const inqKey = inq.inquiryNumber || inq._id;
    const updatedMsgs = (inq.messages || []).map((m) => ({
      ...m,
      isSeen: true,
      readByAdmin: true
    }));
    const updatedInq = { ...inq, messages: updatedMsgs };

    setSelectedInquiry(updatedInq);
    setInquiries((prev) =>
      prev.map((i) =>
        (i.inquiryNumber === inq.inquiryNumber || i._id === inq._id) ? updatedInq : i
      )
    );
    setModalStatus(inq.status);
    setModalPrice(inq.quotedPrice ? String(inq.quotedPrice) : '');
    setModalNotes(inq.adminNotes || '');
    setAdminReplyText('');
    setIsModalOpen(true);

    if (inqKey && inq.messages && inq.messages.some(m => (m.sender === 'customer' || !m.sender) && !m.isSeen && !m.readByAdmin)) {
      apiClient.put(API_ENDPOINTS.INQUIRIES.MARK_MESSAGES_READ(inqKey), {}, {
        headers: { 'x-user-role': 'admin' }
      }).catch(() => {});
    }

    // Immediately fetch latest live messages without needing page refresh!
    refreshSelectedInquiry(inq, true);
  };

  const handleSendAdminReply = async () => {
    if (!selectedInquiry || !adminReplyText.trim()) return;
    setIsSendingReply(true);
    try {
      const inqKey = selectedInquiry.inquiryNumber || selectedInquiry._id;
      const res = await apiClient.post(
        API_ENDPOINTS.INQUIRIES.ADD_MESSAGE(inqKey),
        {
          message: adminReplyText.trim(),
          sender: 'admin',
          senderName: 'Amba Support Admin'
        },
        { headers: { 'x-user-role': 'admin' } }
      );

      const newMsg: InquiryMessage = res.data?.data?.message || {
        _id: 'msg_' + Date.now(),
        sender: 'admin',
        senderName: 'Amba Support Admin',
        message: adminReplyText.trim(),
        createdAt: new Date().toISOString()
      };

      const updatedMessages = [...(selectedInquiry.messages || []), newMsg];
      setSelectedInquiry({
        ...selectedInquiry,
        messages: updatedMessages
      });

      setInquiries((prev) =>
        prev.map((i) =>
          (i.inquiryNumber === selectedInquiry.inquiryNumber || i._id === selectedInquiry._id)
            ? { ...i, messages: updatedMessages }
            : i
        )
      );

      setAdminReplyText('');
      setActionSuccessMessage(`Reply sent to customer for #${selectedInquiry.inquiryNumber}!`);
      setTimeout(() => setActionSuccessMessage(null), 4000);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to send reply to customer');
    } finally {
      setIsSendingReply(false);
    }
  };

  // Submit Update
  const handleSaveModal = async () => {
    if (!selectedInquiry) return;
    setIsSubmitting(true);
    try {
      await apiClient.patch(
        API_ENDPOINTS.INQUIRIES.UPDATE_STATUS(selectedInquiry.inquiryNumber || selectedInquiry._id),
        {
          status: modalStatus,
          quotedPrice: modalPrice ? Number(modalPrice) : 0,
          adminNotes: modalNotes.trim()
        },
        { headers: { 'x-user-role': 'admin' } }
      );

      setActionSuccessMessage(`Successfully updated #${selectedInquiry.inquiryNumber} to "${modalStatus.toUpperCase()}"!`);
      setIsModalOpen(false);
      fetchDashboardData();
      setTimeout(() => setActionSuccessMessage(null), 5000);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to update inquiry');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClearAll = async () => {
    if (!confirm('Are you sure you want to permanently clear ALL customer inquiries and dummy records?')) return;
    try {
      await apiClient.delete(API_ENDPOINTS.INQUIRIES.CLEAR_ALL, {
        headers: { 'x-user-role': 'admin' }
      });
      setActionSuccessMessage('All inquiries and dummy records have been successfully cleared.');
      fetchDashboardData();
      setTimeout(() => setActionSuccessMessage(null), 4000);
    } catch (err: any) {
      alert('Failed to clear inquiries');
    }
  };

  const getStatusBadge = (status: CustomerInquiry['status']) => {
    switch (status) {
      case 'pending':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200">
            <Clock className="w-3 h-3 text-amber-600" /> Pending
          </span>
        );
      case 'in_review':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-bold bg-sky-50 text-sky-800 border border-sky-200">
            <Sparkles className="w-3 h-3 text-sky-600" /> Review
          </span>
        );
      case 'quoted':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-bold bg-purple-50 text-purple-800 border border-purple-200">
            <DollarSign className="w-3 h-3 text-purple-600" /> Quoted
          </span>
        );
      case 'approved':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
            <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Approval
          </span>
        );
      case 'rejected':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-bold bg-rose-50 text-rose-800 border border-rose-200">
            <X className="w-3 h-3 text-rose-600" /> Rejected
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-bold bg-zinc-100 text-zinc-800">
            {status}
          </span>
        );
    }
  };

  const getCategoryBadge = (category?: string) => {
    switch (category) {
      case 'fashion':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-semibold bg-pink-50 text-pink-700 border border-pink-200 shadow-2xs whitespace-nowrap">
            <Scissors className="w-3 h-3 text-pink-600 stroke-[2.2]" /> Fashion & Apparel
          </span>
        );
      case 'jewelry':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-200 shadow-2xs whitespace-nowrap">
            <Crown className="w-3 h-3 text-amber-600 stroke-[2.2]" /> Jewelry & Silver
          </span>
        );
      case 'home_decor':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200 shadow-2xs whitespace-nowrap">
            <Armchair className="w-3 h-3 text-emerald-600 stroke-[2.2]" /> Home Decor
          </span>
        );
      case 'other':
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200 shadow-2xs whitespace-nowrap">
            <Wand2 className="w-3 h-3 text-indigo-600 stroke-[2.2]" /> Custom Craft
          </span>
        );
    }
  };

  const getCountryBadge = (country?: string) => {
    if (!country) return null;
    const lower = country.toLowerCase();
    let label = 'India';
    let code = 'india';
    if (lower.includes('aus')) {
      label = 'Australia';
      code = 'australia';
    } else if (lower.includes('usa') || lower.includes('us') || lower.includes('america')) {
      label = 'USA';
      code = 'usa';
    } else if (lower.includes('uk') || lower.includes('britain') || lower.includes('kingdom')) {
      label = 'UK';
      code = 'uk';
    }
    return (
      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200 shadow-2xs whitespace-nowrap">
        <CountryFlag country={code} className="w-4 h-2.5" />
        <span>{label}</span>
      </span>
    );
  };

  return (
    <div className="flex min-h-screen bg-slate-50 text-slate-900 font-sans antialiased">
      <AdminSidebar />

      <div className="flex-1 flex flex-col min-w-0">
        <AdminHeader title="Operations Dashboard" />

        <main className="flex-1 p-6 lg:p-8 space-y-7 w-full">
          {/* Action Success Alert */}
          {actionSuccessMessage && (
            <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-xl flex items-center justify-between text-sm font-semibold shadow-xs animate-fadeIn">
              <div className="flex items-center gap-2.5">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                <span>{actionSuccessMessage}</span>
              </div>
              <button onClick={() => setActionSuccessMessage(null)} className="text-emerald-700 hover:text-emerald-900 p-1">
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* TOP HERO BANNER */}
          <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-2xl p-7 shadow-lg relative overflow-hidden">
            <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div>
                <div className="inline-flex items-center gap-2 bg-indigo-500/20 text-indigo-300 px-3 py-1 rounded-full text-xs font-semibold mb-2 border border-indigo-400/20">
                  <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                  Live Requirement Management Desk
                </div>
                <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                  Welcome back, Admin
                </h1>
                <p className="text-sm text-slate-300 mt-1 max-w-xl leading-relaxed">
                  You have <strong className="text-amber-400 font-bold">{pendingCount} pending customer inquiry(s)</strong> awaiting quotation and artisan production feasibility.
                </p>
              </div>

              <div className="flex items-center gap-3">
                {inquiries.length > 0 && (
                  <button
                    onClick={handleClearAll}
                    className="px-4 py-2.5 bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 text-sm font-semibold rounded-xl border border-rose-500/30 shadow-sm transition-all flex items-center gap-2 cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4 text-rose-400" />
                    <span>Clear Inquiries</span>
                  </button>
                )}
                <button
                  onClick={fetchDashboardData}
                  className="px-4 py-2.5 bg-slate-800/80 hover:bg-slate-800 text-white text-sm font-semibold rounded-xl border border-slate-700 shadow-sm transition-all flex items-center gap-2 cursor-pointer"
                >
                  <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                  <span>Refresh</span>
                </button>
                <a
                  href="/inquiries"
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-bold rounded-xl shadow-md transition-all flex items-center gap-2 cursor-pointer"
                >
                  <ClipboardList className="w-4 h-4" />
                  <span>All Inquiries</span>
                </a>
                <a
                  href="http://localhost:3000"
                  target="_blank"
                  rel="noreferrer"
                  className="px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white text-sm font-semibold rounded-xl border border-white/20 transition-all flex items-center gap-2 cursor-pointer"
                >
                  <ExternalLink className="w-4 h-4" />
                  <span>Storefront</span>
                </a>
              </div>
            </div>

            {/* Subtle background glow */}
            <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
          </div>

          {/* COMPACT & SLEEK 4 STAT TILES */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
            {/* Tile 1: Total Inquiries */}
            <div className="bg-white border border-slate-200/90 rounded-xl p-3.5 shadow-2xs hover:border-slate-300 transition-all flex items-center justify-between">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-9 h-9 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                  <ClipboardList className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider truncate">Total Inquiries</p>
                  <h3 className="text-xl font-black text-slate-900 leading-tight mt-0.5">{totalCount}</h3>
                </div>
              </div>
              <span className="text-[10px] font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-100 shrink-0">
                All Time
              </span>
            </div>

            {/* Tile 2: Today's Inquiries */}
            <div className="bg-white border border-slate-200/90 rounded-xl p-3.5 shadow-2xs hover:border-slate-300 transition-all flex items-center justify-between">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-9 h-9 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                  <Calendar className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <p className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider truncate">Today's Inquiries</p>
                  <h3 className="text-xl font-black text-emerald-700 leading-tight mt-0.5">+{todayCount}</h3>
                </div>
              </div>
              <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200 shrink-0">
                Today
              </span>
            </div>

            {/* Tile 3: Pending Action */}
            <div className="bg-white border border-slate-200/90 rounded-xl p-3.5 shadow-2xs hover:border-slate-300 transition-all flex items-center justify-between">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-9 h-9 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                  <Clock className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <p className="text-[11px] font-bold text-amber-700 uppercase tracking-wider truncate">Pending Review</p>
                  <h3 className="text-xl font-black text-amber-700 leading-tight mt-0.5">{pendingCount}</h3>
                </div>
              </div>
              <span className="text-[10px] font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200 shrink-0">
                Needs Quote
              </span>
            </div>

            {/* Tile 4: Quoted Value */}
            <div className="bg-white border border-slate-200/90 rounded-xl p-3.5 shadow-2xs hover:border-slate-300 transition-all flex items-center justify-between">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-9 h-9 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
                  <DollarSign className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <p className="text-[11px] font-bold text-purple-700 uppercase tracking-wider truncate">Quoted Pipeline</p>
                  <h3 className="text-xl font-black text-purple-800 leading-tight mt-0.5">
                    ₹{totalQuotedValue.toLocaleString()}
                  </h3>
                </div>
              </div>
              <span className="text-[10px] font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-md border border-purple-200 shrink-0">
                {quotedCount + approvedCount} Items
              </span>
            </div>
          </div>

          {/* STATUS BREAKDOWN BAR */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900">Inquiry Pipeline Status</h3>
                <p className="text-xs text-slate-500 mt-0.5">Real-time distribution of all customer requirements</p>
              </div>
              <span className="text-xs font-bold text-slate-500">{totalCount} total submissions</span>
            </div>

            {/* Visual Progress Bar */}
            <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden flex">
              <div
                style={{ width: `${totalCount ? (pendingCount / totalCount) * 100 : 0}%` }}
                className="bg-amber-400 h-full"
                title={`Pending: ${pendingCount}`}
              />
              <div
                style={{ width: `${totalCount ? (inReviewCount / totalCount) * 100 : 0}%` }}
                className="bg-sky-400 h-full"
                title={`In Review: ${inReviewCount}`}
              />
              <div
                style={{ width: `${totalCount ? (quotedCount / totalCount) * 100 : 0}%` }}
                className="bg-purple-500 h-full"
                title={`Quoted: ${quotedCount}`}
              />
              <div
                style={{ width: `${totalCount ? (approvedCount / totalCount) * 100 : 0}%` }}
                className="bg-emerald-500 h-full"
                title={`Approved: ${approvedCount}`}
              />
            </div>

            {/* Legend / Metrics */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-2">
              <div className="p-3 bg-amber-50/70 border border-amber-200/60 rounded-xl">
                <span className="text-xs font-bold text-amber-800 block">Pending Review</span>
                <span className="text-xl font-black text-amber-900">{pendingCount}</span>
                <span className="text-[11px] text-amber-700 block mt-0.5">
                  {totalCount ? Math.round((pendingCount / totalCount) * 100) : 0}% of total
                </span>
              </div>

              <div className="p-3 bg-sky-50/70 border border-sky-200/60 rounded-xl">
                <span className="text-xs font-bold text-sky-800 block">In Review</span>
                <span className="text-xl font-black text-sky-900">{inReviewCount}</span>
                <span className="text-[11px] text-sky-700 block mt-0.5">
                  {totalCount ? Math.round((inReviewCount / totalCount) * 100) : 0}% of total
                </span>
              </div>

              <div className="p-3 bg-purple-50/70 border border-purple-200/60 rounded-xl">
                <span className="text-xs font-bold text-purple-800 block">Price Quoted</span>
                <span className="text-xl font-black text-purple-900">{quotedCount}</span>
                <span className="text-[11px] text-purple-700 block mt-0.5">
                  {totalCount ? Math.round((quotedCount / totalCount) * 100) : 0}% of total
                </span>
              </div>

              <div className="p-3 bg-emerald-50/70 border border-emerald-200/60 rounded-xl">
                <span className="text-xs font-bold text-emerald-800 block">Approved</span>
                <span className="text-xl font-black text-emerald-900">{approvedCount}</span>
                <span className="text-[11px] text-emerald-700 block mt-0.5">
                  {totalCount ? Math.round((approvedCount / totalCount) * 100) : 0}% of total
                </span>
              </div>
            </div>
          </div>

          {/* DYNAMIC INCOMING REQUIREMENTS TABLE WITH TABS */}
          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
            {/* TIER 1: PRIMARY WORKFLOW SEGMENTED CONTROL & SEARCH/PERIOD */}
            <div className="p-4 border-b border-slate-200/80 bg-slate-50/60 flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3.5">
              {/* Segmented Type Control */}
              <div className="inline-flex items-center p-1 bg-slate-200/70 rounded-xl gap-1 shrink-0 overflow-x-auto">
                <button
                  type="button"
                  onClick={() => setInquiryTypeFilter('all')}
                  className={`flex items-center gap-2 px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer whitespace-nowrap ${inquiryTypeFilter === 'all'
                    ? 'bg-white text-slate-900 shadow-xs font-black ring-1 ring-black/5'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-white/40'
                    }`}
                >
                  <ClipboardList className="w-3.5 h-3.5 text-indigo-600" />
                  <span>All Inquiries</span>
                  <span className={`text-[10px] font-black px-1.5 py-0.2 rounded-md ${inquiryTypeFilter === 'all' ? 'bg-indigo-50 text-indigo-700' : 'bg-slate-300/60 text-slate-600'
                    }`}>
                    {totalCount}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setInquiryTypeFilter('custom_requirement')}
                  className={`flex items-center gap-2 px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer whitespace-nowrap ${inquiryTypeFilter === 'custom_requirement'
                    ? 'bg-white text-amber-950 shadow-xs font-black ring-1 ring-black/5'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-white/40'
                    }`}
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                  <span>Custom Requirements</span>
                  <span className={`text-[10px] font-black px-1.5 py-0.2 rounded-md ${inquiryTypeFilter === 'custom_requirement' ? 'bg-amber-100 text-amber-900' : 'bg-slate-300/60 text-slate-600'
                    }`}>
                    {customRequirementCount}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setInquiryTypeFilter('artisan_product')}
                  className={`flex items-center gap-2 px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer whitespace-nowrap ${inquiryTypeFilter === 'artisan_product'
                    ? 'bg-white text-emerald-950 shadow-xs font-black ring-1 ring-black/5'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-white/40'
                    }`}
                >
                  <ShoppingBag className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Artisan Products</span>
                  <span className={`text-[10px] font-black px-1.5 py-0.2 rounded-md ${inquiryTypeFilter === 'artisan_product' ? 'bg-emerald-100 text-emerald-900' : 'bg-slate-300/60 text-slate-600'
                    }`}>
                    {artisanProductCount}
                  </span>
                </button>
              </div>

              {/* Right: Search & Period dropdown */}
              <div className="flex items-center gap-2.5 flex-wrap sm:flex-nowrap">
                {/* Period select */}
                <div className="flex items-center gap-1.5 bg-white border border-slate-200/90 rounded-xl px-2.5 py-1.5 shadow-2xs">
                  <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Period:</span>
                  <select
                    value={dashboardTimeframe}
                    onChange={(e) => setDashboardTimeframe(e.target.value as any)}
                    className="text-xs font-bold bg-transparent text-slate-700 focus:outline-none cursor-pointer pr-1"
                  >
                    <option value="all">All Time ({totalCount})</option>
                    <option value="today">Today ({todayCount})</option>
                    <option value="week">This Week ({thisWeekCount})</option>
                    <option value="month">This Month ({thisMonthCount})</option>
                  </select>
                </div>

                {/* Search input */}
                <div className="relative flex-1 sm:w-64">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Search name, email, ID..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-7 py-1.5 text-xs bg-white border border-slate-200/90 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 shadow-2xs font-medium text-slate-800 placeholder:text-slate-400 transition-all"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 cursor-pointer"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* TIER 2: CATEGORY FILTER PILLS & RESET */}
            <div className="px-4 py-2.5 border-b border-slate-200/70 bg-white flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 overflow-x-auto">
              {/* Category Filter Chips */}
              <div className="flex items-center gap-1.5 overflow-x-auto py-0.5">
                {[
                  { id: 'all', label: 'All Categories', count: totalCount, icon: LayoutGrid },
                  { id: 'fashion', label: 'Fashion & Apparel', count: fashionCount, icon: Scissors },
                  { id: 'jewelry', label: 'Jewelry & Silver', count: jewelryCount, icon: Crown },
                  { id: 'home_decor', label: 'Home Decor', count: homeDecorCount, icon: Armchair },
                  { id: 'other', label: 'Custom Craft', count: otherCount, icon: Wand2 },
                ].map((cat) => {
                  const Icon = cat.icon;
                  const isSelected = categoryFilter === cat.id;
                  return (
                    <button
                      key={cat.id}
                      onClick={() => setCategoryFilter(cat.id)}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${isSelected
                        ? 'bg-slate-900 text-white font-bold shadow-2xs'
                        : 'bg-slate-100/70 text-slate-600 hover:bg-slate-200/60 hover:text-slate-900'
                        }`}
                    >
                      <Icon className="w-3.5 h-3.5 shrink-0" />
                      <span>{cat.label}</span>
                      <span className={`text-[10px] font-black px-1.5 py-0.2 rounded-md ${isSelected ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-600'
                        }`}>
                        {cat.count}
                      </span>
                    </button>
                  );
                })}
              </div>

              {(dashboardTimeframe !== 'all' || categoryFilter !== 'all' || inquiryTypeFilter !== 'all' || searchQuery) && (
                <button
                  onClick={() => {
                    setDashboardTimeframe('all');
                    setCategoryFilter('all');
                    setInquiryTypeFilter('all');
                    setSearchQuery('');
                  }}
                  className="text-xs text-indigo-600 hover:text-indigo-800 font-bold cursor-pointer ml-1 underline decoration-indigo-200 underline-offset-2 shrink-0"
                >
                  Reset All Filters
                </button>
              )}
            </div>

            {/* Table Content */}
            {loading ? (
              <div className="py-20 text-center">
                <RefreshCw className="w-8 h-8 text-indigo-600 animate-spin mx-auto mb-2" />
                <p className="text-sm font-semibold text-slate-600">Loading live inquiries...</p>
              </div>
            ) : displayedInquiries.length === 0 ? (
              <div className="py-20 text-center">
                <ClipboardList className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <h3 className="text-base font-bold text-slate-700">No Inquiries Found</h3>
                <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                  {dashboardTimeframe === 'today'
                    ? 'No requirements submitted today yet. New customer submissions will appear here.'
                    : 'No requirements match your current filter or search query.'}
                </p>
                {(dashboardTimeframe !== 'all' || categoryFilter !== 'all' || inquiryTypeFilter !== 'all' || searchQuery) && (
                  <button
                    onClick={() => {
                      setDashboardTimeframe('all');
                      setCategoryFilter('all');
                      setInquiryTypeFilter('all');
                      setSearchQuery('');
                    }}
                    className="mt-4 px-4 py-2 bg-indigo-50 text-indigo-700 border border-indigo-200 text-xs font-bold rounded-xl hover:bg-indigo-100 transition-colors cursor-pointer inline-flex items-center gap-1.5"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Clear All Filters</span>
                  </button>
                )}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50/90 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[11px]">
                    <tr>
                      <th className="py-3 px-2.5 whitespace-nowrap">Inquiry Ref</th>
                      <th className="py-3 px-2 whitespace-nowrap">Category</th>
                      <th className="py-3 px-2.5">Product Details</th>
                      <th className="py-3 px-2">Dimensions / Size</th>
                      <th className="py-3 px-2">Customer Info</th>
                      <th className="py-3 px-2 whitespace-nowrap">Quotation</th>
                      <th className="py-3 px-2 whitespace-nowrap">Status</th>
                      <th className="py-3 px-2 whitespace-nowrap">Submitted</th>
                      <th className="py-3 px-2.5 text-right whitespace-nowrap">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {paginatedInquiries.map((inq) => {
                      const hasImage = Boolean(inq.images && inq.images.length > 0 && inq.images[0]);
                      const primaryImg = hasImage ? inq.images![0] : '';
                      const newToday = isToday(inq.createdAt);
                      return (
                        <tr key={inq._id || inq.inquiryNumber} className="hover:bg-slate-50/75 transition-colors">
                          <td className="py-3 px-2.5 whitespace-nowrap align-middle">
                            <span className="font-mono font-bold text-indigo-700 text-xs bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-200/80 inline-block">
                              #{inq.inquiryNumber}
                            </span>
                            {newToday && (
                              <span className="block text-[10px] text-emerald-600 font-bold mt-0.5">
                                ● New Today
                              </span>
                            )}
                            {inq.messages && inq.messages.length > 0 && (
                              <div className="mt-1">
                                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 px-1.5 py-0.5 rounded-full">
                                  <MessageSquare className="w-2.5 h-2.5 text-indigo-600" />
                                  {inq.messages.length} msg{inq.messages.length > 1 ? 's' : ''}
                                  {inq.messages[inq.messages.length - 1]?.sender === 'customer' && (
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse ml-0.5" title="New customer message" />
                                  )}
                                </span>
                              </div>
                            )}
                            <div className="mt-1">
                              {isArtisanProductInquiry(inq) ? (
                                <span className="inline-flex items-center gap-1 text-[10px] font-extrabold text-emerald-800 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded-md">
                                  <ShoppingBag className="w-2.5 h-2.5 text-emerald-600" /> Artisan Product
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 text-[10px] font-extrabold text-amber-800 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded-md">
                                  <Sparkles className="w-2.5 h-2.5 text-amber-600" /> Custom Studio
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="py-3 px-2 whitespace-nowrap align-middle">
                            <div>{getCategoryBadge(inq.category)}</div>
                            {inq.country && (
                              <div className="mt-1">
                                {getCountryBadge(inq.country)}
                              </div>
                            )}
                          </td>
                          <td className="py-3 px-2.5 align-middle">
                            <div className="flex items-center gap-2">
                              {hasImage ? (
                                <div
                                  onClick={() => setPreviewImageModal(primaryImg)}
                                  className="w-8 h-8 rounded-lg overflow-hidden border border-slate-200 shrink-0 cursor-pointer relative group bg-slate-100 shadow-2xs"
                                  title="Click to view image"
                                >
                                  <img
                                    src={primaryImg}
                                    alt={inq.name}
                                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-200"
                                  />
                                  <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                                    <Eye className="w-3.5 h-3.5 text-white" />
                                  </div>
                                </div>
                              ) : (
                                <div
                                  className="w-8 h-8 rounded-lg border border-dashed border-slate-200 shrink-0 flex flex-col items-center justify-center bg-slate-50 text-slate-400"
                                  title="No photo attached"
                                >
                                  <ImageOff className="w-3.5 h-3.5 text-slate-300" />
                                </div>
                              )}
                              <div className="min-w-0 max-w-[130px]">
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <p className="font-bold text-slate-900 text-xs leading-snug truncate" title={inq.name}>{inq.name}</p>
                                  {getUnseenCount(inq) > 0 && (
                                    <span
                                      className="inline-flex items-center justify-center min-w-[18px] h-4 px-1 rounded-full text-[10px] font-black bg-red-600 text-white shadow-xs"
                                      title={`${getUnseenCount(inq)} new message(s)`}
                                    >
                                      {getUnseenCount(inq)}
                                    </span>
                                  )}
                                </div>
                                {inq.description && (
                                  <p className="text-xs text-slate-500 truncate mt-0.5" title={inq.description}>
                                    {inq.description}
                                  </p>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="py-3 px-2 align-middle">
                            <span className="font-semibold text-slate-800 bg-slate-100/90 px-2 py-0.5 rounded-md text-xs border border-slate-200/60 block truncate max-w-[110px]" title={inq.size || 'Standard'}>
                              {inq.size || 'Standard'}
                            </span>
                            <span className="text-slate-500 block text-[11px] mt-0.5 font-medium">
                              Qty: <strong className="text-slate-700 font-bold">{inq.quantity || 1}</strong> unit(s)
                            </span>
                          </td>
                          <td className="py-3 px-2 align-middle">
                            <p className="font-semibold text-slate-800 text-xs truncate max-w-[125px]" title={inq.email}>{inq.email}</p>
                            {inq.phone ? (
                              <p className="text-[11px] text-slate-500 font-mono mt-0.5">{inq.phone}</p>
                            ) : (
                              <span className="text-slate-400 text-[11px] italic">No phone</span>
                            )}
                          </td>
                          <td className="py-3 px-2 font-bold align-middle whitespace-nowrap">
                            {inq.quotedPrice && inq.quotedPrice > 0 ? (
                              <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200 inline-block font-mono font-bold text-xs">
                                ₹{inq.quotedPrice.toLocaleString()}
                              </span>
                            ) : (
                              <span className="text-slate-400 font-medium italic text-xs">Pending Quote</span>
                            )}
                          </td>
                          <td className="py-3 px-2 align-middle whitespace-nowrap">
                            {getStatusBadge(inq.status)}
                          </td>
                          <td className="py-3 px-2 text-slate-500 text-xs whitespace-nowrap align-middle">
                            {inq.createdAt ? (
                              <div>
                                <span className="font-semibold text-slate-700 block text-xs">{new Date(inq.createdAt).toLocaleDateString()}</span>
                                <span className="text-slate-400 text-[11px]">{new Date(inq.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                              </div>
                            ) : (
                              'Today'
                            )}
                          </td>
                          <td className="py-3 px-2.5 text-right align-middle whitespace-nowrap">
                            <div className="flex items-center justify-end gap-1">
                              <button
                                type="button"
                                onClick={() => openReviewModal(inq)}
                                className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold transition-all inline-flex items-center gap-1 cursor-pointer shadow-xs shadow-indigo-600/20"
                              >
                                <Edit3 className="w-3 h-3" />
                                <span>Review</span>
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {/* PROPER MODERN PAGINATION BAR */}
            <div className="p-3 sm:px-5 border-t border-slate-200/90 bg-slate-50/70 flex flex-col md:flex-row items-center justify-between gap-3 text-xs">
              {/* Left: Summary text & Rows Per Page Dropdown */}
              <div className="flex flex-wrap items-center gap-3 text-slate-600">
                <span className="text-slate-500 text-xs">
                  Showing <strong className="font-bold text-slate-900">{totalInquiriesCount > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0}</strong> to{' '}
                  <strong className="font-bold text-slate-900">{Math.min(currentPage * itemsPerPage, totalInquiriesCount)}</strong> of{' '}
                  <strong className="font-bold text-slate-900">{totalInquiriesCount}</strong> inquiries
                </span>

                <div className="h-3.5 w-px bg-slate-300 hidden sm:block" />

                {/* 10, 20, 50 Rows Per Page Dropdown */}
                <div className="flex items-center gap-1.5">
                  <span className="text-slate-500 font-medium text-xs">Rows per page:</span>
                  <div className="relative inline-flex items-center">
                    <select
                      value={itemsPerPage}
                      onChange={(e) => {
                        const newLimit = Number(e.target.value);
                        setItemsPerPage(newLimit);
                        setCurrentPage(1);
                      }}
                      className="w-14 appearance-none bg-white hover:bg-slate-50 border border-slate-200 text-slate-800 rounded-lg pl-2 pr-5 py-1 text-xs font-bold transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 cursor-pointer shadow-2xs"
                    >
                      <option value={10}>10</option>
                      <option value={20}>20</option>
                      <option value={50}>50</option>
                    </select>
                    <ChevronDown className="w-3 h-3 text-slate-400 absolute right-1.5 pointer-events-none" />
                  </div>
                </div>
              </div>

              {/* Right: Page Navigation Buttons */}
              <div className="flex items-center gap-3">
                <span className="text-slate-500 text-xs hidden sm:inline">
                  Page <strong className="font-bold text-slate-900">{currentPage}</strong> of{' '}
                  <strong className="font-bold text-slate-900">{totalPages}</strong>
                </span>

                <div className="inline-flex items-center p-1 bg-white rounded-xl border border-slate-200 shadow-2xs gap-1">
                  <button
                    type="button"
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage <= 1 || loading}
                    className="px-2.5 py-1.5 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-700 hover:text-indigo-600 disabled:opacity-40 disabled:cursor-not-allowed font-bold text-xs transition-all flex items-center gap-1 cursor-pointer"
                    title="Previous page"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    <span className="hidden sm:inline">Prev</span>
                  </button>

                  <div className="flex items-center gap-1 px-1">
                    {getPageNumbers().map((p, idx) => (
                      typeof p === 'number' ? (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => handlePageChange(p)}
                          disabled={loading}
                          className={`min-w-8 h-8 rounded-lg text-xs font-black transition-all cursor-pointer ${currentPage === p
                            ? 'bg-indigo-600 text-white shadow-xs shadow-indigo-600/30'
                            : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                            }`}
                        >
                          {p}
                        </button>
                      ) : (
                        <span key={idx} className="px-1.5 text-slate-400 font-bold">
                          ...
                        </span>
                      )
                    ))}
                  </div>

                  <button
                    type="button"
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage >= totalPages || loading}
                    className="px-2.5 py-1.5 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-700 hover:text-indigo-600 disabled:opacity-40 disabled:cursor-not-allowed font-bold text-xs transition-all flex items-center gap-1 cursor-pointer"
                    title="Next page"
                  >
                    <span className="hidden sm:inline">Next</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* COMPACT 2-COLUMN REVIEW & QUOTATION MODAL */}
      {isModalOpen && selectedInquiry && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[88vh] overflow-y-auto shadow-2xl border border-slate-200 p-5 md:p-6 space-y-4">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5 flex-wrap">
                <span className="font-mono text-xs font-bold text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-lg border border-indigo-200">
                  #{selectedInquiry.inquiryNumber}
                </span>
                <h3 className="text-base font-extrabold text-slate-900">
                  {isArtisanProductInquiry(selectedInquiry) ? 'Review Artisan Product Inquiry' : 'Review Custom Requirement'}
                </h3>
                {getCategoryBadge(selectedInquiry.category)}
                {selectedInquiry.country && getCountryBadge(selectedInquiry.country)}
                {isArtisanProductInquiry(selectedInquiry) ? (
                  <span className="inline-flex items-center gap-1 text-[11px] font-extrabold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-lg shadow-2xs">
                    <ShoppingBag className="w-3.5 h-3.5 text-emerald-600" /> Artisan Catalog Product
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-[11px] font-extrabold text-amber-800 bg-amber-50 border border-amber-200 px-2.5 py-0.5 rounded-lg shadow-2xs">
                    <Sparkles className="w-3.5 h-3.5 text-amber-600" /> Custom Requirement Studio
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => refreshSelectedInquiry(selectedInquiry)}
                  disabled={isRefreshingInquiry}
                  className="px-2.5 py-1.5 text-slate-600 hover:text-indigo-600 rounded-lg hover:bg-slate-100 border border-slate-200 transition-colors cursor-pointer flex items-center gap-1.5 text-xs font-bold shadow-2xs"
                  title="Refresh latest messages & details"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isRefreshingInquiry ? 'animate-spin text-indigo-600' : ''}`} />
                  <span>Refresh</span>
                </button>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* PROMINENT CUSTOMER MESSAGE HIGHLIGHT BANNER */}
            {((selectedInquiry.messages && selectedInquiry.messages.length > 0) || selectedInquiry.description) && (
              <div className="p-4 bg-amber-50/90 border-2 border-amber-300 rounded-xl space-y-1.5 shadow-2xs">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-amber-900 font-bold text-xs uppercase tracking-wider">
                    <MessageSquare className="w-4 h-4 text-amber-700" />
                    <span>Customer Message Received from Frontend:</span>
                  </div>
                  {selectedInquiry.messages && selectedInquiry.messages.length > 0 && (
                    <span className="text-[10px] font-bold bg-amber-200/80 text-amber-900 px-2 py-0.5 rounded">
                      {new Date(selectedInquiry.messages[selectedInquiry.messages.length - 1].createdAt).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                    </span>
                  )}
                </div>
                <div className="bg-white p-3 rounded-lg border border-amber-200 text-slate-900 text-sm font-bold leading-relaxed whitespace-pre-wrap">
                  "{selectedInquiry.messages && selectedInquiry.messages.length > 0
                    ? selectedInquiry.messages[selectedInquiry.messages.length - 1].message
                    : selectedInquiry.description}"
                </div>
              </div>
            )}

            {/* 2-Column Content Grid */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-start">
              {/* LEFT COLUMN: Customer Specifications & Images */}
              <div className="md:col-span-7 space-y-3">
                <div className="p-3.5 bg-slate-50/80 rounded-xl border border-slate-200/80 space-y-2">
                  <div>
                    <h4 className="text-sm font-bold text-slate-900 leading-snug">{selectedInquiry.name}</h4>
                    <div className="flex flex-wrap items-center gap-1.5 text-xs mt-1.5">
                      <span className="bg-white px-2 py-0.5 rounded-md border border-slate-200 font-semibold text-slate-700">
                        Size: {selectedInquiry.size}
                      </span>
                      <span className="bg-white px-2 py-0.5 rounded-md border border-slate-200 font-semibold text-slate-700">
                        Qty: {selectedInquiry.quantity || 1} unit(s)
                      </span>
                    </div>
                  </div>

                  <div className="text-xs text-slate-600 flex flex-wrap gap-x-4 gap-y-1 pt-1 border-t border-slate-200/60">
                    <span><strong className="text-slate-500">Email:</strong> {selectedInquiry.email}</span>
                    {selectedInquiry.phone && (
                      <span><strong className="text-slate-500">Phone:</strong> {selectedInquiry.phone}</span>
                    )}
                  </div>
                </div>

                {/* Category Specifications */}
                {selectedInquiry.specifications && Object.keys(selectedInquiry.specifications).length > 0 && (
                  <div className="p-3 bg-white rounded-xl border border-slate-200 shadow-2xs">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Specifications:</p>
                    <div className="grid grid-cols-2 gap-1.5 text-xs">
                      {Object.entries(selectedInquiry.specifications).map(([key, val]) => (
                        <div key={key} className="bg-slate-50 px-2.5 py-1.5 rounded-lg border border-slate-100">
                          <span className="text-slate-400 font-medium capitalize block text-[10px]">{key.replace(/([A-Z])/g, ' $1')}:</span>
                          <span className="font-bold text-slate-800 truncate block">{String(val)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Description */}
                {selectedInquiry.description && (
                  <div className="text-xs text-slate-600 italic bg-amber-50/50 p-2.5 rounded-xl border border-amber-200/60 leading-relaxed">
                    "{selectedInquiry.description}"
                  </div>
                )}

                {/* Photos Gallery */}
                {selectedInquiry.images && selectedInquiry.images.length > 0 && (
                  <div>
                    <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">
                      Reference Photos ({selectedInquiry.images.length}):
                    </span>
                    <div className="flex flex-wrap gap-2">
                      {selectedInquiry.images.map((img, i) => (
                        <div
                          key={i}
                          onClick={() => setPreviewImageModal(img)}
                          className="w-14 h-14 rounded-xl overflow-hidden border border-slate-300 cursor-pointer hover:opacity-80 transition-opacity shrink-0 relative group shadow-2xs"
                          title="Click to zoom"
                        >
                          <img src={img} alt="Photo" className="w-full h-full object-cover" />
                          <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                            <Eye className="w-3.5 h-3.5 text-white" />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* CUSTOMER & ADMIN MESSAGING / CHAT SECTION */}
                <div className="p-3.5 bg-white rounded-xl border border-slate-200 shadow-2xs space-y-2.5">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
                      <MessageSquare className="w-4 h-4 text-indigo-600" />
                      <span>Customer Inquiries & Messages</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => refreshSelectedInquiry(selectedInquiry)}
                        disabled={isRefreshingInquiry}
                        className="p-1 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors cursor-pointer"
                        title="Refresh Messages"
                      >
                        <RefreshCw className={`w-3.5 h-3.5 ${isRefreshingInquiry ? 'animate-spin text-indigo-600' : ''}`} />
                      </button>
                      <span className="text-[10px] font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-200">
                        {selectedInquiry.messages && selectedInquiry.messages.length > 0
                          ? `${selectedInquiry.messages.length} message(s)`
                          : 'No messages yet'}
                      </span>
                    </div>
                  </div>

                  {/* Messages List */}
                  {selectedInquiry.messages && selectedInquiry.messages.length > 0 ? (
                    <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                      {selectedInquiry.messages.map((msg, mIdx) => {
                        const isCustomer = msg.sender === 'customer';
                        return (
                          <div
                            key={msg._id || mIdx}
                            className={`p-2.5 rounded-xl text-xs space-y-1 ${
                              isCustomer
                                ? 'bg-amber-50/70 border border-amber-200/80 text-amber-950'
                                : 'bg-indigo-50/70 border border-indigo-200/80 text-indigo-950 ml-4'
                            }`}
                          >
                            <div className="flex items-center justify-between text-[10px]">
                              <span className={`font-bold uppercase tracking-wider ${isCustomer ? 'text-amber-800' : 'text-indigo-800'}`}>
                                {isCustomer ? `Customer (${selectedInquiry.name || selectedInquiry.email})` : 'Amba Admin (You)'}
                              </span>
                              <span className="text-slate-400">
                                {msg.createdAt ? new Date(msg.createdAt).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' }) : ''}
                              </span>
                            </div>
                            <p className="font-medium whitespace-pre-wrap leading-relaxed">{msg.message}</p>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-[11px] text-slate-400 italic py-1">
                      No customer messages have been sent for this requirement yet.
                    </p>
                  )}

                  {/* Reply Input Box */}
                  <div className="pt-2 border-t border-slate-100 flex items-center gap-2">
                    <input
                      type="text"
                      placeholder="Reply directly to customer..."
                      value={adminReplyText}
                      onChange={(e) => setAdminReplyText(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleSendAdminReply();
                        }
                      }}
                      className="flex-1 px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium text-slate-800 placeholder:text-slate-400"
                    />
                    <button
                      type="button"
                      onClick={handleSendAdminReply}
                      disabled={isSendingReply || !adminReplyText.trim()}
                      className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg shadow-2xs transition-all flex items-center gap-1 cursor-pointer disabled:opacity-50 shrink-0"
                    >
                      {isSendingReply ? (
                        <RefreshCw className="w-3 h-3 animate-spin" />
                      ) : (
                        <Send className="w-3 h-3" />
                      )}
                      <span>Reply</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* RIGHT COLUMN: Action Controls (Status, Price, Remarks) */}
              <div className="md:col-span-5 bg-slate-50/80 p-4 rounded-xl border border-slate-200/80 flex flex-col justify-between space-y-3.5">
                <div className="space-y-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      Status
                    </label>
                    <select
                      value={modalStatus}
                      onChange={(e) => setModalStatus(e.target.value as any)}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-bold focus:ring-2 focus:ring-indigo-500 focus:outline-none cursor-pointer"
                    >
                      <option value="pending">Pending</option>
                      <option value="in_review">Review</option>
                      <option value="quoted">Quoted</option>
                      <option value="approved">Approval</option>
                      <option value="rejected">Rejected</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      Quoted Price (₹ INR)
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs">₹</span>
                      <input
                        type="number"
                        placeholder="e.g. 5000"
                        value={modalPrice}
                        onChange={(e) => setModalPrice(e.target.value)}
                        className="w-full pl-7 pr-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-bold focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      Admin Remarks
                    </label>
                    <textarea
                      rows={3}
                      placeholder="Add quotation notes or instructions for the customer..."
                      value={modalNotes}
                      onChange={(e) => setModalNotes(e.target.value)}
                      className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-3.5 py-1.5 rounded-xl border border-slate-300 text-slate-600 text-xs font-semibold hover:bg-white cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveModal}
                    disabled={isSubmitting}
                    className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
                  >
                    {isSubmitting ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                    <span>Save Updates</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: IMAGE PREVIEW */}
      {previewImageModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs"
          onClick={() => setPreviewImageModal(null)}
        >
          <div className="relative max-w-2xl w-full bg-white rounded-2xl overflow-hidden p-2 shadow-2xl">
            <button
              onClick={() => setPreviewImageModal(null)}
              className="absolute top-4 right-4 p-2 bg-black/60 text-white rounded-full hover:bg-black transition-colors z-10 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
            <img
              src={previewImageModal}
              alt="Enlarged Reference"
              className="w-full max-h-[75vh] object-contain rounded-xl"
            />
          </div>
        </div>
      )}
    </div>
  );
}
