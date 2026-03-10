"use client";

import { useState, useCallback } from "react";
import { DEFAULT_PROJECT_ID } from "@/lib/constants";

/**
 * Hook for managing the current project context.
 * Once auth is implemented, this will derive the project from the
 * authenticated user's API key / organization context.
 */
export function useProject() {
  const [projectId, setProjectId] = useState<string>(DEFAULT_PROJECT_ID);

  const switchProject = useCallback((id: string) => {
    setProjectId(id);
  }, []);

  return {
    projectId,
    switchProject,
  };
}
