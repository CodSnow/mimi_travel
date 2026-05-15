import type { ReviewRecord, ServiceFeedbackRecord } from '@mimi/shared';

export interface PetRecord {
  id: string;
  userId: string;
  name: string;
  breed?: string | null;
  weight?: string | null;
  vaccine?: string | null;
  certificate?: string | null;
  avatar?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AddressRecord {
  id: string;
  userId: string;
  label: string;
  contactName?: string | null;
  contactPhone?: string | null;
  district?: string | null;
  address: string;
  lat?: number | null;
  lng?: number | null;
  coordSystem: string;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

export type PythonReviewRecord = ReviewRecord;
export type PythonServiceFeedbackRecord = ServiceFeedbackRecord;
