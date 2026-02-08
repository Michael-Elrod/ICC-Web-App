// CloseJobModal.tsx

import React, { useState } from "react";

interface CloseJobModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCloseJob?: () => void;
}

export default function CloseJobModal({
  isOpen,
  onClose,
  onCloseJob,
}: CloseJobModalProps) {
  const [step, setStep] = useState<"initial" | "confirm">("initial");

  if (!isOpen) return null;

  const handleCloseJob = () => {
    if (onCloseJob) {
      onCloseJob();
    }
    onClose();
    setStep("initial");
  };

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
          setStep("initial");
        }
      }}
    >
      <div className="bg-white dark:bg-zinc-800 rounded-lg max-w-2xl w-full overflow-hidden relative">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-semibold">Close Job</h3>
            <button
              onClick={() => {
                onClose();
                setStep("initial");
              }}
              className="text-gray-500 hover:text-gray-700"
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
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          {step === "initial" ? (
            <>
              <p className="mb-6">Are you sure you want to close this job?</p>
              <div className="flex justify-end gap-4">
                <button
                  onClick={() => {
                    onClose();
                    setStep("initial");
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => setStep("confirm")}
                  className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
                >
                  Continue
                </button>
              </div>
            </>
          ) : (
            <>
              <p className="mb-6">
                Closing a job will set the job status to Closed. This will
                automatically complete all tasks and materials and stop any
                future notifications about this job. You will still be able to
                see the job for a limited time under the Closed tab in the Jobs
                page if you would like to copy its contents to create a new one.
              </p>
              <div className="flex justify-end gap-4">
                <button
                  onClick={() => {
                    onClose();
                    setStep("initial");
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCloseJob}
                  className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
                >
                  Close Job
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
