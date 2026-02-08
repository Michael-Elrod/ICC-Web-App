// ContentTabs.tsx

"use client";

import React, { useState, useEffect } from "react";

interface ContentTab {
  name: string;
}

interface ContentTabsProps {
  tabs: ContentTab[];
  activeTab: string;
  setActiveTab: (tabName: string) => void;
}

const ContentTabs: React.FC<ContentTabsProps> = ({
  tabs,
  activeTab,
  setActiveTab,
}) => {
  const [activeTabElement, setActiveTabElement] = useState<HTMLElement | null>(
    null,
  );

  useEffect(() => {
    const element = document.getElementById(`tab-${activeTab}`);
    setActiveTabElement(element);
  }, [activeTab]);

  return (
    <div className="mt-6">
      <div className="flex flex-wrap sm:flex-row relative">
        {tabs.map((tab) => (
          <button
            key={tab.name}
            id={`tab-${tab.name}`}
            className={`w-1/3 sm:w-auto px-3 sm:px-6 py-2 text-center ${
              activeTab === tab.name
                ? "text-current font-medium border-b-2 sm:border-b-0 border-current"
                : "text-opacity-60 hover:text-opacity-80"
            }`}
            onClick={() => setActiveTab(tab.name)}
          >
            {tab.name}
          </button>
        ))}
        {/* Hide the bottom indicator on mobile, show on desktop */}
        {activeTabElement && (
          <div
            className="hidden sm:block absolute bottom-0 h-0.5 bg-current transition-all ease-in-out"
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
