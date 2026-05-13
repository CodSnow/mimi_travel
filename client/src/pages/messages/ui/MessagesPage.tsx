import React from 'react';
import { formatDateTime } from '../../../features/mimi-dashboard/lib/helpers';
import type { MimiAppController } from '../../../features/mimi-dashboard/model/useMimiAppController';
import { assets } from '../../../shared/lib/assets';
import { EmptyBlock } from '../../../shared/ui/common';

export function MessagesPage({ controller }: { controller: MimiAppController }) {
  const { ui, messages } = controller;

  return (
    <section className="page-stack messages-page">
      <section className="messages-hero">
        <div>
          <span className="eyebrow">消息中心</span>
          <h2>{messages.currentConversation ? messages.getConversationTitle(messages.currentConversation.orderId) : '订单和需求沟通'}</h2>
          <p>系统消息、报价消息、支付消息和定位消息统一沉淀在会话里。</p>
        </div>
        <div className="orders-overview-grid">
          <article>
            <strong>{messages.conversations.length}</strong>
            <span>会话</span>
          </article>
          <article>
            <strong>{messages.currentConversation?.participantUserIds.length || 0}</strong>
            <span>参与人</span>
          </article>
          <article>
            <strong>{messages.conversationMessages.length}</strong>
            <span>消息数</span>
          </article>
        </div>
      </section>

      <section className="section-card">
        <div className="section-head">
          <div>
            <h3>会话列表</h3>
            <p>按订单会话和需求会话聚合查看。</p>
          </div>
        </div>
        {messages.conversations.length ? (
          <div className="message-session-list">
            {messages.conversations.map((conversation) => (
              <button
                className={['conversation-item', messages.selectedConversationId === conversation.id ? 'is-active' : ''].join(' ')}
                key={conversation.id}
                onClick={() => void messages.loadConversationDetail(conversation.id)}
                type="button"
              >
                <div>
                  <strong>{messages.getConversationTitle(conversation.orderId)}</strong>
                  <p>{formatDateTime(conversation.lastMessageAt)}</p>
                </div>
                <span className="mini-status">{conversation.participantUserIds.length} 人</span>
              </button>
            ))}
          </div>
        ) : (
          <EmptyBlock description="发布需求、报价、支付和位置同步后会自动产生消息。" image={assets.policyCat} title="暂无会话" />
        )}
      </section>

      {messages.currentConversation ? (
        <section className="section-card conversation-panel">
          <div className="section-head">
            <div>
              <h3>当前会话</h3>
              <p>{messages.currentConversation.orderId ? `订单 ${messages.currentConversation.orderId}` : '需求沟通'}</p>
            </div>
          </div>
          <div className="message-stream">
            {messages.conversationMessages.map((message) => (
              <div
                className={[
                  'message-bubble',
                  message.senderUserId === controller.profile.user?.id ? 'mine' : '',
                  message.type !== 'text' ? 'system' : '',
                ].join(' ')}
                key={message.id}
              >
                <strong>{message.type}</strong>
                <p>{message.content || '系统已同步状态更新。'}</p>
                <span>{formatDateTime(message.createdAt)}</span>
              </div>
            ))}
          </div>

          <div className="composer message-composer">
            <textarea
              rows={3}
              value={messages.messageDraft}
              onChange={(event) => messages.setMessageDraft(event.target.value)}
              placeholder="输入你想发送的内容"
            />
            <button className="primary-btn" disabled={ui.busyKey === `message-${messages.selectedConversationId}`} onClick={() => void messages.sendConversationMessage()} type="button">
              发送
            </button>
          </div>
        </section>
      ) : null}
    </section>
  );
}
