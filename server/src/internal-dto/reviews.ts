import type { TagSummary } from '@mimi/shared';

import type { InternalRequestMeta } from './common.js';

export interface ProviderReviewSummaryRequest {
  meta: InternalRequestMeta;
  providerUserId: string;
}

export interface ProviderReviewSummaryResponse {
  requestId: string;
  providerUserId: string;
  overallScore: number;
  reviewCount: number;
  catCareScore?: number;
  petFriendlyScore?: number;
  drivingStabilityScore?: number;
  punctualityScore?: number;
  cleanlinessScore?: number;
  communicationScore?: number;
  feedbackCompletenessScore?: number;
  medicationAccuracyScore?: number;
  topTags: TagSummary[];
}
