import React from 'react';
import { policyQuickQuestions } from '../../../features/mimi-dashboard/config/constants';
import { formatDateTime } from '../../../features/mimi-dashboard/lib/helpers';
import type { MimiAppController } from '../../../features/mimi-dashboard/model/useMimiAppController';
import { assets } from '../../../shared/lib/assets';
import { EmptyBlock } from '../../../shared/ui/common';
import { SmartImage } from '../../../shared/ui/SmartImage';

export function PolicyPage({ controller }: { controller: MimiAppController }) {
  const { ui, policy } = controller;

  return (
    <section className="page-stack policy-page">
      <section className="policy-qa-hero">
        <SmartImage alt="政策问答" className="policy-hero-image" fallbackLabel="政策问答" src={assets.policyCat} />
        <h1>政策 AI 智能问答</h1>
        <p>检索杭州托运政策，先给结果，再给依据。</p>
        <div className="policy-search">
          <textarea
            rows={2}
            value={policy.policyQuestion}
            onChange={(event) => policy.setPolicyQuestion(event.target.value)}
          />
          <button className="policy-send-btn" disabled={ui.busyKey === 'policy-ask'} onClick={() => void policy.askPolicy()} type="button">
            {ui.busyKey === 'policy-ask' ? '…' : '➤'}
          </button>
        </div>
      </section>

      <section className="ai-answer-card">
        <div className="ai-answer-head">
          <strong>✦ {ui.busyKey === 'policy-ask' ? '检索中' : 'AI 回答'}</strong>
          {policy.policyAnswer?.answer ? (
            <button className="ghost-btn compact-btn" onClick={() => void policy.copyPolicyAnswer()} type="button">
              复制
            </button>
          ) : null}
        </div>
        <div className="answer-body">
          <p>{policy.policyAnswer?.answer || '输入问题后，系统会结合知识库返回办理建议与政策说明。'}</p>
          {policy.policyAnswer?.checklist?.length ? (
            <ul className="reason-list compact-top">
              {policy.policyAnswer.checklist.map((item) => <li key={item}>{item}</li>)}
            </ul>
          ) : null}
          {policy.policyAnswer?.citations?.length ? (
            <div className="tag-row compact-top">
              {policy.policyAnswer.citations.map((item) => <span className="tag" key={item.id}>{item.district} · {item.sourceName}</span>)}
            </div>
          ) : null}
        </div>
      </section>

      <section className="profile-section">
        <div className="profile-section-title">
          <h2>高频问题</h2>
          <span>{policy.policyQuestion ? '快捷填充' : '常见问题'}</span>
        </div>
        <div className="chip-scroller">
          {policyQuickQuestions.map((question) => (
            <button className="chip" key={question} onClick={() => policy.setPolicyQuestion(question)} type="button">
              {question}
            </button>
          ))}
        </div>
      </section>

      <section className="profile-section">
        <div className="profile-section-title">
          <h2>按区县查看</h2>
          <span>{policy.knowledge?.documents.length || 0} 篇政策</span>
        </div>
        <div className="chip-scroller">
          {policy.policyDistricts.map((district) => (
            <button
              className={['chip', policy.selectedPolicyDistrict === district ? 'active' : ''].join(' ')}
              key={district}
              onClick={() => policy.setSelectedPolicyDistrict(district)}
              type="button"
            >
              {district}
            </button>
          ))}
        </div>
      </section>

      {policy.visiblePolicyDocs.length ? (
        <section className="policy-grid">
          {policy.visiblePolicyDocs.slice(0, 4).map((doc) => (
            <button className="policy-tile" key={doc.id} onClick={() => void policy.loadPolicyDetail(doc.id)} type="button">
              {doc.title}
            </button>
          ))}
        </section>
      ) : (
        <EmptyBlock description="当前筛选下暂无政策文档。" image={assets.policyCat} title="暂无政策" />
      )}

      <section className="section-card prototype-section">
        <div className="section-head">
          <div>
            <h3>政策文档</h3>
            <p>当前知识库更新时间：{policy.knowledge?.updatedAt ? formatDateTime(policy.knowledge.updatedAt) : '--'}</p>
          </div>
        </div>
        <div className="policy-doc-list">
          {policy.visiblePolicyDocs.map((doc) => (
            <button
              className={['policy-doc', policy.selectedPolicyId === doc.id ? 'is-active' : ''].join(' ')}
              key={doc.id}
              onClick={() => void policy.loadPolicyDetail(doc.id)}
              type="button"
            >
              <strong>{doc.title}</strong>
              <p>{doc.district} · {doc.summary}</p>
            </button>
          ))}
        </div>
      </section>

      {policy.selectedPolicy ? (
        <section className="section-card policy-detail-card">
          <div className="section-head">
            <div>
              <h3>{policy.selectedPolicy.title}</h3>
              <p>{policy.selectedPolicy.sourceName}</p>
            </div>
            <button className="ghost-btn compact-btn" onClick={() => void policy.favoriteSelectedPolicy()} type="button">收藏</button>
          </div>
          <div className="policy-content">
            <p>{policy.selectedPolicy.summary}</p>
            <p><strong>办理材料：</strong>{policy.selectedPolicy.materials}</p>
            <p>{policy.selectedPolicy.content}</p>
          </div>
        </section>
      ) : null}
    </section>
  );
}
