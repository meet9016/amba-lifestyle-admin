/**
 * Centralized API Configuration & Endpoints for Amba Lifestyle
 * All API routes and backend services must be referenced from this file.
 */

export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5005/api/v1';

export const API_ENDPOINTS = {
  BASE_URL: API_BASE_URL,

  // Authentication & Session
  AUTH: {
    LOGIN: `${API_BASE_URL}/auth/login`,
    REGISTER: `${API_BASE_URL}/auth/register`,
    PROFILE: `${API_BASE_URL}/auth/profile`,
    USERS: `${API_BASE_URL}/auth/users`,
    CUSTOMERS: `${API_BASE_URL}/auth/users?role=customer`,
    VENDORS: `${API_BASE_URL}/auth/vendors`,
    APPROVE_VENDOR: (id: string) => `${API_BASE_URL}/auth/vendors/${id}/approve`,
    REJECT_VENDOR: (id: string) => `${API_BASE_URL}/auth/vendors/${id}/reject`,
    CHECKERS: `${API_BASE_URL}/auth/checkers`,
    DELETE_CHECKER: (id: string) => `${API_BASE_URL}/auth/checkers/${id}`,
  },

  // Products
  PRODUCTS: {
    LIST: `${API_BASE_URL}/products`,
    CREATE: `${API_BASE_URL}/products`,
    BY_ID: (id: string) => `${API_BASE_URL}/products/${id}`,
    PENDING: `${API_BASE_URL}/products?approvalStatus=pending`,
    APPROVED: `${API_BASE_URL}/products?approvalStatus=approved`,
    BY_VENDOR: (vendorId: string) => `${API_BASE_URL}/products?vendor=${vendorId}`,
    APPROVE: (id: string) => `${API_BASE_URL}/products/${id}/approve`,
    REJECT: (id: string) => `${API_BASE_URL}/products/${id}/reject`,
    DELETE: (id: string) => `${API_BASE_URL}/products/${id}`,
  },

  // Categories & Subcategories
  CATEGORIES: {
    LIST: `${API_BASE_URL}/categories`,
    CREATE: `${API_BASE_URL}/categories`,
    BY_ID: (id: string) => `${API_BASE_URL}/categories/${id}`,
    UPDATE: (id: string) => `${API_BASE_URL}/categories/${id}`,
    DELETE: (id: string) => `${API_BASE_URL}/categories/${id}`,
  },
  SUBCATEGORIES: {
    LIST: `${API_BASE_URL}/subcategories`,
    BY_CATEGORY: (categoryId: string) => `${API_BASE_URL}/subcategories?categoryId=${categoryId}`,
    CREATE: `${API_BASE_URL}/subcategories`,
    BY_ID: (id: string) => `${API_BASE_URL}/subcategories/${id}`,
    UPDATE: (id: string) => `${API_BASE_URL}/subcategories/${id}`,
    DELETE: (id: string) => `${API_BASE_URL}/subcategories/${id}`,
  },

  // Orders & Quality Inspection
  ORDERS: {
    LIST: `${API_BASE_URL}/orders`,
    CREATE: `${API_BASE_URL}/orders`,
    BY_ID: (id: string) => `${API_BASE_URL}/orders/${id}`,
    ASSIGN_VENDOR: (id: string) => `${API_BASE_URL}/orders/${id}/assign-vendor`,
    VENDOR_PROGRESS: (id: string) => `${API_BASE_URL}/orders/${id}/vendor-progress`,
    INSPECTION: (id: string) => `${API_BASE_URL}/orders/${id}/inspection`,
  },

  // Customer Support & Chat
  SUPPORT: {
    LIST: `${API_BASE_URL}/support`,
    CREATE: `${API_BASE_URL}/support`,
    ADD_MESSAGE: (id: string) => `${API_BASE_URL}/support/${id}/messages`,
    UPDATE_STATUS: (id: string) => `${API_BASE_URL}/support/${id}/status`,
  },

  // Health
  HEALTH: `${API_BASE_URL}/health`,
} as const;

export default API_ENDPOINTS;

