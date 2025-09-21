export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  name: string;
  email: string;
  password: string;
  password_confirmation: string;
  role?: 'guest' | 'host' | 'admin';
}

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: 'guest' | 'host' | 'admin';
  avatar?: string;
  phone?: string;
  location?: {
    lat: number;
    lng: number;
    address: string;
  };
  followers: number;
  following: number;
  isInfluencer: boolean; // computed: followers >= INFLUENCER_THRESHOLD
  verified: boolean;
  createdAt: Date;
}

export interface AuthState {
  user: AuthUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}