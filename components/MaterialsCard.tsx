// components/MaterialsCard.tsx
import { useSession } from "next-auth/react";
import React, { useState, useEffect, useRef } from "react";
import SmallCardFrame from "./SmallCardFrame";
import CollapsibleSection from "./CollapsibleSection";
import StatusButton from "./StatusButton";
import { createLocalDate } from "@/app/utils";
import UserInfoRow from "./UserInfoRow";
import { MaterialView, UserView } from "@/app/types/views";
import { MaterialUpdatePayload } from "@/app/types/database";

interface MaterialsCardProps {
  materials: MaterialView[];
  contacts: UserView[];
  onStatusUpdate: (
    id: number,
    type: "task" | "material",
    newStatus: string
  ) => void;
  onDelete: (id: number) => Promise<void>;
  userType?: string;
  renderAddButton?: () => React.ReactNode;
  renderAddingForm?: () => React.ReactNode;
}

const MaterialsCard: React.FC<MaterialsCardProps> = ({
  materials,
  contacts,
  onStatusUpdate,
  onDelete,
  userType,
  renderAddButton,
  renderAddingForm,
}) => {
  const [expandedMaterialId, setExpandedMaterialId] = useState<number | null>(
    null
  );
  const [localMaterials, setLocalMaterials] = useState(materials);
  const [activeModal, setActiveModal] = useState<number | null>(null);
  const [selectedUsers, setSelectedUsers] = useState<Set<number>>(new Set());
  const [userSearchQuery, setUserSearchQuery] = useState("");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { data: session } = useSession();
  const currentUserId = session?.user?.id ? parseInt(session.user.id) : null;
  const hasAdminAccess = userType === "Owner" || userType === "Admin";
  const sortedMaterials = [...materials].sort(
    (a, b) =>
      createLocalDate(a.material_duedate).getTime() -
      createLocalDate(b.material_duedate).getTime()
  );
  const canEditMaterial = (material: MaterialView) => {
    if (hasAdminAccess) return true;
    if (!currentUserId) return false;
    return material.users.some((user) => user.user_id === currentUserId);
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  useEffect(() => {
    if (activeModal !== null) {
      const material = localMaterials.find(
        (m) => m.material_id === activeModal
      );
      if (material) {
        setSelectedUsers(new Set(material.users.map((u) => u.user_id)));
      }
    } else {
      setSelectedUsers(new Set());
    }
  }, [activeModal, localMaterials]);

  const handleUserSelection = (userId: number) => {
    setSelectedUsers((prev) => {
      const newSelection = new Set(prev);
      if (newSelection.has(userId)) {
        newSelection.delete(userId);
      } else {
        newSelection.add(userId);
      }
      return newSelection;
    });
  };

  const handleStatusChange = (materialId: number, newStatus: string) => {
    const material = localMaterials.find((m) => m.material_id === materialId);
    if (!material || !canEditMaterial(material)) return;

    setLocalMaterials((prevMaterials) =>
      prevMaterials.map((material) =>
        material.material_id === materialId
          ? { ...material, material_status: newStatus }
          : material
      )
    );
    onStatusUpdate(materialId, "material", newStatus);
  };

  const handleCardClick = (e: React.MouseEvent, materialId: number) => {
    if (!(e.target as HTMLElement).closest(".status-button")) {
      setExpandedMaterialId(
        expandedMaterialId === materialId ? null : materialId
      );
    }
  };

  const setsAreEqual = (a: Set<number>, b: Set<number>) => {
    const arrayA = Array.from(a);
    const arrayB = Array.from(b);
    if (arrayA.length !== arrayB.length) return false;
    return arrayA.every((item) => arrayB.includes(item));
  };

  const handleSaveChanges = async (materialId: number) => {
    const material = localMaterials.find((m) => m.material_id === materialId);
    if (!material) return;

    const changes: MaterialUpdatePayload = {};
    let hasChanges = false;

    const titleInput = document.getElementById(
      `material-title-${materialId}`
    ) as HTMLInputElement;
    const descriptionInput = document.getElementById(
      `material-description-${materialId}`
    ) as HTMLTextAreaElement;
    const extensionInput = document.getElementById(
      `material-extension-${materialId}`
    ) as HTMLInputElement;

    if (titleInput && titleInput.value !== material.material_title) {
      changes.material_title = titleInput.value;
      hasChanges = true;
    }

    if (
      descriptionInput &&
      descriptionInput.value !== material.material_description
    ) {
      changes.material_description = descriptionInput.value;
      hasChanges = true;
    }

    const extensionDays = extensionInput ? parseInt(extensionInput.value) : 0;
    if (!isNaN(extensionDays)) {
      changes.extension_days = extensionDays;
      hasChanges = true;
    }

    const currentUserIds = new Set(material.users.map((u) => u.user_id));
    if (!setsAreEqual(currentUserIds, selectedUsers)) {
      changes.new_users = Array.from(selectedUsers);
      hasChanges = true;
    }

    if (hasChanges) {
      try {
        const jobId = window.location.pathname.split("/")[2];
        const response = await fetch(
          `/api/jobs/${jobId}/materials/${materialId}`,
          {
            method: "PATCH",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(changes),
          }
        );

        if (!response.ok) {
          throw new Error("Failed to update material");
        }

        setActiveModal(null);
        window.location.reload();
      } catch (error) {
        console.error("Error updating material:", error);
      }
    } else {
      setActiveModal(null);
    }
  };

  return (
    <CollapsibleSection title="Materials" itemCount={sortedMaterials.length}>
      <div className="space-y-2">
        {sortedMaterials.map((material) => (
          <div key={material.material_id}>
            <SmallCardFrame>
              <div
                onClick={(e) => handleCardClick(e, material.material_id)}
                className="cursor-pointer"
              >
                <div className="grid grid-cols-3 sm:grid-cols-3 items-start gap-3">
                  <div className="col-span-2 sm:col-span-1 pr-3">
                    <div className="flex flex-col sm:block">
                      <span className="text-sm font-medium break-words">
                        {material.material_title}
                      </span>
                      <span className="text-sm text-gray-600 sm:hidden mt-1">
                        {createLocalDate(
                          material.material_duedate
                        ).toLocaleDateString("en-US", {
                          month: "numeric",
                          day: "numeric",
                        })}
                      </span>
                    </div>
                  </div>
                  <span className="hidden sm:block text-sm text-center col-span-1">
                    {createLocalDate(
                      material.material_duedate
                    ).toLocaleDateString("en-US", {
                      month: "numeric",
                      day: "numeric",
                    })}
                  </span>
                  <div className="col-span-1 flex justify-end">
                    <div className="status-button">
                      <StatusButton
                        id={material.material_id}
                        type="material"
                        currentStatus={material.material_status}
                        onStatusChange={(newStatus) =>
                          handleStatusChange(material.material_id, newStatus)
                        }
                        disabled={!canEditMaterial(material)}
                      />
                    </div>
                  </div>
                </div>

                {expandedMaterialId === material.material_id && (
                  <div className="mt-2 pt-2 border-t border-zinc-200 dark:border-zinc-600">
                    {material.material_description && (
                      <div className="mb-4">
                        <h5 className="text-sm font-medium mb-2">
                          Description:
                        </h5>
                        <SmallCardFrame>
                          <p className="text-sm">
                            {material.material_description}
                          </p>
                        </SmallCardFrame>
                      </div>
                    )}

                    {material.users && material.users.length > 0 && (
                      <div className="space-y-2">
                        <h5 className="text-sm font-medium mb-2">
                          Assigned People:
                        </h5>
                        {material.users.map((user) => (
                          <SmallCardFrame key={user.user_id}>
                            <UserInfoRow
                              firstName={user.first_name}
                              lastName={user.last_name}
                              phone={user.user_phone}
                              email={user.user_email}
                            />
                          </SmallCardFrame>
                        ))}
                      </div>
                    )}

                    <div className="mt-4 flex justify-end">
                      {/* Add the admin access check here */}
                      {hasAdminAccess && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setActiveModal(material.material_id);
                          }}
                          className="px-4 py-2 bg-gray-500 text-white rounded font-bold hover:bg-gray-600 transition-colors"
                        >
                          Edit
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </SmallCardFrame>

            {activeModal === material.material_id && (
              <div
                className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
                onClick={(e) => {
                  if (e.target === e.currentTarget) {
                    setActiveModal(null);
                  }
                }}
              >
                <div className="bg-white dark:bg-zinc-800 rounded-lg max-w-2xl w-full overflow-hidden relative">
                  <div className="p-6">
                    <div className="flex justify-between items-center mb-6">
                      <h3 className="text-xl font-semibold">Edit Material</h3>
                      <button
                        onClick={() => setActiveModal(null)}
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

                    <div className="space-y-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Title
                        </label>
                        <input
                          id={`material-title-${material.material_id}`}
                          type="text"
                          className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-zinc-700 dark:border-zinc-600"
                          defaultValue={material.material_title}
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Description
                        </label>
                        <textarea
                          id={`material-description-${material.material_id}`}
                          className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-zinc-700 dark:border-zinc-600"
                          rows={3}
                          defaultValue={material.material_description}
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Add Extension (Days)
                        </label>
                        <input
                          id={`material-extension-${material.material_id}`}
                          type="number"
                          className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-zinc-700 dark:border-zinc-600"
                          placeholder="Number of days"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Add People
                        </label>
                        <div className="relative" ref={dropdownRef}>
                          <input
                            type="text"
                            placeholder="Search people..."
                            value={userSearchQuery}
                            onChange={(e) => setUserSearchQuery(e.target.value)}
                            onClick={() => setIsDropdownOpen(true)}
                            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-zinc-700 dark:border-zinc-600"
                          />
                          {isDropdownOpen && (
                            <div className="absolute z-10 w-full mt-1 bg-white dark:bg-zinc-800 border border-gray-300 dark:border-zinc-600 rounded-md shadow-lg max-h-60 overflow-auto">
                              {contacts
                                .filter(
                                  (user) =>
                                    !selectedUsers.has(user.user_id) &&
                                    (`${user.first_name} ${user.last_name}`
                                      .toLowerCase()
                                      .includes(
                                        userSearchQuery.toLowerCase()
                                      ) ||
                                      user.user_email
                                        .toLowerCase()
                                        .includes(
                                          userSearchQuery.toLowerCase()
                                        ))
                                )
                                .map((user) => (
                                  <div
                                    key={user.user_id}
                                    className="px-4 py-2 hover:bg-gray-100 dark:hover:bg-zinc-700 cursor-pointer"
                                    onClick={() => {
                                      handleUserSelection(user.user_id);
                                      setIsDropdownOpen(false);
                                    }}
                                  >
                                    {`${user.first_name} ${user.last_name} (${user.user_email})`}
                                  </div>
                                ))}
                            </div>
                          )}

                          <div className="flex flex-wrap gap-2 mt-4">
                            {Array.from(selectedUsers).map((userId) => {
                              const user = contacts.find(
                                (u) => u.user_id === userId
                              );
                              if (!user) return null;

                              return (
                                <div
                                  key={userId}
                                  className="flex items-center bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-3 py-1 rounded-full text-sm"
                                >
                                  <span>{`${user.first_name} ${user.last_name}`}</span>
                                  <button
                                    onClick={() => handleUserSelection(userId)}
                                    className="ml-2 text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-200"
                                  >
                                    <svg
                                      className="w-4 h-4"
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
                              );
                            })}
                          </div>
                        </div>
                      </div>

                      <div className="mt-8 flex justify-end gap-4">
                        <button
                          onClick={() => setActiveModal(null)}
                          className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={async () => {
                            try {
                              await onDelete(material.material_id);
                              setActiveModal(null);
                            } catch (error) {
                              console.error("Error deleting material:", error);
                            }
                          }}
                          className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
                        >
                          Delete
                        </button>
                        <button
                          onClick={() =>
                            handleSaveChanges(material.material_id)
                          }
                          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
                        >
                          Save Changes
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
      {renderAddingForm && renderAddingForm()}
      {renderAddButton && renderAddButton()}
    </CollapsibleSection>
  );
};

export default MaterialsCard;
