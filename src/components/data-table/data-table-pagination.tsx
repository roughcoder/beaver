import * as React from "react"
import { type Table } from "@tanstack/react-table"
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface DataTablePaginationProps<TData> {
  table: Table<TData>
  totalCount?: number // For server-side pagination
  onPageChange?: (pageIndex: number) => void // For server-side pagination
  onPageSizeChange?: (pageSize: number) => void // For server-side pagination
  selectedCount?: number
}

export function DataTablePagination<TData>({
  table,
  totalCount,
  onPageChange,
  onPageSizeChange,
  selectedCount,
}: DataTablePaginationProps<TData>) {
  const pageSize = table.getState().pagination.pageSize
  const pageIndex = table.getState().pagination.pageIndex
  
  // Use server-side totalCount if provided, otherwise use client-side calculation
  const totalPages = totalCount !== undefined 
    ? Math.ceil(totalCount / pageSize)
    : table.getPageCount()
  
  const isServerSide = totalCount !== undefined

  const handlePageChange = (newPageIndex: number) => {
    if (isServerSide && onPageChange) {
      onPageChange(newPageIndex)
    } else {
      table.setPageIndex(newPageIndex)
    }
  }

  const handlePageSizeChange = (newPageSize: number) => {
    if (isServerSide && onPageSizeChange) {
      onPageSizeChange(newPageSize)
    } else {
      table.setPageSize(newPageSize)
    }
  }

  const canPreviousPage = pageIndex > 0
  const canNextPage = pageIndex < totalPages - 1

  const selected = selectedCount ?? table.getSelectedRowModel().rows.length

  return (
    <div className="flex items-center justify-between px-2">
      <div className="text-muted-foreground flex-1 text-sm">
        {selected} of{" "}
        {isServerSide && totalCount !== undefined 
          ? totalCount 
          : table.getRowModel().rows.length} row(s) selected.
      </div>
      <div className="flex items-center space-x-6 lg:space-x-8">
        <div className="flex items-center space-x-2">
          <p className="text-sm font-medium">Rows per page</p>
          <Select
            key={pageSize}
            value={String(pageSize)}
            onValueChange={(value) => {
              handlePageSizeChange(Number(value))
            }}
          >
            <SelectTrigger className="h-8 w-[80px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent side="top">
              {[50, 100, 250, 500, 1000].map((size) => (
                <SelectItem key={size} value={String(size)}>
                  {size}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex w-[100px] items-center justify-center text-sm font-medium">
          Page {pageIndex + 1} of {totalPages}
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="icon"
            className="hidden size-8 lg:flex"
            onClick={() => handlePageChange(0)}
            disabled={!canPreviousPage}
          >
            <span className="sr-only">Go to first page</span>
            <ChevronsLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="size-8"
            onClick={() => handlePageChange(pageIndex - 1)}
            disabled={!canPreviousPage}
          >
            <span className="sr-only">Go to previous page</span>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="size-8"
            onClick={() => handlePageChange(pageIndex + 1)}
            disabled={!canNextPage}
          >
            <span className="sr-only">Go to next page</span>
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="hidden size-8 lg:flex"
            onClick={() => handlePageChange(totalPages - 1)}
            disabled={!canNextPage}
          >
            <span className="sr-only">Go to last page</span>
            <ChevronsRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}

