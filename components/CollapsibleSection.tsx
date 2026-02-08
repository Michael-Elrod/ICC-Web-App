// CollapsibleSection.tsx

import React, { useState } from "react";
import { FaChevronDown, FaChevronUp } from "react-icons/fa";

interface CollapsibleSectionProps {
  title: string;
  itemCount?: number;
  children: React.ReactNode;
  defaultExpanded?: boolean;
  isExpanded?: boolean;
  onToggle?: () => void;
}

const CollapsibleSection: React.FC<CollapsibleSectionProps> = ({
  title,
  itemCount,
  children,
  defaultExpanded = false,
  isExpanded: controlledExpanded,
  onToggle,
}) => {
  const [internalExpanded, setInternalExpanded] = useState(defaultExpanded);

  // Support both controlled and uncontrolled modes
  const isExpanded =
    controlledExpanded !== undefined ? controlledExpanded : internalExpanded;
  const handleToggle =
    onToggle || (() => setInternalExpanded(!internalExpanded));

  const handleHeaderClick = (e: React.MouseEvent) => {
    if (!(e.target as HTMLElement).closest("button")) {
      handleToggle();
    }
  };

  return (
    <div className="bg-zinc-50 dark:bg-zinc-700/50 rounded-lg border border-zinc-200 dark:border-zinc-600 overflow-hidden">
      {/* Header */}
      <div
        className="flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-colors"
        onClick={handleHeaderClick}
      >
        <div className="flex items-center gap-3">
          <h4 className="text-md font-semibold">{title}</h4>
          {itemCount !== undefined && (
            <span className="text-sm text-zinc-500 dark:text-zinc-400">
              ({itemCount})
            </span>
          )}
        </div>
        <button
          onClick={handleToggle}
          className="text-zinc-600 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200 transition-colors"
        >
          {isExpanded ? <FaChevronUp size={16} /> : <FaChevronDown size={16} />}
        </button>
      </div>

      {/* Content */}
      {isExpanded && (
        <div className="px-4 pb-4 pt-2 border-t border-zinc-200 dark:border-zinc-600">
          {children}
        </div>
      )}
    </div>
  );
};

export default CollapsibleSection;
