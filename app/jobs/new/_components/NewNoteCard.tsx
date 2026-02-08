// NewNoteCard.tsx

import React, { useState, useEffect } from "react";
import { FaEdit, FaTrash } from "react-icons/fa";
import { FormNote } from "@/app/types/database";

interface NoteCardProps {
  note: FormNote;
  onUpdate: (updatedNote: FormNote) => void;
  onDelete: () => void;
}

export default function NewNoteCard({
  note,
  onUpdate,
  onDelete,
}: NoteCardProps) {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [localNote, setLocalNote] = useState<FormNote>({
    ...note,
    isExpanded: note.isExpanded || false,
  });

  const handleDone = () => {
    const updatedNote = {
      ...localNote,
      isExpanded: false,
    };
    setLocalNote(updatedNote);
    onUpdate(updatedNote);
  };

  const handleDeleteClick = () => {
    setShowDeleteConfirm(true);
  };

  const handleConfirmDelete = () => {
    onDelete();
    setShowDeleteConfirm(false);
  };

  return (
    <div
      id={`task-${note.id}`}
      className="mb-4 p-4 border border-zinc-300 dark:border-zinc-600 rounded bg-white dark:bg-zinc-800"
    >
      {localNote.isExpanded ? (
        <div>
          <div className="mb-2">
            <textarea
              value={localNote.content}
              onChange={(e) => {
                const updatedNote = {
                  ...localNote,
                  content: e.target.value,
                };
                setLocalNote(updatedNote);
              }}
              className="w-full p-2 border border-zinc-300 dark:border-zinc-600 rounded dark:bg-zinc-800 dark:text-white"
              rows={3}
              placeholder="Add your note here..."
            />
          </div>
          <div className="mt-4 flex justify-end">
            <button
              onClick={handleDone}
              className="mr-2 px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded"
            >
              Done
            </button>
            <button
              onClick={handleDeleteClick}
              className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded"
            >
              Delete
            </button>
          </div>
        </div>
      ) : (
        <div
          className="flex justify-between items-center cursor-pointer"
          onClick={(e) => {
            if (!(e.target as HTMLElement).closest("button")) {
              const updatedNote = {
                ...localNote,
                isExpanded: true,
              };
              setLocalNote(updatedNote);
              onUpdate(updatedNote);
            }
          }}
        >
          <div className="overflow-hidden text-ellipsis whitespace-nowrap flex-grow">
            {localNote.content || "Empty note"}
          </div>
          <div className="flex">
            <button
              onClick={() => {
                const updatedNote = {
                  ...localNote,
                  isExpanded: true,
                };
                setLocalNote(updatedNote);
                onUpdate(updatedNote);
              }}
              className="mr-2 text-zinc-400 hover:text-blue-500 transition-colors"
            >
              <FaEdit size={18} />
            </button>
            <button
              onClick={handleDeleteClick}
              className="text-zinc-400 hover:text-red-500 transition-colors"
            >
              <FaTrash size={18} />
            </button>
          </div>
        </div>
      )}

      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-zinc-800 p-4 rounded-lg border border-zinc-300 dark:border-zinc-600">
            <h3 className="text-lg font-semibold mb-2 text-zinc-900 dark:text-white">
              Delete Note
            </h3>
            <p className="text-zinc-700 dark:text-zinc-300">
              Are you sure you want to delete this note?
            </p>
            <div className="mt-4 flex justify-end space-x-2">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="px-4 py-2 bg-zinc-200 dark:bg-zinc-700 text-zinc-800 dark:text-zinc-200 rounded hover:bg-zinc-300 dark:hover:bg-zinc-600"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDelete}
                className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
