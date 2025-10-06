### Login
- **POST** `/api/auth/login`
- **Body**: { email: string, password: string }
- **Response**: { token: string, user: UserData }

### Logout
- **POST** `/api/auth/logout`
- **Auth**: Required
- **Response**: { success: boolean }

### Get Current User
- **GET** `/api/auth/me`
- **Auth**: Required
- **Response**: { user: UserData }

### Register Student
- **POST** `/api/auth/register/student`
- **Body**: { email: string, password: string, name: string, studentId: string }
- **Response**: { user: UserData }

### Get All Menu Items
- **GET** `/api/menu`
- **Query Params**: category?: string, available?: boolean, limit?: number, offset?: number
- **Response**: { items: MenuItem[] }

### Get Single Menu Item
- **GET** `/api/menu/:id`
- **Response**: { item: MenuItem }

### Create Menu Item
- **POST** `/api/menu`
- **Auth**: Required (Staff/Admin)
- **Body**: { name: string, price: number, category: string, ... }
- **Response**: { item: MenuItem }

### Update Menu Item
- **PUT** `/api/menu/:id`
- **Auth**: Required (Staff/Admin)
- **Body**: { name?: string, price?: number, ... }
- **Response**: { item: MenuItem }

### Update Item Availability
- **PATCH** `/api/menu/:id/availability`
- **Auth**: Required (Staff/Admin)
- **Body**: { stockLevel?: number, isAvailable?: boolean }
- **Response**: { item: MenuItem }

### Delete Menu Item
- **DELETE** `/api/menu/:id`
- **Auth**: Required (Admin)
- **Response**: { success: boolean }

### Get Orders
- **GET** `/api/orders`
- **Auth**: Required
- **Query Params**: status?: string, limit?: number, offset?: number, date?: string
- **Response**: { orders: Order[] }

### Get Single Order
- **GET** `/api/orders/:id`
- **Auth**: Required
- **Response**: { order: Order }

### Create Order
- **POST** `/api/orders`
- **Auth**: Required
- **Body**: { 
    items: Array<{ menuItemId: string, quantity: number, specialInstructions?: string }>,
    specialInstructions?: string 
  }
- **Response**: { order: Order }

### Update Order Status
- **PATCH** `/api/orders/:id/status`
- **Auth**: Required (Staff/Kitchen)
- **Body**: { status: OrderStatus, notes?: string }
- **Response**: { order: Order }

### Cancel Order
- **PATCH** `/api/orders/:id/cancel`
- **Auth**: Required
- **Body**: { reason?: string }
- **Response**: { success: boolean }

### Get Order Analytics
- **GET** `/api/orders/analytics/summary`
- **Auth**: Required (Staff/Admin)
- **Query Params**: startDate?: string, endDate?: string
- **Response**: { 
    totalOrders: number,
    completedOrders: number,
    cancelledOrders: number,
    pendingOrders: number,
    totalRevenue: number,
    avgOrderValue: number,
    completionRate: number
  }

### Get Payments
- **GET** `/api/payments`
- **Auth**: Required (Staff/Admin)
- **Query Params**: status?: string, method?: string, limit?: number, offset?: number
- **Response**: { payments: Payment[] }

### Get Single Payment
- **GET** `/api/payments/:id`
- **Auth**: Required
- **Response**: { payment: Payment }

### Process Cash Payment
- **POST** `/api/payments/cash`
- **Auth**: Required (Staff)
- **Body**: { orderId: string, amountReceived: number, notes?: string }
- **Response**: { payment: Payment }

### Initiate Mobile Money Payment
- **POST** `/api/payments/mobile-money`
- **Auth**: Required
- **Body**: { orderId: string, phoneNumber: string, provider: string }
- **Response**: { payment: Payment }

### Verify Mobile Money Payment
- **GET** `/api/payments/mobile-money/:transactionId/verify`
- **Auth**: Required
- **Response**: { status: PaymentStatus }

### Get Payment Analytics
- **GET** `/api/payments/analytics/summary`
- **Auth**: Required (Staff/Admin)
- **Query Params**: startDate?: string, endDate?: string
- **Response**: { analytics: PaymentAnalytics }

### Get Queue Status
- **GET** `/api/queue/status`
- **Query Params**: limit?: number
- **Response**: { queueItems: QueueItem[] }

### Get Order Position
- **GET** `/api/queue/position/:orderId`
- **Response**: { position: number }

### Update Order Priority
- **PATCH** `/api/queue/priority/:orderId`
- **Auth**: Required (Kitchen/Staff)
- **Body**: { priority: string, reason?: string }
- **Response**: { success: boolean }

### Get Queue Analytics
- **GET** `/api/queue/analytics`
- **Auth**: Required (Staff/Admin)
- **Query Params**: date?: string
- **Response**: { analytics: QueueAnalytics }

### Get Daily Sales Report
- **GET** `/api/reports/sales/daily`
- **Auth**: Required (Staff/Admin)
- **Query Params**: date?: string
- **Response**: { report: DailySalesReport }

### Get Monthly Sales Report
- **GET** `/api/reports/sales/monthly`
- **Auth**: Required (Staff/Admin)
- **Query Params**: month?: number, year?: number
- **Response**: { report: MonthlySalesReport }

### Get Inventory Report
- **GET** `/api/reports/inventory`
- **Auth**: Required (Staff/Admin)
- **Response**: { report: InventoryReport }

### Get Customer Report
- **GET** `/api/reports/customers`
- **Auth**: Required (Staff/Admin)
- **Query Params**: startDate?: string, endDate?: string
- **Response**: { report: CustomerReport }

### Generate Custom Report
- **POST** `/api/reports/custom`
- **Auth**: Required (Admin)
- **Body**: { 
    startDate: string,
    endDate: string,
    metrics: string[],
    groupBy?: string,
    filters?: any
  }
- **Response**: { report: CustomReport }

### Common Response Format:
{
  success: boolean;
  data?: any;
  error?: {
    message: string;
    code?: string;
  }
}