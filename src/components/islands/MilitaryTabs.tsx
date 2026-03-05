import { useState } from 'react';
import type { StrikeItem, Asset } from '../../lib/schemas';

const MIL_TABS = [
  { id: 'strikes', label: 'Strike Targets' },
  { id: 'retaliation', label: 'Iranian Retaliation' },
  { id: 'assets', label: 'US Assets Deployed' },
] as const;

function tierClass(t: number): string {
  return t === 1 ? 't1' : t === 2 ? 't2' : t === 3 ? 't3' : 't4';
}

function tierLabel(t: number): string {
  return t === 1 ? 'T1' : t === 2 ? 'T2' : t === 3 ? 'T3' : 'T4';
}

function strikeIcon(icon: string): string {
  return icon === 'target' ? '\u25CE' : icon === 'retaliation' ? '\u26A1' : icon === 'asset' ? '\u25C6' : '\u2726';
}

interface Props {
  strikeTargets: StrikeItem[];
  retaliationData: StrikeItem[];
  assetsData: Asset[];
}

export default function MilitaryTabs({ strikeTargets, retaliationData, assetsData }: Props) {
  const [activeTab, setActiveTab] = useState('strikes');

  const renderStrikeList = (items: StrikeItem[]) => (
    <ul className="strike-list">
      {items.map((s, i) => (
        <li key={i} className="strike-item">
          <div className={`strike-icon ${s.icon}`}>{strikeIcon(s.icon)}</div>
          <div className="strike-body">
            <div className="strike-name">{s.name}</div>
            <div className="strike-detail">{s.detail}</div>
          </div>
          <div className="strike-meta">
            <span>{s.time || ''}</span>
            <span className={`source-chip ${tierClass(s.tier)}`} style={{ fontSize: '0.5rem' }}>
              {tierLabel(s.tier)}
            </span>
          </div>
        </li>
      ))}
    </ul>
  );

  return (
    <section className="section fade-in" id="sec-military">
      <div className="section-header">
        <span className="section-num">03</span>
        <h2 className="section-title">Military Operations</h2>
        <span className="section-count">Feb 28 &ndash; Mar 4</span>
      </div>
      <div className="tab-row" role="tablist" aria-label="Military operations categories">
        {MIL_TABS.map(t => (
          <button
            key={t.id}
            role="tab"
            aria-selected={activeTab === t.id}
            aria-controls={`tabpanel-${t.id}`}
            id={`tab-${t.id}`}
            className={`tab-btn ${activeTab === t.id ? 'active' : ''}`}
            onClick={() => setActiveTab(t.id)}
          >
            {t.label}
          </button>
        ))}
      </div>
      <div role="tabpanel" id={`tabpanel-${activeTab}`} aria-labelledby={`tab-${activeTab}`}>
        {activeTab === 'strikes' && renderStrikeList(strikeTargets)}
        {activeTab === 'retaliation' && renderStrikeList(retaliationData)}
        {activeTab === 'assets' && (
          <div className="asset-grid">
            {assetsData.map((a, i) => (
              <div key={i} className="asset-card">
                <div className="asset-type">{a.type}</div>
                <div className="asset-name">{a.name}</div>
                <div className="asset-detail">{a.detail}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
