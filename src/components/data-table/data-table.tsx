"use client"

import * as React from "react"
import {
  type ColumnDef,
  type ColumnFiltersState,
  type SortingState,
  type VisibilityState,
  type PaginationState,
  type Table as TanStackTable,
  type Updater,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table"

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Spinner } from "@/components/ui/spinner"

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[]
  data: TData[]
  onTableReady?: (table: TanStackTable<TData>) => void
  initialColumnFilters?: ColumnFiltersState
  sorting?: SortingState // For controlled sorting (server-side)
  onSortingChange?: (sorting: SortingState) => void // For controlled sorting (server-side)
  pagination?: PaginationState // For controlled pagination (server-side)
  onPaginationChange?: (pagination: PaginationState) => void // For controlled pagination (server-side)
  manualPagination?: boolean // Disable client-side pagination
  isLoading?: boolean // Show loading spinner during async operations
  onRowDoubleClick?: (row: TData) => void // Callback when a row is double-clicked
  onSelectedRowCountChange?: (count: number) => void // Notify parent when selection count changes
}

export function DataTable<TData, TValue>({
  columns,
  data,
  onTableReady,
  initialColumnFilters = [],
  sorting: controlledSorting,
  onSortingChange,
  pagination: controlledPagination,
  onPaginationChange,
  manualPagination = false,
  isLoading = false,
  onRowDoubleClick,
  onSelectedRowCountChange,
}: DataTableProps<TData, TValue>) {
  const [internalSorting, setInternalSorting] = React.useState<SortingState>([])
  const sorting = controlledSorting ?? internalSorting
  const setSorting = onSortingChange ?? setInternalSorting
  
  const [internalPagination, setInternalPagination] = React.useState<PaginationState>({
    pageIndex: 0,
    pageSize: 50,
  })
  const pagination = controlledPagination ?? internalPagination
  const setPagination = onPaginationChange ?? setInternalPagination
  
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    initialColumnFilters
  )
  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>(() => {
      // Set default visibility based on column meta
      const initial: VisibilityState = {};
      columns.forEach((col) => {
        const meta = col.meta as { defaultHidden?: boolean } | undefined;
        if (col.id && meta?.defaultHidden) {
          initial[col.id] = false;
        }
      });
      return initial;
    })
  const [rowSelection, setRowSelection] = React.useState<Record<string, boolean>>({})

  // Handle updater functions for controlled state
  const handleSortingChange = React.useCallback((updater: Updater<SortingState>) => {
    if (onSortingChange) {
      const newSorting = typeof updater === 'function' ? updater(sorting) : updater;
      onSortingChange(newSorting);
    } else {
      // React's setState accepts Updater<T> directly
      const newSorting = typeof updater === 'function' ? updater(sorting) : updater;
      setSorting(newSorting);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onSortingChange, sorting, setSorting]);

  const handlePaginationChange = React.useCallback((updater: Updater<PaginationState>) => {
    if (onPaginationChange) {
      const newPagination = typeof updater === 'function' ? updater(pagination) : updater;
      onPaginationChange(newPagination);
    } else {
      // React's setState accepts Updater<T> directly
      const newPagination = typeof updater === 'function' ? updater(pagination) : updater;
      setPagination(newPagination);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onPaginationChange, pagination, setPagination]);

  const handleRowSelectionChange = React.useCallback(
    (updater: Updater<Record<string, boolean>>) => {
      const nextSelection =
        typeof updater === "function" ? updater(rowSelection) : updater;
      setRowSelection(nextSelection);
      if (onSelectedRowCountChange) {
        const count = Object.values(nextSelection).filter(Boolean).length;
        onSelectedRowCountChange(count);
      }
    },
    [rowSelection, onSelectedRowCountChange],
  );

  const table = useReactTable({
    data,
    columns,
    onSortingChange: handleSortingChange,
    onPaginationChange: handlePaginationChange,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: manualPagination ? undefined : getPaginationRowModel(),
    getSortedRowModel: manualPagination ? undefined : getSortedRowModel(),
    getFilteredRowModel: manualPagination ? undefined : getFilteredRowModel(),
    manualPagination,
    manualSorting: manualPagination,
    manualFiltering: manualPagination,
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: handleRowSelectionChange,
    state: {
      sorting,
      pagination,
      columnFilters,
      columnVisibility,
      rowSelection,
    },
  })

  React.useEffect(() => {
    if (onTableReady) {
      onTableReady(table);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [table, onTableReady])

  return (
    <div className="w-full">
      <div className="overflow-hidden rounded-md border relative">
        {isLoading && (
          <div className="absolute inset-0 bg-background/50 backdrop-blur-sm z-10 flex items-center justify-center">
            <Spinner className="size-6" />
          </div>
        )}
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </TableHead>
                  )
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {isLoading && !data.length ? (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  <div className="flex items-center justify-center gap-2">
                    <Spinner className="size-4" />
                    <span className="text-muted-foreground">Loading...</span>
                  </div>
                </TableCell>
              </TableRow>
            ) : table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => {
                const handleDoubleClick = (e: React.MouseEvent) => {
                  // Ignore double-clicks on interactive elements
                  const target = e.target as HTMLElement;
                  const isInteractive = 
                    target.closest('button') ||
                    target.closest('a') ||
                    target.closest('input') ||
                    target.closest('[role="checkbox"]') ||
                    target.closest('[role="button"]') ||
                    target.tagName === 'BUTTON' ||
                    target.tagName === 'A' ||
                    target.tagName === 'INPUT';
                  
                  if (!isInteractive && onRowDoubleClick) {
                    onRowDoubleClick(row.original);
                  }
                };

                return (
                  <TableRow
                    key={row.id}
                    data-state={row.getIsSelected() && "selected"}
                    onDoubleClick={handleDoubleClick}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id}>
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext()
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                );
              })
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  No results.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}

