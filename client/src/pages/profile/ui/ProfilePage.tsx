import React from 'react';
import type { MimiAppController } from '../../../features/mimi-dashboard/model/useMimiAppController';
import { assets } from '../../../shared/lib/assets';
import { SmartImage } from '../../../shared/ui/SmartImage';

export function ProfilePage({ controller }: { controller: MimiAppController }) {
  const { ui, profile, dashboard, orders, messages, publish } = controller;

  return (
    <section className="page-stack profile-page">
      <section className="profile-hero">
        <div className="profile-row">
          <div className="avatar">{profile.profileDraft.avatar || '🐱'}</div>
          <div>
            <div className="profile-name-row">
              <h1>{profile.user?.nickname || '咪咪主人'}</h1>
            </div>
            <p>{profile.user?.phone || '暂无手机号'} · {profile.user?.verified ? '已认证' : '未认证'}</p>
          </div>
        </div>
        <div className="hero-actions">
          <button className="profile-edit" disabled={ui.busyKey === 'save-profile'} onClick={() => void profile.saveProfile()} type="button">
            {ui.busyKey === 'save-profile' ? '保存中...' : '保存资料'}
          </button>
          <button className="ghost-btn compact-btn" onClick={profile.handleLogout} type="button">
            退出
          </button>
        </div>
      </section>

      <section className="pet-status-card multi pet-strip">
        <div className="pet-section-head">
          <h2>我的概览</h2>
          <button onClick={() => ui.setActiveTab('orders')} type="button">
            查看订单 <span>→</span>
          </button>
        </div>
        <div className="profile-overview-grid">
          <article className="overview-pill">
            <strong>{dashboard.demands.filter((item) => item.userId === profile.user?.id).length}</strong>
            <span>我的需求</span>
          </article>
          <article className="overview-pill">
            <strong>{orders.orders.length}</strong>
            <span>我的订单</span>
          </article>
          <article className="overview-pill">
            <strong>{messages.conversations.length}</strong>
            <span>会话消息</span>
          </article>
          <article className="overview-pill">
            <strong>{publish.recommendations.length}</strong>
            <span>当前推荐</span>
          </article>
        </div>
      </section>

      <section className="profile-menu-card">
        <button className="profile-menu-row" onClick={() => ui.setActiveTab('publish')} type="button">
          <span className="profile-menu-icon order">📝</span>
          <strong>发布新需求</strong>
          <em>›</em>
        </button>
        <button className="profile-menu-row" onClick={() => ui.setActiveTab('messages')} type="button">
          <span className="profile-menu-icon favorite">💬</span>
          <strong>消息中心</strong>
          <em>›</em>
        </button>
        <button className="profile-menu-row" onClick={() => ui.setActiveTab('policy')} type="button">
          <span className="profile-menu-icon order">📚</span>
          <strong>政策查询</strong>
          <em>›</em>
        </button>
        <button className="profile-menu-row" onClick={() => ui.navigateToScreen('pets')} type="button">
          <span className="profile-menu-icon favorite">🐱</span>
          <strong>宠物档案</strong>
          <em>›</em>
        </button>
        <button className="profile-menu-row" onClick={() => ui.navigateToScreen('addresses')} type="button">
          <span className="profile-menu-icon order">📍</span>
          <strong>地址管理</strong>
          <em>›</em>
        </button>
        <button className="profile-menu-row" onClick={() => ui.navigateToScreen('payments')} type="button">
          <span className="profile-menu-icon favorite">💳</span>
          <strong>支付记录</strong>
          <em>›</em>
        </button>
        <button className="profile-menu-row" onClick={() => ui.navigateToScreen('favorites')} type="button">
          <span className="profile-menu-icon favorite">⭐</span>
          <strong>收藏夹</strong>
          <em>›</em>
        </button>
        <button className="profile-menu-row" onClick={() => ui.navigateToScreen('provider_workspace')} type="button">
          <span className="profile-menu-icon order">🧰</span>
          <strong>服务者工作台</strong>
          <em>›</em>
        </button>
        <button className="profile-menu-row" onClick={() => ui.navigateToScreen('offer_management')} type="button">
          <span className="profile-menu-icon favorite">💬</span>
          <strong>报价管理</strong>
          <em>›</em>
        </button>
        <button className="profile-menu-row" onClick={() => ui.navigateToScreen('admin')} type="button">
          <span className="profile-menu-icon favorite">🛡️</span>
          <strong>管理后台</strong>
          <em>›</em>
        </button>
      </section>

      <section className="profile-section">
        <div className="profile-section-title">
          <h2>基础资料</h2>
          <span>随时更新</span>
        </div>
        <div className="form-grid">
          <label>
            昵称
            <input
              value={profile.profileDraft.nickname}
              onChange={(event) => profile.setProfileDraft((prev) => ({ ...prev, nickname: event.target.value }))}
            />
          </label>
          <label>
            手机号
            <input
              value={profile.profileDraft.phone}
              onChange={(event) => profile.setProfileDraft((prev) => ({ ...prev, phone: event.target.value }))}
            />
          </label>
          <label className="full-span">
            头像标识
            <input
              value={profile.profileDraft.avatar}
              onChange={(event) => profile.setProfileDraft((prev) => ({ ...prev, avatar: event.target.value }))}
            />
          </label>
        </div>
      </section>

      <section className="profile-section">
        <div className="profile-section-title">
          <h2>服务者入驻</h2>
          <span>赚生活费</span>
        </div>
        <div className="provider-apply-card">
          <SmartImage alt="服务者入驻" className="apply-image" fallbackLabel="成为服务者" src={assets.windCat} />
          <div>
            <strong>申请成为服务者</strong>
            <p>默认提交上门照护和宠物友好接送能力，并附带演示车辆资料。</p>
            <button className="secondary-btn" disabled={ui.busyKey === 'apply-provider'} onClick={() => void profile.applyAsProvider()} type="button">
              {ui.busyKey === 'apply-provider' ? '提交中...' : '立即申请'}
            </button>
          </div>
        </div>
      </section>
    </section>
  );
}
