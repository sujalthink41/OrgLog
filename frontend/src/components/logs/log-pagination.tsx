"use client";

import { Button } from "@/components/ui";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface LogPaginationProps {
  total: number;
  limit: number;
  offset: number;
  onPageChange: (offset: number) => void;
}

export function LogPagination({ total, limit, offset, onPageChange }: LogPaginationProps) {
  const currentPage = Math.floor(offset / limit) + 1;
  const totalPages = Math.ceil(total / limit);
  const startItem = offset + 1;
  const endItem = Math.min(offset + limit, total);

  return (
    <div className="flex items-center justify-between pt-4">
      <p className="text-xs text-slate-500">
        Showing{" "}
        <span className="font-semibold text-slate-700">{startItem}</span>
        {" - "}
        <span className="font-semibold text-slate-700">{endItem}</span>
        {" of "}
        <span className="font-semibold text-slate-700">{total.toLocaleString()}</span>
        {" logs"}
      </p>

      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(Math.max(0, offset - limit))}
          disabled={offset === 0}
        >
          <ChevronLeft className="h-3.5 w-3.5" />
          Previous
        </Button>

        <div className="flex items-center gap-1 px-2">
          <span className="text-xs text-slate-500">
            Page{" "}
            <span className="font-semibold text-slate-700">{currentPage}</span>
            {" of "}
            <span className="font-semibold text-slate-700">{totalPages}</span>
          </span>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(offset + limit)}
          disabled={offset + limit >= total}
        >
          Next
          <ChevronRight className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );
}
