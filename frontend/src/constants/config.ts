export const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';
export const SOCKET_URL = process.env.REACT_APP_SOCKET_URL || 'http://localhost:3001';

export const APP_CONFIG = {
  APP_NAME: 'Canteen Management System',
  VERSION: '1.0.0',
  COMPANY: 'Your Institution',
  SUPPORT_EMAIL: 'support@institution.edu',
  PHONE: '+1 (555) 123-4567'
};

export const PAGINATION = {
  DEFAULT_PAGE_SIZE: 10,
  MAX_PAGE_SIZE: 100
};

export const CACHE_TIMES = {
  MENU_ITEMS: 5 * 60 * 1000, // 5 minutes
  ORDERS: 30 * 1000, // 30 seconds
  QUEUE: 10 * 1000, // 10 seconds
  ANALYTICS: 5 * 60 * 1000 // 5 minutes
};

export const ORDER_STATUSES = {
  PENDING: 'PENDING',
  CONFIRMED: 'CONFIRMED',
  PREPARING: 'PREPARING',
  READY: 'READY',
  COMPLETED: 'COMPLETED',
  CANCELLED: 'CANCELLED'
};

export const USER_ROLES = {
  ADMIN: 'ADMIN',
  STAFF: 'STAFF',
  KITCHEN: 'KITCHEN',
  STUDENT: 'STUDENT'
};

export const PAYMENT_METHODS = {
  CASH: 'CASH',
  MOBILE_MONEY: 'MOBILE_MONEY'
};

export const ITEM_CATEGORIES = {
  MAIN_COURSE: 'MAIN_COURSE',
  APPETIZER: 'APPETIZER',
  BEVERAGE: 'BEVERAGE',
  DESSERT: 'DESSERT',
  SNACK: 'SNACK'
};