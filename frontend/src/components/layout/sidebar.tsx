"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Search,
  Radio,
  BarChart3,
  ChevronLeft,
  ChevronRight,
  Layers,
  FolderKanban,
  ChevronDown,
  Plus,
  LogOut,
  User,
  Check,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { NAVIGATION } from "@/lib/constants";
import {
  useLiveLogsContext,
  useSidebarContext,
  useProjectContext,
  useAuthContext,
} from "@/lib/providers";

const iconMap = {
  LayoutDashboard,
  Search,
  Radio,
  BarChart3,
} as const;

export function Sidebar() {
  const pathname = usePathname();
  const { collapsed, toggle } = useSidebarContext();
  const { isConnected, messages } = useLiveLogsContext();
  const { user, logout } = useAuthContext();
  const {
    projects,
    currentProject,
    switchProject,
    createProject,
  } = useProjectContext();

  const [projectDropdownOpen, setProjectDropdownOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [showNewProject, setShowNewProject] = useState(false);
  const [newProjectName, setNewProjectName] = useState("");
  const [creating, setCreating] = useState(false);

  async function handleCreateProject() {
    if (!newProjectName.trim() || creating) return;
    setCreating(true);
    try {
      await createProject(newProjectName.trim());
      setNewProjectName("");
      setShowNewProject(false);
    } catch {
      // silently fail
    } finally {
      setCreating(false);
    }
  }

  const initials = user?.name
    ? user.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "U";

  return (
    <aside
      className={cn(
        "fixed left-0 top-0 bottom-0 z-30 flex flex-col border-r border-slate-200 bg-white transition-all duration-300",
        collapsed ? "w-[72px]" : "w-[260px]"
      )}
    >
      {/* Logo */}
      <div className="flex items-center h-16 px-4 border-b border-slate-200 shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-blue-600 shrink-0">
            <Layers className="h-5 w-5 text-white" />
          </div>
          {!collapsed && (
            <div className="min-w-0">
              <h1 className="text-base font-bold text-slate-900 truncate">
                OrgLog
              </h1>
              <p className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">
                Logging Platform
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Project Selector */}
      {!collapsed && (
        <div className="px-3 pt-4 pb-2">
          <div className="relative">
            <button
              onClick={() => {
                setProjectDropdownOpen(!projectDropdownOpen);
                setUserDropdownOpen(false);
              }}
              className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg border border-slate-200 bg-slate-50/80 hover:bg-slate-100 transition-colors text-left"
            >
              <div className="flex items-center justify-center w-7 h-7 rounded-md bg-blue-100 shrink-0">
                <FolderKanban className="h-3.5 w-3.5 text-blue-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-slate-900 truncate">
                  {currentProject?.name || "Select project"}
                </p>
                <p className="text-[10px] text-slate-400 truncate">
                  {projects.length} project{projects.length !== 1 ? "s" : ""}
                </p>
              </div>
              <ChevronDown
                className={cn(
                  "h-3.5 w-3.5 text-slate-400 transition-transform",
                  projectDropdownOpen && "rotate-180"
                )}
              />
            </button>

            {/* Project dropdown */}
            {projectDropdownOpen && (
              <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-slate-200 rounded-lg shadow-lg z-50 overflow-hidden">
                <div className="max-h-[200px] overflow-y-auto py-1">
                  {projects.map((project) => (
                    <button
                      key={project.id}
                      onClick={() => {
                        switchProject(project.id);
                        setProjectDropdownOpen(false);
                      }}
                      className={cn(
                        "w-full flex items-center gap-2.5 px-3 py-2 text-left text-sm hover:bg-slate-50 transition-colors",
                        currentProject?.id === project.id && "bg-blue-50"
                      )}
                    >
                      <FolderKanban
                        className={cn(
                          "h-3.5 w-3.5 shrink-0",
                          currentProject?.id === project.id
                            ? "text-blue-600"
                            : "text-slate-400"
                        )}
                      />
                      <span
                        className={cn(
                          "flex-1 truncate",
                          currentProject?.id === project.id
                            ? "text-blue-700 font-medium"
                            : "text-slate-700"
                        )}
                      >
                        {project.name}
                      </span>
                      {currentProject?.id === project.id && (
                        <Check className="h-3.5 w-3.5 text-blue-600 shrink-0" />
                      )}
                    </button>
                  ))}
                </div>

                <div className="border-t border-slate-100 p-2">
                  {showNewProject ? (
                    <div className="flex gap-1.5">
                      <input
                        type="text"
                        value={newProjectName}
                        onChange={(e) => setNewProjectName(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") handleCreateProject();
                          if (e.key === "Escape") {
                            setShowNewProject(false);
                            setNewProjectName("");
                          }
                        }}
                        placeholder="Project name"
                        autoFocus
                        className="flex-1 h-8 px-2.5 text-xs rounded-md border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                      <button
                        onClick={handleCreateProject}
                        disabled={!newProjectName.trim() || creating}
                        className="h-8 px-3 text-xs font-medium rounded-md bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 transition-colors"
                      >
                        {creating ? "..." : "Add"}
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setShowNewProject(true)}
                      className="w-full flex items-center gap-2 px-2 py-1.5 text-xs font-medium text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      New project
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Collapsed project icon */}
      {collapsed && currentProject && (
        <div className="px-3 pt-4 pb-2 flex justify-center">
          <div
            className="flex items-center justify-center w-9 h-9 rounded-lg bg-blue-100 cursor-pointer hover:bg-blue-200 transition-colors"
            title={currentProject.name}
          >
            <FolderKanban className="h-4 w-4 text-blue-600" />
          </div>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 px-3 py-3 space-y-1 overflow-y-auto">
        {!collapsed && (
          <p className="px-3 mb-2 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
            Platform
          </p>
        )}
        {NAVIGATION.items.map((item) => {
          const Icon = iconMap[item.icon];
          const isActive =
            item.href === "/dashboard"
              ? pathname === "/dashboard"
              : pathname.startsWith(item.href);
          const isLiveTail = item.href === "/dashboard/live";

          return (
            <Link
              key={item.href}
              href={item.href}
              title={collapsed ? item.label : undefined}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150",
                collapsed && "justify-center px-0",
                isActive
                  ? "bg-blue-50 text-blue-700"
                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
              )}
            >
              <div className="relative shrink-0">
                <Icon
                  className={cn(
                    "h-[18px] w-[18px]",
                    isActive ? "text-blue-600" : "text-slate-400"
                  )}
                />
                {isLiveTail && isConnected && collapsed && (
                  <span className="absolute -top-0.5 -right-0.5 flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                  </span>
                )}
              </div>
              {!collapsed && (
                <span className="truncate flex-1">{item.label}</span>
              )}
              {isLiveTail && isConnected && !collapsed && (
                <span className="relative flex h-2 w-2 shrink-0">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                </span>
              )}
              {isLiveTail && !collapsed && messages.length > 0 && (
                <span className="text-[10px] font-semibold text-slate-400 tabular-nums">
                  {messages.length}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* User section */}
      <div className="border-t border-slate-200 shrink-0">
        <div className="relative">
          {userDropdownOpen && !collapsed && (
            <div className="absolute bottom-full left-3 right-3 mb-1 bg-white border border-slate-200 rounded-lg shadow-lg z-50 overflow-hidden">
              <div className="px-3 py-2.5 border-b border-slate-100">
                <p className="text-xs font-medium text-slate-900 truncate">
                  {user?.name}
                </p>
                <p className="text-[10px] text-slate-400 truncate">
                  {user?.email}
                </p>
              </div>
              <button
                onClick={() => {
                  setUserDropdownOpen(false);
                  logout();
                }}
                className="w-full flex items-center gap-2.5 px-3 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
              >
                <LogOut className="h-3.5 w-3.5" />
                Sign out
              </button>
            </div>
          )}

          <button
            onClick={() => {
              setUserDropdownOpen(!userDropdownOpen);
              setProjectDropdownOpen(false);
            }}
            className={cn(
              "w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-50 transition-colors",
              collapsed && "justify-center px-0"
            )}
          >
            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-white text-xs font-bold shrink-0">
              {initials}
            </div>
            {!collapsed && (
              <div className="flex-1 min-w-0 text-left">
                <p className="text-xs font-medium text-slate-900 truncate">
                  {user?.name}
                </p>
                <p className="text-[10px] text-slate-400 truncate">
                  {user?.email}
                </p>
              </div>
            )}
          </button>
        </div>

        {/* Collapse toggle */}
        <div className="px-3 py-2 border-t border-slate-100">
          <button
            onClick={toggle}
            className="flex items-center justify-center w-full h-8 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
          >
            {collapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <ChevronLeft className="h-4 w-4" />
            )}
          </button>
        </div>
      </div>
    </aside>
  );
}
