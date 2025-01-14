// components/NoteCard.tsx
import React from 'react';
import { NoteView } from '@/app/types/views';
import { formatCardDate } from '@/app/utils';

interface NoteProps extends NoteView {
  onClick: () => void;
  isExpanded: boolean;
}

export default function Note({
  note_details,
  created_at,
  created_by,
  onClick,
  isExpanded,
}: NoteProps) {

  return (
    <div onClick={onClick} className="cursor-pointer">
      <div className="grid grid-cols-3 items-center">
        <span className="text-sm font-medium col-span-1 truncate">
          {note_details}
        </span>
        <span className="text-sm text-center col-span-1">
          {formatCardDate(created_at)}
        </span>
        <span className="text-sm text-right col-span-1">
          {created_by?.user?.first_name} {created_by?.user?.last_name}
        </span>
      </div>
      {isExpanded && (
        <div className="mt-2 pt-2 border-t border-zinc-200 dark:border-zinc-600">
          <div className="mb-4">
            <h5 className="text-sm font-medium mb-2">Details:</h5>
            <div className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-zinc-600 shadow-sm">
              <p className="text-sm whitespace-pre-wrap">{note_details}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}