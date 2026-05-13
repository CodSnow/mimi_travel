import type { ServiceType } from './demand.js';

export type UserRole = 'customer' | 'provider' | 'admin';
export type ProviderStatus = 'pending' | 'approved' | 'rejected';
export type VehicleType = 'economy' | 'comfort' | 'suv' | 'business_van';
export type TrunkLevel = 'small' | 'medium' | 'large';

export interface UserProfile {
  id: string;
  nickname: string;
  phone: string;
  avatar: string;
  role: UserRole;
  verified: boolean;
  createdAt: string;
}

export interface ProviderProfile {
  userId: string;
  status: ProviderStatus;
  services: ServiceType[];
  intro: string;
  serviceRadiusKm: number;
  baseDistrict: string;
  score: number;
  completedOrderCount: number;
  catCareScore?: number;
  communicationScore?: number;
  punctualityScore?: number;
  emergencyHandlingScore?: number;
  petFriendlyScore?: number;
  drivingStabilityScore?: number;
  cleanlinessScore?: number;
  supportsHomeVisit?: boolean;
  supportsMedication?: boolean;
  supportsMultiDayCare?: boolean;
  supportsEmergencyOrder?: boolean;
  catCareTags?: string[];
}

export interface VehicleProfile {
  id: string;
  userId: string;
  vehicleType: VehicleType;
  plateMasked: string;
  seats: number;
  trunkLevel: TrunkLevel;
  supportsCatBag: boolean;
  supportsCrate: boolean;
  supportsStroller: boolean;
  supportsMultiPet: boolean;
  petFriendly: boolean;
  petFriendlyTags: string[];
}
