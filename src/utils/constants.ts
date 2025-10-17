// App constants
export const APP_NAME = 'Shopify PWA';
export const API_BASE_URL = '/api';

export const ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  REGISTER: '/register',
  EXPLORE: '/explore',
  PRODUCT: '/product/:id',
  SHOP: '/shop/:id',
  CART: '/cart',
  ORDERS: '/orders',
  PROFILE: '/profile',
  VENDOR_DASHBOARD: '/vendor/dashboard',
} as const;

export const USER_ROLES = {
  GUEST: 'guest',
  CUSTOMER: 'customer',
  VENDOR: 'vendor',
} as const;

export const INFLUENCER_THRESHOLD = 1000; // followers needed to be considered influencer