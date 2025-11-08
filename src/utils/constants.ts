// App constants
export const APP_NAME = 'CavaYo';
export const API_BASE_URL = '/api';

export const ROUTES = {
  FEED: '/',
  LOGIN: '/login',
  REGISTER: '/register',
  DISCOVER: '/discover',
  LISTING: '/listing/:id',
  PROPERTY: '/property/:id',
  BOOKINGS: '/bookings',
  PROFILE: '/profile',
  HOST_DASHBOARD: '/host/dashboard',
} as const;

export const USER_ROLES = {
  GUEST: 'guest',
  HOST: 'host',
  ADMIN: 'admin',
} as const;

export const INFLUENCER_THRESHOLD = 1000; // followers needed to be considered influencer