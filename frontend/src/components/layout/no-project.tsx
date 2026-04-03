"use client";

import { useState } from "react";
import { FolderKanban, Plus } from "lucide-react";
import { useProjectContext } from "@/lib/providers";

export function NoProjectSelected() {
  const { createProject } = useProjectContext();
  const [name, setName] = useState("");
  const [creating, setCreating] = useState(false);
  const [showForm, setShowForm] = useState(false);

  async function handleCreate() {
    if (!name.trim() || creating) return;
    setCreating(true);
    try {
      await createProject(name.trim());
    } catch {
      // handled by provider
    } finally {
      setCreating(false);
    }
  }

  return (
    <div className="flex-1 flex items-center justify-center p-6">
      <div className="text-center max-w-sm">
        <div className="flex items-center justify-center w-16 h-16 rounded-2xl bg-blue-50 border border-blue-100 mx-auto mb-5">
          <FolderKanban className="h-8 w-8 text-blue-500" />
        </div>
        <h3 className="text-lg font-semibold text-slate-900 mb-1.5">
          No project selected
        </h3>
        <p className="text-sm text-slate-500 mb-6 leading-relaxed">
          Create your first project to start ingesting and viewing logs.
        </p>

        {showForm ? (
          <div className="flex gap-2 max-w-xs mx-auto">
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleCreate();
                if (e.key === "Escape") {
                  setShowForm(false);
                  setName("");
                }
              }}
              placeholder="Project name"
              autoFocus
              className="flex-1 h-10 px-3 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            <button
              onClick={handleCreate}
              disabled={!name.trim() || creating}
              className="h-10 px-4 text-sm font-medium rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              {creating ? "..." : "Create"}
            </button>
          </div>
        ) : (
          <button
            onClick={() => setShowForm(true)}
            className="inline-flex items-center gap-2 h-10 px-5 text-sm font-medium rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors shadow-sm shadow-blue-600/20"
          >
            <Plus className="h-4 w-4" />
            Create project
          </button>
        )}
      </div>
    </div>
  );
}
