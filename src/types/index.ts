export interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'vendor' | 'customer';
  avatar?: string;
  phone?: string;
  isVerified?: boolean;
}

export interface Product {
  _id: string;
  title: string;
  slug?: string;
  description: string;
  price: number;
  discountPrice?: number;
  category: string;
  stock: number;
  images: string[];
  vendor: {
    _id: string;
    name: string;
    email: string;
  };
  status: 'draft' | 'published' | 'out_of_stock' | 'archived';
  rating: number;
  numReviews: number;
  createdAt: string;
}

export interface Order {
  _id: string;
  orderNumber: string;
  customer: {
    _id: string;
    name: string;
    email: string;
  };
  items: Array<{
    product: string;
    title: string;
    price: number;
    quantity: number;
  }>;
  totalAmount: number;
  paymentMethod: string;
  paymentStatus: 'pending' | 'paid' | 'failed';
  orderStatus: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  createdAt: string;
}

export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data: T;
  pagination?: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

