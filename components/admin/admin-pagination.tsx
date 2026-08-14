import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight } from "lucide-react"

interface PaginationProps {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export function AdminPagination({ page, totalPages, onPageChange }: PaginationProps) {
  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-center gap-4 py-6">
      <Button
        variant="outline"
        size="sm"
        disabled={page <= 1}
        onClick={() => onPageChange(page - 1)}
        className="gap-1 border-border/40"
      >
        <ChevronLeft className="w-4 h-4" /> Previous
      </Button>
      
      <div className="text-sm font-bold">
        Page <span className="text-primary">{page}</span> of {totalPages}
      </div>

      <Button
        variant="outline"
        size="sm"
        disabled={page >= totalPages}
        onClick={() => onPageChange(page + 1)}
        className="gap-1 border-border/40"
      >
        Next <ChevronRight className="w-4 h-4" />
      </Button>
    </div>
  )
}
