"use client";

import React, { useState, useEffect } from "react";
import { User } from "@/app/types/database";
import CardFrame from "@/components/CardFrame";
import ClientSearchSelect from "./ClientSearch";
import NewClientModal from "./NewClientModal";
import { validateFiles } from "@/app/lib/s3";

interface NewJobCardProps {
  jobType: string;
  startDate: string;
  errors?: { [key: string]: string };
  willCopyFloorplans?: boolean;
  floorplansToCopyCount?: number;
  onJobDetailsChange: (details: {
    jobTitle: string;
    jobLocation?: string;
    description?: string;
    selectedClient?: { user_id: number } | null;
    floorPlans?: File[];
  }) => void;
}

export default function NewJobCard({
  jobType,
  startDate,
  errors: externalErrors,
  willCopyFloorplans,
  floorplansToCopyCount,
  onJobDetailsChange,
}: NewJobCardProps) {
  const [jobTitle, setJobTitle] = useState("");
  const [showNewClientForm, setShowNewClientForm] = useState(false);
  const [selectedClient, setSelectedClient] = useState<User | null>(null);
  const [jobLocation, setJobLocation] = useState("");
  const [description, setDescription] = useState("");
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [floorPlans, setFloorPlans] = useState<File[]>([]);
  const [uploadStatus, setUploadStatus] = useState<string>("");
  const [showFloorplanDropdown, setShowFloorplanDropdown] = useState(false);

  useEffect(() => {
    if (externalErrors) {
      setErrors(externalErrors);
    }
  }, [externalErrors]);

  const getInputClassName = (fieldName: string, type: string = "text") => {
    const baseClass = "mt-1 block w-full border rounded-md shadow-sm p-2";
    const errorClass = "border-red-500";
    const normalClass = "border-zinc-300";
    const darkModeClass =
      "dark:bg-zinc-800 dark:text-white dark:border-zinc-600";
    const typeSpecificClass =
      type === "file"
        ? `file:mr-4 file:py-0.5 file:px-4 file:rounded-md file:border-0 
         file:text-sm file:font-bold file:bg-zinc-500 file:text-white 
         hover:file:bg-zinc-700 file:transition-colors file:h-[26px] file:mt-[4px]`
        : "";

    return `${baseClass} ${
      errors[fieldName] ? errorClass : normalClass
    } ${darkModeClass} ${typeSpecificClass}`.trim();
  };

  const removeFloorplan = (index: number) => {
    const updatedFloorPlans = [...floorPlans];
    updatedFloorPlans.splice(index, 1);
    setFloorPlans(updatedFloorPlans);
    setUploadStatus(
      updatedFloorPlans.length > 0
        ? `${updatedFloorPlans.length} file${
            updatedFloorPlans.length > 1 ? "s" : ""
          } selected`
        : ""
    );

    onJobDetailsChange({
      jobTitle,
      jobLocation,
      description,
      selectedClient,
      floorPlans: updatedFloorPlans,
    });
  };

  const handleClientSelect = (client: User | null) => {
    setSelectedClient(client);
    onJobDetailsChange({
      jobTitle,
      jobLocation,
      description,
      selectedClient: client ? { user_id: client.user_id } : null,
      floorPlans,
    });
  };

  const handleFloorPlanChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      try {
        const newFiles = Array.from(e.target.files);
        validateFiles(newFiles);

        const updatedFloorPlans = [...floorPlans, ...newFiles];
        setFloorPlans(updatedFloorPlans);
        setUploadStatus(
          `${updatedFloorPlans.length} file${
            updatedFloorPlans.length > 1 ? "s" : ""
          } selected`
        );

        onJobDetailsChange({
          jobTitle,
          jobLocation,
          description,
          selectedClient,
          floorPlans: updatedFloorPlans,
        });

        const fileInput = document.getElementById(
          "floorplan-upload"
        ) as HTMLInputElement;
        if (fileInput) {
          fileInput.value = "";
        }
      } catch (error) {
        if (error instanceof Error) {
          setUploadStatus(error.message);
          setErrors((prev) => ({ ...prev, floorPlan: error.message }));
        }
      }
    }
  };

  const handleInputChange = (field: string, value: string) => {
    if (field === "jobTitle") {
      setJobTitle(value);
      onJobDetailsChange({
        jobTitle: value,
        jobLocation,
        description,
        selectedClient,
        floorPlans,
      });
    }
    setErrors((prev) => ({ ...prev, [field]: "" }));
  };

  const handleLocationChange = (value: string) => {
    setJobLocation(value);
    onJobDetailsChange({
      jobTitle,
      jobLocation: value,
      description,
      selectedClient,
      floorPlans,
    });
  };

  const handleDescriptionChange = (value: string) => {
    setDescription(value);
    onJobDetailsChange({
      jobTitle,
      jobLocation,
      description: value,
      selectedClient,
      floorPlans,
    });
  };

  return (
    <div id="job-details-section" className="space-y-4">
      <CardFrame>
        <div className="space-y-4">
          {/* Title Input */}
          <div>
            <label
              htmlFor="jobTitle"
              className="block text-sm font-medium text-zinc-700 dark:text-white"
            >
              Title
            </label>
            <input
              type="text"
              id="jobTitle"
              value={jobTitle}
              onChange={(e) => handleInputChange("jobTitle", e.target.value)}
              className={getInputClassName("jobTitle")}
              placeholder="Job title..."
              required
            />
            {errors.jobTitle && (
              <p className="text-red-500 text-xs mt-1">{errors.jobTitle}</p>
            )}
          </div>

          {/* Location and Floor Plan Inputs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="jobLocation"
                className="block text-sm font-medium text-zinc-700 dark:text-white"
              >
                Location
              </label>
              <input
                type="text"
                id="jobLocation"
                value={jobLocation}
                onChange={(e) => handleLocationChange(e.target.value)}
                className={getInputClassName("jobLocation")}
                placeholder="Address..."
              />
            </div>
            <div>
              <label
                htmlFor="floorPlan"
                className="block text-sm font-medium text-zinc-700 dark:text-white"
              >
                Floor Plans
                {willCopyFloorplans && (
                  <span className="block sm:inline sm:ml-2 text-blue-500 text-sm font-normal mt-1 sm:mt-0">
                    ({floorplansToCopyCount} will be copied from original job)
                  </span>
                )}
              </label>

              <div className="flex items-center gap-2 mt-1">
                <div className="relative flex-grow">
                  <button
                    type="button"
                    onClick={() =>
                      setShowFloorplanDropdown(!showFloorplanDropdown)
                    }
                    className="w-full px-3 py-2 text-left border rounded-md shadow-sm border-zinc-300 dark:border-zinc-600 flex justify-between items-center dark:bg-zinc-800 dark:text-white"
                  >
                    <span className="truncate">
                      {floorPlans.length === 0
                        ? willCopyFloorplans
                          ? "Add more floor plans..."
                          : "No floor plans selected"
                        : `${floorPlans.length} floor plan${
                            floorPlans.length !== 1 ? "s" : ""
                          } selected`}
                    </span>
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
                        d="M19 9l-7 7-7-7"
                      />
                    </svg>
                  </button>

                  {/* Dropdown showing selected files */}
                  {showFloorplanDropdown && floorPlans.length > 0 && (
                    <div className="absolute z-10 w-full mt-1 bg-white dark:bg-zinc-800 border border-gray-300 dark:border-zinc-600 rounded-md shadow-lg max-h-48 overflow-auto">
                      <ul className="py-1">
                        {floorPlans.map((file, index) => (
                          <li
                            key={index}
                            className="px-3 py-2 flex justify-between items-center hover:bg-gray-100 dark:hover:bg-zinc-700"
                          >
                            <span className="truncate">{file.name}</span>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                removeFloorplan(index);
                              }}
                              className="text-red-500 hover:text-red-700"
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
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => {
                    const input = document.getElementById("floorplan-upload");
                    if (input) {
                      input.click();
                    }
                  }}
                  className="px-3 py-2 bg-blue-500 text-white font-medium rounded-md hover:bg-blue-600 transition-colors"
                >
                  Add
                </button>

                {/* Hidden file input */}
                <input
                  id="floorplan-upload"
                  type="file"
                  accept="image/jpeg,image/png,image/gif,application/pdf"
                  multiple
                  className="hidden"
                  onChange={handleFloorPlanChange}
                />
              </div>

              {errors.floorPlan && (
                <p className="text-red-500 text-xs mt-1">{errors.floorPlan}</p>
              )}
            </div>
          </div>

          {/* Client Selection */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="flex-1">
                <ClientSearchSelect
                  onClientSelect={handleClientSelect}
                  selectedClient={selectedClient}
                />
              </div>
              <button
                type="button"
                onClick={() => setShowNewClientForm(true)}
                className="mt-6 min-w-[100px] px-3 py-2 bg-blue-500 text-white font-medium rounded-md hover:bg-blue-700 transition-colors"
              >
                Create
              </button>
            </div>
          </div>

          {/* Description Input */}
          <div>
            <label
              htmlFor="description"
              className="block text-sm font-medium text-zinc-700 dark:text-white"
            >
              Description
            </label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => handleDescriptionChange(e.target.value)}
              rows={3}
              className={getInputClassName("description")}
              placeholder="This is a detailed or high level description of the job..."
            />
          </div>
        </div>
      </CardFrame>

      {/* New Client Modal */}
      <NewClientModal
        isOpen={showNewClientForm}
        onClose={() => setShowNewClientForm(false)}
        onClientCreated={(client: User) => {
          setSelectedClient(client);
          onJobDetailsChange({
            jobTitle,
            jobLocation,
            description,
            selectedClient: { user_id: client.user_id },
            floorPlans,
          });
          setShowNewClientForm(false);
        }}
      />
    </div>
  );
}
