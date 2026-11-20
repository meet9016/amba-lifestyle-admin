'use client';

import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Clock,
  Search,
  FileCheck,
  Building,
  Image as ImageIcon,
  Eye,
  Check,
  X
} from 'lucide-react';
import { AdminSidebar } from '@/components/layout/AdminSidebar';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { ImageUpload } from '@/components/ui/ImageUpload';
import { apiClient, API_ENDPOINTS } from '@/lib/api';

export interface InspectionOrder {
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
  assignedVendorName?: string;
  assignedCheckerName?: string;
  passedToCheckerAt?: string;
  orderStage: string;
  inspectionReport?: {
    inspectorName?: string;
    inspectedAt?: string;
    qualityCheckPassed?: boolean;
    quantityVerified?: boolean;
    specificationsMatched?: boolean;
    defectNotes?: string;
    inspectionPhotos?: string[];
    status?: 'pending' | 'passed' | 'failed';
  };
  totalAmount: number;
  createdAt: string;
}

export default function QualityInspectionPage() {
  const [orders, setOrders] = useState<InspectionOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'pending' | 'passed' | 'failed' | 'all'>('pending');
  const [searchQuery, setSearchQuery] = useState('');
  const [notification, setNotification] = useState<string | null>(null);

  // Inspection Inspection Dialog
  const [selectedOrder, setSelectedOrder] = useState<InspectionOrder | null>(null);
  const [isInspectModalOpen, setIsInspectModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form State
  const [inspectorName, setInspectorName] = useState('Senior Quality Inspector');
  const [qualityPassed, setQualityPassed] = useState(true);
  const [quantityVerified, setQuantityVerified] = useState(true);
  const [specificationsMatched, setSpecificationsMatched] = useState(true);
  const [defectNotes, setDefectNotes] = useState('');
  const [proofPhoto, setProofPhoto] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  const fetchInspectionQueue = async () => {
    setIsLoading(true);
    let currentRole = 'admin';
    let currentUserId = '';
    if (typeof window !== 'undefined') {
      try {
        const u = JSON.parse(localStorage.getItem('user') || '{}');
        if (u.role === 'checker') currentRole = 'checker';
        currentUserId = u.id || u._id || '';
      } catch (_) {}
    }

    try {
      const res = await apiClient.get(API_ENDPOINTS.ORDERS.LIST, {
        headers: { 'x-user-role': currentRole, 'x-user-id': currentUserId }
      });
      if (res.data?.data) {
        setOrders(res.data.data);
      }
    } catch (err) {
      console.error('Error loading inspection queue:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const u = JSON.parse(localStorage.getItem('user') || '{}');
        if (u.name) {
          setInspectorName(u.role === 'checker' ? `${u.name} (Quality Inspector)` : `${u.name} (Super Admin QA)`);
        }
      } catch (_) {}
    }
    fetchInspectionQueue();
  }, []);

  const openInspectionModal = (order: InspectionOrder) => {
    setSelectedOrder(order);
    setQualityPassed(true);
    setQuantityVerified(true);
    setSpecificationsMatched(true);
    setDefectNotes('');
    setProofPhoto('');
    setFormError(null);
    setIsInspectModalOpen(true);
  };

  const handleDecision = async (decision: 'pass' | 'fail') => {
    if (!selectedOrder) return;

    if (decision === 'fail' && !defectNotes.trim()) {
      setFormError('Please detail the specific defect notes so the vendor knows what to correct.');
      return;
    }

    setIsSubmitting(true);
    setFormError(null);

    let currentRole = 'admin';
    let currentName = inspectorName;
    if (typeof window !== 'undefined') {
      try {
        const u = JSON.parse(localStorage.getItem('user') || '{}');
        if (u.role === 'checker') currentRole = 'checker';
        if (u.name) currentName = u.name;
      } catch (_) {}
    }

    const payload = {
      decision,
      inspectorName: currentName,
      qualityCheckPassed: decision === 'pass' ? qualityPassed : false,
      quantityVerified: decision === 'pass' ? quantityVerified : false,
      specificationsMatched: decision === 'pass' ? specificationsMatched : false,
      defectNotes: defectNotes.trim(),
      inspectionPhotos: proofPhoto ? [proofPhoto] : []
    };

    try {
      await apiClient.patch(API_ENDPOINTS.ORDERS.INSPECTION(selectedOrder._id), payload, {
        headers: { 'x-user-role': currentRole, 'x-user-name': currentName }
      });

      const updatedStage = decision === 'pass' ? 'quality_approved' : 'quality_failed';
      setOrders(prev =>
        prev.map(o =>
          o._id === selectedOrder._id
            ? {
                ...o,
                orderStage: updatedStage,
                inspectionReport: {
                  inspectorName,
                  inspectedAt: new Date().toISOString(),
                  qualityCheckPassed: payload.qualityCheckPassed,
                  quantityVerified: payload.quantityVerified,
                  specificationsMatched: payload.specificationsMatched,
                  defectNotes: payload.defectNotes,
                  status: decision === 'pass' ? 'passed' : 'failed'
                }
              }
            : o
        )
      );

      setNotification(
        decision === 'pass'
          ? `Order #${selectedOrder.orderNumber} successfully QUALITY APPROVED!`
          : `Order #${selectedOrder.orderNumber} REJECTED & returned to vendor for correction.`
      );
      setTimeout(() => setNotification(null), 5000);
      setIsInspectModalOpen(false);
    } catch (err) {
      console.error('Inspection error:', err);
      // Fallback local update
      const updatedStage = decision === 'pass' ? 'quality_approved' : 'quality_failed';
      setOrders(prev =>
        prev.map(o =>
          o._id === selectedOrder._id
            ? {
                ...o,
                orderStage: updatedStage,
                inspectionReport: {
                  inspectorName,
                  defectNotes: payload.defectNotes,
                  status: decision === 'pass' ? 'passed' : 'failed'
                }
              }
            : o
        )
      );
      setNotification(`Inspection decision applied for #${selectedOrder.orderNumber}!`);
      setTimeout(() => setNotification(null), 5000);
      setIsInspectModalOpen(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  const pendingCount = orders.filter(
    o => o.orderStage === 'ready_for_inspection' || o.orderStage === 'under_inspection'
  ).length;
  const passedCount = orders.filter(o => o.orderStage === 'quality_approved' || o.orderStage === 'completed').length;
  const failedCount = orders.filter(o => o.orderStage === 'quality_failed').length;

  const filteredOrders = orders.filter(o => {
    const isPending = o.orderStage === 'ready_for_inspection' || o.orderStage === 'under_inspection';
    const isPassed = o.orderStage === 'quality_approved' || o.orderStage === 'completed';
    const isFailed = o.orderStage === 'quality_failed';

    const matchesTab =
      activeTab === 'pending'
        ? isPending
        : activeTab === 'passed'
        ? isPassed
        : activeTab === 'failed'
        ? isFailed
        : true;

    const matchesSearch =
      o.orderNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (o.assignedVendorName && o.assignedVendorName.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (o.items && o.items[0]?.title.toLowerCase().includes(searchQuery.toLowerCase()));

    return matchesTab && matchesSearch;
  });

  return (
    <div className="flex min-h-screen bg-zinc-50/50">
      <AdminSidebar />

      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 bg-white border-b border-zinc-200 flex items-center justify-between px-8 sticky top-0 z-20">
          <div>
            <h1 className="text-lg font-bold text-zinc-900 tracking-tight">Product Checker & Quality Inspection Console</h1>
            <p className="text-xs text-zinc-500">Test batches, verify quality, quantity & customer specifications before final fulfillment</p>
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

          {/* Metric Overview */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="p-5 bg-white border-zinc-200 shadow-xs flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                <Clock className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase text-zinc-400">Awaiting Inspection</p>
                <h3 className="text-2xl font-bold text-zinc-900 mt-0.5">{pendingCount}</h3>
                <p className="text-[11px] text-amber-600 mt-0.5 font-medium">Ready for checker review</p>
              </div>
            </Card>

            <Card className="p-5 bg-white border-zinc-200 shadow-xs flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase text-zinc-400">Quality Certified & Approved</p>
                <h3 className="text-2xl font-bold text-zinc-900 mt-0.5">{passedCount}</h3>
                <p className="text-[11px] text-emerald-600 mt-0.5 font-medium">Passed all strict standards</p>
              </div>
            </Card>

            <Card className="p-5 bg-white border-zinc-200 shadow-xs flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
                <XCircle className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase text-zinc-400">Returned to Vendor (Defects)</p>
                <h3 className="text-2xl font-bold text-zinc-900 mt-0.5">{failedCount}</h3>
                <p className="text-[11px] text-rose-600 mt-0.5 font-medium">Corrections required</p>
              </div>
            </Card>
          </div>

          {/* Filter Bar */}
          <Card className="p-4 bg-white border-zinc-200 space-y-4 shadow-xs">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex flex-wrap gap-2">
                {[
                  { id: 'pending', label: `Pending Inspection (${pendingCount})` },
                  { id: 'passed', label: `Approved (${passedCount})` },
                  { id: 'failed', label: `Defects / Returned (${failedCount})` },
                  { id: 'all', label: `All Orders (${orders.length})` }
                ].map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                      activeTab === tab.id
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
                  placeholder="Search order #, vendor, product..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 text-xs bg-zinc-50 border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>
          </Card>

          {/* Inspection Queue Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {isLoading ? (
              <div className="col-span-full py-12 text-center text-zinc-400 text-sm">
                Loading inspection orders...
              </div>
            ) : filteredOrders.length === 0 ? (
              <div className="col-span-full py-12 text-center text-zinc-400 text-sm bg-white rounded-2xl border border-dashed border-zinc-200">
                No orders in this inspection filter.
              </div>
            ) : (
              filteredOrders.map(order => {
                const item = order.items?.[0];
                const isReady = order.orderStage === 'ready_for_inspection';
                const isPassed = order.orderStage === 'quality_approved' || order.orderStage === 'completed';
                const isFailed = order.orderStage === 'quality_failed';

                return (
                  <Card key={order._id} className="p-5 bg-white border-zinc-200 shadow-xs flex flex-col justify-between">
                    <div className="space-y-4">
                      {/* Top Header */}
                      <div className="flex items-center justify-between">
                        <span className="font-mono font-bold text-zinc-900 text-xs">{order.orderNumber}</span>
                        {isReady ? (
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 animate-pulse">
                            Ready for Check
                          </span>
                        ) : isPassed ? (
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                            Quality Passed
                          </span>
                        ) : isFailed ? (
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800">
                            Failed / In Revision
                          </span>
                        ) : (
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-zinc-100 text-zinc-600">
                            {order.orderStage.replace(/_/g, ' ')}
                          </span>
                        )}
                      </div>

                      {/* Product Overview */}
                      <div className="flex items-center gap-3">
                        {item?.imageUrl && (
                          <img
                            src={item.imageUrl}
                            alt="Batch"
                            className="w-14 h-14 rounded-xl object-cover border border-zinc-200 shrink-0"
                          />
                        )}
                        <div>
                          <h4 className="font-bold text-zinc-900 text-xs line-clamp-1">{item?.title || 'Handcrafted Batch'}</h4>
                          <p className="text-[11px] text-zinc-500 font-semibold mt-0.5">
                            Batch Qty: <strong className="text-zinc-900">{item?.quantity || 1} units</strong>
                          </p>
                          <p className="text-[10px] text-zinc-400">Total: ₹{order.totalAmount.toLocaleString('en-IN')}</p>
                        </div>
                      </div>

                      {/* Vendor & Specs */}
                      <div className="p-3 bg-zinc-50 rounded-xl space-y-1.5 text-[11px]">
                        <div className="flex items-center justify-between">
                          <span className="text-zinc-400">Artisan Vendor:</span>
                          <span className="font-semibold text-zinc-800">{order.assignedVendorName || 'Jaipur Partner'}</span>
                        </div>
                        {order.customRequirements && (
                          <div className="pt-1 border-t border-zinc-200/60">
                            <span className="text-zinc-400 block text-[10px]">Client Custom Spec:</span>
                            <span className="text-zinc-700 italic line-clamp-2">&ldquo;{order.customRequirements}&rdquo;</span>
                          </div>
                        )}
                        {order.referenceImages && order.referenceImages.length > 0 && (
                          <div className="flex items-center gap-1 text-purple-700 font-semibold text-[10px] pt-0.5">
                            <ImageIcon className="w-3 h-3" /> {order.referenceImages.length} Client reference photo(s) attached
                          </div>
                        )}
                      </div>

                      {/* Defect note if rejected */}
                      {isFailed && order.inspectionReport?.defectNotes && (
                        <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-xl text-[11px] text-rose-800">
                          <strong className="block text-[10px] uppercase font-bold text-rose-900">Checker Defect Feedback:</strong>
                          <span>{order.inspectionReport.defectNotes}</span>
                        </div>
                      )}
                    </div>

                    {/* Bottom Action */}
                    <div className="pt-4 mt-4 border-t border-zinc-100">
                      {isReady ? (
                        <Button
                          onClick={() => openInspectionModal(order)}
                          className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs h-10 shadow-xs"
                        >
                          <FileCheck className="w-4 h-4 mr-1.5" /> Conduct Quality Inspection
                        </Button>
                      ) : (
                        <Button
                          variant="outline"
                          onClick={() => openInspectionModal(order)}
                          className="w-full text-xs text-zinc-700 h-9"
                        >
                          <Eye className="w-3.5 h-3.5 mr-1.5" /> Re-inspect / View Record
                        </Button>
                      )}
                    </div>
                  </Card>
                );
              })
            )}
          </div>
        </main>
      </div>

      {/* CONDUCT QUALITY INSPECTION MODAL */}
      <Modal
        isOpen={isInspectModalOpen}
        onClose={() => setIsInspectModalOpen(false)}
        title={`Quality Inspection Form: ${selectedOrder?.orderNumber}`}
      >
        {selectedOrder && (
          <div className="space-y-4 text-xs text-zinc-700">
            {formError && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            {/* Batch Info */}
            <div className="p-3 bg-zinc-50 border border-zinc-200 rounded-xl space-y-1">
              <p className="font-bold text-zinc-900 text-sm">{selectedOrder.items?.[0]?.title}</p>
              <div className="flex items-center justify-between text-zinc-600">
                <span>Vendor: <strong className="text-zinc-800">{selectedOrder.assignedVendorName || 'Assigned Artisan'}</strong></span>
                <span>Batch Count: <strong className="text-zinc-900">{selectedOrder.items?.[0]?.quantity} units</strong></span>
              </div>
            </div>

            {/* Inspector Details */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-zinc-700">
                Quality Inspector Name <span className="text-rose-500 font-bold">*</span>
              </label>
              <input
                type="text"
                value={inspectorName}
                onChange={e => setInspectorName(e.target.value)}
                className="w-full px-3.5 py-2 text-xs bg-white text-zinc-900 border border-zinc-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                required
              />
            </div>

            {/* 3 Quality Checkpoints */}
            <div className="space-y-2.5 p-3.5 bg-zinc-50/80 border border-zinc-200 rounded-xl">
              <span className="block font-bold text-zinc-900 text-[11px] uppercase tracking-wider">
                Inspection Criteria Checklist
              </span>

              <label className="flex items-center gap-3 cursor-pointer p-2 rounded-lg bg-white border border-zinc-200 hover:border-zinc-300 transition-colors">
                <input
                  type="checkbox"
                  checked={qualityPassed}
                  onChange={e => setQualityPassed(e.target.checked)}
                  className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500"
                />
                <div>
                  <span className="font-semibold text-zinc-900 block">1. Material, Weave & Finish Quality</span>
                  <span className="text-[11px] text-zinc-500">Fabric density, colorfastness, seam integrity, and authentic artisan craftsmanship.</span>
                </div>
              </label>

              <label className="flex items-center gap-3 cursor-pointer p-2 rounded-lg bg-white border border-zinc-200 hover:border-zinc-300 transition-colors">
                <input
                  type="checkbox"
                  checked={quantityVerified}
                  onChange={e => setQuantityVerified(e.target.checked)}
                  className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500"
                />
                <div>
                  <span className="font-semibold text-zinc-900 block">2. Batch Quantity Count Verified</span>
                  <span className="text-[11px] text-zinc-500">Physical count strictly matches client requirement ({selectedOrder.items?.[0]?.quantity} pcs).</span>
                </div>
              </label>

              <label className="flex items-center gap-3 cursor-pointer p-2 rounded-lg bg-white border border-zinc-200 hover:border-zinc-300 transition-colors">
                <input
                  type="checkbox"
                  checked={specificationsMatched}
                  onChange={e => setSpecificationsMatched(e.target.checked)}
                  className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500"
                />
                <div>
                  <span className="font-semibold text-zinc-900 block">3. Customer Custom Specs & Reference Matched</span>
                  <span className="text-[11px] text-zinc-500">Custom border, color palette, and client notes verified against reference design.</span>
                </div>
              </label>
            </div>

            {/* Defect Notes */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-zinc-700">
                Inspection Notes / Defect Reason (Required if Rejecting)
              </label>
              <textarea
                rows={3}
                placeholder="Detail observations, defects found, or certifications approved..."
                value={defectNotes}
                onChange={e => setDefectNotes(e.target.value)}
                className="w-full px-3.5 py-2 text-xs bg-white text-zinc-900 border border-zinc-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 placeholder-zinc-400"
              />
            </div>

            {/* Proof Photo Upload */}
            <ImageUpload
              label="Attach Inspection Proof / Defect Photo (Optional)"
              value={proofPhoto}
              onChange={b64 => setProofPhoto(b64)}
            />

            {/* Decision Buttons */}
            <div className="pt-3 border-t border-zinc-100 flex items-center justify-between gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsInspectModalOpen(false)}
                className="text-xs"
              >
                Cancel
              </Button>

              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  disabled={isSubmitting}
                  onClick={() => handleDecision('fail')}
                  className="bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs h-10 px-4"
                >
                  <XCircle className="w-4 h-4 mr-1.5" /> Fail & Return to Vendor
                </Button>

                <Button
                  type="button"
                  disabled={isSubmitting}
                  onClick={() => handleDecision('pass')}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs h-10 px-4 shadow-sm"
                >
                  <CheckCircle2 className="w-4 h-4 mr-1.5" /> Pass & Approve Quality
                </Button>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

