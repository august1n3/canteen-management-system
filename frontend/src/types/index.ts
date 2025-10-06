export interface User {
  id: string;
  email: string;
  name: string;
  role: 'ADMIN' | 'STAFF' | 'KITCHEN' | 'STUDENT';
  studentId?: string;
  isActive: boolean;
  createdAt: string;
}

export interface MenuItem {
  id: string;
  name: string;
  description?: string;
  price: number;
  category: 'MAIN_COURSE' | 'APPETIZER' | 'BEVERAGE' | 'DESSERT' | 'SNACK';
  imageUrl?: string;
  status: 'AVAILABLE' | 'UNAVAILABLE';
  preparationTime?: number;
  nutritionalInfo?: any;
  allergens?: string[];
  availability?: ItemAvailability;
  createdAt: string;
  updatedAt: string;
}

export interface ItemAvailability {
  id: string;
  menuItemId: string;
  stockLevel: number;
  isAvailable: boolean;
  lastUpdated: string;
}

export interface Order {
  id: string;
  userId: string;
  status: 'PENDING' | 'CONFIRMED' | 'PREPARING' | 'READY' | 'COMPLETED' | 'CANCELLED';
  totalAmount: number;
  specialInstructions?: string;
  estimatedCompletionTime?: string;
  completedAt?: string;
  items: OrderItem[];
  user: User;
  payment?: Payment;
  createdAt: string;
  updatedAt: string;
}

export interface OrderItem {
  id: string;
  orderId: string;
  menuItemId: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  specialInstructions?: string;
  menuItem: MenuItem;
}

export interface Payment {
  id: string;
  orderId: string;
  method: 'CASH' | 'MOBILE_MONEY';
  status: 'PENDING' | 'COMPLETED' | 'FAILED';
  amount: number;
  amountReceived?: number;
  changeAmount?: number;
  phoneNumber?: string;
  provider?: string;
  transactionId: string;
  externalTransactionId?: string;
  processedBy?: string;
  initiatedBy?: string;
  failureReason?: string;
  notes?: string;
  completedAt?: string;
  createdAt: string;
}

export interface CartItem {
  menuItemId: string;
  name: string;
  price: number;
  quantity: number;
  specialInstructions?: string;
}

export interface QueueItem {
  id: string;
  queuePosition: number;
  customerName: string;
  studentId?: string;
  status: string;
  itemCount: number;
  items: Array<{
    name: string;
    quantity: number;
    category: string;
  }>;
  orderTime: string;
  estimatedCompletionTime?: string;
  totalAmount: number;
  waitTime: number;
}

export interface QueueStatus {
  queue: QueueItem[];
  statistics: {
    totalOrders: number;
    confirmedOrders: number;
    preparingOrders: number;
    readyOrders: number;
    avgWaitTime: number;
    estimatedWaitTime: number;
  };
  lastUpdated: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    message: string;
    details?: any;
  };
}

export interface PaginationParams {
  limit?: number;
  offset?: number;
  page?: number;
}

export interface DateRange {
  startDate: string;
  endDate: string;
}

export interface SalesMetrics {
  totalRevenue: number;
  totalOrders: number;
  avgOrderValue: number;
  completionRate: number;
}

export interface InventoryMetrics {
  totalItems: number;
  lowStockItems: number;
  outOfStockItems: number;
  totalValue: number;
}

export interface SystemLog {
  id: string;
  action: string;
  userId?: string;
  details: any;
  createdAt: string;
}