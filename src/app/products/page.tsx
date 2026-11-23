'use client';

import React, { useState, useEffect } from 'react';
import { AdminSidebar } from '@/components/layout/AdminSidebar';
import { AdminHeader } from '@/components/layout/AdminHeader';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Select';
import { Modal } from '@/components/ui/Modal';
import { apiClient, API_ENDPOINTS } from '@/lib/api';
import {
  Package,
  Search,
  CheckCircle2,
  XCircle,
  Clock,
  Filter,
  ExternalLink,
  Trash2,
  Eye,
  Tag,
  Layers,
  Store,
  Boxes,
  Calendar,
  DollarSign,
  AlertCircle,
  Star,
  Info,
  Plus,
  Upload,
  Edit3
} from 'lucide-react';

interface AdminProduct {
  id: string;
  title: string;
  category: string;
  subCategory?: string;
  price: number;
  discountPrice?: number;
  stock?: number;
  vendorName: string;
  vendor?: string;
  status?: string;
  approvalStatus: 'approved' | 'pending' | 'rejected' | 'inactive';
  isActive?: boolean;
  rejectionReason?: string;
  imageUrl?: string;
  images?: string[];
  description?: string;
  specifications?: Record<string, string>;
  tierPricing?: { minQty: number; maxQty?: number; price: number }[];
  rating?: number;
  numReviews?: number;
  createdAt?: string;
}

