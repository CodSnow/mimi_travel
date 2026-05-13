export type RecommendationType = 'caregiver' | 'driver';
export type RiskLevel = 'low' | 'medium' | 'high';

export interface RecommendationSnapshot {
  id: string;
  demandId: string;
  recommendationType: RecommendationType;
  candidateUserId: string;
  score: number;
  reasonCodes: string[];
  snapshot: Record<string, unknown>;
  createdAt: string;
}

export interface RiskDecision {
  id: string;
  orderId?: string;
  paymentId?: string;
  decisionType: string;
  allowed: boolean;
  riskLevel: RiskLevel;
  reasonCodes: string[];
  detail?: Record<string, unknown>;
  createdAt: string;
}
