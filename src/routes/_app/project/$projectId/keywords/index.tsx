"use client";

import { useState, useCallback, useEffect, useMemo } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { api, type Id } from "@/convex";
import { useQuery } from "convex/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, FlaskConical } from "lucide-react";
import type { Table, SortingState } from "@tanstack/react-table";
import { DataTable } from "@/components/data-table/data-table";
import { DataTablePagination } from "@/components/data-table/data-table-pagination";
import { DataTableViewOptions } from "@/components/data-table/data-table-view-options";
import { createLiveKeywordColumns } from "@/table-configs/live-keywords/columns";
import type { LiveKeywordRow } from "@/table-configs/live-keywords/types";
import { KeywordDetailsSheet } from "@/components/keywords/keyword-details-sheet";

export const Route = createFileRoute("/_app/project/$projectId/keywords/")({
  component: KeywordsDashboard,
});

function KeywordsDashboard() {
  const { projectId } = Route.useParams();
  const id = projectId as Id<"projects">;
  const [searchQuery, setSearchQuery] = useState("");
  const [pageIndex, setPageIndex] = useState(0);
  const [pageSize, setPageSize] = useState(50);
  const [sorting, setSorting] = useState<SortingState>([]);
  const [table, setTable] = useState<Table<LiveKeywordRow> | null>(null);
  const [selectedCount, setSelectedCount] = useState(0);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [selectedKeywordId, setSelectedKeywordId] = useState<Id<"keywords"> | null>(null);
  const [selectedContextId, setSelectedContextId] = useState<Id<"keywordContexts"> | null>(null);
  const [defaultTab, setDefaultTab] = useState<"overview" | "serp">("overview");

  // Get full list for KPI calculations
  const trackedKeywords = useQuery(api.trackedKeywords.listByProject, {
    projectId: id,
  });

  // Get paginated data for table
  const paginatedData = useQuery(api.trackedKeywords.listByProjectPaged, {
    projectId: id,
    pageIndex,
    pageSize,
    search: searchQuery || undefined,
    sortColumn: sorting[0]?.id,
    sortDirection: sorting[0]?.desc ? "desc" : "asc",
  });

  // Keep previous data to show while loading (prevents table disappearing)
  const [previousData, setPreviousData] = useState<typeof paginatedData>(undefined);
  useEffect(() => {
    if (paginatedData !== undefined) {
      setPreviousData(paginatedData);
    }
  }, [paginatedData]);

  // Show loading when query is undefined (initial load or refetch)
  const isLoading = paginatedData === undefined;
  // Use previous data if available, otherwise empty array
  const displayData = previousData ?? paginatedData;

  const handleTableReady = useCallback((tableInstance: Table<LiveKeywordRow>) => {
    setTable(tableInstance);
  }, []);

  const handleSortingChange = useCallback((newSorting: SortingState) => {
    setSorting(newSorting);
  }, []);

  const handlePaginationChange = useCallback((pagination: { pageIndex: number; pageSize: number }) => {
    setPageIndex(pagination.pageIndex);
    setPageSize(pagination.pageSize);
  }, []);

  const handleRowDoubleClick = useCallback((row: LiveKeywordRow) => {
    setSelectedKeywordId(row.keywordId);
    setSelectedContextId(row.contextId);
    setDefaultTab("overview");
    setSheetOpen(true);
  }, []);

  const handleViewSerp = useCallback((row: LiveKeywordRow) => {
    setSelectedKeywordId(row.keywordId);
    setSelectedContextId(row.contextId);
    setDefaultTab("serp");
    setSheetOpen(true);
  }, []);

  const handleViewDetails = useCallback((row: LiveKeywordRow) => {
    setSelectedKeywordId(row.keywordId);
    setSelectedContextId(row.contextId);
    setDefaultTab("overview");
    setSheetOpen(true);
  }, []);

  const columns = useMemo(
    () =>
      createLiveKeywordColumns({
        onViewSerp: handleViewSerp,
        onViewDetails: handleViewDetails,
      }),
    [handleViewSerp, handleViewDetails]
  );

  // Reset to first page when search or sorting changes
  useEffect(() => {
    // These are intentionally "trigger-only" deps; we still want to reset page
    // even though we don't otherwise use them in the effect.
    void searchQuery;
    void sorting;
    setPageIndex(0);
  }, [searchQuery, sorting]);

  // Calculate KPIs
  const kpis = useMemo(() => {
    if (!trackedKeywords) {
      return {
        totalKeywords: 0,
        avgDifficulty: 0,
        totalVolume: 0,
        trackingEnabled: 0,
      };
    }

    const totalKeywords = trackedKeywords.length;
    const difficulties = trackedKeywords
      .map((k) => k.latestDifficulty ?? k.dataforseoKd)
      .filter((d): d is number => d !== undefined);
    const avgDifficulty =
      difficulties.length > 0
        ? difficulties.reduce((sum, d) => sum + d, 0) / difficulties.length
        : 0;
    const totalVolume = trackedKeywords.reduce(
      (sum, k) => sum + (k.volume || 0),
      0
    );
    const trackingEnabled = trackedKeywords.filter((k) => k.trackSerpDaily)
      .length;

    return {
      totalKeywords,
      avgDifficulty: Math.round(avgDifficulty),
      totalVolume,
      trackingEnabled,
    };
  }, [trackedKeywords]);

  // Show initial loading state only if we have no previous data
  if (trackedKeywords === undefined || (paginatedData === undefined && previousData === undefined)) {
    return <div className="text-muted-foreground">Loading keywords…</div>;
  }

  const totalCount = displayData?.totalCount ?? 0;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold">Tracked Keywords</h2>
          <p className="text-muted-foreground">
            Manage and monitor your tracked keywords.
          </p>
        </div>
        <Button asChild>
          <Link to="/project/$projectId/keywords/research" params={{ projectId: id }}>
            <FlaskConical className="h-4 w-4 mr-2" />
            Research Mode
          </Link>
        </Button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Tracked Keywords
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">{kpis.totalKeywords}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Avg Difficulty
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">{kpis.avgDifficulty}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Volume
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">
              {kpis.totalVolume.toLocaleString()}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              SERP Tracking
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">{kpis.trackingEnabled}</div>
            <p className="text-xs text-muted-foreground mt-1">enabled</p>
          </CardContent>
        </Card>
      </div>

      {/* Table Section */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            {totalCount} keyword{totalCount !== 1 ? "s" : ""} found
          </div>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search keywords..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 w-64"
              />
            </div>
            {table && <DataTableViewOptions table={table} />}
          </div>
        </div>

        <DataTable
          columns={columns}
          data={(displayData?.rows ?? []) as LiveKeywordRow[]}
          onTableReady={handleTableReady}
          initialColumnFilters={[]}
          sorting={sorting}
          onSortingChange={handleSortingChange}
          pagination={{ pageIndex, pageSize }}
          onPaginationChange={handlePaginationChange}
          manualPagination={true}
          isLoading={isLoading}
          onRowDoubleClick={handleRowDoubleClick}
          onSelectedRowCountChange={setSelectedCount}
        />

        {table && (
          <DataTablePagination
            table={table}
            totalCount={totalCount}
            selectedCount={selectedCount}
            onPageChange={setPageIndex}
            onPageSizeChange={(newSize) => {
              setPageSize(newSize);
              setPageIndex(0);
            }}
          />
        )}
      </div>

      {selectedKeywordId && selectedContextId && (
        <KeywordDetailsSheet
          open={sheetOpen}
          onOpenChange={setSheetOpen}
          projectId={id}
          keywordId={selectedKeywordId}
          contextId={selectedContextId}
          defaultTab={defaultTab}
        />
      )}
    </div>
  );
}
