import React, { useState, useEffect } from "react";
import Image from "next/image";

interface FloorplanViewerProps {
  floorplans: { url: string; name: string }[];
  onClose?: () => void;
  mode: "modal" | "embedded";
}

const FloorplanViewer: React.FC<FloorplanViewerProps> = ({
  floorplans,
  onClose,
  mode,
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
      className={`bg-white dark:bg-zinc-800 rounded-lg w-full ${
        mode === "modal" ? "max-w-6xl max-h-[90vh]" : "h-full"
      } flex flex-col`}
    >
      {/* Header */}
      <div className="p-4 border-b dark:border-zinc-700 flex justify-between items-center">
        <h3 className="text-lg font-semibold">
          Floorplan {selectedIndex + 1} of {floorplans.length}
        </h3>
        <div className="flex gap-2">
          {floorplans[selectedIndex]?.url && (
            <button
              onClick={() =>
                downloadImage(
                  floorplans[selectedIndex].url,
                  floorplans[selectedIndex].name ||
                    `floorplan-${selectedIndex + 1}.jpg`
                )
              }
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
            >
              Download Current
            </button>
          )}
          {floorplans.length > 1 && (
            <button
              onClick={() => downloadAllFloorplans(floorplans)}
              className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 transition-colors"
            >
              Download All
            </button>
          )}
          {mode === "modal" && onClose && (
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors"
            >
              Close
            </button>
          )}
        </div>
      </div>

      {/* Main content area */}
      <div className="flex flex-1 min-h-0">
        {/* Main image display */}
        <div className="flex-1 relative p-4 flex items-center justify-center">
          {floorplans.length > 1 && (
            <>
              <button
                onClick={() =>
                  setSelectedIndex((prev) =>
                    prev > 0 ? prev - 1 : floorplans.length - 1
                  )
                }
                className="absolute left-6 z-10 p-2 rounded-full bg-black/30 hover:bg-black/50 text-white transition-colors"
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
                className="absolute right-6 z-10 p-2 rounded-full bg-black/30 hover:bg-black/50 text-white transition-colors"
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

          <div className="relative h-full w-full">
            {renderImage(floorplans[selectedIndex], "object-contain")}
          </div>
        </div>

        {/* Thumbnail sidebar */}
        {floorplans.length > 1 && (
          <div className="w-48 border-l dark:border-zinc-700 p-2 overflow-y-auto">
            <div className="grid gap-2">
              {floorplans.map((plan, index) => (
                <button
                  key={index}
                  onClick={() => setSelectedIndex(index)}
                  className={`relative aspect-square w-full rounded-lg overflow-hidden border-2 transition-colors ${
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
