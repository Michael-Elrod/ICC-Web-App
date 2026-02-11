// page.tsx

"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import CardFrame from "@/components/CardFrame";
import { FaEdit, FaTrash } from "react-icons/fa";
import { useTemplates, useDeleteTemplate } from "@/app/hooks/use-templates";

export default function TemplatesPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const { data: templates = [], isLoading } = useTemplates();
  const deleteTemplate = useDeleteTemplate();
  const [deleteId, setDeleteId] = useState<number | null>(null);

  const canAccess =
    session?.user?.type === "Owner" || session?.user?.type === "Admin";

  const handleDelete = async () => {
    if (!deleteId) return;
    deleteTemplate.mutate(deleteId, {
      onSuccess: () => setDeleteId(null),
      onError: (error) => {
        console.error("Error deleting template:", error);
        setDeleteId(null);
      },
    });
  };

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

  return (
    <div className="mx-auto space-y-4 pt-6">
      <div className="flex justify-between items-center mb-2">
        <h2 className="text-2xl font-bold">Job Templates</h2>
        <button
          onClick={() => router.push("/templates/new")}
          className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white font-bold rounded-md transition-colors"
        >
          Create New Template
        </button>
      </div>

      {isLoading ? (
        <CardFrame>
          <div className="animate-pulse space-y-3">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-12 bg-zinc-200 dark:bg-zinc-700 rounded"
              />
            ))}
          </div>
        </CardFrame>
      ) : templates.length === 0 ? (
        <CardFrame>
          <p className="text-center text-zinc-500 dark:text-zinc-400 py-8">
            No templates found. Create one to get started.
          </p>
        </CardFrame>
      ) : (
        <div className="space-y-4">
          {templates.map((template) => (
            <CardFrame key={template.template_id}>
              <div className="flex items-center justify-between">
                <span className="text-lg font-medium dark:text-white">
                  {template.template_name}
                </span>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() =>
                      router.push(`/templates/${template.template_id}`)
                    }
                    className="p-2 text-zinc-600 dark:text-zinc-400 hover:text-blue-500 dark:hover:text-blue-400 transition-colors"
                    title="Edit template"
                  >
                    <FaEdit size={18} />
                  </button>
                  <button
                    onClick={() => setDeleteId(template.template_id)}
                    className="p-2 text-zinc-600 dark:text-zinc-400 hover:text-red-500 dark:hover:text-red-400 transition-colors"
                    title="Delete template"
                  >
                    <FaTrash size={16} />
                  </button>
                </div>
              </div>
            </CardFrame>
          ))}
        </div>
      )}

      {/* Delete confirmation modal */}
      {deleteId !== null && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-zinc-800 p-6 rounded-lg shadow-xl max-w-sm">
            <p className="text-lg font-medium dark:text-white mb-4">
              Delete this template? This cannot be undone.
            </p>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setDeleteId(null)}
                className="px-4 py-2 text-zinc-600 dark:text-zinc-400"
                disabled={deleteTemplate.isPending}
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={deleteTemplate.isPending}
                className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded disabled:opacity-50"
              >
                {deleteTemplate.isPending ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
