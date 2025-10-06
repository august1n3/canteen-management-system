export interface QueueItem {
  orderId: string;
  orderNumber: string;
  customerName: string;
  items: {
    name: string;
    quantity: number;
  }[];
  estimatedReadyTime: Date;
  priority: 'normal' | 'high' | 'urgent';
  status: 'waiting' | 'preparing' | 'ready';
  position: number;
  createdAt: Date;
}

export interface QueueStats {
  totalOrders: number;
  averageWaitTime: number;
  currentWaitTime: number;
  ordersInQueue: number;
  ordersReady: number;
  ordersCompleted: number;
}

export interface QueueUpdate {
  type: 'order_added' | 'order_updated' | 'order_removed' | 'queue_cleared';
  order?: QueueItem;
  orderId?: string;
  newPosition?: number;
  estimatedTime?: number;
}

export interface PublicQueueDisplay {
  currentOrders: QueueItem[];
  readyOrders: string[]; // Order numbers
  stats: QueueStats;
  lastUpdated: Date;
}

export interface WebSocketMessage {
  type: 'queue_update' | 'order_status' | 'payment_status' | 'notification';
  payload: any;
  timestamp: Date;
  userId?: string;
  channel?: string;
}