export enum OrderStatus {
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  PREPARING = 'preparing',
  READY = 'ready',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled'
}

export enum OrderPriority {
  NORMAL = 'normal',
  HIGH = 'high',
  URGENT = 'urgent'
}

export interface OrderItem {
  id: string;
  menuItemId: string;
  quantity: number;
  price: number;
  specialInstructions?: string;
  menuItem?: MenuItem;
}

export interface Order {
  id: string;
  orderNumber: string;
  userId: string;
  items: OrderItem[];
  totalAmount: number;
  status: OrderStatus;
  priority: OrderPriority;
  paymentStatus: PaymentStatus;
  paymentId?: string;
  estimatedReadyTime?: Date;
  actualReadyTime?: Date;
  queuePosition?: number;
  specialInstructions?: string;
  createdAt: Date;
  updatedAt: Date;
  user?: User;
  payment?: Payment;
}

export interface CreateOrderRequest {
  items: {
    menuItemId: string;
    quantity: number;
    specialInstructions?: string;
  }[];
  paymentMethod: PaymentMethod;
  specialInstructions?: string;
}

export interface OrderStatusUpdate {
  orderId: string;
  status: OrderStatus;
  estimatedReadyTime?: Date;
  queuePosition?: number;
  message?: string;
}

export interface OrderStats {
  totalOrders: number;
  pendingOrders: number;
  completedOrders: number;
  cancelledOrders: number;
  averageOrderValue: number;
  averagePreparationTime: number;
}

// Import types from other files
import { User } from './user';
import { MenuItem } from './menu';
import { Payment, PaymentStatus, PaymentMethod } from './payment';