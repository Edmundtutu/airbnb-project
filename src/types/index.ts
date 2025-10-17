// Basic type exports
export * from './auth';
export * from './listings';
export * from './bookings';
export * from './properties';
export * from './api';
export * from './test-data';

// Re-export main types for convenience
export type { AuthUser as User } from './auth';
export type { Property } from './properties';
export type { Listing } from './listings';
export type { Booking } from './bookings';
export type { Post, Comment } from './properties';

// Legacy exports for backward compatibility
export * from './listings'; // This will include Product interface
export * from './bookings'; // This will include Order interface
export * from './properties'; // This will include Shop interface

// Influencer threshold constant
export const INFLUENCER_THRESHOLD = 1000;