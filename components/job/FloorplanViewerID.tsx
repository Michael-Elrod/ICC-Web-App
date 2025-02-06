import React, { useState, useEffect } from "react";
import Image from "next/image";

interface FloorPlanViewerIDProps {
  floorplans: { id: number; url: string; name: string }[];
  onClose?: () => void;
  mode: "modal" | "embedded";
  onRemoveCurrent?: (index: number) => void;
  onRemoveAll?: () => void;
  onUpload?: () => void;
  hasAdminAccess?: boolean;
}

const FloorPlanViewerID: React.FC<FloorPlanViewerIDProps> = ({
  floorplans,
  onClose,
  mode,
  onRemoveCurrent,
  onRemoveAll,
  onUpload,
  hasAdminAccess,
}) => {
  const [selectedIndex, setSelectedIndex] = useState(0);

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

  const renderImage = (
    plan: { url: string; name: string },
    imgClassName: string
  ) => {
    if (!plan?.url) {
      console.error("Missing URL for plan:", plan);
      return null;
    }

    return (
      <Image
        src={plan.url}
        alt={plan.name || "Floor Plan"}
        fill
        sizes={
          imgClassName.includes("object-contain")
            ? "(max-width: 768px) 100vw, (max-width: 1200px) 80vw, 70vw"
            : "(max-width: 768px) 20vw, 15vw"
        }
        className={imgClassName}
      />
    );
  };

  const downloadImage = async (url: string, filename: string) => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = downloadUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);
    } catch (error) {
      console.error("Error downloading image:", error);
    }
  };

  const downloadAllFloorplans = async (
    floorplans: { url: string; name: string }[]
  ) => {
    for (const plan of floorplans) {
      await downloadImage(plan.url, plan.name || "floorplan.jpg");
    }
  };

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
        <div className="flex flex-col sm:flex sm:flex-row sm:justify-between items-center gap-2 sm:gap-4 max-w-5xl mx-auto w-full">
          {/* Mobile: Top Row for Remove and Download buttons */}
          <div className="w-full grid grid-cols-2 gap-2 sm:hidden">
            {/* Remove buttons group - only show if admin */}
            {hasAdminAccess && (
              <div className="flex flex-col gap-2">
                {floorplans[selectedIndex]?.url && (
                  <button
                    onClick={() => onRemoveCurrent?.(selectedIndex)}
                    className="px-2 py-1 bg-red-500 text-white rounded hover:bg-red-600 transition-colors text-xs whitespace-nowrap"
                  >
                    Remove Current
                  </button>
                )}
                {floorplans.length > 1 && (
                  <button
                    onClick={onRemoveAll}
                    className="px-2 py-1 bg-red-600 text-white rounded hover:bg-red-700 transition-colors text-xs whitespace-nowrap"
                  >
                    Remove All
                  </button>
                )}
              </div>
            )}

            {/* Download buttons group */}
            <div
              className={`flex flex-col gap-2 ${
                !hasAdminAccess ? "col-span-2" : ""
              }`}
            >
              {floorplans[selectedIndex]?.url && (
                <button
                  onClick={() =>
                    downloadImage(
                      floorplans[selectedIndex].url,
                      floorplans[selectedIndex].name ||
                        `floorplan-${selectedIndex + 1}.jpg`
                    )
                  }
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

          {/* Mobile: Bottom Row for Add More button - only show if admin */}
          {hasAdminAccess && (
            <div className="w-full sm:hidden">
              <button
                onClick={() => onUpload?.()}
                className="w-full px-2 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors text-xs whitespace-nowrap"
              >
                Add More
              </button>
            </div>
          )}

          {/* Desktop Layout (hidden on mobile) */}
          {hasAdminAccess && (
            <div className="hidden sm:flex sm:flex-row gap-2">
              {floorplans[selectedIndex]?.url && (
                <button
                  onClick={() => onRemoveCurrent?.(selectedIndex)}
                  className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition-colors text-base whitespace-nowrap"
                >
                  Remove Current
                </button>
              )}
              {floorplans.length > 1 && (
                <button
                  onClick={onRemoveAll}
                  className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors text-base whitespace-nowrap"
                >
                  Remove All
                </button>
              )}
            </div>
          )}

          <div
            className={`hidden sm:flex sm:flex-row gap-2 ${
              !hasAdminAccess ? "w-full justify-center" : ""
            }`}
          >
            {floorplans[selectedIndex]?.url && (
              <button
                onClick={() =>
                  downloadImage(
                    floorplans[selectedIndex].url,
                    floorplans[selectedIndex].name ||
                      `floorplan-${selectedIndex + 1}.jpg`
                  )
                }
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
            {hasAdminAccess && (
              <button
                onClick={() => onUpload?.()}
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors text-base whitespace-nowrap"
              >
                Add More
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main content area */}
      <div className="flex flex-col w-full max-w-5xl mx-auto">
        {/* Main image display */}
        <div className="relative px-2 sm:px-4 py-4 flex items-center justify-center">
          {floorplans.length > 1 && (
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
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 19l-7-7 7-7"
                  />
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
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </button>
            </>
          )}

          <div className="relative h-[60vh] w-full">
            {renderImage(floorplans[selectedIndex], "object-contain")}
          </div>
        </div>

        {/* Thumbnail section */}
        {floorplans.length > 1 && (
          <div className="border-t dark:border-zinc-700 px-2 sm:px-4 py-4">
            <div className="overflow-x-hidden">
              {" "}
              {/* Changed from overflow-x-auto */}
              <div className="flex flex-wrap gap-2 justify-center max-w-full">
                {" "}
                {/* Changed from flex gap-2 justify-center min-w-0 w-max mx-auto */}
                {floorplans.map((plan, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedIndex(index)}
                    className={`relative h-20 w-20 sm:h-24 sm:w-24 flex-shrink-0 rounded-lg overflow-hidden border-2 transition-colors ${
                      selectedIndex === index
                        ? "border-blue-500"
                        : "border-transparent hover:border-blue-300"
                    }`}
                  >
                    {renderImage(plan, "object-cover")}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
  return <MainContent />;
};

export default FloorPlanViewerID;
