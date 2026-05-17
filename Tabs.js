import React from 'react';

export default function Tabs({ tabs, activeTab, onChange }) {
  return (
    <nav className="tabs">
      {tabs.map(tab => (
        <button
          key={tab.key}
          className={activeTab === tab.key ? 'tab active' : 'tab'}
          onClick={() => onChange(tab.key)}
          title={tab.title}
        >
          {tab.title}
        </button>
      ))}
    </nav>
  );
}
