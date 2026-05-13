import React from 'react';
import { SmartImage } from './SmartImage';

export function DetailItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="detail-item">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

export function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <article className="stat-card">
      <strong>{value}</strong>
      <span>{label}</span>
    </article>
  );
}

export function ToggleChip({
  label,
  value,
  onChange,
}: {
  label: string;
  value: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <button
      className={['toggle-chip', value ? 'is-active' : ''].join(' ')}
      onClick={() => onChange(!value)}
      type="button"
    >
      {label}
    </button>
  );
}

export function EmptyBlock({ title, description, image }: { title: string; description: string; image: string }) {
  return (
    <div className="empty-block">
      <SmartImage alt={title} className="empty-image" fallbackLabel="咪咪出行" src={image} />
      <strong>{title}</strong>
      <p>{description}</p>
    </div>
  );
}
