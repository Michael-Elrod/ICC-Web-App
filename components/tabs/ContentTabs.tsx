// components/ContentTabs.tsx - For switching content within a page
"use client";

import React, { useState, useEffect } from 'react';

interface ContentTab {
  name: string;
}

interface ContentTabsProps {
  tabs: ContentTab[];
  activeTab: string;
  setActiveTab: (tabName: string) => void;
}

const ContentTabs: React.FC<ContentTabsProps> = ({ tabs, activeTab, setActiveTab }) => {
  const [activeTabElement, setActiveTabElement] = useState<HTMLElement | null>(null);

  useEffect(() => {
    const element = document.getElementById(`tab-${activeTab}`);
    setActiveTabElement(element);
  }, [activeTab]);

  return (
    <div className="mt-6">
      <div className="flex relative">
        {tabs.map((tab) => (
          <button
            key={tab.name}
            id={`tab-${tab.name}`}
            className={`px-6 py-2 ${
              activeTab === tab.name ? 'text-current font-medium' : 'text-opacity-60 hover:text-opacity-80'
            }`}
            onClick={() => setActiveTab(tab.name)}
          >
            {tab.name}
          </button>
        ))}
        {activeTabElement && (
          <div
            className="absolute bottom-0 h-0.5 bg-current transition-all ease-in-out"
            style={{
              left: `${activeTabElement.offsetLeft}px`,
              width: `${activeTabElement.offsetWidth}px`,
            }}
          />
        )}
      </div>
    </div>
  );
};

export default ContentTabs;