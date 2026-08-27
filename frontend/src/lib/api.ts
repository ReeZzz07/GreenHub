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

export type UserVerificationStatus = 'VERIFIED' | 'PENDING_MODERATION';

export interface ApiUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  phone: string | null;
  avatarUrl: string | null;
  pendingEmail: string | null;
  verificationStatus: UserVerificationStatus;
  rejectionReason?: string | null;
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
  consentToDataProcessing: boolean;
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

export function apiLogout(token: string): Promise<void> {
  return request<void>('/auth/logout', {
    method: 'POST',
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
  views: number;
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
  sellerId?: string;
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

export function fetchSimilarListings(id: string): Promise<Listing[]> {
  return request<Listing[]>(`/listings/${id}/similar`);
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

export function updateListing(
  id: string,
  payload: Partial<CreateListingPayload>,
  token: string,
): Promise<Listing> {
  return request<Listing>(`/listings/${id}`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify(payload),
  });
}

export function updateListingAvailability(
  id: string,
  action: 'mark_sold' | 'relist',
  token: string,
): Promise<Listing> {
  return request<Listing>(`/listings/${id}/availability`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify({ action }),
  });
}

export function fetchModerationQueue(token: string): Promise<Listing[]> {
  return request<Listing[]>('/listings/moderation-queue', {
    headers: { Authorization: `Bearer ${token}` },
  });
}

export function fetchListingForReview(id: string, token: string): Promise<Listing> {
  return request<Listing>(`/listings/${id}/review`, {
    headers: { Authorization: `Bearer ${token}` },
  });
}

export interface ModeratePayload {
  action: 'approve' | 'reject';
  reason?: string;
}

export function moderateListing(id: string, payload: ModeratePayload, token: string): Promise<Listing> {
  return request<Listing>(`/listings/${id}/moderate`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify(payload),
  });
}

export interface ChatMessage {
  id: string;
  conversationId: string;
  senderId: string;
  content: string;
  createdAt: string;
  sender: { id: string; name: string };
}

export interface Conversation {
  id: string;
  listingId: string;
  buyerId: string;
  sellerId: string;
  createdAt: string;
  updatedAt: string;
  lastMessageAt: string;
  listing: { id: string; title: string; images: string[]; price: number; sellerId: string };
  buyer: { id: string; name: string };
  seller: { id: string; name: string };
  messages?: ChatMessage[];
}

export function fetchConversations(token: string): Promise<Conversation[]> {
  return request<Conversation[]>('/conversations', {
    headers: { Authorization: `Bearer ${token}` },
  });
}

export function createConversation(listingId: string, token: string): Promise<Conversation> {
  return request<Conversation>('/conversations', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify({ listingId }),
  });
}

export function fetchConversation(id: string, token: string): Promise<Conversation> {
  return request<Conversation>(`/conversations/${id}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
}

export function fetchConversationMessages(id: string, token: string): Promise<ChatMessage[]> {
  return request<ChatMessage[]>(`/conversations/${id}/messages`, {
    headers: { Authorization: `Bearer ${token}` },
  });
}

export function fetchFavorites(token: string): Promise<Listing[]> {
  return request<Listing[]>('/favorites/mine', {
    headers: { Authorization: `Bearer ${token}` },
  });
}

export function fetchFavoriteIds(token: string): Promise<string[]> {
  return request<string[]>('/favorites/mine/ids', {
    headers: { Authorization: `Bearer ${token}` },
  });
}

export function addFavorite(listingId: string, token: string): Promise<{ success: boolean }> {
  return request<{ success: boolean }>(`/favorites/${listingId}`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
  });
}

export function removeFavorite(listingId: string, token: string): Promise<{ success: boolean }> {
  return request<{ success: boolean }>(`/favorites/${listingId}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  });
}

export type SettingKey =
  | 'YOOKASSA_SHOP_ID'
  | 'YOOKASSA_SECRET_KEY'
  | 'PLANT_ID_API_KEY'
  | 'LLM_API_KEY'
  | 'LLM_API_URL'
  | 'LLM_MODEL';

export type SettingsStatus = Record<SettingKey, boolean>;

export function fetchSettingsStatus(token: string): Promise<SettingsStatus> {
  return request<SettingsStatus>('/admin/settings', {
    headers: { Authorization: `Bearer ${token}` },
  });
}

export function updateSettings(
  values: Partial<Record<SettingKey, string>>,
  token: string,
): Promise<SettingsStatus> {
  return request<SettingsStatus>('/admin/settings', {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify(values),
  });
}

export type OrderStatus = 'PENDING' | 'PAID' | 'CANCELLED' | 'EXPIRED';

