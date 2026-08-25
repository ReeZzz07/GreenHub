import { UserRole } from '@/types';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/api';

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const body = await res.json().catch(() => null);
    const message = Array.isArray(body?.message)
      ? body.message.join(', ')
      : (body?.message ?? res.statusText);
    throw new ApiError(res.status, message);
  }

  if (res.status === 204) return undefined as T;
  return res.json();
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });
  return handleResponse<T>(res);
}

// Без Content-Type: браузер сам проставит multipart/form-data с правильным boundary
export async function uploadMedia(file: File, token: string): Promise<{ url: string }> {
  const formData = new FormData();
  formData.append('file', file);

  const res = await fetch(`${API_URL}/media/upload`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: formData,
  });
  return handleResponse<{ url: string }>(res);
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  icon: string | null;
  parentId: string | null;
}

export function fetchCategories(): Promise<Category[]> {
  return request<Category[]>('/categories');
}

export interface ApiUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  phone: string | null;
}

export interface AuthResponse {
  accessToken: string;
  user: ApiUser;
}

export function apiLogin(email: string, password: string): Promise<AuthResponse> {
  return request<AuthResponse>('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
}

export interface RegisterPayload {
  email: string;
  password: string;
  name: string;
  role: UserRole;
  phone?: string;
}

export function apiRegister(payload: RegisterPayload): Promise<AuthResponse> {
  return request<AuthResponse>('/auth/register', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function fetchMe(token: string): Promise<ApiUser> {
  return request<ApiUser>('/auth/me', {
    headers: { Authorization: `Bearer ${token}` },
  });
}

export type ListingStatus = 'PENDING_MODERATION' | 'PUBLISHED' | 'REJECTED' | 'SOLD';

export interface Listing {
  id: string;
  title: string;
  latinName: string | null;
  description: string;
  price: number;
  quantity: number;
  images: string[];
  lightRequirements: string | null;
  waterRequirements: string | null;
  careInstructions: string[];
  status: ListingStatus;
  rejectionReason: string | null;
  categoryId: string;
  category: Category;
  sellerId: string;
  seller: { id: string; name: string };
  createdAt: string;
  updatedAt: string;
}

export interface ListingsPage {
  items: Listing[];
  total: number;
  page: number;
  limit: number;
}

export interface ListingsQuery {
  category?: string;
  search?: string;
  minPrice?: number;
  maxPrice?: number;
  page?: number;
  limit?: number;
  sortBy?: 'newest' | 'price_asc' | 'price_desc';
}

export function fetchListings(query: ListingsQuery = {}): Promise<ListingsPage> {
  const params = new URLSearchParams();
  Object.entries(query).forEach(([key, value]) => {
    if (value !== undefined && value !== '') params.set(key, String(value));
  });
  const qs = params.toString();
  return request<ListingsPage>(`/listings${qs ? `?${qs}` : ''}`);
}

export function fetchListing(id: string): Promise<Listing> {
  return request<Listing>(`/listings/${id}`);
}

export function fetchMyListings(token: string): Promise<Listing[]> {
  return request<Listing[]>('/listings/mine', {
    headers: { Authorization: `Bearer ${token}` },
  });
}

export interface CreateListingPayload {
  title: string;
  latinName?: string;
  description: string;
  price: number;
  quantity?: number;
  categoryId: string;
  images?: string[];
  lightRequirements?: string;
  waterRequirements?: string;
  careInstructions?: string[];
}

export function createListing(payload: CreateListingPayload, token: string): Promise<Listing> {
  return request<Listing>('/listings', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify(payload),
  });
}

export function deleteListing(id: string, token: string): Promise<{ success: boolean }> {
  return request<{ success: boolean }>(`/listings/${id}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  });
}
