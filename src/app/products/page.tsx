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
  Edit3,
  X,
  LayoutGrid,
  Scissors,
  Crown,
  Armchair,
  Wand2,
  RefreshCw,
  ShoppingBag,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  ChevronDown
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
  companyName?: string;
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

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalProducts, setTotalProducts] = useState(0);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [backendStats, setBackendStats] = useState<{
    total: number;
    active: number;
    inactive: number;
  } | null>(null);
  const [backendCompanies, setBackendCompanies] = useState<string[]>([]);

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

  // Custom companies dynamically added by user
  const [customCompanies, setCustomCompanies] = useState<string[]>([]);

  // Add Product Modal States
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newPrice, setNewPrice] = useState('');
  const [newCompanyName, setNewCompanyName] = useState('');
  const [isAddingCompanyInAdd, setIsAddingCompanyInAdd] = useState(false);
  const [companyInputAdd, setCompanyInputAdd] = useState('');
  const [newCategory, setNewCategory] = useState('Fashion & Apparel');
  const [newImageUrl, setNewImageUrl] = useState('');
  const [isSubmittingNewProduct, setIsSubmittingNewProduct] = useState(false);

  // Edit Product Modal States
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editPrice, setEditPrice] = useState('');
  const [editCompanyName, setEditCompanyName] = useState('');
  const [isAddingCompanyInEdit, setIsAddingCompanyInEdit] = useState(false);
  const [companyInputEdit, setCompanyInputEdit] = useState('');
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
    const finalCompany = newCompanyName.trim();

    setIsSubmittingNewProduct(true);
    try {
      const payload = {
        title: newTitle.trim(),
        name: newTitle.trim(),
        price: Number(newPrice),
        category: newCategory,
        companyName: finalCompany,
        vendorName: finalCompany,
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
          vendorName: created.companyName || created.vendorName || finalCompany,
          companyName: created.companyName || created.vendorName || finalCompany,
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
        fetchAdminData();
      }
      setIsAddModalOpen(false);
      setNewTitle('');
      setNewPrice('');
      setNewCompanyName('');
      setIsAddingCompanyInAdd(false);
      setCompanyInputAdd('');
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
    setEditCompanyName(p.companyName || p.vendorName || '');
    setIsAddingCompanyInEdit(false);
    setCompanyInputEdit('');
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
      const finalCompany = editCompanyName.trim();
      const payload = {
        title: editTitle.trim(),
        name: editTitle.trim(),
        price: Number(editPrice),
        category: editCategory,
        companyName: finalCompany,
        vendorName: finalCompany,
        images: [finalImg],
        imageUrl: finalImg
      };

      await apiClient.put(API_ENDPOINTS.PRODUCTS.UPDATE(editingProductId), payload, {
        headers: { 'x-user-role': 'admin' }
      });

      setProducts(prev =>
        prev.map(item =>
          item.id === editingProductId
            ? {
                ...item,
                title: editTitle.trim(),
                price: Number(editPrice),
                category: editCategory,
                companyName: finalCompany,
                vendorName: finalCompany,
                imageUrl: finalImg,
                images: [finalImg]
              }
            : item
        )
      );

      setNotification(`Product "${editTitle}" updated successfully.`);
      setTimeout(() => setNotification(null), 4000);
      setIsEditModalOpen(false);
      setIsAddingCompanyInEdit(false);
      setCompanyInputEdit('');
      fetchAdminData();
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
      fetchAdminData();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to delete product');
    } finally {
      setIsDeletingProduct(false);
    }
  };

  // Fetch all products and dynamic categories from backend
  const [loading, setLoading] = useState(false);

  const fetchAdminData = async (targetPage?: number, targetLimit?: number) => {
    setLoading(true);
    const p = targetPage !== undefined ? targetPage : currentPage;
    const l = targetLimit !== undefined ? targetLimit : itemsPerPage;
    // 1. Fetch products
    try {
      const queryParams = new URLSearchParams();
      queryParams.set('page', String(p));
      queryParams.set('limit', String(l));
      queryParams.set('all', 'true');
      if (activeTab !== 'all') {
        queryParams.set('status', activeTab);
      }
      if (selectedCategory !== 'All') {
        queryParams.set('category', selectedCategory);
      }
      if (searchQuery.trim()) {
        queryParams.set('search', searchQuery.trim());
      }

      const res = await apiClient.get(`${API_ENDPOINTS.PRODUCTS.LIST}?${queryParams.toString()}`, {
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
          vendorName: item.companyName || item.vendorName || 'Amba Lifestyle Direct',
          companyName: item.companyName || item.vendorName || 'Amba Lifestyle Direct',
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
      if (res.data?.companies) {
        setBackendCompanies(res.data.companies);
      }
      if (res.data?.pagination) {
        setTotalPages(res.data.pagination.totalPages || 1);
        setTotalProducts(res.data.pagination.total || 0);
        setCurrentPage(res.data.pagination.page || 1);
      }
      if (res.data?.stats) {
        setBackendStats(res.data.stats);
      }
    } catch (_) { }

    // 2. Fetch dynamic categories
    try {
      const catRes = await apiClient.get(API_ENDPOINTS.CATEGORIES.LIST);
      if (catRes.data?.data && catRes.data.data.length > 0) {
        setCategories(catRes.data.data);
      }
    } catch (_) { } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminData(1);
  }, [activeTab, selectedCategory, itemsPerPage]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchAdminData(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handlePageChange = (newPage: number) => {
    if (newPage < 1 || newPage > totalPages || newPage === currentPage) return;
    setCurrentPage(newPage);
    fetchAdminData(newPage);
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

  // Distinct categories dynamically from products and category list
  const knownCategories = ['Fashion & Apparel', 'Jewelry & Silverware', 'Home Decor & Crafts', 'Other Custom Craft'];
  const dynamicCategoryNames = Array.from(
    new Set([
      ...knownCategories,
      ...categories.map(c => c.name),
      ...products.map(p => p.category).filter(Boolean)
    ])
  );

  // Distinct companies dynamically from backend, user additions, and existing products
  const companyNames = Array.from(
    new Set([
      ...(backendCompanies || []),
      ...customCompanies,
      ...products.map(p => (p.companyName || p.vendorName || '').trim()).filter(Boolean),
      ...(newCompanyName ? [newCompanyName.trim()] : []),
      ...(editCompanyName ? [editCompanyName.trim()] : [])
    ])
  ).filter(Boolean);

  // Filter products: backend already handles search, category, status and returns the current page
  const filteredProducts = products;

  const countTotal = backendStats ? backendStats.total : totalProducts;
  const countActive = backendStats ? backendStats.active : products.filter(p => p.approvalStatus === 'approved' && p.status !== 'inactive').length;
  const countInactive = backendStats ? backendStats.inactive : products.filter(p => p.approvalStatus !== 'approved' || p.status === 'inactive').length;

  const getCategoryCount = (catName: string) => {
    if (catName === 'All') return countTotal;
    return products.filter(p => p.category === catName).length;
  };

  const getCategoryBadge = (category?: string) => {
    const cat = (category || '').toLowerCase();
    if (cat.includes('fashion') || cat.includes('apparel')) {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-pink-50 text-pink-700 border border-pink-200 shadow-2xs">
          <Scissors className="w-3 h-3 text-pink-600 stroke-[2.2]" /> {category || 'Fashion'}
        </span>
      );
    }
    if (cat.includes('jewel') || cat.includes('silver')) {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200 shadow-2xs">
          <Crown className="w-3 h-3 text-amber-600 stroke-[2.2]" /> {category || 'Jewelry'}
        </span>
      );
    }
    if (cat.includes('decor') || cat.includes('home')) {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 shadow-2xs">
          <Armchair className="w-3 h-3 text-emerald-600 stroke-[2.2]" /> {category || 'Home Decor'}
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-purple-50 text-purple-800 border border-purple-200 shadow-2xs">
        <Wand2 className="w-3 h-3 text-purple-600 stroke-[2.2]" /> {category || 'Craft'}
      </span>
    );
  };

  return (
    <div className="flex min-h-screen bg-slate-50 text-slate-900 font-sans antialiased">
      <AdminSidebar />

      <div className="flex-1 flex flex-col min-w-0">
        <AdminHeader title="Platform Product Management" />

        <main className="flex-1 p-6 lg:p-8 space-y-6 w-full">
          {/* Header Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                  All Products Directory
                </h1>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Catalog Live
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-500 mt-1">
                Complete catalog across all vendors. Set products Active or Inactive, edit details, and inspect storefront publication.
              </p>
            </div>

            <div className="flex items-center gap-2.5 flex-wrap sm:flex-nowrap">
              <button
                type="button"
                onClick={() => fetchAdminData()}
                className="px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-xs font-bold rounded-xl transition-all flex items-center gap-2 cursor-pointer shadow-2xs"
                title="Refresh products list"
              >
                <RefreshCw className={`w-3.5 h-3.5 text-slate-500 ${loading ? 'animate-spin' : ''}`} />
                <span>Refresh</span>
              </button>

              <a
                href="http://localhost:3000"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-50 transition-all shadow-2xs"
              >
                <ExternalLink className="w-3.5 h-3.5 text-slate-500" />
                <span>View Storefront</span>
              </a>

              <Button
                onClick={() => setIsAddModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-xs shadow-indigo-600/20 transition-all cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Add New Product</span>
              </Button>
            </div>
          </div>

          {/* Notifications */}
          {notification && (
            <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-2xl flex items-center justify-between text-xs font-semibold shadow-xs">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>{notification}</span>
              </div>
              <button onClick={() => setNotification(null)} className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* SLEEK 4 STAT TILES */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
            {/* Tile 1: Total Products */}
            <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-xs hover:border-slate-300 transition-all flex items-center justify-between">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0 border border-indigo-100/60">
                  <Package className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider truncate">Total Products</p>
                  <h3 className="text-2xl font-black text-slate-900 leading-tight mt-0.5">{countTotal}</h3>
                </div>
              </div>
              <span className="text-[10px] font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-100 shrink-0">
                In Catalog
              </span>
            </div>

            {/* Tile 2: Active Storefront */}
            <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-xs hover:border-slate-300 transition-all flex items-center justify-between">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 border border-emerald-100/60">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <p className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider truncate">Active Storefront</p>
                  <h3 className="text-2xl font-black text-emerald-700 leading-tight mt-0.5">{countActive}</h3>
                </div>
              </div>
              <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200 shrink-0">
                Live Now
              </span>
            </div>

            {/* Tile 3: Inactive / Hidden */}
            <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-xs hover:border-slate-300 transition-all flex items-center justify-between">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center shrink-0 border border-slate-200/60">
                  <XCircle className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <p className="text-[11px] font-bold text-slate-600 uppercase tracking-wider truncate">Inactive / Hidden</p>
                  <h3 className="text-2xl font-black text-slate-700 leading-tight mt-0.5">{countInactive}</h3>
                </div>
              </div>
              <span className="text-[10px] font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200 shrink-0">
                Catalog Draft
              </span>
            </div>

            {/* Tile 4: Active Categories */}
            <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-xs hover:border-slate-300 transition-all flex items-center justify-between">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0 border border-purple-100/60">
                  <Layers className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <p className="text-[11px] font-bold text-purple-700 uppercase tracking-wider truncate">Categories</p>
                  <h3 className="text-2xl font-black text-purple-700 leading-tight mt-0.5">{dynamicCategoryNames.length}</h3>
                </div>
              </div>
              <span className="text-[10px] font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-md border border-purple-200 shrink-0">
                Active Segments
              </span>
            </div>
          </div>

          {/* MAIN PRODUCTS CONTAINER WITH PROFESSIONAL CONTROL CENTER */}
          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
            {/* ONE-LINE CONTROL CENTER: STATUS PILLS, SEARCH INPUT, & CATEGORY DROPDOWN */}
            <div className="p-3.5 border-b border-slate-200/80 bg-slate-50/60 flex flex-row items-center justify-between gap-3 overflow-x-auto flex-nowrap">
              {/* Segmented Status Pill Control */}
              <div className="inline-flex items-center p-1 bg-slate-200/70 rounded-xl gap-1 shrink-0">
                <button
                  type="button"
                  onClick={() => setActiveTab('all')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer whitespace-nowrap ${
                    activeTab === 'all'
                      ? 'bg-white text-slate-900 shadow-xs font-black ring-1 ring-black/5'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-white/40'
                  }`}
                >
                  <Package className="w-3.5 h-3.5 text-indigo-600" />
                  <span>All Products</span>
                  <span className={`text-[10px] font-black px-1.5 py-0.2 rounded-md ${
                    activeTab === 'all' ? 'bg-indigo-50 text-indigo-700' : 'bg-slate-300/60 text-slate-600'
                  }`}>
                    {countTotal}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('active')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer whitespace-nowrap ${
                    activeTab === 'active'
                      ? 'bg-white text-emerald-950 shadow-xs font-black ring-1 ring-black/5'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-white/40'
                  }`}
                >
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Active</span>
                  <span className={`text-[10px] font-black px-1.5 py-0.2 rounded-md ${
                    activeTab === 'active' ? 'bg-emerald-100 text-emerald-900' : 'bg-slate-300/60 text-slate-600'
                  }`}>
                    {countActive}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('inactive')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer whitespace-nowrap ${
                    activeTab === 'inactive'
                      ? 'bg-white text-slate-900 shadow-xs font-black ring-1 ring-black/5'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-white/40'
                  }`}
                >
                  <XCircle className="w-3.5 h-3.5 text-slate-500" />
                  <span>Inactive</span>
                  <span className={`text-[10px] font-black px-1.5 py-0.2 rounded-md ${
                    activeTab === 'inactive' ? 'bg-slate-200 text-slate-800' : 'bg-slate-300/60 text-slate-600'
                  }`}>
                    {countInactive}
                  </span>
                </button>
              </div>

              {/* Right Side: Search Bar & Category Dropdown */}
              <div className="flex items-center gap-2.5 flex-1 max-w-xl justify-end min-w-0">
                {/* Search Bar with clear button */}
                <div className="relative flex-1 min-w-[180px]">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Search by title, vendor, or ID..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-7 py-2 text-xs bg-white border border-slate-200/90 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 shadow-2xs font-medium text-slate-800 placeholder:text-slate-400 transition-all"
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

                {/* Category Dropdown */}
                <div className="relative shrink-0 w-44 sm:w-48">
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="w-full h-9 pl-3 pr-8 text-xs font-semibold bg-white border border-slate-200/90 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 shadow-2xs text-slate-800 cursor-pointer appearance-none truncate"
                  >
                    <option value="All">All Categories ({countTotal})</option>
                    {dynamicCategoryNames.map((catName) => (
                      <option key={catName} value={catName}>
                        {catName} ({getCategoryCount(catName)})
                      </option>
                    ))}
                  </select>
                  <Filter className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>

                {/* Reset Filters button */}
                {(selectedCategory !== 'All' || searchQuery !== '' || activeTab !== 'all') && (
                  <button
                    onClick={() => {
                      setSelectedCategory('All');
                      setSearchQuery('');
                      setActiveTab('all');
                    }}
                    className="text-xs font-bold text-rose-600 hover:text-rose-700 shrink-0 px-2.5 py-1.5 rounded-xl hover:bg-rose-50 transition-colors cursor-pointer"
                    title="Reset all filters"
                  >
                    Reset
                  </button>
                )}
              </div>
            </div>

            {/* PRODUCTS DATA TABLE */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/80 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    <th className="py-3 px-4">Product Details</th>
                    <th className="py-3 px-4">Artisan / Vendor</th>
                    <th className="py-3 px-4">Category</th>
                    <th className="py-3 px-4">Price</th>
                    <th className="py-3 px-4">Storefront Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredProducts.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-16 text-center">
                        <div className="max-w-sm mx-auto space-y-3">
                          <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
                            <Package className="w-6 h-6" />
                          </div>
                          <div>
                            <p className="text-sm font-bold text-slate-800">No products found</p>
                            <p className="text-xs text-slate-400 mt-1">
                              Try clearing your search query or selecting a different status/category filter.
                            </p>
                          </div>
                          <button
                            onClick={() => {
                              setSelectedCategory('All');
                              setSearchQuery('');
                              setActiveTab('all');
                            }}
                            className="px-3.5 py-1.5 text-xs font-bold text-indigo-600 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors cursor-pointer"
                          >
                            Reset All Filters
                          </button>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filteredProducts.map((p) => (
                      <tr key={p.id} className="text-slate-700 hover:bg-slate-50/70 transition-colors">
                        {/* 1. Product Thumbnail & Info */}
                        <td className="py-3.5 px-4">
                          <div
                            onClick={() => handleOpenDetails(p)}
                            className="flex items-center gap-3 cursor-pointer group"
                            title="Click to inspect full details and specifications"
                          >
                            <div className="relative w-12 h-14 rounded-xl overflow-hidden bg-slate-100 border border-slate-200 shrink-0 shadow-2xs">
                              <img
                                src={p.imageUrl}
                                alt={p.title}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                              />
                            </div>
                            <div className="max-w-xs min-w-0">
                              <p className="font-bold text-slate-900 text-xs line-clamp-1 group-hover:text-indigo-600 transition-colors">
                                {p.title}
                              </p>
                              <div className="flex items-center gap-1.5 mt-0.5">
                                <span className="font-mono text-[10px] text-slate-400 bg-slate-100 px-1.5 py-0.2 rounded border border-slate-200/60">
                                  ID: {p.id.slice(-6)}
                                </span>
                                {p.stock !== undefined && (
                                  <span className="text-[10px] text-slate-500 font-medium">
                                    • {p.stock} in stock
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* 2. Vendor */}
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-800">
                            <Store className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <span className="truncate max-w-[140px]">{p.vendorName}</span>
                          </div>
                          {p.rating && (
                            <div className="flex items-center gap-1 mt-0.5">
                              <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                              <span className="text-[11px] font-bold text-slate-600">
                                {p.rating.toFixed(1)}
                              </span>
                            </div>
                          )}
                        </td>

                        {/* 3. Category */}
                        <td className="py-3 px-4">
                          {getCategoryBadge(p.category)}
                          {p.subCategory && (
                            <div className="text-[10px] font-medium text-slate-400 mt-1 truncate max-w-[140px]">
                              {p.subCategory}
                            </div>
                          )}
                        </td>

                        {/* 4. Price */}
                        <td className="py-3 px-4">
                          <div className="font-mono font-black text-slate-900 text-sm">
                            ₹{p.price.toLocaleString()}
                          </div>
                          {p.discountPrice && p.discountPrice > p.price && (
                            <div className="text-[10px] font-mono text-slate-400 line-through">
                              ₹{p.discountPrice.toLocaleString()}
                            </div>
                          )}
                        </td>

                        {/* 5. Status Toggle */}
                        <td className="py-3 px-4">
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
                              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-600 border border-slate-200 hover:bg-slate-200/80 hover:border-slate-300 transition-all cursor-pointer shadow-2xs group"
                              title="Inactive / Hidden. Click to set Active"
                            >
                              <span className="w-2 h-2 rounded-full bg-slate-400" />
                              <span>Inactive</span>
                            </button>
                          )}
                        </td>

                        {/* 6. Actions */}
                        <td className="py-3 px-4 text-right">
                          <div className="inline-flex items-center gap-1.5 justify-end">
                            {/* 1. Edit Button */}
                            <button
                              onClick={() => handleOpenEdit(p)}
                              className="inline-flex items-center justify-center w-8 h-8 rounded-xl border border-indigo-200 bg-indigo-50/70 text-indigo-700 hover:bg-indigo-100 hover:border-indigo-300 transition-all shadow-2xs active:scale-95 cursor-pointer"
                              title="Edit Product (Image, Name, Price)"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>

                            {/* 2. View Details Button */}
                            <button
                              onClick={() => handleOpenDetails(p)}
                              className="inline-flex items-center justify-center w-8 h-8 rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-100 hover:border-slate-300 transition-all shadow-2xs active:scale-95 cursor-pointer"
                              title="View Product Inspection & Details"
                            >
                              <Eye className="w-3.5 h-3.5 text-slate-600" />
                            </button>

                            {/* 3. Delete Button */}
                            <button
                              onClick={() => handleOpenDeleteModal(p)}
                              className="inline-flex items-center justify-center w-8 h-8 rounded-xl border border-rose-200 bg-rose-50/70 text-rose-700 hover:bg-rose-100 hover:border-rose-300 transition-all shadow-2xs active:scale-95 cursor-pointer"
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

            {/* PROPER MODERN BACKEND PAGINATION BAR */}
            <div className="p-3 sm:px-5 border-t border-slate-200/90 bg-slate-50/70 flex flex-col md:flex-row items-center justify-between gap-3 text-xs">
              {/* Left: Summary text & Rows Per Page Dropdown */}
              <div className="flex flex-wrap items-center gap-3 text-slate-600">
                <span className="text-slate-500 text-xs">
                  Showing <strong className="font-bold text-slate-900">{totalProducts > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0}</strong> to{' '}
                  <strong className="font-bold text-slate-900">{Math.min(currentPage * itemsPerPage, totalProducts)}</strong> of{' '}
                  <strong className="font-bold text-slate-900">{totalProducts}</strong> products
                </span>

                <div className="h-3.5 w-px bg-slate-300 hidden sm:block" />

                {/* 10, 20, 50 Rows Per Page Proper Dropdown */}
                <div className="flex items-center gap-1.5">
                  <span className="text-slate-500 font-medium text-xs">Rows per page:</span>
                  <div className="relative inline-flex items-center">
                    <select
                      value={itemsPerPage}
                      onChange={(e) => {
                        const newLimit = Number(e.target.value);
                        setItemsPerPage(newLimit);
                        setCurrentPage(1);
                        fetchAdminData(1, newLimit);
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
                          className={`min-w-8 h-8 rounded-lg text-xs font-black transition-all cursor-pointer ${
                            currentPage === p
                              ? 'bg-indigo-600 text-white shadow-xs'
                              : 'text-slate-600 hover:bg-slate-100'
                          }`}
                        >
                          {p}
                        </button>
                      ) : (
                        <span key={idx} className="px-1 text-slate-400 font-bold">
                          {p}
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

          {/* Company Name with Dropdown & "+ Add" button */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-zinc-800 uppercase tracking-wider">
                Company Name
              </label>
              {!isAddingCompanyInAdd && (
                <button
                  type="button"
                  onClick={() => {
                    setIsAddingCompanyInAdd(true);
                    setCompanyInputAdd('');
                  }}
                  className="text-xs font-bold text-indigo-600 hover:text-indigo-800 cursor-pointer inline-flex items-center gap-1 hover:underline"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Company</span>
                </button>
              )}
            </div>

            {isAddingCompanyInAdd ? (
              <div className="space-y-1 bg-indigo-50/50 p-2.5 rounded-xl border border-indigo-200">
                <span className="text-[11px] font-bold text-indigo-900 block">
                  Add New Company to Dropdown:
                </span>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    autoFocus
                    placeholder="Enter company name..."
                    value={companyInputAdd}
                    onChange={(e) => setCompanyInputAdd(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        if (companyInputAdd.trim()) {
                          const val = companyInputAdd.trim();
                          setCustomCompanies(prev => Array.from(new Set([...prev, val])));
                          setNewCompanyName(val);
                          setCompanyInputAdd('');
                          setIsAddingCompanyInAdd(false);
                        }
                      }
                    }}
                    className="flex-1 px-3 py-2 text-xs bg-white border border-indigo-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium text-zinc-900"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (companyInputAdd.trim()) {
                        const val = companyInputAdd.trim();
                        setCustomCompanies(prev => Array.from(new Set([...prev, val])));
                        setNewCompanyName(val);
                        setCompanyInputAdd('');
                        setIsAddingCompanyInAdd(false);
                      }
                    }}
                    disabled={!companyInputAdd.trim()}
                    className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-lg text-xs font-bold transition-all shrink-0 cursor-pointer shadow-2xs"
                  >
                    Add
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsAddingCompanyInAdd(false);
                      setCompanyInputAdd('');
                    }}
                    className="px-2.5 py-2 bg-zinc-200 hover:bg-zinc-300 text-zinc-700 rounded-lg text-xs font-bold transition-all shrink-0 cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <select
                    value={newCompanyName}
                    onChange={(e) => setNewCompanyName(e.target.value)}
                    className="w-full px-3 py-2.5 text-xs bg-zinc-50 border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium text-zinc-800 cursor-pointer appearance-none truncate pr-8"
                  >
                    <option value="">-- Select Company --</option>
                    {companyNames.map((comp) => (
                      <option key={comp} value={comp}>
                        {comp}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="w-3.5 h-3.5 text-zinc-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setIsAddingCompanyInAdd(true);
                    setCompanyInputAdd('');
                  }}
                  className="px-3 py-2.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-xl text-xs font-bold transition-all flex items-center gap-1 shrink-0 cursor-pointer shadow-2xs"
                  title="Add new company name to dropdown"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add</span>
                </button>
              </div>
            )}
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

          {/* Company Name with Dropdown & "+ Add" button */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-zinc-800 uppercase tracking-wider">
                Company Name
              </label>
              {!isAddingCompanyInEdit && (
                <button
                  type="button"
                  onClick={() => {
                    setIsAddingCompanyInEdit(true);
                    setCompanyInputEdit('');
                  }}
                  className="text-xs font-bold text-indigo-600 hover:text-indigo-800 cursor-pointer inline-flex items-center gap-1 hover:underline"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Company</span>
                </button>
              )}
            </div>

            {isAddingCompanyInEdit ? (
              <div className="space-y-1 bg-indigo-50/50 p-2.5 rounded-xl border border-indigo-200">
                <span className="text-[11px] font-bold text-indigo-900 block">
                  Add New Company to Dropdown:
                </span>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    autoFocus
                    placeholder="Enter company name..."
                    value={companyInputEdit}
                    onChange={(e) => setCompanyInputEdit(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        if (companyInputEdit.trim()) {
                          const val = companyInputEdit.trim();
                          setCustomCompanies(prev => Array.from(new Set([...prev, val])));
                          setEditCompanyName(val);
                          setCompanyInputEdit('');
                          setIsAddingCompanyInEdit(false);
                        }
                      }
                    }}
                    className="flex-1 px-3 py-2 text-xs bg-white border border-indigo-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium text-zinc-900"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (companyInputEdit.trim()) {
                        const val = companyInputEdit.trim();
                        setCustomCompanies(prev => Array.from(new Set([...prev, val])));
                        setEditCompanyName(val);
                        setCompanyInputEdit('');
                        setIsAddingCompanyInEdit(false);
                      }
                    }}
                    disabled={!companyInputEdit.trim()}
                    className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-lg text-xs font-bold transition-all shrink-0 cursor-pointer shadow-2xs"
                  >
                    Add
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsAddingCompanyInEdit(false);
                      setCompanyInputEdit('');
                    }}
                    className="px-2.5 py-2 bg-zinc-200 hover:bg-zinc-300 text-zinc-700 rounded-lg text-xs font-bold transition-all shrink-0 cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <select
                    value={editCompanyName}
                    onChange={(e) => setEditCompanyName(e.target.value)}
                    className="w-full px-3 py-2.5 text-xs bg-zinc-50 border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium text-zinc-800 cursor-pointer appearance-none truncate pr-8"
                  >
                    <option value="">-- Select Company --</option>
                    {companyNames.map((comp) => (
                      <option key={comp} value={comp}>
                        {comp}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="w-3.5 h-3.5 text-zinc-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setIsAddingCompanyInEdit(true);
                    setCompanyInputEdit('');
                  }}
                  className="px-3 py-2.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-xl text-xs font-bold transition-all flex items-center gap-1 shrink-0 cursor-pointer shadow-2xs"
                  title="Add new company name to dropdown"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add</span>
                </button>
              </div>
            )}
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

