// components/NavTabs.tsx - For navigation between pages
"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { NavTab } from '../../app/types/views';

interface NavTabsProps {
  tabs: NavTab[];
  activeTab: string;
  setActiveTab: (tabName: string) => void;
}

const NavTabs: React.FC<NavTabsProps> = ({ tabs, activeTab, setActiveTab }) => {
  const [activeTabElement, setActiveTabElement] = useState<HTMLElement | null>(null);
  const router = useRouter();

  useEffect(() => {
    const element = document.getElementById(`tab-${activeTab}`);
    setActiveTabElement(element);
  }, [activeTab]);

  const handleTabClick = (tab: NavTab) => {
    setActiveTab(tab.name);
    router.push(tab.href);
  };

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
            onClick={() => handleTabClick(tab)}
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

export default NavTabs;