// DeleteJobModal.tsx

import React from "react";

interface DeleteJobModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDeleteJob: () => void;
}

export default function DeleteJobModal({
  isOpen,
  onClose,
  onDeleteJob,
}: DeleteJobModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-zinc-800 rounded-lg max-w-md w-full p-6">
        <h3 className="text-lg font-semibold mb-4">Delete Job</h3>
        <p className="mb-6">
          Are you sure you want to permanently delete this job? This action
          cannot be undone and will remove all associated tasks, materials, and
          phases.
        </p>
        <div className="flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-500 hover:text-gray-700 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onDeleteJob}
            className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
          >
            Delete Job
          </button>
        </div>
      </div>
    </div>
  );
}
