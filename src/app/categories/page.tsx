'use client';

import React, { useState, useEffect } from 'react';
import { AdminSidebar } from '@/components/layout/AdminSidebar';
import { AdminHeader } from '@/components/layout/AdminHeader';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Modal } from '@/components/ui/Modal';
import { ImageUpload } from '@/components/ui/ImageUpload';
import { apiClient, API_ENDPOINTS } from '@/lib/api';
import {
  adminCategorySchema,
  adminSubcategorySchema
} from '@/lib/validations/category';
import {
  Layers,
  FolderTree,
  Plus,
  Search,
  Edit2,
  Trash2,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Filter,
  ArrowRight,
  ExternalLink,
  ChevronRight,
  Sparkles
} from 'lucide-react';

export interface CategoryItem {
  _id: string;
  name: string;
  slug: string;
  description?: string;
  image?: string;
  isActive: boolean;
  subcategoriesCount?: number;
  createdAt?: string;
}

export interface SubcategoryItem {
  _id: string;
  name: string;
  slug: string;
  categoryId: string;
  categoryName?: string;
  description?: string;
  image?: string;
  isActive: boolean;
  createdAt?: string;
}

export default function AdminCategoriesPage() {
  const [activeTab, setActiveTab] = useState<'categories' | 'subcategories'>('categories');
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [subcategories, setSubcategories] = useState<SubcategoryItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'All' | 'Active' | 'Inactive'>('All');
  const [selectedParentCategory, setSelectedParentCategory] = useState<string>('All');

  // Modal states: Category
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [categoryModalMode, setCategoryModalMode] = useState<'create' | 'edit'>('create');
  const [editingCategory, setEditingCategory] = useState<CategoryItem | null>(null);
  const [categoryFormData, setCategoryFormData] = useState({
    name: '',
    slug: '',
    description: '',
    image: '',
    isActive: true
  });
  const [categoryFormErrors, setCategoryFormErrors] = useState<Record<string, string>>({});
  const [isSubmittingCategory, setIsSubmittingCategory] = useState(false);

  // Modal states: Subcategory
  const [isSubModalOpen, setIsSubModalOpen] = useState(false);
  const [subModalMode, setSubModalMode] = useState<'create' | 'edit'>('create');
  const [editingSubcategory, setEditingSubcategory] = useState<SubcategoryItem | null>(null);
  const [subFormData, setSubFormData] = useState({
    name: '',
    slug: '',
    categoryId: '',
    description: '',
    image: '',
    isActive: true
  });
  const [subFormErrors, setSubFormErrors] = useState<Record<string, string>>({});
  const [isSubmittingSub, setIsSubmittingSub] = useState(false);

  // Delete Confirmation state
  const [deleteTarget, setDeleteTarget] = useState<{
    type: 'category' | 'subcategory';
    id: string;
    name: string;
    warning?: string;
  } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Show notification helper
  const showNotification = (message: string, type: 'success' | 'error' = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 4500);
  };

  // Fetch data from backend API
  const fetchData = async () => {
    try {
      setLoading(true);
      const [catRes, subRes] = await Promise.all([
        apiClient.get(API_ENDPOINTS.CATEGORIES.LIST),
        apiClient.get(API_ENDPOINTS.SUBCATEGORIES.LIST)
      ]);

      if (catRes.data?.data) {
        setCategories(catRes.data.data);
      }
      if (subRes.data?.data) {
        setSubcategories(subRes.data.data);
      }
    } catch (_) {
      // Keep initial seed if backend not reachable
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Sync subcategories count when categories/subcategories change
  const categoriesWithLiveCount = categories.map(cat => {
    const count = subcategories.filter(s => String(s.categoryId) === String(cat._id)).length;
    return {
      ...cat,
      subcategoriesCount: count
    };
  });

  // ==========================================
  // CATEGORY HANDLERS
  // ==========================================

  const openCreateCategoryModal = () => {
    setCategoryModalMode('create');
    setEditingCategory(null);
    setCategoryFormData({
      name: '',
      slug: '',
      description: '',
      image: '',
      isActive: true
    });
    setCategoryFormErrors({});
    setIsCategoryModalOpen(true);
  };

  const openEditCategoryModal = (cat: CategoryItem) => {
    setCategoryModalMode('edit');
    setEditingCategory(cat);
    setCategoryFormData({
      name: cat.name,
      slug: cat.slug,
      description: cat.description || '',
      image: cat.image || '',
      isActive: cat.isActive
    });
    setCategoryFormErrors({});
    setIsCategoryModalOpen(true);
  };

  const handleCategorySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setCategoryFormErrors({});

    // ZOD VALIDATION
    const validation = adminCategorySchema.safeParse({
      name: categoryFormData.name,
      slug: categoryFormData.slug || undefined,
      description: categoryFormData.description,
      image: categoryFormData.image,
      isActive: categoryFormData.isActive
    });

    if (!validation.success) {
      const errMap: Record<string, string> = {};
      for (const issue of validation.error.issues) {
        const key = issue.path[0] as string;
        if (!errMap[key]) errMap[key] = issue.message;
      }
      setCategoryFormErrors(errMap);
      return;
    }

    setIsSubmittingCategory(true);
    const payload = {
      name: categoryFormData.name.trim(),
      slug: categoryFormData.slug.trim() || undefined,
      description: categoryFormData.description.trim(),
      image: categoryFormData.image,
      isActive: categoryFormData.isActive
    };

    try {
      if (categoryModalMode === 'create') {
        const res = await apiClient.post(API_ENDPOINTS.CATEGORIES.CREATE, payload, {
          headers: { 'x-user-role': 'admin' }
        });
        const created = res.data?.data;
        if (created) {
          setCategories(prev => [created, ...prev]);
        }
        showNotification(`Category "${payload.name}" created successfully!`);
      } else if (editingCategory) {
        const res = await apiClient.put(API_ENDPOINTS.CATEGORIES.UPDATE(editingCategory._id), payload, {
          headers: { 'x-user-role': 'admin' }
        });
        const updated = res.data?.data;
        setCategories(prev =>
          prev.map(c => (c._id === editingCategory._id ? { ...c, ...payload, ...updated } : c))
        );
        // Also update subcategory parent categoryName if changed
        setSubcategories(prev =>
          prev.map(s => (s.categoryId === editingCategory._id ? { ...s, categoryName: payload.name } : s))
        );
        showNotification(`Category "${payload.name}" updated successfully!`);
      }
      setIsCategoryModalOpen(false);
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Failed to save category. Please try again.';
      setCategoryFormErrors({ general: msg });
    } finally {
      setIsSubmittingCategory(false);
    }
  };

  // ==========================================
  // SUBCATEGORY HANDLERS
  // ==========================================

  const openCreateSubModal = (preselectedCatId?: string) => {
    setSubModalMode('create');
    setEditingSubcategory(null);
    setSubFormData({
      name: '',
      slug: '',
      categoryId: preselectedCatId || (categories[0]?._id ? String(categories[0]._id) : ''),
      description: '',
      image: '',
      isActive: true
    });
    setSubFormErrors({});
    setIsSubModalOpen(true);
  };

  const openEditSubModal = (sub: SubcategoryItem) => {
    setSubModalMode('edit');
    setEditingSubcategory(sub);
    setSubFormData({
      name: sub.name,
      slug: sub.slug,
      categoryId: String(sub.categoryId),
      description: sub.description || '',
      image: sub.image || '',
      isActive: sub.isActive
    });
    setSubFormErrors({});
    setIsSubModalOpen(true);
  };

  const handleSubSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubFormErrors({});

    // ZOD VALIDATION
    const validation = adminSubcategorySchema.safeParse({
      name: subFormData.name,
      categoryId: subFormData.categoryId,
      slug: subFormData.slug || undefined,
      description: subFormData.description,
      image: subFormData.image,
      isActive: subFormData.isActive
    });

    if (!validation.success) {
      const errMap: Record<string, string> = {};
      for (const issue of validation.error.issues) {
        const key = issue.path[0] as string;
        if (!errMap[key]) errMap[key] = issue.message;
      }
      setSubFormErrors(errMap);
      return;
    }

    setIsSubmittingSub(true);
    const parentCat = categories.find(c => String(c._id) === String(subFormData.categoryId));
    const payload = {
      name: subFormData.name.trim(),
      categoryId: subFormData.categoryId,
      categoryName: parentCat ? parentCat.name : 'General',
      slug: subFormData.slug.trim() || undefined,
      description: subFormData.description.trim(),
      image: subFormData.image,
      isActive: subFormData.isActive
    };

    try {
      if (subModalMode === 'create') {
        const res = await apiClient.post(API_ENDPOINTS.SUBCATEGORIES.CREATE, payload, {
          headers: { 'x-user-role': 'admin' }
        });
        const created = res.data?.data;
        if (created) {
          setSubcategories(prev => [created, ...prev]);
        }
        showNotification(`Subcategory "${payload.name}" created successfully!`);
      } else if (editingSubcategory) {
        const res = await apiClient.put(API_ENDPOINTS.SUBCATEGORIES.UPDATE(editingSubcategory._id), payload, {
          headers: { 'x-user-role': 'admin' }
        });
        const updated = res.data?.data;
        setSubcategories(prev =>
          prev.map(s => (s._id === editingSubcategory._id ? { ...s, ...payload, ...updated } : s))
        );
        showNotification(`Subcategory "${payload.name}" updated successfully!`);
      }
      setIsSubModalOpen(false);
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Failed to save subcategory. Please try again.';
      setSubFormErrors({ general: msg });
    } finally {
      setIsSubmittingSub(false);
    }
  };

  // ==========================================
  // DELETE HANDLERS
  // ==========================================

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);

    try {
      if (deleteTarget.type === 'category') {
        await apiClient.delete(API_ENDPOINTS.CATEGORIES.DELETE(deleteTarget.id), {
          headers: { 'x-user-role': 'admin' }
        });
        setCategories(prev => prev.filter(c => c._id !== deleteTarget.id));
        setSubcategories(prev => prev.filter(s => s.categoryId !== deleteTarget.id));
        showNotification(`Category "${deleteTarget.name}" and associated subcategories removed.`);
      } else {
        await apiClient.delete(API_ENDPOINTS.SUBCATEGORIES.DELETE(deleteTarget.id), {
          headers: { 'x-user-role': 'admin' }
        });
        setSubcategories(prev => prev.filter(s => s._id !== deleteTarget.id));
        showNotification(`Subcategory "${deleteTarget.name}" deleted.`);
      }
      setDeleteTarget(null);
    } catch (err: any) {
      showNotification('Delete action failed. Please try again.', 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  // Filtered Categories
  const filteredCategories = categoriesWithLiveCount.filter(cat => {
    const matchesSearch =
      cat.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      cat.slug.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (cat.description || '').toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus =
      statusFilter === 'All'
        ? true
        : statusFilter === 'Active'
        ? cat.isActive
        : !cat.isActive;
    return matchesSearch && matchesStatus;
  });

  // Filtered Subcategories
  const filteredSubcategories = subcategories.filter(sub => {
    const matchesSearch =
      sub.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      sub.slug.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (sub.categoryName || '').toLowerCase().includes(searchQuery.toLowerCase());
    const matchesParent =
      selectedParentCategory === 'All'
        ? true
        : String(sub.categoryId) === selectedParentCategory;
    const matchesStatus =
      statusFilter === 'All'
        ? true
        : statusFilter === 'Active'
        ? sub.isActive
        : !sub.isActive;
    return matchesSearch && matchesParent && matchesStatus;
  });

  const parentCategoryOptions = [
    { value: 'All', label: 'All Parent Categories' },
    ...categories.map(c => ({ value: String(c._id), label: c.name }))
  ];

  return (
    <div className="flex min-h-screen bg-zinc-50 text-zinc-900">
      <AdminSidebar />

      <div className="flex-1 flex flex-col min-w-0">
        <AdminHeader />

        <main className="flex-1 p-8 space-y-6">
          {/* Notification Alert */}
          {notification && (
            <div
              className={`p-4 rounded-2xl flex items-center justify-between text-xs font-semibold shadow-xs transition-all ${
                notification.type === 'success'
                  ? 'bg-emerald-50 border border-emerald-200 text-emerald-900'
                  : 'bg-rose-50 border border-rose-200 text-rose-900'
              }`}
            >
              <div className="flex items-center gap-2">
                {notification.type === 'success' ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                )}
                <span>{notification.message}</span>
              </div>
              <button
                onClick={() => setNotification(null)}
                className="text-zinc-400 hover:text-zinc-600 font-bold ml-4"
              >
                ✕
              </button>
            </div>
          )}

          {/* Header & Quick Action Buttons */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold text-zinc-900">Category & Subcategory Management</h1>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-100">
                  Store Taxonomy
                </span>
              </div>
              <p className="text-xs text-zinc-500 mt-1">
                Configure hierarchical product catalog categories, taxonomy slugs, and storefront filters.
              </p>
            </div>

            <div className="flex items-center gap-2.5">
              <Button
                onClick={() => openCreateCategoryModal()}
                className="bg-indigo-600 hover:bg-indigo-700 text-white gap-2 shadow-xs"
              >
                <Plus className="w-4 h-4" />
                Add Category
              </Button>
              <Button
                onClick={() => openCreateSubModal()}
                variant="outline"
                className="gap-2 border-indigo-200 text-indigo-700 hover:bg-indigo-50 shadow-xs"
              >
                <FolderTree className="w-4 h-4" />
                Add Subcategory
              </Button>
            </div>
          </div>

          {/* Metric Overview Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="p-4 bg-white border border-zinc-200/80 rounded-2xl shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-zinc-500">Total Categories</span>
                <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                  <Layers className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-2xl font-bold text-zinc-900">{categories.length}</span>
                <span className="text-xs text-zinc-400">Master groups</span>
              </div>
            </Card>

            <Card className="p-4 bg-white border border-zinc-200/80 rounded-2xl shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-zinc-500">Active Categories</span>
                <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-2xl font-bold text-emerald-600">
                  {categories.filter(c => c.isActive).length}
                </span>
                <span className="text-xs text-zinc-400">Visible on web</span>
              </div>
            </Card>

            <Card className="p-4 bg-white border border-zinc-200/80 rounded-2xl shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-zinc-500">Total Subcategories</span>
                <div className="w-8 h-8 rounded-xl bg-violet-50 text-violet-600 flex items-center justify-center">
                  <FolderTree className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-2xl font-bold text-zinc-900">{subcategories.length}</span>
                <span className="text-xs text-zinc-400">Taxonomy nodes</span>
              </div>
            </Card>

            <Card className="p-4 bg-white border border-zinc-200/80 rounded-2xl shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-zinc-500">Active Subcategories</span>
                <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                  <Sparkles className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-2xl font-bold text-blue-600">
                  {subcategories.filter(s => s.isActive).length}
                </span>
                <span className="text-xs text-zinc-400">Published items</span>
              </div>
            </Card>
          </div>

          {/* Tabs & Filters Bar */}
          <Card className="p-4 bg-white border border-zinc-200/80 rounded-2xl shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-100 pb-3">
              {/* Tab Switcher */}
              <div className="flex items-center gap-1.5 p-1 bg-zinc-100 rounded-xl w-fit">
                <button
                  onClick={() => {
                    setActiveTab('categories');
                    setSelectedParentCategory('All');
                  }}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                    activeTab === 'categories'
                      ? 'bg-white text-zinc-900 shadow-xs'
                      : 'text-zinc-600 hover:text-zinc-900'
                  }`}
                >
                  <Layers className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Categories</span>
                  <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-zinc-100 text-zinc-700 font-semibold">
                    {categories.length}
                  </span>
                </button>

                <button
                  onClick={() => setActiveTab('subcategories')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                    activeTab === 'subcategories'
                      ? 'bg-white text-zinc-900 shadow-xs'
                      : 'text-zinc-600 hover:text-zinc-900'
                  }`}
                >
                  <FolderTree className="w-3.5 h-3.5 text-violet-600" />
                  <span>Subcategories</span>
                  <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-zinc-100 text-zinc-700 font-semibold">
                    {subcategories.length}
                  </span>
                </button>
              </div>

              {/* Status Filter */}
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-zinc-500">Status:</span>
                {(['All', 'Active', 'Inactive'] as const).map(status => (
                  <button
                    key={status}
                    onClick={() => setStatusFilter(status)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                      statusFilter === status
                        ? 'bg-indigo-50 text-indigo-700 font-semibold border border-indigo-200'
                        : 'text-zinc-600 hover:bg-zinc-100 border border-transparent'
                    }`}
                  >
                    {status}
                  </button>
                ))}
              </div>
            </div>

            {/* Search and Secondary Filter Row */}
            <div className="flex flex-col sm:flex-row items-center gap-3">
              <div className="relative flex-1 w-full">
                <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder={
                    activeTab === 'categories'
                      ? 'Search categories by name, slug or description...'
                      : 'Search subcategories...'
                  }
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-white text-zinc-900 border border-zinc-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 placeholder-zinc-400 shadow-xs"
                />
              </div>

              {activeTab === 'subcategories' && (
                <div className="w-full sm:w-64">
                  <Select
                    options={parentCategoryOptions}
                    value={selectedParentCategory}
                    onChange={e => setSelectedParentCategory(e.target.value)}
                    focusRingColor="focus:ring-violet-500"
                  />
                </div>
              )}
            </div>
          </Card>

          {/* MAIN CONTENT AREA */}
          {activeTab === 'categories' ? (
            /* ================= CATEGORIES TABLE ================= */
            <Card className="bg-white border border-zinc-200/80 rounded-2xl shadow-xs overflow-hidden">
              <div className="px-6 py-4 border-b border-zinc-100 flex items-center justify-between">
                <div>
                  <h2 className="text-sm font-bold text-zinc-900">All Master Categories</h2>
                  <p className="text-xs text-zinc-500 mt-0.5">
                    Showing {filteredCategories.length} of {categories.length} categories
                  </p>
                </div>
                <Button
                  onClick={() => openCreateCategoryModal()}
                  size="sm"
                  className="bg-indigo-600 hover:bg-indigo-700 text-white gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5" />
                  New Category
                </Button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-zinc-100 bg-zinc-50/75 text-[11px] font-semibold text-zinc-500 uppercase tracking-wider">
                      <th className="py-3 px-6">Category</th>
                      <th className="py-3 px-6">Slug</th>
                      <th className="py-3 px-6">Description</th>
                      <th className="py-3 px-6 text-center">Subcategories</th>
                      <th className="py-3 px-6 text-center">Status</th>
                      <th className="py-3 px-6 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100 text-xs">
                    {filteredCategories.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-12 text-center text-zinc-400">
                          <Layers className="w-8 h-8 mx-auto text-zinc-300 mb-2 stroke-[1.5]" />
                          <p className="text-sm font-semibold text-zinc-700">No categories found</p>
                          <p className="text-xs text-zinc-400 mt-0.5">
                            Try adjusting your search criteria or add a new category.
                          </p>
                        </td>
                      </tr>
                    ) : (
                      filteredCategories.map(cat => (
                        <tr key={cat._id} className="hover:bg-zinc-50/60 transition-colors">
                          {/* Name & Thumbnail */}
                          <td className="py-3.5 px-6">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-xl bg-zinc-100 overflow-hidden shrink-0 border border-zinc-200/60 flex items-center justify-center">
                                {cat.image ? (
                                  <img
                                    src={cat.image}
                                    alt={cat.name}
                                    className="w-full h-full object-cover"
                                  />
                                ) : (
                                  <Layers className="w-5 h-5 text-zinc-400" />
                                )}
                              </div>
                              <div>
                                <span className="font-semibold text-zinc-900 block">{cat.name}</span>
                                <span className="text-[10px] text-zinc-400 font-mono">ID: {cat._id}</span>
                              </div>
                            </div>
                          </td>

                          {/* Slug */}
                          <td className="py-3.5 px-6 font-mono text-zinc-600 text-[11px]">
                            <span className="px-2 py-0.5 bg-zinc-100 text-zinc-700 rounded-md">
                              /{cat.slug}
                            </span>
                          </td>

                          {/* Description */}
                          <td className="py-3.5 px-6 max-w-xs text-zinc-600 truncate">
                            {cat.description || <span className="text-zinc-400 italic">No description</span>}
                          </td>

                          {/* Subcategories count badge & filter link */}
                          <td className="py-3.5 px-6 text-center">
                            <button
                              onClick={() => {
                                setSelectedParentCategory(String(cat._id));
                                setActiveTab('subcategories');
                              }}
                              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-violet-50 text-violet-700 hover:bg-violet-100 transition-colors border border-violet-200/60"
                              title="Click to view subcategories"
                            >
                              <span>{cat.subcategoriesCount || 0} subcategories</span>
                              <ChevronRight className="w-3 h-3 text-violet-500" />
                            </button>
                          </td>

                          {/* Status */}
                          <td className="py-3.5 px-6 text-center">
                            {cat.isActive ? (
                              <Badge variant="success" dot size="sm">
                                Active
                              </Badge>
                            ) : (
                              <Badge variant="default" dot size="sm">
                                Inactive
                              </Badge>
                            )}
                          </td>

                          {/* Actions */}
                          <td className="py-3.5 px-6 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => openCreateSubModal(String(cat._id))}
                                title="Add Subcategory to this Category"
                                className="p-1.5 text-zinc-500 hover:text-violet-600 hover:bg-violet-50 rounded-lg transition-colors"
                              >
                                <Plus className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => openEditCategoryModal(cat)}
                                title="Edit Category"
                                className="p-1.5 text-zinc-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() =>
                                  setDeleteTarget({
                                    type: 'category',
                                    id: cat._id,
                                    name: cat.name,
                                    warning:
                                      cat.subcategoriesCount && cat.subcategoriesCount > 0
                                        ? `Deleting this category will also remove its ${cat.subcategoriesCount} linked subcategories.`
                                        : undefined
                                  })
                                }
                                title="Delete Category"
                                className="p-1.5 text-zinc-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                              >
                                <Trash2 className="w-4 h-4" />
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
          ) : (
            /* ================= SUBCATEGORIES TABLE ================= */
            <Card className="bg-white border border-zinc-200/80 rounded-2xl shadow-xs overflow-hidden">
              <div className="px-6 py-4 border-b border-zinc-100 flex items-center justify-between">
                <div>
                  <h2 className="text-sm font-bold text-zinc-900">All Subcategories</h2>
                  <p className="text-xs text-zinc-500 mt-0.5">
                    Showing {filteredSubcategories.length} of {subcategories.length} subcategories
                    {selectedParentCategory !== 'All' && (
                      <span className="ml-1 text-indigo-600 font-semibold">
                        (Filtered by: {categories.find(c => String(c._id) === selectedParentCategory)?.name})
                      </span>
                    )}
                  </p>
                </div>
                <Button
                  onClick={() => openCreateSubModal()}
                  size="sm"
                  className="bg-violet-600 hover:bg-violet-700 text-white gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5" />
                  New Subcategory
                </Button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-zinc-100 bg-zinc-50/75 text-[11px] font-semibold text-zinc-500 uppercase tracking-wider">
                      <th className="py-3 px-6">Subcategory</th>
                      <th className="py-3 px-6">Parent Category</th>
                      <th className="py-3 px-6">Slug</th>
                      <th className="py-3 px-6">Description</th>
                      <th className="py-3 px-6 text-center">Status</th>
                      <th className="py-3 px-6 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100 text-xs">
                    {filteredSubcategories.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-12 text-center text-zinc-400">
                          <FolderTree className="w-8 h-8 mx-auto text-zinc-300 mb-2 stroke-[1.5]" />
                          <p className="text-sm font-semibold text-zinc-700">No subcategories found</p>
                          <p className="text-xs text-zinc-400 mt-0.5">
                            Try selecting another parent category or add a new subcategory.
                          </p>
                        </td>
                      </tr>
                    ) : (
                      filteredSubcategories.map(sub => (
                        <tr key={sub._id} className="hover:bg-zinc-50/60 transition-colors">
                          {/* Name */}
                          <td className="py-3.5 px-6 font-semibold text-zinc-900">
                            <div className="flex items-center gap-2.5">
                              <div className="w-7 h-7 rounded-lg bg-violet-50 text-violet-600 flex items-center justify-center shrink-0">
                                <FolderTree className="w-3.5 h-3.5" />
                              </div>
                              <div>
                                <span className="block text-zinc-900">{sub.name}</span>
                                <span className="text-[10px] text-zinc-400 font-mono">ID: {sub._id}</span>
                              </div>
                            </div>
                          </td>

                          {/* Parent Category Badge */}
                          <td className="py-3.5 px-6">
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-100">
                              <Layers className="w-3 h-3 text-indigo-500" />
                              {sub.categoryName || 'General'}
                            </span>
                          </td>

                          {/* Slug */}
                          <td className="py-3.5 px-6 font-mono text-zinc-600 text-[11px]">
                            <span className="px-2 py-0.5 bg-zinc-100 text-zinc-700 rounded-md">
                              /{sub.slug}
                            </span>
                          </td>

                          {/* Description */}
                          <td className="py-3.5 px-6 max-w-xs text-zinc-600 truncate">
                            {sub.description || <span className="text-zinc-400 italic">No description</span>}
                          </td>

                          {/* Status */}
                          <td className="py-3.5 px-6 text-center">
                            {sub.isActive ? (
                              <Badge variant="success" dot size="sm">
                                Active
                              </Badge>
                            ) : (
                              <Badge variant="default" dot size="sm">
                                Inactive
                              </Badge>
                            )}
                          </td>

                          {/* Actions */}
                          <td className="py-3.5 px-6 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => openEditSubModal(sub)}
                                title="Edit Subcategory"
                                className="p-1.5 text-zinc-500 hover:text-violet-600 hover:bg-violet-50 rounded-lg transition-colors"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() =>
                                  setDeleteTarget({
                                    type: 'subcategory',
                                    id: sub._id,
                                    name: sub.name
                                  })
                                }
                                title="Delete Subcategory"
                                className="p-1.5 text-zinc-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                              >
                                <Trash2 className="w-4 h-4" />
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
          )}
        </main>
      </div>

      {/* ================= CATEGORY MODAL (ADD / EDIT) ================= */}
      <Modal
        isOpen={isCategoryModalOpen}
        onClose={() => setIsCategoryModalOpen(false)}
        title={categoryModalMode === 'create' ? 'Add Master Category' : 'Edit Master Category'}
      >
        <form onSubmit={handleCategorySubmit} className="space-y-4" noValidate>
          {categoryFormErrors.general && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
              <span>{categoryFormErrors.general}</span>
            </div>
          )}

          <Input
            label="Category Name *"
            name="name"
            placeholder="e.g. Ethnic Wear, Handloom Crafts"
            value={categoryFormData.name}
            onChange={e => setCategoryFormData(prev => ({ ...prev, name: e.target.value }))}
            error={categoryFormErrors.name}
          />

          <Input
            label="URL Slug (Optional - auto generates from name)"
            name="slug"
            placeholder="e.g. ethnic-wear"
            value={categoryFormData.slug}
            onChange={e => setCategoryFormData(prev => ({ ...prev, slug: e.target.value }))}
            error={categoryFormErrors.slug}
          />

          <ImageUpload
            label="Category Banner / Icon"
            value={categoryFormData.image}
            onChange={url => setCategoryFormData(prev => ({ ...prev, image: url }))}
          />

          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-zinc-700">Description</label>
            <textarea
              name="description"
              rows={3}
              placeholder="Detailed description of this category for navigation..."
              value={categoryFormData.description}
              onChange={e => setCategoryFormData(prev => ({ ...prev, description: e.target.value }))}
              className="w-full px-3.5 py-2 text-sm bg-white text-zinc-900 border border-zinc-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 placeholder-zinc-400"
            />
          </div>

          <div className="flex items-center gap-2.5 pt-1">
            <input
              type="checkbox"
              id="categoryActive"
              checked={categoryFormData.isActive}
              onChange={e => setCategoryFormData(prev => ({ ...prev, isActive: e.target.checked }))}
              className="w-4 h-4 text-indigo-600 rounded border-zinc-300 focus:ring-indigo-500"
            />
            <label htmlFor="categoryActive" className="text-xs font-semibold text-zinc-700 select-none cursor-pointer">
              Active & Published on Storefront
            </label>
          </div>

          <div className="pt-4 flex items-center justify-end gap-3 border-t border-zinc-100">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsCategoryModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmittingCategory}
              className="bg-indigo-600 hover:bg-indigo-700 text-white"
            >
              {isSubmittingCategory ? 'Saving...' : categoryModalMode === 'create' ? 'Create Category' : 'Save Changes'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* ================= SUBCATEGORY MODAL (ADD / EDIT) ================= */}
      <Modal
        isOpen={isSubModalOpen}
        onClose={() => setIsSubModalOpen(false)}
        title={subModalMode === 'create' ? 'Add Subcategory' : 'Edit Subcategory'}
      >
        <form onSubmit={handleSubSubmit} className="space-y-4" noValidate>
          {subFormErrors.general && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
              <span>{subFormErrors.general}</span>
            </div>
          )}

          <Select
            label="Parent Master Category *"
            name="categoryId"
            value={subFormData.categoryId}
            onChange={e => setSubFormData(prev => ({ ...prev, categoryId: e.target.value }))}
            options={categories.map(c => ({ value: String(c._id), label: c.name }))}
            error={subFormErrors.categoryId}
            focusRingColor="focus:ring-violet-500"
          />

          <Input
            label="Subcategory Name *"
            name="name"
            placeholder="e.g. Sarees & Handlooms, Blue Pottery"
            value={subFormData.name}
            onChange={e => setSubFormData(prev => ({ ...prev, name: e.target.value }))}
            error={subFormErrors.name}
          />

          <Input
            label="URL Slug (Optional - auto generates from name)"
            name="slug"
            placeholder="e.g. sarees-handlooms"
            value={subFormData.slug}
            onChange={e => setSubFormData(prev => ({ ...prev, slug: e.target.value }))}
            error={subFormErrors.slug}
          />

          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-zinc-700">Description</label>
            <textarea
              name="description"
              rows={3}
              placeholder="Brief details about items in this subcategory..."
              value={subFormData.description}
              onChange={e => setSubFormData(prev => ({ ...prev, description: e.target.value }))}
              className="w-full px-3.5 py-2 text-sm bg-white text-zinc-900 border border-zinc-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500 placeholder-zinc-400"
            />
          </div>

          <div className="flex items-center gap-2.5 pt-1">
            <input
              type="checkbox"
              id="subActive"
              checked={subFormData.isActive}
              onChange={e => setSubFormData(prev => ({ ...prev, isActive: e.target.checked }))}
              className="w-4 h-4 text-violet-600 rounded border-zinc-300 focus:ring-violet-500"
            />
            <label htmlFor="subActive" className="text-xs font-semibold text-zinc-700 select-none cursor-pointer">
              Active & Published on Storefront
            </label>
          </div>

          <div className="pt-4 flex items-center justify-end gap-3 border-t border-zinc-100">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsSubModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmittingSub}
              className="bg-violet-600 hover:bg-violet-700 text-white"
            >
              {isSubmittingSub ? 'Saving...' : subModalMode === 'create' ? 'Create Subcategory' : 'Save Changes'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* ================= DELETE CONFIRMATION MODAL ================= */}
      <Modal
        isOpen={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        title={`Delete ${deleteTarget?.type === 'category' ? 'Category' : 'Subcategory'}`}
      >
        <div className="space-y-4">
          <p className="text-sm text-zinc-600">
            Are you sure you want to delete{' '}
            <strong className="text-zinc-900">{deleteTarget?.name}</strong>? This action cannot be
            undone.
          </p>

          {deleteTarget?.warning && (
            <div className="p-3 bg-amber-50 border border-amber-200 text-amber-800 text-xs rounded-xl flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-amber-600" />
              <span>{deleteTarget.warning}</span>
            </div>
          )}

          <div className="pt-3 flex items-center justify-end gap-3 border-t border-zinc-100">
            <Button
              type="button"
              variant="outline"
              onClick={() => setDeleteTarget(null)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              disabled={isDeleting}
              onClick={confirmDelete}
              className="bg-rose-600 hover:bg-rose-700 text-white"
            >
              {isDeleting ? 'Deleting...' : 'Delete Permanently'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
