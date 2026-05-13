export interface ReviewRecord {
  id: string;
  orderId: string;
  reviewerUserId: string;
  revieweeUserId: string;
  overallScore: number;
  catCareScore?: number;
  petFriendlyScore?: number;
  drivingStabilityScore?: number;
  punctualityScore?: number;
  cleanlinessScore?: number;
  communicationScore?: number;
  feedbackCompletenessScore?: number;
  medicationAccuracyScore?: number;
  supportsPetHandlingScore?: number;
  tags: string[];
  content?: string;
  createdAt: string;
}

export interface ServiceFeedbackRecord {
  id: string;
  orderId: string;
  providerUserId: string;
  arrivedAt?: string;
  leftAt?: string;
  note?: string;
  photoUrls: string[];
  videoUrls: string[];
  createdAt: string;
}

export interface TagSummary {
  tag: string;
  count: number;
}
