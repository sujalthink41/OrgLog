"use client";

import { createContext, useContext, type ReactNode } from "react";
import { useProject } from "@/lib/hooks/use-project";

interface ProjectContextValue {
  projectId: string;
  switchProject: (id: string) => void;
}

const ProjectContext = createContext<ProjectContextValue | null>(null);

export function ProjectProvider({ children }: { children: ReactNode }) {
  const project = useProject();

  return (
    <ProjectContext.Provider value={project}>
      {children}
    </ProjectContext.Provider>
  );
}

export function useProjectContext() {
  const context = useContext(ProjectContext);
  if (!context) {
    throw new Error("useProjectContext must be used within a ProjectProvider");
  }
  return context;
}
