"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { projectsApi } from "@/lib/api";
import { useAuthContext } from "./auth-provider";
import type { Project } from "@/lib/types";

interface ProjectContextValue {
  projects: Project[];
  currentProject: Project | null;
  projectId: string;
  isLoading: boolean;
  switchProject: (id: string) => void;
  refreshProjects: () => Promise<void>;
  createProject: (name: string) => Promise<Project>;
}

const ProjectContext = createContext<ProjectContextValue | null>(null);

const SELECTED_PROJECT_KEY = "orglog_selected_project";

export function ProjectProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useAuthContext();
  const [projects, setProjects] = useState<Project[]>([]);
  const [currentProject, setCurrentProject] = useState<Project | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const fetchProjects = useCallback(async () => {
    if (!isAuthenticated) return;
    setIsLoading(true);
    try {
      const data = await projectsApi.list();
      setProjects(data);

      // restore last selected project or pick first
      const savedId = localStorage.getItem(SELECTED_PROJECT_KEY);
      const saved = savedId ? data.find((p) => p.id === savedId) : null;
      if (saved) {
        setCurrentProject(saved);
      } else if (data.length > 0) {
        setCurrentProject(data[0]);
        localStorage.setItem(SELECTED_PROJECT_KEY, data[0].id);
      }
    } catch {
      // if fetch fails, clear state
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  const switchProject = useCallback(
    (id: string) => {
      const project = projects.find((p) => p.id === id);
      if (project) {
        setCurrentProject(project);
        localStorage.setItem(SELECTED_PROJECT_KEY, id);
      }
    },
    [projects]
  );

  const createProject = useCallback(
    async (name: string) => {
      const newProject = await projectsApi.create({ name });
      setProjects((prev) => [...prev, newProject]);
      setCurrentProject(newProject);
      localStorage.setItem(SELECTED_PROJECT_KEY, newProject.id);
      return newProject;
    },
    []
  );

  const refreshProjects = useCallback(async () => {
    await fetchProjects();
  }, [fetchProjects]);

  return (
    <ProjectContext.Provider
      value={{
        projects,
        currentProject,
        projectId: currentProject?.id ?? "",
        isLoading,
        switchProject,
        refreshProjects,
        createProject,
      }}
    >
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
