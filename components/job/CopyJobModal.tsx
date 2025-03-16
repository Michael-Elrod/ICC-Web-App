// components/job/CopyJobModal.tsx
import React, { useState } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

interface CopyJobModalProps {
  isOpen: boolean;
  onClose: () => void;
  jobName: string;
  onCopyJob?: (startDate: Date, copyOptions: CopyOptions) => void;
}

interface CopyOptions {
  workerAssignments: boolean;
  notes: boolean;
  floorplans: boolean;
}

export default function CopyJobModal({
  isOpen,
  onClose,
  jobName,
  onCopyJob,
}: CopyJobModalProps) {
  const [step, setStep] = useState<"confirm" | "date">("confirm");
  const [newJobStartDate, setNewJobStartDate] = useState<Date | null>(null);
  const [copyOptions, setCopyOptions] = useState<CopyOptions>({
    workerAssignments: true,
    notes: true,
    floorplans: true,
  });

  if (!isOpen) return null;

  const handleCopyJob = () => {
    if (newJobStartDate && onCopyJob) {
      onCopyJob(newJobStartDate, copyOptions);
    }
    onClose();
    setStep("confirm");
    setNewJobStartDate(null);
  };

  const handleOptionChange = (option: keyof CopyOptions) => {
    setCopyOptions({
      ...copyOptions,
      [option]: !copyOptions[option],
    });
  };

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
          setStep("confirm");
          setNewJobStartDate(null);
        }
      }}
    >
      <div className="bg-white dark:bg-zinc-800 rounded-lg max-w-2xl w-full overflow-hidden relative">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-semibold">Copy Job</h3>
            <button
              onClick={() => {
                onClose();
                setStep("confirm");
                setNewJobStartDate(null);
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

          {step === "confirm" ? (
            <>
              <p className="mb-6">
                Are you sure you want to copy this job? This action will begin
                the creation of a new job with all of the same phases, tasks,
                materials, and assigned contacts as {jobName}
              </p>
              <div className="flex justify-end gap-4">
                <button
                  onClick={() => {
                    onClose();
                    setStep("confirm");
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => setStep("date")}
                  className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
                >
                  Continue
                </button>
              </div>
            </>
          ) : (
            <>
              <p className="mb-6">
                Please choose the start date of the new job and select what to
                copy:
              </p>
              <div className="relative mb-6" style={{ zIndex: 1000 }}>
                <DatePicker
                  selected={newJobStartDate}
                  onChange={(date: Date | null) => setNewJobStartDate(date)}
                  filterDate={(date: Date) => {
                    const day = date.getDay();
                    return day !== 0 && day !== 6;
                  }}
                  dateFormat="MM/dd/yyyy"
                  placeholderText="Choose Start Date"
                  className="mt-1 w-full border rounded-md shadow-sm p-2 text-zinc-700 dark:text-white border-zinc-300 dark:bg-zinc-800 dark:border-zinc-600 h-[44px] appearance-none placeholder:text-zinc-700 dark:placeholder:text-white"
                  required
                  wrapperClassName="w-full"
                  portalId="root"
                />
              </div>

              <div className="space-y-3 mb-6">
                <p className="font-medium">Items to copy:</p>
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="workerAssignments"
                    checked={copyOptions.workerAssignments}
                    onChange={() => handleOptionChange("workerAssignments")}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <label
                    htmlFor="workerAssignments"
                    className="ml-2 text-sm font-medium"
                  >
                    Worker Assignments (All users assigned to tasks and materials)
                  </label>
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="floorplans"
                    checked={copyOptions.floorplans}
                    onChange={() => handleOptionChange("floorplans")}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <label
                    htmlFor="floorplans"
                    className="ml-2 text-sm font-medium"
                  >
                    Floor Plans (All floor plan images)
                  </label>
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="notes"
                    checked={copyOptions.notes}
                    onChange={() => handleOptionChange("notes")}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <label htmlFor="notes" className="ml-2 text-sm font-medium">
                    Notes (All notes added to phases)
                  </label>
                </div>
              </div>

              <div className="mt-6 flex justify-end gap-4">
                <button
                  onClick={() => {
                    onClose();
                    setStep("confirm");
                    setNewJobStartDate(null);
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCopyJob}
                  disabled={!newJobStartDate}
                  className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors disabled:bg-blue-300 disabled:cursor-not-allowed"
                >
                  Copy Job
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
