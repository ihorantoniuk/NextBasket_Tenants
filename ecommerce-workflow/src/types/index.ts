export interface Product {
  id: string;
  tenantId: string;
  name: string;
  description: string;
  tags: string[];
  price: number;
  stock: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface Cart {
  id: string;
  tenantId: string;
  items: CartItem[];
  createdAt: Date;
  updatedAt: Date;
}

export interface CartItem {
  productId: string;
  quantity: number;
  price: number;
}

export interface Order {
  id: string;
  tenantId: string;
  cartId: string;
  items: OrderItem[];
  subtotal: number;
  discount: number;
  vat: number;
  total: number;
  promoCode?: string;
  upsellSuggestions?: UpsellSuggestion[];
  status: OrderStatus;
  createdAt: Date;
}

export interface OrderItem {
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export interface UpsellSuggestion {
  productId: string;
  productName: string;
  reason: string;
  confidence: number;
}

export enum OrderStatus {
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  SHIPPED = 'shipped',
  DELIVERED = 'delivered',
  CANCELLED = 'cancelled'
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginationParams {
  page?: number;
  limit?: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface CheckoutRequest {
  cartId: string;
  tenantId: string;
  promoCode?: string;
}

export interface CheckoutResponse {
  orderId: string;
  subtotal: number;
  discount: number;
  vat: number;
  total: number;
  upsellSuggestions?: UpsellSuggestion[];
}

export interface CreateProductRequest {
  name: string;
  description: string;
  tags: string[];
  price: number;
  stock: number;
}

export interface UpdateProductRequest {
  name?: string;
  description?: string;
  tags?: string[];
  price?: number;
  stock?: number;
}

export interface AddToCartRequest {
  productId: string;
  quantity: number;
}

export interface UpdateCartItemRequest {
  productId: string;
  quantity: number;
}
