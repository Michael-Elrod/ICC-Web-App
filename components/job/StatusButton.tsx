// components/StatusButton.tsx
import React, { useState } from "react";
import { useParams } from "next/navigation";

interface StatusButtonProps {
  id: number;
  type: "task" | "material";
  currentStatus: string;
  onStatusChange: (newStatus: string) => void;
  disabled?: boolean; // New prop
}

const StatusButton: React.FC<StatusButtonProps> = ({
  id,
  type,
  currentStatus,
  onStatusChange,
  disabled = false, // Default to false
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [pendingStatus, setPendingStatus] = useState<string | null>(null);
  const params = useParams();
  const jobId = params?.id as string;
  const statuses = ["Incomplete", "In Progress", "Complete"];

  const handleButtonClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (disabled) return; // Don't open dropdown if disabled
    setIsOpen(!isOpen);
  };

  const handleStatusClick = (e: React.MouseEvent, newStatus: string) => {
    e.stopPropagation();
    setPendingStatus(newStatus);
    setShowConfirmation(true);
    setIsOpen(false);
  };

  const handleConfirm = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!pendingStatus) return;

    try {
      const response = await fetch(`/api/jobs/${jobId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id,
          type,
          newStatus: pendingStatus,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to update status");
      }

      onStatusChange(pendingStatus);
      setShowConfirmation(false);
      setPendingStatus(null);
    } catch (error) {
      console.error("Failed to update status:", error);
    }
  };

  const handleCancel = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowConfirmation(false);
    setPendingStatus(null);
  };

  return (
    <div className="relative" onClick={(e) => e.stopPropagation()}>
      <button
        onClick={handleButtonClick}
        className={`text-sm px-3 py-1 font-bold rounded ${
          currentStatus === "Complete"
            ? "bg-green-500 text-white"
            : currentStatus === "In Progress"
            ? "bg-yellow-500 text-white"
            : "bg-red-500 text-white"
        } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
        disabled={disabled}
        title={disabled ? "You are not assigned to this item" : ""}
      >
        {currentStatus}
      </button>

      {isOpen && !disabled && (
        <div className="absolute right-0 mt-1 w-36 bg-white rounded-md shadow-lg z-10 border border-gray-200">
          <div className="py-1">
            {statuses
              .filter((status) => status !== currentStatus)
              .map((status) => (
                <button
                  key={status}
                  onClick={(e) => handleStatusClick(e, status)}
                  className="block w-full text-left px-4 py-2 text-sm hover:bg-gray-100 font-bold"
                >
                  {status}
                </button>
              ))}
          </div>
        </div>
      )}

      {showConfirmation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl max-w-sm w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">
              Confirm Status Change
            </h3>
            <p className="mb-6">
              Are you sure you want to change the status to {pendingStatus}?
            </p>
            <div className="flex justify-end space-x-4">
              <button
                onClick={handleCancel}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 font-bold"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirm}
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 font-bold"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StatusButton;