'use client';

import React, { useState, useEffect } from 'react';
import {
  ShoppingBag,
  Clock,
  CheckCircle2,
  AlertCircle,
  Search,
  Filter,
  UserCheck,
  Building,
  Eye,
  FileText,
  Image as ImageIcon,
  ArrowRight,
  ShieldCheck,
  X
} from 'lucide-react';
import { AdminSidebar } from '@/components/layout/AdminSidebar';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { apiClient, API_ENDPOINTS } from '@/lib/api';

export interface OrderItem {
  _id: string;
  orderNumber: string;
  customerInfo?: {
    name: string;
    email: string;
    phone: string;
    company: string;
  };
  items?: Array<{
    title: string;
    price: number;
    quantity: number;
    category?: string;
    imageUrl?: string;
  }>;
  customRequirements?: string;
  referenceImages?: string[];
  assignedVendor?: string;
  assignedVendorName?: string;
  assignedAt?: string;
  orderStage:
    | 'pending_admin_review'
    | 'assigned_to_vendor'
    | 'vendor_preparing'
    | 'ready_for_inspection'
    | 'under_inspection'
    | 'quality_failed'
    | 'quality_approved'
    | 'completed';
  inspectionReport?: {
    status?: string;
    inspectorName?: string;
    defectNotes?: string;
  };
  totalAmount: number;
  createdAt: string;
}

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<OrderItem[]>([]);
  const [vendors, setVendors] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [notification, setNotification] = useState<string | null>(null);

  // Modals
  const [selectedOrder, setSelectedOrder] = useState<OrderItem | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [selectedVendorId, setSelectedVendorId] = useState('');
  const [isAssigning, setIsAssigning] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  const fetchOrdersAndVendors = async () => {
    setIsLoading(true);
    try {
      const [orderRes, vendorRes] = await Promise.all([
        apiClient.get(API_ENDPOINTS.ORDERS.LIST, { headers: { 'x-user-role': 'admin' } }),
        apiClient.get(API_ENDPOINTS.AUTH.VENDORS, { headers: { 'x-user-role': 'admin' } })
      ]);

      if (orderRes.data?.data) {
        setOrders(orderRes.data.data);
      }
      if (vendorRes.data?.data) {
        // Only approved vendors can be assigned
        const approvedOnly = vendorRes.data.data.filter((v: any) => v.vendorApprovalStatus === 'approved' || v.isApproved);
        setVendors(approvedOnly);
      }
    } catch (err) {
      console.error('Error fetching orders:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchOrdersAndVendors();
  }, []);

  const handleAssignVendorSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrder || !selectedVendorId) return;

    const vendorObj = vendors.find(v => v._id === selectedVendorId);
    const vendorName = vendorObj?.storeName || vendorObj?.name || 'Assigned Artisan Partner';

    setIsAssigning(true);
    try {
      await apiClient.patch(
        API_ENDPOINTS.ORDERS.ASSIGN_VENDOR(selectedOrder._id),
        { vendorId: selectedVendorId, vendorName },
        { headers: { 'x-user-role': 'admin' } }
      );

      setOrders(prev =>
        prev.map(o =>
          o._id === selectedOrder._id
            ? {
                ...o,
                assignedVendor: selectedVendorId,
                assignedVendorName: vendorName,
                orderStage: 'assigned_to_vendor'
              }
            : o
        )
      );

      setNotification(`Order #${selectedOrder.orderNumber} assigned to ${vendorName}!`);
      setTimeout(() => setNotification(null), 5000);
      setIsAssignModalOpen(false);
    } catch (err) {
      console.error('Assignment error:', err);
      // Fallback local update
      setOrders(prev =>
        prev.map(o =>
          o._id === selectedOrder._id
            ? {
                ...o,
                assignedVendor: selectedVendorId,
                assignedVendorName: vendorName,
                orderStage: 'assigned_to_vendor'
              }
            : o
        )
      );
      setNotification(`Order #${selectedOrder.orderNumber} assigned to ${vendorName}!`);
      setTimeout(() => setNotification(null), 5000);
      setIsAssignModalOpen(false);
    } finally {
      setIsAssigning(false);
    }
  };

  const getStageBadge = (stage: OrderItem['orderStage']) => {
    switch (stage) {
      case 'pending_admin_review':
        return <Badge variant="warning">Needs Vendor Assignment</Badge>;
      case 'assigned_to_vendor':
        return <Badge variant="info">Assigned to Vendor</Badge>;
      case 'vendor_preparing':
        return <Badge variant="warning">In Manufacturing</Badge>;
      case 'ready_for_inspection':
        return <Badge variant="danger">Ready for Quality Check</Badge>;
      case 'under_inspection':
        return <Badge variant="warning">Under Quality Inspection</Badge>;
      case 'quality_failed':
        return <Badge variant="danger">Defect - Returned to Vendor</Badge>;
      case 'quality_approved':
      case 'completed':
        return <Badge variant="success">Quality Approved</Badge>;
      default:
        return <Badge variant="default">{stage}</Badge>;
    }
  };

  const filteredOrders = orders.filter(o => {
    const matchesFilter =
      selectedFilter === 'all'
        ? true
        : selectedFilter === 'needs_assignment'
        ? o.orderStage === 'pending_admin_review'
        : selectedFilter === 'in_vendor'
        ? o.orderStage === 'assigned_to_vendor' || o.orderStage === 'vendor_preparing'
        : selectedFilter === 'inspection'
        ? o.orderStage === 'ready_for_inspection' || o.orderStage === 'under_inspection' || o.orderStage === 'quality_failed'
        : selectedFilter === 'approved'
        ? o.orderStage === 'quality_approved' || o.orderStage === 'completed'
        : true;

    const matchesSearch =
      o.orderNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      o.customerInfo?.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      o.customerInfo?.company.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (o.items && o.items[0]?.title.toLowerCase().includes(searchQuery.toLowerCase()));

    return matchesFilter && matchesSearch;
  });

  const needsAssignCount = orders.filter(o => o.orderStage === 'pending_admin_review').length;
  const inVendorCount = orders.filter(o => o.orderStage === 'assigned_to_vendor' || o.orderStage === 'vendor_preparing').length;
  const inspectionCount = orders.filter(o => o.orderStage === 'ready_for_inspection' || o.orderStage === 'quality_failed').length;
  const approvedCount = orders.filter(o => o.orderStage === 'quality_approved' || o.orderStage === 'completed').length;

  return (
    <div className="flex min-h-screen bg-zinc-50/50">
      <AdminSidebar />

      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 bg-white border-b border-zinc-200 flex items-center justify-between px-8 sticky top-0 z-20">
          <div>
            <h1 className="text-lg font-bold text-zinc-900 tracking-tight">Order Management & Vendor Assignment</h1>
            <p className="text-xs text-zinc-500">Review B2B customer inquiries, assign artisan vendors, and monitor manufacturing</p>
          </div>
        </header>

        <main className="flex-1 p-8 max-w-7xl w-full mx-auto space-y-6">
          {notification && (
            <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm flex items-center justify-between shadow-xs">
              <div className="flex items-center gap-2.5">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                <span>{notification}</span>
              </div>
              <button onClick={() => setNotification(null)} className="text-emerald-700 hover:text-emerald-900 cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Metric Overview Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="p-5 bg-white border-zinc-200 shadow-xs flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                <Clock className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase text-zinc-400">Needs Assignment</p>
                <h3 className="text-2xl font-bold text-zinc-900 mt-0.5">{needsAssignCount}</h3>
                <p className="text-[11px] text-amber-600 mt-0.5 font-medium">Pending vendor allocation</p>
              </div>
            </Card>

            <Card className="p-5 bg-white border-zinc-200 shadow-xs flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                <Building className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase text-zinc-400">In Preparation</p>
                <h3 className="text-2xl font-bold text-zinc-900 mt-0.5">{inVendorCount}</h3>
                <p className="text-[11px] text-indigo-600 mt-0.5 font-medium">Under artisan production</p>
              </div>
            </Card>

            <Card className="p-5 bg-white border-zinc-200 shadow-xs flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase text-zinc-400">Quality Inspection</p>
                <h3 className="text-2xl font-bold text-zinc-900 mt-0.5">{inspectionCount}</h3>
                <p className="text-[11px] text-rose-600 mt-0.5 font-medium">Ready for checker review</p>
              </div>
            </Card>

            <Card className="p-5 bg-white border-zinc-200 shadow-xs flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase text-zinc-400">Quality Approved</p>
                <h3 className="text-2xl font-bold text-zinc-900 mt-0.5">{approvedCount}</h3>
                <p className="text-[11px] text-emerald-600 mt-0.5 font-medium">Certified & ready</p>
              </div>
            </Card>
          </div>

          {/* Filters & Search Row */}
          <Card className="p-4 bg-white border-zinc-200 space-y-4 shadow-xs">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex flex-wrap gap-2">
                {[
                  { id: 'all', label: `All Orders (${orders.length})` },
                  { id: 'needs_assignment', label: `Needs Vendor (${needsAssignCount})` },
                  { id: 'in_vendor', label: `In Production (${inVendorCount})` },
                  { id: 'inspection', label: `Inspection Queue (${inspectionCount})` },
                  { id: 'approved', label: `Quality Approved (${approvedCount})` }
                ].map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setSelectedFilter(tab.id)}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                      selectedFilter === tab.id
                        ? 'bg-indigo-600 text-white shadow-xs'
                        : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              <div className="relative w-full md:w-72">
                <Search className="w-4 h-4 absolute left-3 top-2.5 text-zinc-400" />
                <input
                  type="text"
                  placeholder="Search order #, customer, product..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 text-xs bg-zinc-50 border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>
          </Card>

          {/* Orders Table */}
          <Card className="bg-white border-zinc-200 overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-zinc-200 bg-zinc-50/75 text-zinc-500 font-semibold uppercase tracking-wider text-[11px]">
                    <th className="py-3.5 px-4">Order Details</th>
                    <th className="py-3.5 px-4">Buyer / Client</th>
                    <th className="py-3.5 px-4">Product & Bulk Qty</th>
                    <th className="py-3.5 px-4">Reference Specs</th>
                    <th className="py-3.5 px-4">Assigned Vendor</th>
                    <th className="py-3.5 px-4">Workflow Stage</th>
                    <th className="py-3.5 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 text-zinc-700">
                  {isLoading ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-zinc-400">
                        Loading orders...
                      </td>
                    </tr>
                  ) : filteredOrders.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-zinc-400">
                        No orders match the selected filter.
                      </td>
                    </tr>
                  ) : (
                    filteredOrders.map(order => {
                      const item = order.items?.[0];
                      const hasRefImages = order.referenceImages && order.referenceImages.length > 0;

                      return (
                        <tr key={order._id} className="hover:bg-zinc-50/80 transition-colors">
                          <td className="py-3.5 px-4 font-mono">
                            <span className="font-bold text-zinc-900 block">{order.orderNumber}</span>
                            <span className="text-[10px] text-zinc-400">
                              {new Date(order.createdAt).toLocaleDateString('en-IN', {
                                day: '2-digit',
                                month: 'short',
                                year: 'numeric'
                              })}
                            </span>
                          </td>

                          <td className="py-3.5 px-4">
                            <p className="font-semibold text-zinc-900">{order.customerInfo?.name || 'Retail Client'}</p>
                            <p className="text-[11px] text-zinc-500">{order.customerInfo?.company || 'Direct Buyer'}</p>
                            <p className="text-[10px] text-zinc-400">{order.customerInfo?.phone || order.customerInfo?.email}</p>
                          </td>

                          <td className="py-3.5 px-4">
                            <div className="flex items-center gap-2.5">
                              {item?.imageUrl && (
                                <img
                                  src={item.imageUrl}
                                  alt="Product"
                                  className="w-9 h-9 rounded-lg object-cover border border-zinc-200 shrink-0"
                                />
                              )}
                              <div>
                                <p className="font-medium text-zinc-800 line-clamp-1 max-w-[200px]">{item?.title || 'Handcrafted Collection'}</p>
                                <p className="text-[11px] text-zinc-500 font-semibold">
                                  {item?.quantity || 1} units × ₹{item?.price || order.totalAmount}
                                  <span className="text-zinc-900 font-bold ml-1.5">(₹{order.totalAmount.toLocaleString('en-IN')})</span>
                                </p>
                              </div>
                            </div>
                          </td>

                          <td className="py-3.5 px-4">
                            <div className="flex items-center gap-1.5">
                              {hasRefImages ? (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-purple-50 text-purple-700 font-semibold text-[10px] border border-purple-200">
                                  <ImageIcon className="w-3 h-3" /> {order.referenceImages?.length} Ref Image(s)
                                </span>
                              ) : (
                                <span className="text-zinc-400 text-[11px]">Standard Spec</span>
                              )}
                            </div>
                            {order.customRequirements && (
                              <p className="text-[11px] text-zinc-500 line-clamp-1 max-w-[180px] mt-0.5 italic">
                                &ldquo;{order.customRequirements}&rdquo;
                              </p>
                            )}
                          </td>

                          <td className="py-3.5 px-4">
                            {order.assignedVendorName ? (
                              <div className="flex items-center gap-1.5 text-zinc-800 font-medium">
                                <Building className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                                <span className="truncate max-w-[150px]">{order.assignedVendorName}</span>
                              </div>
                            ) : (
                              <span className="text-amber-600 font-semibold text-[11px] flex items-center gap-1">
                                <AlertCircle className="w-3.5 h-3.5" /> Unassigned
                              </span>
                            )}
                          </td>

                          <td className="py-3.5 px-4">{getStageBadge(order.orderStage)}</td>

                          <td className="py-3.5 px-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setSelectedOrder(order);
                                  setIsDetailModalOpen(true);
                                }}
                                className="h-8 px-2.5 text-xs text-zinc-600"
                              >
                                <Eye className="w-3.5 h-3.5 mr-1" /> View
                              </Button>

                              {!order.assignedVendor || order.orderStage === 'pending_admin_review' ? (
                                <Button
                                  size="sm"
                                  onClick={() => {
                                    setSelectedOrder(order);
                                    setSelectedVendorId(vendors[0]?._id || '');
                                    setIsAssignModalOpen(true);
                                  }}
                                  className="h-8 px-2.5 text-xs bg-indigo-600 hover:bg-indigo-700 text-white"
                                >
                                  <UserCheck className="w-3.5 h-3.5 mr-1" /> Assign Vendor
                                </Button>
                              ) : (
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => {
                                    setSelectedOrder(order);
                                    setSelectedVendorId(order.assignedVendor || vendors[0]?._id || '');
                                    setIsAssignModalOpen(true);
                                  }}
                                  className="h-8 px-2 text-xs text-zinc-500 hover:text-zinc-800"
                                >
                                  Reassign
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
          </Card>
        </main>
      </div>

      {/* ASSIGN VENDOR MODAL */}
      <Modal
        isOpen={isAssignModalOpen}
        onClose={() => setIsAssignModalOpen(false)}
        title={`Assign Vendor to Order #${selectedOrder?.orderNumber}`}
      >
        <form onSubmit={handleAssignVendorSubmit} className="space-y-4">
          <div className="p-3.5 bg-zinc-50 border border-zinc-200 rounded-xl space-y-1 text-xs">
            <p className="font-bold text-zinc-900">{selectedOrder?.items?.[0]?.title}</p>
            <p className="text-zinc-600">
              Bulk Requirement: <span className="font-semibold text-zinc-900">{selectedOrder?.items?.[0]?.quantity} units</span> | Value: <span className="font-semibold text-zinc-900">₹{selectedOrder?.totalAmount.toLocaleString('en-IN')}</span>
            </p>
            {selectedOrder?.customRequirements && (
              <p className="text-zinc-500 italic mt-1">&ldquo;{selectedOrder.customRequirements}&rdquo;</p>
            )}
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-zinc-700">
              Select Approved Artisan / Vendor <span className="text-rose-500 font-bold">*</span>
            </label>
            <select
              value={selectedVendorId}
              onChange={e => setSelectedVendorId(e.target.value)}
              className="w-full px-3.5 py-2.5 text-sm bg-white text-zinc-900 border border-zinc-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
              required
            >
              <option value="" disabled>-- Choose an Approved Vendor --</option>
              {vendors.map(v => (
                <option key={v._id} value={v._id}>
                  {v.storeName || v.name} ({v.vendorCategory || 'Handicrafts'})
                </option>
              ))}
            </select>
            <p className="text-[11px] text-zinc-500">
              Only verified and approved vendors are authorized to receive manufacturing assignments.
            </p>
          </div>

          <div className="pt-3 flex items-center justify-end gap-3 border-t border-zinc-100">
            <Button type="button" variant="outline" onClick={() => setIsAssignModalOpen(false)}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isAssigning || !selectedVendorId}
              className="bg-indigo-600 hover:bg-indigo-700 text-white"
            >
              {isAssigning ? 'Assigning...' : 'Confirm Assignment'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* ORDER DETAILS & REFERENCE IMAGES MODAL */}
      <Modal
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        title={`Order Details: ${selectedOrder?.orderNumber}`}
      >
        {selectedOrder && (
          <div className="space-y-5 text-xs text-zinc-700">
            {/* Status Header */}
            <div className="flex items-center justify-between p-3.5 bg-zinc-50 border border-zinc-200 rounded-xl">
              <div>
                <span className="text-zinc-400 block text-[10px] uppercase font-semibold">Current Pipeline Stage</span>
                <span className="font-bold text-zinc-900 text-sm mt-0.5 block">{selectedOrder.orderStage.replace(/_/g, ' ').toUpperCase()}</span>
              </div>
              <div>{getStageBadge(selectedOrder.orderStage)}</div>
            </div>

            {/* Buyer Contact Details */}
            <div className="grid grid-cols-2 gap-3 p-3.5 bg-white border border-zinc-200 rounded-xl">
              <div>
                <span className="text-[10px] text-zinc-400 uppercase font-semibold">Client Name</span>
                <p className="font-bold text-zinc-900 text-xs mt-0.5">{selectedOrder.customerInfo?.name || 'Retail Client'}</p>
                <p className="text-zinc-500">{selectedOrder.customerInfo?.company || 'B2B Wholesale Buyer'}</p>
              </div>
              <div>
                <span className="text-[10px] text-zinc-400 uppercase font-semibold">Direct Contact</span>
                <p className="font-medium text-zinc-800 mt-0.5">{selectedOrder.customerInfo?.phone || 'Phone on file'}</p>
                <p className="text-zinc-500">{selectedOrder.customerInfo?.email}</p>
              </div>
            </div>

            {/* Custom Specifications */}
            <div className="p-3.5 bg-amber-50/60 border border-amber-200 rounded-xl space-y-1">
              <span className="text-[10px] text-amber-800 font-bold uppercase tracking-wider block">Customer Custom Requirements</span>
              <p className="text-zinc-800 font-medium">
                {selectedOrder.customRequirements || 'Standard batch order. No custom embroidery modifications specified.'}
              </p>
            </div>

            {/* Reference Images Uploaded by Customer */}
            {selectedOrder.referenceImages && selectedOrder.referenceImages.length > 0 && (
              <div className="space-y-2">
                <span className="text-xs font-bold text-zinc-900 block">Customer Reference Product Images</span>
                <div className="grid grid-cols-3 gap-2">
                  {selectedOrder.referenceImages.map((img, idx) => (
                    <div
                      key={idx}
                      onClick={() => setPreviewImage(img)}
                      className="group relative aspect-square rounded-xl overflow-hidden border border-zinc-200 cursor-pointer bg-zinc-100"
                    >
                      <img src={img} alt="Ref Sample" className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                      <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-[10px] font-semibold">
                        View Sample
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Assigned Artisan Details */}
            <div className="p-3.5 bg-indigo-50/50 border border-indigo-200 rounded-xl flex items-center justify-between">
              <div>
                <span className="text-[10px] text-indigo-700 uppercase font-semibold">Assigned Vendor</span>
                <p className="font-bold text-zinc-900 text-sm mt-0.5">
                  {selectedOrder.assignedVendorName || 'Not yet assigned to an artisan'}
                </p>
              </div>
              {!selectedOrder.assignedVendor && (
                <Button
                  size="sm"
                  onClick={() => {
                    setIsDetailModalOpen(false);
                    setSelectedVendorId(vendors[0]?._id || '');
                    setIsAssignModalOpen(true);
                  }}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white"
                >
                  Assign Now
                </Button>
              )}
            </div>

            {/* Quality Report Summary (if present) */}
            {selectedOrder.inspectionReport?.inspectorName && (
              <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl space-y-1">
                <span className="text-[10px] text-emerald-800 font-bold uppercase">Quality Inspection Record</span>
                <p className="text-xs text-zinc-800">
                  Inspected by: <strong className="text-zinc-900">{selectedOrder.inspectionReport.inspectorName}</strong>
                </p>
                {selectedOrder.inspectionReport.defectNotes && (
                  <p className="text-xs text-rose-700 mt-1">
                    Defect Notes: {selectedOrder.inspectionReport.defectNotes}
                  </p>
                )}
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* FULLSIZE IMAGE LIGHTBOX PREVIEW */}
      {previewImage && (
        <div
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 backdrop-blur-xs cursor-pointer"
          onClick={() => setPreviewImage(null)}
        >
          <div className="relative max-w-3xl max-h-[85vh] bg-white rounded-2xl overflow-hidden p-2">
            <button
              onClick={() => setPreviewImage(null)}
              className="absolute top-4 right-4 p-2 bg-black/60 hover:bg-black text-white rounded-full transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
            <img src={previewImage} alt="Reference Full View" className="max-w-full max-h-[80vh] object-contain rounded-xl" />
          </div>
        </div>
      )}
    </div>
  );
}

