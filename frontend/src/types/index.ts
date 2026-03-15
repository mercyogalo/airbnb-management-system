export type UserRole = 'admin' | 'owner' | 'user';

export interface User {
  id: string;
  _id?: string;
  name: string;
  email: string;
  role: UserRole;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface AuthResponse {
  user: User;
  token: string;
}

export interface Property {
  _id: string;
  name: string;
  description: string;
  location: {
    address: string;
    city: string;
    country: string;
    coordinates?: {
      lat: number;
      lng: number;
    };
  };
  pricePerNight: number;
  mainImage?: string;
  maxGuests: number;
  images: string[];
  rules: string[];
  status: 'pending' | 'approved' | 'rejected';
  owner: {
    _id: string;
    name: string;
    email: string;
  };
  blockedDates: string[];
  createdAt: string;
  updatedAt?: string;
}

export interface Booking {
  _id: string;
  property: Property;
  guest: {
    _id: string;
    name: string;
    email: string;
  };
  checkIn: string;
  checkOut: string;
  guests: number;
  totalPrice: number;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  specialRequests?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface PropertyFilters {
  city?: string;
  minPrice?: number;
  maxPrice?: number;
  guests?: number;
}

export interface ApiErrorShape {
  message?: string | string[];
  error?: string;
  statusCode?: number;
}
