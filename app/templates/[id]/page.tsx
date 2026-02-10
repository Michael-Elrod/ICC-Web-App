// page.tsx

"use client";

import React, { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { useSession } from "next-auth/react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import CardFrame from "@/components/CardFrame";
import TemplatePhaseCard, {
  TemplatePhaseData,
} from "../_components/TemplatePhaseCard";
import { UserView } from "@/app/types/views";
import {
  createLocalDate,
  formatToDateString,
  getCurrentBusinessDate,
} from "@/app/utils";

export default function EditTemplatePage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { data: session, status } = useSession();
  const [templateName, setTemplateName] = useState("");
  const [phases, setPhases] = useState<TemplatePhaseData[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [contacts, setContacts] = useState<UserView[]>([]);
  const [previewStartDate, setPreviewStartDate] = useState(() =>
    formatToDateString(getCurrentBusinessDate(new Date())),
  );

  const canAccess =
    session?.user?.type === "Owner" || session?.user?.type === "Admin";

  useEffect(() => {
    if (!canAccess) return;

    const fetchTemplate = async () => {
      try {
        const res = await fetch(`/api/templates/${id}`);
        if (!res.ok) {
          router.push("/templates");
          return;
        }
        const data = await res.json();
        setTemplateName(data.template_name);

        const loadedPhases: TemplatePhaseData[] = data.phases.map(
          (phase: any) => ({
            tempId: `phase-${phase.template_phase_id}`,
            title: phase.phase_title,
            description: phase.phase_description || "",
            tasks: phase.tasks.map((task: any) => ({
              tempId: `task-${task.template_task_id}`,
              title: task.task_title,
              duration: task.task_duration,
              offset: task.task_offset,
              description: task.task_description || "",
              contacts: task.contacts || [],
            })),
            materials: phase.materials.map((material: any) => ({
              tempId: `material-${material.template_material_id}`,
              title: material.material_title,
              offset: material.material_offset,
              description: material.material_description || "",
              contacts: material.contacts || [],
            })),
          }),
        );

        setPhases(loadedPhases);
      } catch (err) {
        console.error("Error fetching template:", err);
        router.push("/templates");
      } finally {
        setLoading(false);
      }
    };

    const fetchContacts = async () => {
      try {
        const res = await fetch("/api/users/non-clients");
        if (res.ok) {
          const data = await res.json();
          setContacts(data);
        }
      } catch (err) {
        console.error("Error fetching contacts:", err);
      }
    };

    fetchTemplate();
    fetchContacts();
  }, [id, canAccess, router]);

  if (status === "loading") return null;

  if (!canAccess) {
    return (
      <div className="mx-auto p-4">
        <p className="text-zinc-600 dark:text-zinc-400">
          You do not have permission to access this page.
        </p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="mx-auto space-y-4 pt-6">
        <div className="animate-pulse">
          <div className="h-8 bg-zinc-200 dark:bg-zinc-700 rounded w-48 mb-4" />
          <div className="h-32 bg-zinc-200 dark:bg-zinc-700 rounded mb-4" />
          <div className="h-32 bg-zinc-200 dark:bg-zinc-700 rounded" />
        </div>
      </div>
    );
  }

  const handleAddPhase = (afterPhaseId: string | null) => {
    const newPhase: TemplatePhaseData = {
      tempId: `phase-${Date.now()}`,
      title: "New Phase",
      description: "",
      tasks: [],
      materials: [],
    };

    if (afterPhaseId === null) {
      setPhases([...phases, newPhase]);
    } else {
      const index = phases.findIndex((p) => p.tempId === afterPhaseId);
      const newPhases = [
        ...phases.slice(0, index + 1),
        newPhase,
        ...phases.slice(index + 1),
      ];
      setPhases(newPhases);
    }
  };

  const handleSubmit = async () => {
    setError("");

    if (!templateName.trim()) {
      setError("Template name is required");
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        template_name: templateName,
        phases: phases.map((phase) => ({
          title: phase.title,
          description: phase.description,
          tasks: phase.tasks.map((task) => ({
            title: task.title,
            duration: task.duration,
            offset: task.offset,
            description: task.description,
            contacts: task.contacts.map((c) => ({ user_id: c.user_id })),
          })),
          materials: phase.materials.map((material) => ({
            title: material.title,
            offset: material.offset,
            description: material.description,
            contacts: material.contacts.map((c) => ({ user_id: c.user_id })),
          })),
        })),
      };

      const res = await fetch(`/api/templates/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        router.push("/templates");
      } else {
        const data = await res.json();
        setError(data.error || "Failed to update template");
      }
    } catch (err) {
      console.error("Error updating template:", err);
      setError("Failed to update template");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="mx-auto space-y-4 pt-6">
      <h2 className="text-2xl font-bold mb-2">Edit Template</h2>

      <CardFrame>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label
              htmlFor="templateName"
              className="block text-sm font-medium text-zinc-700 dark:text-white"
            >
              Template Name
            </label>
            <input
              id="templateName"
              type="text"
              value={templateName}
              onChange={(e) => {
                setTemplateName(e.target.value);
                setError("");
              }}
              className="mt-1 w-full border rounded-md shadow-sm p-2 text-zinc-700 dark:text-white border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-800"
              placeholder="e.g. Crawl Space, Slab"
            />
            {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-white">
              Preview Start Date
            </label>
            <DatePicker
              selected={
                previewStartDate ? createLocalDate(previewStartDate) : null
              }
              onChange={(date: Date | null) => {
                if (date) {
                  setPreviewStartDate(formatToDateString(date));
                }
              }}
              filterDate={(date: Date) => {
                const day = date.getDay();
                return day !== 0 && day !== 6;
              }}
              dateFormat="MM/dd/yyyy"
              className="mt-1 w-full border rounded-md shadow-sm p-2 text-zinc-700 dark:text-white border-zinc-300 dark:bg-zinc-800 dark:border-zinc-600 h-[44px] appearance-none"
              wrapperClassName="w-full"
            />
            <p className="text-xs text-zinc-400 mt-1">
              Pick an example start date to preview what dates your offsets
              translate to. This is not saved.
            </p>
          </div>
        </div>
      </CardFrame>

      <div className="mt-8 space-y-4">
        <h2 className="text-2xl font-bold">Phases</h2>
        <div className="relative h-2">
          <div className="absolute left-0 right-0 -top-2 h-8 flex justify-center items-center transition-opacity duration-200 opacity-0 hover:opacity-100">
            <button
              className="bg-blue-500 hover:bg-blue-600 text-white rounded-full w-8 h-8 flex items-center justify-center shadow-lg"
              onClick={() => {
                const newPhase: TemplatePhaseData = {
                  tempId: `phase-${Date.now()}`,
                  title: "New Phase",
                  description: "",
                  tasks: [],
                  materials: [],
                };
                setPhases([newPhase, ...phases]);
              }}
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
                  d="M12 4v16m8-8H4"
                />
              </svg>
            </button>
          </div>
        </div>
        <div className="space-y-4">
          {phases.map((phase, index) => (
            <TemplatePhaseCard
              key={phase.tempId}
              phase={phase}
              onUpdate={(updatedPhase) => {
                const newPhases = [...phases];
                newPhases[index] = updatedPhase;
                setPhases(newPhases);
              }}
              onDelete={() => {
                setPhases(phases.filter((_, i) => i !== index));
              }}
              onAddPhaseAfter={(phaseId) => handleAddPhase(phaseId)}
              contacts={contacts}
              phaseIndex={index}
              previewStartDate={previewStartDate}
            />
          ))}
          {phases.length === 0 && (
            <div className="flex justify-center py-8">
              <button
                className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md"
                onClick={() => handleAddPhase(null)}
              >
                Add First Phase
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="mt-8 mb-8 flex justify-end gap-4">
        <button
          onClick={() => router.push("/templates")}
          className="px-6 py-3 text-white font-bold rounded-md shadow-lg bg-zinc-500 hover:bg-zinc-600 transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={handleSubmit}
          disabled={isSubmitting}
          className={`px-6 py-3 text-white font-bold rounded-md shadow-lg transition-colors ${
            isSubmitting
              ? "bg-gray-400 cursor-not-allowed"
              : "bg-green-500 hover:bg-green-600"
          }`}
        >
          {isSubmitting ? (
            <span className="flex items-center">
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
              Saving...
            </span>
          ) : (
            "Save Changes"
          )}
        </button>
      </div>
    </div>
  );
}
