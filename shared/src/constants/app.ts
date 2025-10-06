export const APP_CONFIG = {
  NAME: 'Canteen Management System',
  VERSION: '1.0.0',
  API_VERSION: 'v1',
} as const;

export const WEBSOCKET_EVENTS = {
  ORDER_STATUS_UPDATE: 'order_status_update',
  QUEUE_UPDATE: 'queue_update',
  PAYMENT_STATUS_UPDATE: 'payment_status_update',
  MENU_UPDATE: 'menu_update',
  NOTIFICATION: 'notification',
  CONNECT: 'connect',
  DISCONNECT: 'disconnect',
} as const;

export const ORDER_CONFIG = {
  MAX_ITEMS_PER_ORDER: 20,
  MIN_ORDER_VALUE: 1.0,
  MAX_ORDER_VALUE: 1000.0,
  DEFAULT_PREPARATION_TIME: 15, // minutes
  QUEUE_REFRESH_INTERVAL: 5000, // ms
} as const;

export const PAYMENT_CONFIG = {
  TIMEOUT: 300000, // 5 minutes in ms
  RETRY_ATTEMPTS: 3,
  SUPPORTED_CURRENCIES: ['GHS', 'USD'] as const,
  MIN_AMOUNT: 0.50,
  MAX_AMOUNT: 5000.0,
} as const;

export const PAGINATION = {
  DEFAULT_PAGE_SIZE: 20,
  MAX_PAGE_SIZE: 100,
  DEFAULT_PAGE: 1,
} as const;

export const VALIDATION = {
  PASSWORD_MIN_LENGTH: 8,
  PHONE_REGEX: /^[\+]?[1-9][\d]{0,15}$/,
  EMAIL_REGEX: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  STUDENT_ID_REGEX: /^[A-Z0-9]{6,10}$/,
} as const;

export const ERROR_CODES = {
  // Authentication errors
  INVALID_CREDENTIALS: 'INVALID_CREDENTIALS',
  TOKEN_EXPIRED: 'TOKEN_EXPIRED',
  TOKEN_INVALID: 'TOKEN_INVALID',
  INSUFFICIENT_PERMISSIONS: 'INSUFFICIENT_PERMISSIONS',
  
  // Order errors
  ORDER_NOT_FOUND: 'ORDER_NOT_FOUND',
  INVALID_ORDER_STATUS: 'INVALID_ORDER_STATUS',
  ORDER_CANNOT_BE_MODIFIED: 'ORDER_CANNOT_BE_MODIFIED',
  INSUFFICIENT_STOCK: 'INSUFFICIENT_STOCK',
  
  // Payment errors
  PAYMENT_FAILED: 'PAYMENT_FAILED',
  PAYMENT_TIMEOUT: 'PAYMENT_TIMEOUT',
  INVALID_PAYMENT_METHOD: 'INVALID_PAYMENT_METHOD',
  PAYMENT_ALREADY_PROCESSED: 'PAYMENT_ALREADY_PROCESSED',
  
  // Menu errors
  MENU_ITEM_NOT_FOUND: 'MENU_ITEM_NOT_FOUND',
  MENU_ITEM_UNAVAILABLE: 'MENU_ITEM_UNAVAILABLE',
  INVALID_MENU_CATEGORY: 'INVALID_MENU_CATEGORY',
  
  // General errors
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  NOT_FOUND: 'NOT_FOUND',
  INTERNAL_SERVER_ERROR: 'INTERNAL_SERVER_ERROR',
  RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',
} as const;

export const API_ROUTES = {
  // Auth routes
  AUTH: {
    LOGIN: '/auth/login',
    REGISTER: '/auth/register',
    REFRESH: '/auth/refresh',
    LOGOUT: '/auth/logout',
    PROFILE: '/auth/profile',
  },
  
  // Order routes
  ORDERS: {
    BASE: '/orders',
    BY_ID: (id: string) => `/orders/${id}`,
    BY_USER: (userId: string) => `/orders/user/${userId}`,
    CURRENT: '/orders/current',
    HISTORY: '/orders/history',
    STATS: '/orders/stats',
  },
  
  // Menu routes
  MENU: {
    BASE: '/menu',
    BY_ID: (id: string) => `/menu/${id}`,
    BY_CATEGORY: (category: string) => `/menu/category/${category}`,
    AVAILABLE: '/menu/available',
    POPULAR: '/menu/popular',
    STATS: '/menu/stats',
  },
  
  // Payment routes
  PAYMENTS: {
    BASE: '/payments',
    BY_ID: (id: string) => `/payments/${id}`,
    PROCESS: '/payments/process',
    VERIFY: '/payments/verify',
    REFUND: '/payments/refund',
    STATS: '/payments/stats',
  },
  
  // Queue routes
  QUEUE: {
    CURRENT: '/queue/current',
    PUBLIC: '/queue/public',
    STATS: '/queue/stats',
    POSITION: (orderId: string) => `/queue/position/${orderId}`,
  },
  
  // Reports routes
  REPORTS: {
    BASE: '/reports',
    SALES: '/reports/sales',
    ORDERS: '/reports/orders',
    PAYMENTS: '/reports/payments',
    MENU: '/reports/menu',
  },
} as const;