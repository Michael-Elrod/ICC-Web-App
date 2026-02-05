import React, { useState, useEffect } from "react";
import Image from "next/image";
import { isPdf, downloadFile, downloadAllFloorplans } from "@/app/lib/floorplan-utils";

export interface FloorplanItem {
  id?: number;
  url: string;
  name: string;
}

interface FloorplanViewerProps {
  floorplans: FloorplanItem[];
  onClose?: () => void;
  mode: "modal" | "embedded";
  onRemoveCurrent?: (index: number) => void;
  onRemoveAll?: () => void;
  onUpload?: () => void;
  hasAdminAccess?: boolean;
}

const FloorplanViewer: React.FC<FloorplanViewerProps> = ({
  floorplans,
  onClose,
  mode,
  onRemoveCurrent,
  onRemoveAll,
  onUpload,
  hasAdminAccess = false,
}) => {
  const [selectedIndex, setSelectedIndex] = useState(0);

  const showAdminControls = hasAdminAccess && (onRemoveCurrent || onRemoveAll || onUpload);

  useEffect(() => {
    if (mode === "modal") {
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === "Escape" && onClose) onClose();
        if (e.key === "ArrowLeft")
          setSelectedIndex((prev) =>
            prev > 0 ? prev - 1 : floorplans.length - 1
          );
        if (e.key === "ArrowRight")
          setSelectedIndex((prev) =>
            prev < floorplans.length - 1 ? prev + 1 : 0
          );
      };
      window.addEventListener("keydown", handleKeyDown);
      return () => window.removeEventListener("keydown", handleKeyDown);
    }
  }, [onClose, floorplans.length, mode]);

  if (!floorplans || !floorplans.length || !floorplans[0]?.url) {
    console.error("Invalid floorplans data:", floorplans);
    return <div>No floorplans available</div>;
  }

  const currentPlan = floorplans[selectedIndex];

  const renderMedia = (
    plan: FloorplanItem,
    isMainView: boolean = false
  ) => {
    if (!plan?.url) {
      console.error("Missing URL for plan:", plan);
      return null;
    }

    if (isPdf(plan.url)) {
      if (isMainView) {
        return (
          <object
            data={plan.url}
            type="application/pdf"
            className="w-full h-full"
          >
            <div className="flex flex-col items-center justify-center h-full bg-gray-100 dark:bg-zinc-700 rounded-lg">
              <svg className="w-16 h-16 text-red-500 mb-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
              </svg>
              <p className="text-lg font-medium mb-2">{plan.name || "PDF Document"}</p>
              <a
                href={plan.url}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
              >
                Open PDF
              </a>
            </div>
          </object>
        );
      } else {
        return (
          <div className="flex flex-col items-center justify-center h-full bg-gray-100 dark:bg-zinc-700">
            <svg className="w-8 h-8 text-red-500" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
            </svg>
            <span className="text-xs mt-1 text-gray-600 dark:text-gray-300">PDF</span>
          </div>
        );
      }
    }

    const imgClassName = isMainView ? "object-contain" : "object-cover";
    return (
      <Image
        src={plan.url}
        alt={plan.name || "Floor Plan"}
        fill
        sizes={
          isMainView
            ? "(max-width: 768px) 100vw, (max-width: 1200px) 80vw, 70vw"
            : "(max-width: 768px) 20vw, 15vw"
        }
        className={imgClassName}
      />
    );
  };

  const handleDownloadCurrent = () => {
    if (currentPlan?.url) {
      const extension = isPdf(currentPlan.url) ? '.pdf' : '.jpg';
      downloadFile(
        currentPlan.url,
        currentPlan.name || `floorplan-${selectedIndex + 1}${extension}`
      );
    }
  };

  const NavigationButtons = () => (
    <>
      <button
        onClick={() =>
          setSelectedIndex((prev) =>
            prev > 0 ? prev - 1 : floorplans.length - 1
          )
        }
        className="absolute left-4 sm:left-6 z-10 p-2 rounded-full bg-black/30 hover:bg-black/50 text-white transition-colors"
        aria-label="Previous image"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
      </button>
      <button
        onClick={() =>
          setSelectedIndex((prev) =>
            prev < floorplans.length - 1 ? prev + 1 : 0
          )
        }
        className="absolute right-4 sm:right-6 z-10 p-2 rounded-full bg-black/30 hover:bg-black/50 text-white transition-colors"
        aria-label="Next image"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </button>
    </>
  );

  const MainContent = () => (
    <div
      className={`bg-white dark:bg-zinc-800 w-full ${
        mode === "modal"
          ? "max-w-6xl max-h-[90vh] rounded-lg"
          : "h-full sm:rounded-lg"
      } flex flex-col`}
    >
      {/* Header */}
      <div className="p-2 sm:p-4 border-b dark:border-zinc-700">
        <div className="flex flex-col sm:flex-row sm:justify-between items-center gap-2 sm:gap-4 max-w-5xl mx-auto w-full">
          {/* Mobile Layout */}
          <div className="w-full grid grid-cols-2 gap-2 sm:hidden">
            {/* Admin buttons - mobile */}
            {showAdminControls && (
              <div className="flex flex-col gap-2">
                {currentPlan?.url && onRemoveCurrent && (
                  <button
                    onClick={() => onRemoveCurrent(selectedIndex)}
                    className="px-2 py-1 bg-red-500 text-white rounded hover:bg-red-600 transition-colors text-xs whitespace-nowrap"
                  >
                    Remove Current
                  </button>
                )}
                {floorplans.length > 1 && onRemoveAll && (
                  <button
                    onClick={onRemoveAll}
                    className="px-2 py-1 bg-red-600 text-white rounded hover:bg-red-700 transition-colors text-xs whitespace-nowrap"
                  >
                    Remove All
                  </button>
                )}
              </div>
            )}

            {/* Download buttons - mobile */}
            <div className={`flex flex-col gap-2 ${!showAdminControls ? "col-span-2" : ""}`}>
              {currentPlan?.url && (
                <button
                  onClick={handleDownloadCurrent}
                  className="px-2 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors text-xs whitespace-nowrap"
                >
                  Download Current
                </button>
              )}
              {floorplans.length > 1 && (
                <button
                  onClick={() => downloadAllFloorplans(floorplans)}
                  className="px-2 py-1 bg-green-500 text-white rounded hover:bg-green-600 transition-colors text-xs whitespace-nowrap"
                >
                  Download All
                </button>
              )}
            </div>
          </div>

          {/* Add More button - mobile */}
          {showAdminControls && onUpload && (
            <div className="w-full sm:hidden">
              <button
                onClick={onUpload}
                className="w-full px-2 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors text-xs whitespace-nowrap"
              >
                Add More
              </button>
            </div>
          )}

          {/* Desktop Layout - Admin buttons */}
          {showAdminControls && (
            <div className="hidden sm:flex sm:flex-row gap-2">
              {currentPlan?.url && onRemoveCurrent && (
                <button
                  onClick={() => onRemoveCurrent(selectedIndex)}
                  className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition-colors text-base whitespace-nowrap"
                >
                  Remove Current
                </button>
              )}
              {floorplans.length > 1 && onRemoveAll && (
                <button
                  onClick={onRemoveAll}
                  className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors text-base whitespace-nowrap"
                >
                  Remove All
                </button>
              )}
            </div>
          )}

          {/* Desktop Layout - Download buttons */}
          <div className={`hidden sm:flex sm:flex-row gap-2 ${!showAdminControls ? "w-full justify-center" : ""}`}>
            {currentPlan?.url && (
              <button
                onClick={handleDownloadCurrent}
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors text-base whitespace-nowrap"
              >
                Download Current
              </button>
            )}
            {floorplans.length > 1 && (
              <button
                onClick={() => downloadAllFloorplans(floorplans)}
                className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 transition-colors text-base whitespace-nowrap"
              >
                Download All
              </button>
            )}
            {showAdminControls && onUpload && (
              <button
                onClick={onUpload}
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors text-base whitespace-nowrap"
              >
                Add More
              </button>
            )}
            {mode === "modal" && onClose && !showAdminControls && (
              <button
                onClick={onClose}
                className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors"
              >
                Close
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main content area */}
      <div className="flex flex-col w-full max-w-5xl mx-auto">
        {/* Main display */}
        <div className="relative px-2 sm:px-4 py-4 flex items-center justify-center">
          {floorplans.length > 1 && <NavigationButtons />}
          <div className="relative h-[60vh] w-full">
            {renderMedia(currentPlan, true)}
          </div>
        </div>

        {/* Thumbnails */}
        {floorplans.length > 1 && (
          <div className="border-t dark:border-zinc-700 px-2 sm:px-4 py-4">
            <div className="overflow-x-hidden">
              <div className="flex flex-wrap gap-2 justify-center max-w-full">
                {floorplans.map((plan, index) => (
                  <button
                    key={plan.id ?? index}
                    onClick={() => setSelectedIndex(index)}
                    className={`relative h-20 w-20 sm:h-24 sm:w-24 flex-shrink-0 rounded-lg overflow-hidden border-2 transition-colors ${
                      selectedIndex === index
                        ? "border-blue-500"
                        : "border-transparent hover:border-blue-300"
                    }`}
                  >
                    {renderMedia(plan, false)}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  if (mode === "modal") {
    return (
      <div
        className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
        onClick={(e) => e.target === e.currentTarget && onClose?.()}
      >
        <MainContent />
      </div>
    );
  }

  return <MainContent />;
};

export default FloorplanViewer;
