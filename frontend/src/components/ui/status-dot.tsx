import { cn } from "@/lib/utils";

interface StatusDotProps {
  status: "online" | "offline" | "warning";
  className?: string;
  pulse?: boolean;
}

const statusColors = {
  online: "bg-emerald-500",
  offline: "bg-slate-400",
  warning: "bg-amber-500",
};

export function StatusDot({ status, className, pulse = false }: StatusDotProps) {
  return (
    <span className={cn("relative flex h-2.5 w-2.5", className)}>
      {pulse && status === "online" && (
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
      )}
      <span className={cn("relative inline-flex rounded-full h-2.5 w-2.5", statusColors[status])} />
    </span>
  );
}
