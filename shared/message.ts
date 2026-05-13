export interface Conversation {
  id: string;
  demandId?: string;
  orderId?: string;
  participantUserIds: string[];
  lastMessageAt: string;
}

export type MessageType =
  | 'text'
  | 'system'
  | 'offer'
  | 'payment'
  | 'location'
  | 'service_feedback';

export interface MessageRecord {
  id: string;
  conversationId: string;
  senderUserId: string;
  type: MessageType;
  content: string;
  relatedDemandId?: string;
  createdAt: string;
}