export interface Review {
  id: string;
  rating: number;
  comment: string | null;
  sellerReply: string | null;
  orderId: string;
  reviewerId: string;
  sellerId: string;
  reviewer: { id: string; name: string; avatarUrl: string | null };
  createdAt: string;
  updatedAt: string;
}

export interface Order {
  id: string;
  amount: number;
  quantity: number;
  status: OrderStatus;
  paymentUrl: string | null;
  paymentId: string | null;
  listingId: string;
  listing: { id: string; title: string; images: string[]; sellerId: string };
  buyerId: string;
  review: Review | null;
  createdAt: string;
  updatedAt: string;
}

export function createOrder(listingId: string, quantity: number, token: string): Promise<Order> {
  return request<Order>('/orders', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify({ listingId, quantity }),
  });
}

export function fetchMyOrders(token: string): Promise<Order[]> {
  return request<Order[]>('/orders/mine', {
    headers: { Authorization: `Bearer ${token}` },
  });
}

export function fetchOrder(id: string, token: string): Promise<Order> {
  return request<Order>(`/orders/${id}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
}

export interface RecognitionResult {
  recognized: boolean;
  name?: string;
  commonNames?: string[];
  confidence?: number;
}

export async function recognizePlant(file: File, token: string): Promise<RecognitionResult> {
  const formData = new FormData();
  formData.append('file', file);

  const res = await fetch(`${API_URL}/ai/recognize`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: formData,
  });
  return handleResponse<RecognitionResult>(res);
}

export interface GenerateDescriptionPayload {
  title: string;
  categoryName: string;
  lightRequirements?: string;
  waterRequirements?: string;
  careInstructions?: string[];
}

export interface GenerateDescriptionResult {
  description: string;
  flagged: boolean;
  flagReasons: string[];
}

export function generateDescription(
  payload: GenerateDescriptionPayload,
  token: string,
): Promise<GenerateDescriptionResult> {
  return request<GenerateDescriptionResult>('/ai/generate-description', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify(payload),
  });
}

// Имя/телефон — не чувствительные поля, применяются сразу без модерации
export function updateProfile(
  userId: string,
  data: { name?: string; phone?: string },
  token: string,
): Promise<ApiUser> {
  return request<ApiUser>(`/users/${userId}`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify(data),
  });
}

export function changePassword(
  currentPassword: string,
  newPassword: string,
  token: string,
): Promise<{ success: boolean }> {
  return request<{ success: boolean }>('/users/me/change-password', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify({ currentPassword, newPassword }),
  });
}

// Email — логин пользователя, поэтому не применяется сразу: уходит на модерацию
export function requestEmailChange(newEmail: string, token: string): Promise<ApiUser> {
  return request<ApiUser>('/users/me/email-change-request', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify({ newEmail }),
  });
}

export async function uploadAvatar(file: File, token: string): Promise<ApiUser> {
  const formData = new FormData();
  formData.append('file', file);

  const res = await fetch(`${API_URL}/users/me/avatar`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: formData,
  });
  return handleResponse<ApiUser>(res);
}

export function fetchVerificationQueue(token: string): Promise<ApiUser[]> {
  return request<ApiUser[]>('/users/verification-queue', {
    headers: { Authorization: `Bearer ${token}` },
  });
}

export interface ModerateVerificationPayload {
  action: 'approve' | 'reject';
  reason?: string;
}

export function moderateVerification(
  userId: string,
  payload: ModerateVerificationPayload,
  token: string,
): Promise<ApiUser> {
  return request<ApiUser>(`/users/${userId}/moderate-verification`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify(payload),
  });
}

export interface SellerSummary {
  id: string;
  name: string;
  avatarUrl: string | null;
  role: UserRole;
  createdAt: string;
  avgRating: number;
  reviewsCount: number;
  breakdown: { star: number; count: number }[];
}

export function fetchSellerSummary(id: string): Promise<SellerSummary> {
  return request<SellerSummary>(`/sellers/${id}`);
}

export function fetchSellerReviews(id: string): Promise<Review[]> {
  return request<Review[]>(`/sellers/${id}/reviews`);
}

export interface CreateReviewPayload {
  rating: number;
  comment?: string;
}

export function createReview(orderId: string, payload: CreateReviewPayload, token: string): Promise<Review> {
  return request<Review>(`/orders/${orderId}/review`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify(payload),
  });
}

export function replyToReview(reviewId: string, reply: string, token: string): Promise<Review> {
  return request<Review>(`/reviews/${reviewId}/reply`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify({ reply }),
  });
}
