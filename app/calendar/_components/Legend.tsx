// components/calendar/Legend.tsx
import React from "react";

interface LegendItem {
  label: string;
  color: string;
}

interface LegendProps {
  items: LegendItem[];
}

export const Legend: React.FC<LegendProps> = ({ items }) => {
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
