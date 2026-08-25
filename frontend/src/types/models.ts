import { UserRole, OrderStatus } from '@/types/index';

export interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  role: UserRole;
  phone?: string;
  createdAt: Date;
}

export interface Plant {
  id: string;
  name: string;
  latinName: string;
  description: string;
  price: number;
  images: string[];
  category: string;
  sellerId: string;
  sellerName: string;
  inStock: boolean;
  quantity: number;
  rating: number;
  reviewsCount: number;
  aiGenerated?: boolean;
  careInstructions?: string[];
  lightRequirements?: string;
  waterRequirements?: string;
  difficulty?: 'easy' | 'medium' | 'hard';
  createdAt: Date;
}

export interface CartItem {
  id: string;
  plantId: string;
  plant: Plant;
  quantity: number;
  addedAt: Date;
}

export interface Order {
  id: string;
  userId: string;
  items: CartItem[];
  totalAmount: number;
  status: OrderStatus;
  shippingAddress: string;
  contactPhone: string;
  paymentLink?: string;
  isPaid: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Review {
  id: string;
  plantId: string;
  userId: string;
  userName: string;
  rating: number;
  comment: string;
  images?: string[];
  createdAt: Date;
}

export interface AIRecognitionResult {
  plantName: string;
  latinName: string;
  confidence: number;
  description: string;
  careInstructions: string[];
  similarPlants: Plant[];
}

export interface FilterOptions {
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  difficulty?: string;
  inStock?: boolean;
  sortBy?: 'price_asc' | 'price_desc' | 'rating' | 'newest';
}
