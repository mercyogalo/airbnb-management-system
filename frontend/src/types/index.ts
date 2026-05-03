export type UserRole = 'admin' | 'user';

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

export type PropertyListingStatus = 'active' | 'inactive';

export interface BlockedPeriod {
  _id?: string;
  start: string;
  end: string;
  reason: string;
  type: 'full_day' | 'time_range';
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
  bedrooms?: number;
  bathrooms?: number;
  images: string[];
  rules: string[];
  amenities?: string[];
  status: PropertyListingStatus;
  owner: {
    _id: string;
    name: string;
    email: string;
  };
  blockedPeriods?: BlockedPeriod[];
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
  status: 'awaiting_payment' | 'confirmed' | 'cancelled' | 'completed' | 'expired';
  paymentMethod?: 'mpesa';
  paymentReference?: string;
  transactionId?: string;
  paidAt?: string;
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
