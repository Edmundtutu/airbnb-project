// Basic type exports
export * from './auth';
export * from './products';
export * from './orders';
export * from './shops';
export * from './properties';
export * from './listings';
export * from './bookings';
export * from './api';
export * from './test-data';

// Re-export main types for convenience
export type { AuthUser as User } from './auth';
export type { Shop } from './shops';
export type { Product } from './products';
export type { Post, Comment } from './shops';

// Influencer threshold constant
export const INFLUENCER_THRESHOLD = 1000;