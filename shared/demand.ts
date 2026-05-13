import type { LocationPoint } from './location.js';

export type ServiceType =
  | 'buddy'
  | 'feeding'
  | 'cleaning'
  | 'playtime'
  | 'temporary_care'
  | 'hospital'
  | 'medication'
  | 'multi_day_care'
  | 'grooming_pickup'
  | 'taxi'
  | 'ride'
  | 'pet_friendly_taxi'
  | 'carpool'
  | 'escort'
  | 'shipping_assist';

export interface CareRequirements {
  needHomeVisit?: boolean;
  needCleaning?: boolean;
  needMedication?: boolean;
  needPhotoFeedback?: boolean;
  needVideoFeedback?: boolean;
  needMultiDayCare?: boolean;
  visitTimesPerDay?: number;
  estimatedDurationMinutes?: number;
  hasMultiplePets?: boolean;
  caregiverPreference?: 'any' | 'male' | 'female';
  requireCatCareExperience?: boolean;
}

export interface RideRequirements {
  petCount?: number;
  petSize?: 'small' | 'medium' | 'large';
  carrierType?: 'none' | 'cat_bag' | 'crate' | 'stroller';
  acceptNormalTaxi?: boolean;
  requirePetFriendlyVehicle?: boolean;
  requireLargeTrunk?: boolean;
  requireStableDriving?: boolean;
  requireLowOdor?: boolean;
}

export type DemandStatus =
  | 'open'
  | 'matched'
  | 'paid'
  | 'in_service'
  | 'completed'
  | 'cancelled'
  | 'refunding';

export interface Demand {
  id: string;
  userId: string;
  serviceType: ServiceType;
  title: string;
  description: string;
  petSummary: string;
  budgetMin: number;
  budgetMax: number;
  expectedPrice?: number;
  pickup?: LocationPoint;
  destination?: LocationPoint;
  serviceTime: string;
  contactName: string;
  contactPhone: string;
  allowBargain: boolean;
  visibilityRadiusKm: number;
  careRequirements?: CareRequirements;
  rideRequirements?: RideRequirements;
  status: DemandStatus;
  selectedOfferId?: string;
  createdAt: string;
  updatedAt: string;
}
