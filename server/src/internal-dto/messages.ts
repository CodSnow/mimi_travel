import type { Conversation, MessageRecord } from '@mimi/shared';

export type ConversationResponse = Conversation;

export type MessageResponse = MessageRecord & {
  payload?: Record<string, unknown>;
  clientMsgId?: string;
  relatedOrderId?: string;
};

export interface MessageReadResponse {
  id: string;
  conversationId: string;
  userId: string;
  lastReadMessageId?: string;
  readAt: string;
}

export interface ConversationListResponse {
  items: ConversationResponse[];
}

export interface ConversationDetailResponse {
  conversation: ConversationResponse;
  messages: MessageResponse[];
  read?: MessageReadResponse;
}

export interface EnsureOrderConversationRequest {
  orderId: string;
}

export interface SendMessageRequest {
  senderUserId: string;
  type?: MessageResponse['type'];
  content: string;
  payload?: Record<string, unknown>;
  relatedDemandId?: string;
  relatedOrderId?: string;
  clientMsgId?: string;
}

export interface MarkReadRequest {
  conversationId: string;
  userId: string;
  lastReadMessageId?: string;
}
