"use client";

import React, { useState, useEffect } from "react";
import { User } from "../../app/types/database";
import CardFrame from "../util/CardFrame";
import ClientSearchSelect from "./ClientSearch";
import NewClientModal from "./NewClientModal";
import { validateFiles } from "@/app/lib/s3";

interface NewJobCardProps {
  jobType: string;
  startDate: string;
  errors?: { [key: string]: string };
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
  onJobDetailsChange,
}: NewJobCardProps) {
  const [contacts, setContacts] = useState<User[]>([]);
  const [jobTitle, setJobTitle] = useState("");
  const [showNewClientForm, setShowNewClientForm] = useState(false);
  const [selectedClient, setSelectedClient] = useState<User | null>(null);
  const [jobLocation, setJobLocation] = useState("");
  const [description, setDescription] = useState("");
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [floorPlans, setFloorPlans] = useState<File[]>([]);
  const [uploadStatus, setUploadStatus] = useState<string>("");

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
        const files = Array.from(e.target.files);
        validateFiles(files);
        setFloorPlans(files);
        setUploadStatus(
          `${files.length} file${files.length > 1 ? "s" : ""} selected`
        );

        onJobDetailsChange({
          jobTitle,
          jobLocation,
          description,
          selectedClient,
          floorPlans: files,
        });
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

  useEffect(() => {
    const fetchContacts = async () => {
      try {
        const response = await fetch("/api/users/non-clients");
        if (response.ok) {
          const data = await response.json();
          setContacts(data);
        }
      } catch (error) {
        console.error("Error fetching contacts:", error);
      }
    };

    fetchContacts();
  }, []);

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
          <div className="grid grid-cols-2 gap-4">
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
              </label>
              <div className="relative">
                <input
                  type="file"
                  id="floorPlan"
                  accept="image/*"
                  multiple
                  onChange={handleFloorPlanChange}
                  className={`${getInputClassName(
                    "floorPlan",
                    "file"
                  )} custom-file-input opacity-0 absolute inset-0 w-full h-full cursor-pointer`}
                />
                <div
                  className={`${getInputClassName(
                    "floorPlan"
                  )} pointer-events-none text-zinc-500 dark:text-zinc-400`}
                >
                  {uploadStatus || (
                    <>
                      <span className="hidden sm:inline">
                        Select floor plan images...
                      </span>
                      <span className="sm:hidden">Images...</span>
                    </>
                  )}
                </div>
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
                className="mt-6 min-w-[100px] px-3 py-2 bg-blue-500 text-white font-bold rounded-md hover:bg-blue-700 transition-colors"
              >
                Add New Client
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
