import { useEffect, useState } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { createLocalDate, formatToDateString } from "@/app/utils";

interface EditPhaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpdate: (updates: {
    title: string;
    startDate: string;
    extend: number;
    extendFuturePhases: boolean;
    adjustItems?: boolean;
    daysDiff?: number;
  }) => void;
  initialTitle: string;
  initialStartDate: string;
  jobStartDate: string;
}

export default function EditPhaseModal({
  isOpen,
  onClose,
  onUpdate,
  initialTitle,
  initialStartDate,
  jobStartDate,
}: EditPhaseModalProps) {
  const [title, setTitle] = useState(initialTitle);
  const [startDate, setStartDate] = useState(initialStartDate);
  const [extend, setExtend] = useState(0);
  const [extendFuturePhases, setExtendFuturePhases] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setTitle(initialTitle);
      setStartDate(initialStartDate);
      setExtend(0);
      setExtendFuturePhases(false);
    }
  }, [isOpen, initialTitle, initialStartDate]);

  const handleSubmit = async () => {
    setIsLoading(true);
    try {
      // Calculate days difference if start date changed
      const daysDiff = startDate !== initialStartDate 
        ? Math.floor(
            (createLocalDate(startDate).getTime() - createLocalDate(initialStartDate).getTime()) 
            / (1000 * 60 * 60 * 24)
          )
        : 0;
  
      const updates = {
        title: title.trim() || initialTitle,
        startDate: startDate || initialStartDate,
        extend,
        extendFuturePhases,
        adjustItems: startDate !== initialStartDate || extend > 0,
        daysDiff
      };
      onUpdate(updates);
      handleClose();
    } catch (error) {
      console.error("Failed to update phase:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setTitle(initialTitle);
    setStartDate(initialStartDate);
    setExtend(0);
    setExtendFuturePhases(false);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          handleClose();
        }
      }}
    >
      <div className="bg-white dark:bg-zinc-800 rounded-lg p-6 w-[500px]">
        <h2 className="text-xl font-bold mb-4">Edit Phase</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-white">
              Phase Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="mt-1 block w-full border border-zinc-300 rounded-md shadow-sm p-2 dark:bg-zinc-800 dark:text-white dark:border-zinc-600"
              placeholder="Phase Title"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-white">
              Start Date
            </label>
            <DatePicker
              selected={startDate ? createLocalDate(startDate) : null}
              onChange={(date: Date | null) => {
                if (date) {
                  const dateString = formatToDateString(date);
                  setStartDate(dateString);
                }
              }}
              minDate={createLocalDate(jobStartDate)}
              filterDate={(date: Date) => {
                const day = date.getDay();
                return day !== 0 && day !== 6;
              }}
              dateFormat="MM/dd/yyyy"
              placeholderText="Choose Start Date"
              className="mt-1 block w-full border border-zinc-300 rounded-md shadow-sm p-2 dark:bg-zinc-800 dark:text-white dark:border-zinc-600"
              wrapperClassName="w-full"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-white">
              Extend Phase (days)
            </label>
            <input
              type="number"
              value={extend}
              onChange={(e) => setExtend(parseInt(e.target.value) || 0)}
              min={0}
              className="mt-1 block w-full border border-zinc-300 rounded-md shadow-sm p-2 dark:bg-zinc-800 dark:text-white dark:border-zinc-600"
            />
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="extendFuturePhases"
              checked={extendFuturePhases}
              onChange={(e) => setExtendFuturePhases(e.target.checked)}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label
              htmlFor="extendFuturePhases"
              className="ml-2 block text-sm text-zinc-700 dark:text-white"
            >
              Push future phases
            </label>
          </div>
        </div>

        <div className="mt-6 flex justify-end space-x-4">
          <button
            onClick={handleClose}
            className="px-4 py-2 bg-red-500 text-white font-bold rounded-md hover:bg-red-700 transition-colors"
            disabled={isLoading}
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            className="px-4 py-2 bg-green-500 text-white font-bold rounded-md hover:bg-green-700 transition-colors flex items-center"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <svg
                  className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                Updating...
              </>
            ) : (
              "Save"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
