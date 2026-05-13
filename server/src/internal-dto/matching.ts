import type {
  CareRequirements,
  LocationPoint,
  RideRequirements,
  ServiceType,
  TrunkLevel,
  VehicleType,
} from '@mimi/shared';

import type { InternalRequestMeta } from './common.js';

export type CaregiverServiceType = Extract<
  ServiceType,
  | 'buddy'
  | 'feeding'
  | 'cleaning'
  | 'playtime'
  | 'temporary_care'
  | 'hospital'
  | 'medication'
  | 'multi_day_care'
  | 'grooming_pickup'
>;

export type DriverServiceType = Extract<
  ServiceType,
  'taxi' | 'ride' | 'pet_friendly_taxi' | 'carpool' | 'escort'
>;

export interface CaregiverMatchDemand {
  id: string;
  userId: string;
  district?: string;
  serviceType: CaregiverServiceType;
  budgetMin: number;
  budgetMax: number;
  serviceTime: string;
  pickup?: LocationPoint;
  careRequirements?: CareRequirements;
}

export interface CaregiverMatchRequest {
  meta: InternalRequestMeta;
  demand: CaregiverMatchDemand;
  page?: number;
  pageSize?: number;
}

export interface CaregiverProfileSnapshot {
  nickname: string;
  avatar?: string;
  catCareScore?: number;
  communicationScore?: number;
  punctualityScore?: number;
  tags: string[];
  completedOrderCount: number;
  supportsHomeVisit?: boolean;
  supportsMedication?: boolean;
  supportsMultiDayCare?: boolean;
}

export interface CaregiverMatchCandidate {
  providerUserId: string;
  score: number;
  distanceKm?: number;
  reasons: string[];
  priceHintMin?: number;
  priceHintMax?: number;
  profileSnapshot: CaregiverProfileSnapshot;
}

export interface CaregiverMatchResponse {
  requestId: string;
  candidates: CaregiverMatchCandidate[];
}

export interface DriverMatchDemand {
  id: string;
  userId: string;
  district?: string;
  serviceType: DriverServiceType;
  budgetMin: number;
  budgetMax: number;
  serviceTime: string;
  pickup?: LocationPoint;
  destination?: LocationPoint;
  rideRequirements?: RideRequirements;
}

export interface DriverMatchRequest {
  meta: InternalRequestMeta;
  demand: DriverMatchDemand;
  page?: number;
  pageSize?: number;
}

export interface DriverProfileSnapshot {
  nickname: string;
  avatar?: string;
  petFriendlyScore?: number;
  drivingStabilityScore?: number;
  cleanlinessScore?: number;
  punctualityScore?: number;
  tags: string[];
  completedOrderCount: number;
}

export interface VehicleSnapshot {
  vehicleType: VehicleType;
  trunkLevel?: TrunkLevel;
  supportsCatBag: boolean;
  supportsCrate: boolean;
  supportsStroller: boolean;
  supportsMultiPet: boolean;
  petFriendly: boolean;
  petFriendlyTags: string[];
}

export interface DriverMatchCandidate {
  providerUserId: string;
  vehicleId?: string;
  score: number;
  distanceKm?: number;
  etaMinutes?: number;
  reasons: string[];
  profileSnapshot: DriverProfileSnapshot;
  vehicleSnapshot?: VehicleSnapshot;
}

export interface DriverMatchResponse {
  requestId: string;
  candidates: DriverMatchCandidate[];
}
