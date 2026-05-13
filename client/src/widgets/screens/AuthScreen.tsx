import React from 'react';
import type { LoginDraft } from '../../features/mimi-dashboard/model/types';
import { assets } from '../../shared/lib/assets';
import { SmartImage } from '../../shared/ui/SmartImage';

interface AuthScreenProps {
  busyKey: string;
  loginDraft: LoginDraft;
  onChange: (updater: (prev: LoginDraft) => LoginDraft) => void;
  onSubmit: (event: React.FormEvent) => void;
}

export function AuthScreen({ busyKey, loginDraft, onChange, onSubmit }: AuthScreenProps) {
  return (
    <div className="app-shell auth-shell">
      <div className="auth-panel">
        <div className="auth-hero">
          <SmartImage alt="咪咪出行登录" className="hero-image" fallbackLabel="宠物友好出行" src={assets.loginCat} />
          <div>
            <span className="eyebrow">Mimi Travel H5</span>
            <h1>咪咪出行</h1>
            <p>发布需求、智能匹配、消息沟通、支付下单、定位导航一站式闭环。</p>
          </div>
        </div>

        <form className="auth-form" onSubmit={onSubmit}>
          <label>
            昵称
            <input
              value={loginDraft.nickname}
              onChange={(event) => onChange((prev) => ({ ...prev, nickname: event.target.value }))}
              placeholder="请输入联系人昵称"
            />
          </label>
          <label>
            手机号
            <input
              value={loginDraft.phone}
              onChange={(event) => onChange((prev) => ({ ...prev, phone: event.target.value }))}
              placeholder="请输入手机号"
            />
          </label>
          <label>
            头像标识
            <input
              value={loginDraft.avatar}
              onChange={(event) => onChange((prev) => ({ ...prev, avatar: event.target.value }))}
              placeholder="例如：🐱"
            />
          </label>
          <button className="primary-btn" disabled={busyKey === 'login'} type="submit">
            {busyKey === 'login' ? '进入中...' : '进入 H5 工作台'}
          </button>
        </form>

        <div className="auth-feature-grid">
          <article className="mini-feature">
            <strong>智能推荐</strong>
            <span>对接 Python 排序服务，优先给出更合适的服务者。</span>
          </article>
          <article className="mini-feature">
            <strong>交易闭环</strong>
            <span>报价、下单、支付、评价、退款状态都有落账与消息通知。</span>
          </article>
          <article className="mini-feature">
            <strong>图片兜底</strong>
            <span>所有展示图都通过安全资源路径和占位组件渲染。</span>
          </article>
        </div>
      </div>
    </div>
  );
}