export default function AdminProductsPage() {
  const [products, setProducts] = useState<AdminProduct[]>([]);
  const [categories, setCategories] = useState<{ _id: string; name: string }[]>([]);
  const [activeTab, setActiveTab] = useState<'all' | 'active' | 'inactive'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [notification, setNotification] = useState<string | null>(null);

  // Product Inspection Detail Modal States
  const [selectedProduct, setSelectedProduct] = useState<AdminProduct | null>(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  // Rejection Modal State
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [rejectionReasonInput, setRejectionReasonInput] = useState('');
  const [productToReject, setProductToReject] = useState<AdminProduct | null>(null);

  // Common Delete Confirmation Modal States
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState<AdminProduct | null>(null);
  const [isDeletingProduct, setIsDeletingProduct] = useState(false);

  // Add Product Modal States
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newPrice, setNewPrice] = useState('');
  const [newCategory, setNewCategory] = useState('Fashion & Apparel');
  const [newImageUrl, setNewImageUrl] = useState('');
  const [isSubmittingNewProduct, setIsSubmittingNewProduct] = useState(false);

  // Edit Product Modal States
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editPrice, setEditPrice] = useState('');
  const [editCategory, setEditCategory] = useState('Fashion & Apparel');
  const [editImageUrl, setEditImageUrl] = useState('');
  const [isSubmittingEdit, setIsSubmittingEdit] = useState(false);

  // Client-side auto-compression helper to ensure instant upload without "request entity too large" error
  const compressImageFile = (file: File): Promise<string> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onerror = () => resolve('');
      reader.onload = (event) => {
        const img = new Image();
        img.onerror = () => resolve((event.target?.result as string) || '');
        img.onload = () => {
          const MAX_DIM = 1200;
          let width = img.width;
          let height = img.height;

          if (width > MAX_DIM || height > MAX_DIM) {
            if (width > height) {
              height = Math.round((height * MAX_DIM) / width);
              width = MAX_DIM;
            } else {
              width = Math.round((width * MAX_DIM) / height);
              height = MAX_DIM;
            }
          }

          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            resolve((event.target?.result as string) || '');
            return;
          }
          ctx.drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL('image/jpeg', 0.85));
        };
        img.src = (event.target?.result as string) || '';
      };
      reader.readAsDataURL(file);
    });
  };

  const handleImageFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const compressed = await compressImageFile(file);
      if (compressed) {
        setNewImageUrl(compressed);
      }
    } catch (_) {
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          setNewImageUrl(reader.result);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleEditImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const compressed = await compressImageFile(file);
      if (compressed) {
        setEditImageUrl(compressed);
      }
    } catch (_) {
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          setEditImageUrl(reader.result);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) {
      alert('Please enter product name');
      return;
    }
    if (!newPrice || Number(newPrice) <= 0) {
      alert('Please enter a valid price');
      return;
    }
    const finalImg = newImageUrl.trim() || 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=600&q=80';

    setIsSubmittingNewProduct(true);
    try {
      const payload = {
        title: newTitle.trim(),
        name: newTitle.trim(),
        price: Number(newPrice),
        category: newCategory,
        images: [finalImg],
        imageUrl: finalImg
      };

      const res = await apiClient.post(API_ENDPOINTS.PRODUCTS.CREATE, payload, {
        headers: { 'x-user-role': 'admin' }
      });

      const created = res.data?.data;
      if (created) {
        const mappedProduct: AdminProduct = {
          id: String(created._id),
          title: created.title,
          category: created.category,
          subCategory: created.subCategory || 'Handcrafted Goods',
          price: created.price,
          discountPrice: created.discountPrice,
          stock: created.stock || 10,
          vendorName: created.vendorName || 'Amba Lifestyle Direct',
          approvalStatus: 'approved',
          status: 'approved',
          isActive: true,
          imageUrl: created.images?.[0] || finalImg,
          images: created.images || [finalImg],
          description: '',
          createdAt: created.createdAt || new Date().toISOString()
        };
        setProducts(prev => [mappedProduct, ...prev]);
        setNotification(`Product "${newTitle}" added successfully! Now visible on the frontend.`);
        setTimeout(() => setNotification(null), 5000);
      }
      setIsAddModalOpen(false);
      setNewTitle('');
      setNewPrice('');
      setNewImageUrl('');
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to create product');
    } finally {
      setIsSubmittingNewProduct(false);
    }
  };

  const handleToggleProductStatus = async (p: AdminProduct) => {
    const isCurrentlyActive = p.approvalStatus === 'approved' && p.status !== 'inactive';
    const nextActive = !isCurrentlyActive;
    const nextStatus = nextActive ? 'approved' : 'inactive';

    // Optimistically update status
    setProducts(prev =>
      prev.map(item =>
        item.id === p.id
          ? { ...item, approvalStatus: nextStatus as any, status: nextStatus, isActive: nextActive }
          : item
      )
    );

    try {
      await apiClient.put(
        API_ENDPOINTS.PRODUCTS.UPDATE(p.id),
        {
          isActive: nextActive,
          status: nextStatus,
          approvalStatus: nextStatus
        },
        { headers: { 'x-user-role': 'admin' } }
      );

      setNotification(
        `Product "${p.title}" is now ${nextActive ? 'Active (Live on Storefront)' : 'Inactive (Hidden from Storefront)'}.`
      );
      setTimeout(() => setNotification(null), 4000);
    } catch (err: any) {
      // Revert if error
      setProducts(prev =>
        prev.map(item =>
          item.id === p.id
            ? { ...item, approvalStatus: p.approvalStatus, status: p.status, isActive: p.isActive }
            : item
        )
      );
      alert(err.response?.data?.message || 'Failed to update product status');
    }
  };

  const handleOpenEdit = (p: AdminProduct) => {
    setEditingProductId(p.id);
    setEditTitle(p.title);
    setEditPrice(String(p.price));
    setEditCategory(p.category || 'Fashion & Apparel');
    setEditImageUrl(p.imageUrl || p.images?.[0] || '');
    setIsEditModalOpen(true);
  };

  const handleUpdateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProductId) return;
    if (!editTitle.trim()) {
      alert('Product name is required');
      return;
    }
    if (!editPrice || Number(editPrice) <= 0) {
      alert('Valid price is required');
      return;
    }

    setIsSubmittingEdit(true);
    try {
      const finalImg = editImageUrl.trim() || 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=600&q=80';
      const payload = {
        title: editTitle.trim(),
        name: editTitle.trim(),
        price: Number(editPrice),
        category: editCategory,
        images: [finalImg],
        imageUrl: finalImg
      };

      await apiClient.put(API_ENDPOINTS.PRODUCTS.UPDATE(editingProductId), payload, {
        headers: { 'x-user-role': 'admin' }
      });

      setProducts(prev =>
        prev.map(item =>
          item.id === editingProductId
            ? { ...item, title: editTitle.trim(), price: Number(editPrice), category: editCategory, imageUrl: finalImg, images: [finalImg] }
            : item
        )
      );

      setNotification(`Product "${editTitle}" updated successfully.`);
      setTimeout(() => setNotification(null), 4000);
      setIsEditModalOpen(false);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to update product');
    } finally {
      setIsSubmittingEdit(false);
    }
  };

  const handleOpenDeleteModal = (p: AdminProduct) => {
    setProductToDelete(p);
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDeleteProduct = async () => {
    if (!productToDelete) return;
    setIsDeletingProduct(true);
    try {
      await apiClient.delete(API_ENDPOINTS.PRODUCTS.DELETE(productToDelete.id), {
        headers: { 'x-user-role': 'admin' }
      });
      setProducts(prev => prev.filter(item => item.id !== productToDelete.id));
      setNotification(`Product "${productToDelete.title}" deleted successfully.`);
      setTimeout(() => setNotification(null), 4000);
      setIsDeleteModalOpen(false);
      setProductToDelete(null);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to delete product');
    } finally {
      setIsDeletingProduct(false);
    }
  };

  // Fetch all products and dynamic categories from backend
  useEffect(() => {
    const fetchAdminData = async () => {
      // 1. Fetch products
      try {
        const res = await apiClient.get(`${API_ENDPOINTS.PRODUCTS.LIST}?limit=50&all=true`, {
          headers: { 'x-user-role': 'admin' }
        });
        if (res.data?.data) {
          const mapped = res.data.data.map((item: any) => ({
            id: String(item._id),
            title: item.title,
            category: item.category,
            subCategory: item.subCategory || 'Handcrafted Goods',
            price: item.price,
            discountPrice: item.discountPrice,
            stock: item.stock,
            vendorName: item.vendorName || 'Artisan Partner',
            vendor: typeof item.vendor === 'object' ? item.vendor?._id || item.vendor?.name : String(item.vendor || ''),
            status: item.status || 'approved',
            approvalStatus: (item.approvalStatus === 'inactive' || item.status === 'inactive') ? 'inactive' : (item.approvalStatus || (item.status === 'pending_approval' ? 'pending' : 'approved')),
            isActive: item.approvalStatus === 'approved' && item.status !== 'inactive',
            rejectionReason: item.rejectionReason || '',
            imageUrl: item.images?.[0] || 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=300&q=80',
            images: Array.isArray(item.images) && item.images.length > 0
              ? item.images
              : ['https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=300&q=80'],
            description: item.description || 'No description provided for this artisan product.',
            specifications: item.specifications || {},
            tierPricing: item.tierPricing || [],
            rating: item.rating || 4.8,
            numReviews: item.numReviews || 0,
            createdAt: item.createdAt
          }));
          setProducts(mapped);
        }
      } catch (_) { }

      // 2. Fetch dynamic categories
      try {
        const catRes = await apiClient.get(API_ENDPOINTS.CATEGORIES.LIST);
        if (catRes.data?.data && catRes.data.data.length > 0) {
          setCategories(catRes.data.data);
        }
      } catch (_) { }
    };

    fetchAdminData();
  }, []);

  const handleOpenDetails = (p: AdminProduct) => {
    setSelectedProduct(p);
    setActiveImageIndex(0);
    setIsDetailsModalOpen(true);
  };

  const handleApprove = async (p: AdminProduct) => {
    try {
      await apiClient.patch(API_ENDPOINTS.PRODUCTS.APPROVE(p.id), {}, {
        headers: { 'x-user-role': 'admin' }
      });
    } catch (_) { }

    setProducts(prev =>
      prev.map(item => item.id === p.id ? { ...item, approvalStatus: 'approved', rejectionReason: '' } : item)
    );
    if (selectedProduct?.id === p.id) {
      setSelectedProduct(prev => prev ? { ...prev, approvalStatus: 'approved', rejectionReason: '' } : null);
    }
    setNotification(`Product "${p.title.substring(0, 30)}..." approved and published to storefront.`);
    setTimeout(() => setNotification(null), 4000);
  };

  const handleOpenRejectModal = (p: AdminProduct) => {
    setProductToReject(p);
    setRejectionReasonInput('Information incomplete or image quality inadequate');
    setIsRejectModalOpen(true);
  };

  const handleConfirmReject = async () => {
    if (!productToReject) return;
    const p = productToReject;
    const reason = rejectionReasonInput.trim() || 'Failed quality guidelines';

    try {
      await apiClient.patch(
        API_ENDPOINTS.PRODUCTS.REJECT(p.id),
        { reason },
        { headers: { 'x-user-role': 'admin' } }
      );
    } catch (_) { }

    setProducts(prev =>
      prev.map(item => item.id === p.id ? { ...item, approvalStatus: 'rejected', rejectionReason: reason } : item)
    );
    if (selectedProduct?.id === p.id) {
      setSelectedProduct(prev => prev ? { ...prev, approvalStatus: 'rejected', rejectionReason: reason } : null);
    }
    setIsRejectModalOpen(false);
    setProductToReject(null);
    setNotification(`Product "${p.title.substring(0, 30)}..." marked as rejected.`);
    setTimeout(() => setNotification(null), 4000);
  };

  // Filter products
  const filteredProducts = products.filter((p) => {
    const isProdActive = p.approvalStatus === 'approved' && p.status !== 'inactive';
    const matchesTab =
      activeTab === 'all'
        ? true
        : activeTab === 'active'
          ? isProdActive
          : !isProdActive;
    const matchesSearch =
      p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.vendorName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory =
      selectedCategory === 'All' ? true : p.category === selectedCategory;

    return matchesTab && matchesSearch && matchesCategory;
  });

  const countActive = products.filter(p => p.approvalStatus === 'approved' && p.status !== 'inactive').length;
  const countInactive = products.filter(p => p.approvalStatus !== 'approved' || p.status === 'inactive').length;

  return (
    <div className="flex min-h-screen bg-zinc-50 text-zinc-900">
      <AdminSidebar />

      <div className="flex-1 flex flex-col min-w-0">
        <AdminHeader title="Platform Product Management" />

        <main className="flex-1 p-8 space-y-6">
          {notification && (
            <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-2xl flex items-center justify-between text-xs font-semibold shadow-xs">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>{notification}</span>
              </div>
              <button onClick={() => setNotification(null)}>✕</button>
            </div>
          )}

          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-zinc-900">All Products Directory</h1>
              <p className="text-xs text-zinc-500 mt-1">
                Complete catalog across all vendors. Set products Active or Inactive, edit details, and inspect storefront publication.
              </p>
            </div>
            <div className="flex items-center gap-2.5">
              <Button
                onClick={() => setIsAddModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-sm transition-all cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Add New Product</span>
              </Button>
              <a
                href="http://localhost:3000"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-2 bg-white border border-zinc-200 rounded-xl text-xs font-semibold text-zinc-700 hover:bg-zinc-100 transition-colors shadow-xs"
              >
                <ExternalLink className="w-3.5 h-3.5" /> View Storefront
              </a>
            </div>
          </div>

          {/* Filter Bar */}
          <Card className="bg-white p-4 space-y-4">
            {/* Status Tabs */}
            <div className="flex border-b border-zinc-100 overflow-x-auto gap-2">
              <button
                onClick={() => setActiveTab('all')}
                className={`pb-3 px-3 text-xs font-bold border-b-2 transition-all ${activeTab === 'all'
                  ? 'border-indigo-600 text-indigo-700'
                  : 'border-transparent text-zinc-500 hover:text-zinc-800'
                  }`}
              >
                All Products ({products.length})
              </button>
              <button
                onClick={() => setActiveTab('active')}
                className={`pb-3 px-3 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 ${activeTab === 'active'
                  ? 'border-emerald-600 text-emerald-700'
                  : 'border-transparent text-zinc-500 hover:text-zinc-800'
                  }`}
              >
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                Active ({countActive})
              </button>
              <button
                onClick={() => setActiveTab('inactive')}
                className={`pb-3 px-3 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 ${activeTab === 'inactive'
                  ? 'border-zinc-700 text-zinc-900'
                  : 'border-transparent text-zinc-500 hover:text-zinc-800'
                  }`}
              >
                <XCircle className="w-3.5 h-3.5 text-zinc-400" />
                Inactive ({countInactive})
              </button>
            </div>

            {/* Search and Common Select Filter */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
              <div className="relative sm:col-span-2">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
                <input
                  type="text"
                  placeholder="Search by product title or vendor name..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs bg-zinc-50 border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-zinc-800"
                />
              </div>

              {/* Common Select Component */}
              <Select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                options={[
                  { value: 'All', label: 'All Categories' },
                  ...categories.map(c => ({ value: c.name, label: c.name }))
                ]}
                focusRingColor="focus:ring-indigo-500"
                className="py-1.5 text-xs"
              />
            </div>
          </Card>

          {/* All Products Table */}
          <Card className="bg-white">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-zinc-200 text-xs font-semibold text-zinc-500">
                    <th className="pb-3">Product</th>
                    <th className="pb-3">Vendor</th>
                    <th className="pb-3">Category</th>
                    <th className="pb-3">Price</th>
                    <th className="pb-3">Status</th>
                    <th className="pb-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100">
                  {filteredProducts.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-10 text-center text-xs text-zinc-400">
                        No products found matching criteria.
                      </td>
                    </tr>
                  ) : (
                    filteredProducts.map((p) => (
                      <tr key={p.id} className="text-zinc-700 hover:bg-zinc-50/50">
                        <td className="py-3.5">
                          <div
                            onClick={() => handleOpenDetails(p)}
                            className="flex items-center gap-3 cursor-pointer group"
                            title="Click to view complete product details"
                          >
                            <img
                              src={p.imageUrl}
                              alt={p.title}
                              className="w-12 h-14 object-cover rounded-xl bg-zinc-100 border border-zinc-200 shrink-0 group-hover:scale-105 transition-transform"
                            />
                            <div className="max-w-xs">
                              <p className="font-semibold text-zinc-900 text-xs line-clamp-1 group-hover:text-indigo-600 transition-colors">
                                {p.title}
                              </p>
                              <p className="text-[10px] text-zinc-400 mt-0.5">ID: {p.id}</p>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 text-xs font-medium text-zinc-800">{p.vendorName}</td>
                        <td className="py-3 text-xs text-zinc-500">
                          <div>{p.category}</div>
                          {p.subCategory && (
                            <span className="text-[10px] text-zinc-400">{p.subCategory}</span>
                          )}
                        </td>
                        <td className="py-3 font-semibold text-zinc-900">₹{p.price.toLocaleString()}</td>
                        <td className="py-3">
                          {p.approvalStatus === 'approved' && p.status !== 'inactive' ? (
                            <button
                              onClick={() => handleToggleProductStatus(p)}
                              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 hover:border-emerald-300 transition-all cursor-pointer shadow-2xs group"
                              title="Active on Storefront. Click to set Inactive"
                            >
                              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                              <span>Active</span>
                            </button>
                          ) : (
                            <button
                              onClick={() => handleToggleProductStatus(p)}
                              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-zinc-100 text-zinc-600 border border-zinc-200 hover:bg-zinc-200/80 hover:border-zinc-300 transition-all cursor-pointer shadow-2xs group"
                              title="Inactive / Hidden. Click to set Active"
                            >
                              <span className="w-2 h-2 rounded-full bg-zinc-400" />
                              <span>Inactive</span>
                            </button>
                          )}
                        </td>
                        <td className="py-3 text-right">
                          <div className="inline-flex items-center gap-1.5 justify-end">
                            {/* 1. Edit Button */}
                            <button
                              onClick={() => handleOpenEdit(p)}
                              className="inline-flex items-center gap-1.5 h-8 px-3 text-xs border border-indigo-200 bg-indigo-50/60 text-indigo-700 hover:bg-indigo-100 rounded-xl font-bold transition-all shadow-2xs active:scale-[0.98] cursor-pointer"
                              title="Edit Product (Image, Name, Price)"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                          
                            </button>

                            {/* 2. View Button */}
                            <button
                              onClick={() => handleOpenDetails(p)}
                              className="inline-flex items-center gap-1.5 h-8 px-3 text-xs border border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50 hover:border-zinc-300 rounded-xl font-bold transition-all shadow-2xs active:scale-[0.98] cursor-pointer"
                              title="View Product Details"
                            >
                              <Eye className="w-3.5 h-3.5 text-zinc-500" />
                      
                            </button>

                            {/* 3. Delete Button */}
                            <button
                              onClick={() => handleOpenDeleteModal(p)}
                              className="inline-flex items-center gap-1.5 h-8 px-3 text-xs border border-rose-200 bg-rose-50/60 text-rose-700 hover:bg-rose-100 rounded-xl font-bold transition-all shadow-2xs active:scale-[0.98] cursor-pointer"
                              title="Delete Product"
                            >
                              <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                          
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </main>
      </div>

      {/* ======================================================== */}
      {/* PRODUCT DETAILS INSPECTION MODAL (PURE LIGHT MODE)      */}
      {/* ======================================================== */}
      {selectedProduct && (
        <Modal
          isOpen={isDetailsModalOpen}
          onClose={() => setIsDetailsModalOpen(false)}
          title="Product Inspection & Verification"
          maxWidth="max-w-3xl"
          footer={
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center gap-2">
                <span className="text-xs text-zinc-500">Storefront Status:</span>
                {selectedProduct.approvalStatus === 'approved' && (
                  <Badge variant="success" dot size="sm">Live on Storefront</Badge>
                )}
                {selectedProduct.approvalStatus === 'pending' && (
                  <Badge variant="warning" dot size="sm">Pending Review</Badge>
                )}
                {selectedProduct.approvalStatus === 'rejected' && (
                  <Badge variant="danger" dot size="sm">Rejected</Badge>
                )}
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsDetailsModalOpen(false)}
                >
                  Close
                </Button>

                {selectedProduct.approvalStatus === 'pending' && (
                  <>
                    <button
                      onClick={() => {
                        handleOpenRejectModal(selectedProduct);
                      }}
                      className="h-10 px-4 text-xs font-semibold border border-rose-200 bg-white text-rose-700 hover:bg-rose-50 hover:border-rose-300 rounded-xl transition-all shadow-2xs active:scale-[0.98]"
                    >
                      Reject Submission
                    </button>
                    <button
                      onClick={() => handleApprove(selectedProduct)}
                      className="h-10 px-4 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-xs hover:shadow-emerald-600/25 transition-all flex items-center gap-1.5 active:scale-[0.98]"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      Approve & Publish to Storefront
                    </button>
                  </>
                )}

                {selectedProduct.approvalStatus === 'approved' && (
                  <>
                    <button
                      onClick={() => handleOpenRejectModal(selectedProduct)}
                      className="h-10 px-4 text-xs font-semibold border border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50 hover:border-zinc-300 rounded-xl transition-all shadow-2xs active:scale-[0.98]"
                    >
                      Revoke Approval
                    </button>
                    <a
                      href={`http://localhost:3001/product/${selectedProduct.id}`}
                      target="_blank"
                      rel="noreferrer"
                      className="h-10 px-4 text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-xs hover:shadow-indigo-600/25 transition-all inline-flex items-center gap-1.5 active:scale-[0.98]"
                    >
                      <ExternalLink className="w-4 h-4" />
                      View on Storefront
                    </a>
                  </>
                )}

                {selectedProduct.approvalStatus === 'rejected' && (
                  <button
                    onClick={() => handleApprove(selectedProduct)}
                    className="h-10 px-4 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-xs hover:shadow-emerald-600/25 transition-all flex items-center gap-1.5 active:scale-[0.98]"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    Re-approve Product
                  </button>
                )}
              </div>
            </div>
          }
        >
          <div className="space-y-6">
            {/* Top Grid: Gallery on left, Pricing & Details on right */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Product Gallery */}
              <div className="space-y-3">
                <div className="aspect-4/3 w-full rounded-2xl overflow-hidden bg-zinc-100 border border-zinc-200 flex items-center justify-center relative shadow-xs">
                  <img
                    src={selectedProduct.images?.[activeImageIndex] || selectedProduct.imageUrl}
                    alt={selectedProduct.title}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-2.5 left-2.5 bg-black/60 text-white text-[10px] font-semibold px-2 py-0.5 rounded-full backdrop-blur-xs">
                    Image {activeImageIndex + 1} of {selectedProduct.images?.length || 1}
                  </div>
                </div>

                {/* Thumbnail strip if multiple images */}
                {selectedProduct.images && selectedProduct.images.length > 1 && (
                  <div className="flex gap-2 overflow-x-auto pb-1">
                    {selectedProduct.images.map((img, idx) => (
                      <button
                        key={idx}
                        onClick={() => setActiveImageIndex(idx)}
                        className={`w-14 h-14 rounded-xl overflow-hidden border-2 shrink-0 transition-all ${activeImageIndex === idx
                          ? 'border-indigo-600 ring-2 ring-indigo-500/20'
                          : 'border-zinc-200 opacity-60 hover:opacity-100'
                          }`}
                      >
                        <img src={img} alt={`Thumb ${idx}`} className="w-full h-full object-cover" />
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Core Information Panel */}
              <div className="space-y-4">
                <div>
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-zinc-100 text-zinc-600">
                      {selectedProduct.category}
                    </span>
                    {selectedProduct.subCategory && (
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700">
                        {selectedProduct.subCategory}
                      </span>
                    )}
                  </div>
                  <h2 className="text-lg font-bold text-zinc-900 leading-snug">
                    {selectedProduct.title}
                  </h2>
                  <p className="text-[11px] font-mono text-zinc-400 mt-1">
                    Product ID: {selectedProduct.id}
                  </p>
                </div>

                {/* Key Metrics Grid */}
                <div className="grid grid-cols-2 gap-2.5 p-3.5 bg-zinc-50 border border-zinc-200/80 rounded-2xl">
                  <div>
                    <span className="text-[10px] text-zinc-500 font-medium">Selling Price</span>
                    <div className="flex items-baseline gap-1.5 mt-0.5">
                      <span className="text-base font-bold text-zinc-900">
                        ₹{selectedProduct.price.toLocaleString()}
                      </span>
                      {selectedProduct.discountPrice && selectedProduct.discountPrice > selectedProduct.price && (
                        <span className="text-xs text-zinc-400 line-through">
                          ₹{selectedProduct.discountPrice.toLocaleString()}
                        </span>
                      )}
                    </div>
                  </div>

                  <div>
                    <span className="text-[10px] text-zinc-500 font-medium">Inventory Stock</span>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <Boxes className="w-3.5 h-3.5 text-zinc-400" />
                      <span className="text-sm font-bold text-zinc-800">
                        {selectedProduct.stock} units
                      </span>
                    </div>
                  </div>

                  <div>
                    <span className="text-[10px] text-zinc-500 font-medium">Artisan / Vendor</span>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <Store className="w-3.5 h-3.5 text-indigo-500" />
                      <span className="text-xs font-semibold text-zinc-800 truncate">
                        {selectedProduct.vendorName}
                      </span>
                    </div>
                  </div>

                  <div>
                    <span className="text-[10px] text-zinc-500 font-medium">Artisan Quality</span>
                    <div className="flex items-center gap-1 mt-0.5">
                      <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                      <span className="text-xs font-bold text-zinc-800">
                        {selectedProduct.rating?.toFixed(1) || '5.0'} / 5.0
                      </span>
                    </div>
                  </div>
                </div>

                {/* Rejection Alert if applicable */}
                {selectedProduct.approvalStatus === 'rejected' && selectedProduct.rejectionReason && (
                  <div className="p-3 bg-rose-50 border border-rose-200 rounded-2xl flex items-start gap-2.5 text-xs text-rose-900">
                    <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold text-rose-800">Rejection Notice</p>
                      <p className="text-rose-700 text-[11px] mt-0.5">{selectedProduct.rejectionReason}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>



            {/* Specifications if present */}
            {selectedProduct.specifications && Object.keys(selectedProduct.specifications).length > 0 && (
              <div className="space-y-2 pt-2 border-t border-zinc-100">
                <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-500 flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-zinc-400" />
                  Product Specifications & Attributes
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                  {Object.entries(selectedProduct.specifications).map(([key, value]) => (
                    <div key={key} className="p-2.5 bg-zinc-50 rounded-xl border border-zinc-200 text-xs">
                      <span className="text-[10px] font-medium text-zinc-400 uppercase tracking-wider block">
                        {key}
                      </span>
                      <span className="font-semibold text-zinc-800 mt-0.5 block truncate">
                        {String(value)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Tiered Bulk Pricing if available */}
            {selectedProduct.tierPricing && selectedProduct.tierPricing.length > 0 && (
              <div className="space-y-2 pt-2 border-t border-zinc-100">
                <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-500 flex items-center gap-1.5">
                  <DollarSign className="w-3.5 h-3.5 text-zinc-400" />
                  Wholesale & Bulk Tier Pricing
                </h3>
                <div className="overflow-hidden border border-zinc-200 rounded-xl">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-zinc-50 border-b border-zinc-200 text-zinc-500">
                      <tr>
                        <th className="py-2 px-3">Order Quantity Tier</th>
                        <th className="py-2 px-3 text-right">Unit Price</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-100">
                      {selectedProduct.tierPricing.map((tier, idx) => (
                        <tr key={idx} className="hover:bg-zinc-50/50">
                          <td className="py-2 px-3 font-medium text-zinc-700">
                            {tier.minQty} {tier.maxQty ? `to ${tier.maxQty} units` : '+ units'}
                          </td>
                          <td className="py-2 px-3 text-right font-bold text-zinc-900">
                            ₹{tier.price.toLocaleString()} / unit
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </Modal>
      )}

      {/* ======================================================== */}
      {/* REJECTION REASON CONFIRMATION MODAL                      */}
      {/* ======================================================== */}
      <Modal
        isOpen={isRejectModalOpen}
        onClose={() => setIsRejectModalOpen(false)}
        title="Reject Product Submission"
        maxWidth="max-w-md"
        footer={
          <>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsRejectModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              size="sm"
              onClick={handleConfirmReject}
              className="bg-rose-600 hover:bg-rose-700 text-white"
            >
              Confirm Rejection
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <p className="text-xs text-zinc-600">
            Please provide a constructive feedback reason for vendor{' '}
            <strong className="text-zinc-900">{productToReject?.vendorName}</strong> regarding why{' '}
            <strong className="text-zinc-900">&quot;{productToReject?.title}&quot;</strong> is being rejected or revoked.
          </p>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-zinc-700">Rejection Reason</label>
            <textarea
              value={rejectionReasonInput}
              onChange={(e) => setRejectionReasonInput(e.target.value)}
              rows={3}
              placeholder="e.g. Image resolution is low, description lacks material composition..."
              className="w-full p-3 text-xs bg-zinc-50 border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500 text-zinc-800"
            />
          </div>
        </div>
      </Modal>

      {/* ======================================================== */}
      {/* ADD NEW PRODUCT MODAL (IMAGE, NAME, PRICE)               */}
      {/* ======================================================== */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Add New Product"
        maxWidth="max-w-lg"
        footer={
          <>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsAddModalOpen(false)}
              disabled={isSubmittingNewProduct}
            >
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleCreateProduct}
              disabled={isSubmittingNewProduct || !newTitle.trim() || !newPrice}
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold cursor-pointer"
            >
              {isSubmittingNewProduct ? 'Adding Product...' : 'Add Product'}
            </Button>
          </>
        }
      >
        <form onSubmit={handleCreateProduct} className="space-y-4">
          {/* Image Upload Area */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-zinc-800 uppercase tracking-wider">
                Product Image <span className="text-rose-500">*</span>
              </label>
              {newImageUrl && (
                <button
                  type="button"
                  onClick={() => setNewImageUrl('')}
                  className="text-[11px] text-rose-600 hover:text-rose-800 font-semibold cursor-pointer"
                >
                  Remove Image
                </button>
              )}
            </div>

            {!newImageUrl ? (
              <label className="border-2 border-dashed border-zinc-300 hover:border-indigo-500 rounded-2xl p-6 text-center cursor-pointer transition-all bg-zinc-50/70 hover:bg-indigo-50/20 flex flex-col items-center justify-center gap-2 group">
                <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center group-hover:scale-105 transition-transform border border-indigo-100/60 shadow-2xs">
                  <Upload className="w-5 h-5 text-indigo-600" />
                </div>
                <div>
                  <p className="text-xs font-bold text-zinc-800 group-hover:text-indigo-600 transition-colors">
                    Click to browse and upload product photo
                  </p>
                  <p className="text-[11px] text-zinc-400 mt-0.5">
                    Supports high-resolution PNG, JPG, or WEBP
                  </p>
                </div>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageFileUpload}
                  className="hidden"
                />
              </label>
            ) : (
              <div className="relative rounded-2xl overflow-hidden border border-zinc-200 bg-zinc-100 flex items-center justify-center group h-48 shadow-xs">
                <img src={newImageUrl} alt="Product Preview" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                  <label className="px-3 py-1.5 bg-white text-zinc-800 rounded-xl text-xs font-bold shadow-md cursor-pointer hover:bg-zinc-100 transition-colors flex items-center gap-1.5">
                    <Upload className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Change Image</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageFileUpload}
                      className="hidden"
                    />
                  </label>
                  <button
                    type="button"
                    onClick={() => setNewImageUrl('')}
                    className="px-3 py-1.5 bg-rose-600 text-white rounded-xl text-xs font-bold shadow-md hover:bg-rose-700 transition-colors cursor-pointer"
                  >
                    Remove
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Name */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-zinc-800 uppercase tracking-wider">
              Product Name <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Pure Banarasi Silk Saree, Handcrafted Silver Necklace"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              className="w-full px-3 py-2.5 text-xs bg-zinc-50 border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
            />
          </div>

          {/* Price */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-zinc-800 uppercase tracking-wider">
              Product Price (₹ INR) <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <DollarSign className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="number"
                required
                min="1"
                placeholder="e.g. 4500"
                value={newPrice}
                onChange={(e) => setNewPrice(e.target.value)}
                className="w-full pl-9 pr-3 py-2.5 text-xs bg-zinc-50 border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 font-bold text-zinc-900"
              />
            </div>
          </div>

          {/* Category */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-zinc-800 uppercase tracking-wider">
              Category
            </label>
            <select
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-zinc-50 border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium cursor-pointer"
            >
              <option value="Fashion & Apparel">Fashion & Apparel</option>
              <option value="Jewelry & Silverware">Jewelry & Silverware</option>
              <option value="Home Decor & Crafts">Home Decor & Crafts</option>
              <option value="Other Custom Craft">Other Custom Craft</option>
            </select>
          </div>
        </form>
      </Modal>

      {/* ======================================================== */}
      {/* EDIT PRODUCT MODAL (IMAGE, NAME, PRICE)                 */}
      {/* ======================================================== */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="Edit Product (Image, Name, Price)"
        maxWidth="max-w-lg"
        footer={
          <>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsEditModalOpen(false)}
              disabled={isSubmittingEdit}
            >
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleUpdateProduct}
              disabled={isSubmittingEdit || !editTitle.trim() || !editPrice}
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold cursor-pointer"
            >
              {isSubmittingEdit ? 'Saving Changes...' : 'Save & Update Product'}
            </Button>
          </>
        }
      >
        <form onSubmit={handleUpdateProduct} className="space-y-4">
          {/* Image Upload Area */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-zinc-800 uppercase tracking-wider">
                Product Image <span className="text-rose-500">*</span>
              </label>
              {editImageUrl && (
                <button
                  type="button"
                  onClick={() => setEditImageUrl('')}
                  className="text-[11px] text-rose-600 hover:text-rose-800 font-semibold cursor-pointer"
                >
                  Remove Image
                </button>
              )}
            </div>

            {!editImageUrl ? (
              <label className="border-2 border-dashed border-zinc-300 hover:border-indigo-500 rounded-2xl p-6 text-center cursor-pointer transition-all bg-zinc-50/70 hover:bg-indigo-50/20 flex flex-col items-center justify-center gap-2 group">
                <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center group-hover:scale-105 transition-transform border border-indigo-100/60 shadow-2xs">
                  <Upload className="w-5 h-5 text-indigo-600" />
                </div>
                <div>
                  <p className="text-xs font-bold text-zinc-800 group-hover:text-indigo-600 transition-colors">
                    Click to browse and upload product photo
                  </p>
                  <p className="text-[11px] text-zinc-400 mt-0.5">
                    Supports high-resolution PNG, JPG, or WEBP
                  </p>
                </div>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleEditImageUpload}
                  className="hidden"
                />
              </label>
            ) : (
              <div className="relative rounded-2xl overflow-hidden border border-zinc-200 bg-zinc-100 flex items-center justify-center group h-48 shadow-xs">
                <img src={editImageUrl} alt="Edit Preview" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                  <label className="px-3 py-1.5 bg-white text-zinc-800 rounded-xl text-xs font-bold shadow-md cursor-pointer hover:bg-zinc-100 transition-colors flex items-center gap-1.5">
                    <Upload className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Change Image</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleEditImageUpload}
                      className="hidden"
                    />
                  </label>
                  <button
                    type="button"
                    onClick={() => setEditImageUrl('')}
                    className="px-3 py-1.5 bg-rose-600 text-white rounded-xl text-xs font-bold shadow-md hover:bg-rose-700 transition-colors cursor-pointer"
                  >
                    Remove
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Name */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-zinc-800 uppercase tracking-wider">
              Product Name <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Pure Banarasi Silk Saree"
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              className="w-full px-3 py-2.5 text-xs bg-zinc-50 border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
            />
          </div>

          {/* Price */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-zinc-800 uppercase tracking-wider">
              Product Price (₹ INR) <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <DollarSign className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="number"
                required
                min="1"
                placeholder="e.g. 4500"
                value={editPrice}
                onChange={(e) => setEditPrice(e.target.value)}
                className="w-full pl-9 pr-3 py-2.5 text-xs bg-zinc-50 border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 font-bold text-zinc-900"
              />
            </div>
          </div>

          {/* Category */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-zinc-800 uppercase tracking-wider">
              Category
            </label>
            <select
              value={editCategory}
              onChange={(e) => setEditCategory(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-zinc-50 border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium cursor-pointer"
            >
              <option value="Fashion & Apparel">Fashion & Apparel</option>
              <option value="Jewelry & Silverware">Jewelry & Silverware</option>
              <option value="Home Decor & Crafts">Home Decor & Crafts</option>
              <option value="Other Custom Craft">Other Custom Craft</option>
            </select>
          </div>
        </form>
      </Modal>

      {/* ======================================================== */}
      {/* COMMON DELETE CONFIRMATION MODAL                         */}
      {/* ======================================================== */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => !isDeletingProduct && setIsDeleteModalOpen(false)}
        title="Delete Product Confirmation"
        maxWidth="max-w-md"
        footer={
          <div className="flex items-center justify-end gap-2.5 w-full">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsDeleteModalOpen(false)}
              disabled={isDeletingProduct}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              size="sm"
              onClick={handleConfirmDeleteProduct}
              disabled={isDeletingProduct}
              className="bg-rose-600 hover:bg-rose-700 text-white font-bold flex items-center gap-1.5 cursor-pointer shadow-sm"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>{isDeletingProduct ? 'Deleting...' : 'Yes, Delete Product'}</span>
            </Button>
          </div>
        }
      >
        {productToDelete && (
          <div className="space-y-4 text-center py-2">
            <div className="w-14 h-14 rounded-2xl bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center mx-auto shadow-2xs">
              <Trash2 className="w-7 h-7 text-rose-600" />
            </div>

            <div>
              <h3 className="text-base font-bold text-zinc-900">
                Delete &quot;{productToDelete.title}&quot;?
              </h3>
              <p className="text-xs text-zinc-500 mt-1 max-w-sm mx-auto leading-relaxed">
                Are you sure you want to delete this product? This action cannot be undone and will permanently remove it from both the admin catalog and the customer storefront.
              </p>
            </div>

            {/* Product Summary Preview */}
            {/* <div className="p-3 bg-zinc-50 border border-zinc-200/80 rounded-2xl flex items-center gap-3 text-left">
              <img
                src={productToDelete.imageUrl}
                alt={productToDelete.title}
                className="w-12 h-12 rounded-xl object-cover border border-zinc-200 shrink-0 bg-white"
              />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-zinc-900 truncate">
                  {productToDelete.title}
                </p>
                <p className="text-xs font-bold text-emerald-700 mt-0.5">
                  ₹{productToDelete.price.toLocaleString()} INR
                </p>
                <span className="text-[10px] text-zinc-400">
                  Category: {productToDelete.category}
                </span>
              </div>
            </div> */}
          </div>
        )}
      </Modal>
    </div>
  );
}

