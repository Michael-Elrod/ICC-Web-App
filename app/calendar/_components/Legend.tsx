// Legend.tsx

"use client";

import React, { useState } from "react";

interface LegendItem {
  label: string;
  color: string;
}

interface LegendProps {
  items: LegendItem[];
}

export const LegendToggle: React.FC<LegendProps> = ({ items }) => {
  const [isOpen, setIsOpen] = useState(false);

  if (items.length === 0) return null;

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300 px-3 py-1.5 border border-gray-300 dark:border-zinc-600 rounded-md"
      >
        <div className="flex items-center gap-1">
          {items.slice(0, 3).map((item, i) => (
            <div
              key={i}
              className="w-2.5 h-2.5 rounded-sm"
              style={{ backgroundColor: item.color }}
            />
          ))}
          {items.length > 3 && (
            <span className="text-xs text-gray-400">+{items.length - 3}</span>
          )}
        </div>
        <span>Legend</span>
        <svg
          className={`w-3 h-3 transition-transform ${isOpen ? "rotate-180" : ""}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>
      {isOpen && (
        <div className="absolute top-full left-0 mt-1 z-10 bg-white dark:bg-zinc-800 border border-gray-300 dark:border-zinc-600 rounded-md shadow-lg p-2 min-w-[200px]">
          <div className="flex flex-wrap gap-x-3 gap-y-1.5">
            {items.map((item, index) => (
              <div key={index} className="flex items-center">
                <div
                  className="w-3 h-3 rounded-sm mr-1.5"
                  style={{ backgroundColor: item.color }}
                />
                <span className="text-xs text-gray-700 dark:text-gray-200">
                  {item.label}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export const Legend: React.FC<LegendProps> = ({ items }) => {
  if (items.length === 0) return null;

  return (
    <div className="flex justify-center px-6 py-3 mb-2">
      <div className="flex flex-wrap justify-center gap-4 max-w-full">
        {items.map((item, index) => (
          <div key={index} className="flex items-center">
            <div
              className="w-4 h-4 rounded-sm mr-2"
              style={{ backgroundColor: item.color }}
            />
            <span className="text-sm text-gray-700 dark:text-gray-200">
              {item.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};
