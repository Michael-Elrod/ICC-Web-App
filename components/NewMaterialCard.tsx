// NewMaterialCard.tsx

import React, { useState, useEffect } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { FaEdit, FaTrash } from "react-icons/fa";
import ContactCard from "./ContactCard";
import ContactSearchSelect from "./ContactSearchSelect";
import { FormMaterial } from "@/app/types/database";
import { UserView } from "@/app/types/views";
import { MaterialCardProps } from "@/app/types/props";
import {
  formatDate,
  createLocalDate,
  toPickerDate,
  fromPickerDate,
} from "@/app/utils";
import {
  handleDeleteConfirm,
  handleDeleteClick,
  handleDueDateChange,
  handleContactSelect,
  handleContactRemove,
  handleDone,
} from "@/handlers/new/materials";

const NewMaterialCard: React.FC<MaterialCardProps> = ({
  material,
  onUpdate,
  onDelete,
  phaseStartDate,
  contacts,
  phase,
  onPhaseUpdate,
}) => {
  const [selectedContacts, setSelectedContacts] = useState<UserView[]>(
    material.selectedContacts
      ?.map(
        (contact) =>
          contacts.find((c) => c.user_id === parseInt(contact.id)) as UserView,
      )
      .filter(Boolean) || [],
  );
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [localMaterial, setLocalMaterial] = useState<FormMaterial>({
    ...material,
    isExpanded: material.isExpanded,
  });

  useEffect(() => {
    if (material.id === "" && !material.dueDate) {
      setLocalMaterial((prev) => ({
        ...prev,
        dueDate: phaseStartDate,
      }));
    } else {
      setLocalMaterial({
        ...material,
        isExpanded: localMaterial?.isExpanded || material.isExpanded,
      });
    }
  }, [material, phaseStartDate, localMaterial?.isExpanded]);

  return (
    <div
      id={`material-${material.id}`}
      className="mb-4 p-4 border border-zinc-300 dark:border-zinc-600 rounded bg-white dark:bg-zinc-800"
    >
      {localMaterial.isExpanded ? (
        <div>
          <div className="grid grid-cols-2 gap-4 mb-2">
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-200">
                Title
              </label>
              <input
                type="text"
                value={localMaterial.title}
                onChange={(e) =>
                  handleDueDateChange(
                    "title",
                    e.target.value,
                    phaseStartDate,
                    setLocalMaterial,
                    setErrors,
                  )
                }
                className={`w-full p-2 border ${
                  errors.title
                    ? "border-red-500"
                    : "border-zinc-300 dark:border-zinc-600"
                } rounded dark:bg-zinc-800 dark:text-white`}
              />
              {errors.title && (
                <p className="text-red-500 text-xs mt-1">{errors.title}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-200">
                Due Date
              </label>
              <DatePicker
                selected={
                  localMaterial.dueDate
                    ? createLocalDate(localMaterial.dueDate)
                    : null
                }
                onChange={(date: Date | null) =>
                  handleDueDateChange(
                    "dueDate",
                    date ? fromPickerDate(date) : "",
                    phaseStartDate,
                    setLocalMaterial,
                    setErrors,
                  )
                }
                filterDate={(date: Date) => {
                  const day = date.getDay();
                  return day !== 0 && day !== 6;
                }}
                dateFormat="MM/dd/yyyy"
                minDate={toPickerDate(phaseStartDate)}
                className={`w-full p-2 border ${
                  errors.dueDate
                    ? "border-red-500"
                    : "border-zinc-300 dark:border-zinc-600"
                } rounded dark:bg-zinc-800 dark:text-white`}
                wrapperClassName="w-full"
              />
              {errors.dueDate && (
                <p className="text-red-500 text-xs">{errors.dueDate}</p>
              )}
            </div>
          </div>
          <div className="mb-2">
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-200">
              Details
            </label>
            <textarea
              value={localMaterial.details}
              onChange={(e) =>
                handleDueDateChange(
                  "details",
                  e.target.value,
                  phaseStartDate,
                  setLocalMaterial,
                  setErrors,
                )
              }
              className="w-full p-2 border border-zinc-300 dark:border-zinc-600 rounded dark:bg-zinc-800 dark:text-white"
              rows={3}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-200">
              Add People
            </label>
            <ContactSearchSelect
              contacts={contacts}
              selectedContacts={selectedContacts}
              onSelect={(contact) =>
                handleContactSelect(
                  contact,
                  selectedContacts,
                  setSelectedContacts,
                )
              }
            />
            <div className="mt-2 space-y-2">
              {selectedContacts.map((contact: UserView) => (
                <div key={contact.user_id} className="relative [&>*]:py-[2px]">
                  <ContactCard
                    user_id={contact.user_id}
                    user_first_name={contact.first_name}
                    user_last_name={contact.last_name}
                    user_email={contact.user_email}
                    user_phone={contact.user_phone}
                    showCheckbox={false}
                  />
                  <button
                    onClick={() =>
                      handleContactRemove(
                        contact.user_id.toString(),
                        selectedContacts,
                        setSelectedContacts,
                      )
                    }
                    className="absolute top-0.5 right-2 text-zinc-400 hover:text-zinc-600"
                  >
                    <FaTrash size={16} />
                  </button>
                </div>
              ))}
            </div>
          </div>
          <div className="mt-4 flex justify-end">
            <button
              onClick={() =>
                handleDone(
                  localMaterial,
                  selectedContacts,
                  setLocalMaterial,
                  setErrors,
                  onUpdate,
                  phase.startDate,
                )
              }
              className="mr-2 px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded"
            >
              Done
            </button>
            <button
              onClick={() => handleDeleteClick(setShowDeleteConfirm)}
              className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded"
            >
              Delete
            </button>
          </div>
        </div>
      ) : (
        <div
          className="grid grid-cols-3 items-center cursor-pointer"
          onClick={(e) => {
            if (!(e.target as HTMLElement).closest("button")) {
              const updatedMaterial = { ...localMaterial, isExpanded: true };
              setLocalMaterial(updatedMaterial);
              onUpdate(updatedMaterial);
            }
          }}
        >
          <div className="overflow-hidden text-ellipsis whitespace-nowrap">
            {localMaterial.title}
          </div>
          <div className="text-center">
            {(() => {
              return formatDate(localMaterial.dueDate);
            })()}
          </div>
          <div className="flex justify-end">
            <button
              onClick={() => {
                const updatedMaterial = { ...localMaterial, isExpanded: true };
                setLocalMaterial(updatedMaterial);
                onUpdate(updatedMaterial);
              }}
              className="mr-2 text-zinc-400 hover:text-blue-500 transition-colors"
            >
              <FaEdit size={18} />
            </button>
            <button
              onClick={() => handleDeleteClick(setShowDeleteConfirm)}
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
              Delete Material
            </h3>
            <p className="text-zinc-700 dark:text-zinc-300">
              Are you sure you want to delete this material?
            </p>
            <div className="mt-4 flex justify-end space-x-2">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="px-4 py-2 bg-zinc-200 dark:bg-zinc-700 text-zinc-800 dark:text-zinc-200 rounded hover:bg-zinc-300 dark:hover:bg-zinc-600"
              >
                Cancel
              </button>
              <button
                onClick={() =>
                  handleDeleteConfirm(
                    material.id,
                    onDelete,
                    setShowDeleteConfirm,
                  )
                }
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
};

export default NewMaterialCard;
