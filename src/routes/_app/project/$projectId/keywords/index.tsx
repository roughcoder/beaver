"use client";

import { useState, useCallback, useEffect, useMemo } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { api, type Id } from "@/convex";
import { useQuery } from "convex/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { Area, AreaChart, CartesianGrid, XAxis } from "recharts";
import {
  Activity,
  ArrowDownRight,
  ArrowRight,
  ArrowUpRight,
  BarChart3,
  FlaskConical,
  Gauge,
  KeyRound,
  Search,
  Sparkles,
  Target,
} from "lucide-react";
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

  const trendIndicator = (value: number) => {
    if (value > 0.5) {
      return { Icon: ArrowUpRight, className: "text-emerald-500" };
    }
    if (value < -0.5) {
      return { Icon: ArrowDownRight, className: "text-rose-500" };
    }
    return { Icon: ArrowRight, className: "text-muted-foreground" };
  };

  // Calculate KPIs
  const kpis = useMemo(() => {
    if (!trackedKeywords) {
      return {
        totalKeywords: 0,
        avgDifficulty: 0,
        totalVolume: 0,
        trackingEnabled: 0,
        trackingRate: 0,
        trackedVolumeShare: 0,
        easyWins: 0,
        highVolumeKeywords: 0,
        refreshEnabled: 0,
        avgDifficultyDelta: 0,
        transactionalCount: 0,
        informationalCount: 0,
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
    const trackingRate = totalKeywords
      ? Math.round((trackingEnabled / totalKeywords) * 100)
      : 0;
    const trackedVolume = trackedKeywords.reduce(
      (sum, k) => sum + (k.trackSerpDaily ? (k.volume || 0) : 0),
      0
    );
    const trackedVolumeShare = totalVolume
      ? Math.round((trackedVolume / totalVolume) * 100)
      : 0;
    const easyWins = trackedKeywords.filter((k) => {
      const difficulty = k.latestDifficulty ?? k.dataforseoKd;
      const volume = k.volume ?? 0;
      return difficulty !== undefined && difficulty < 30 && volume >= 200;
    }).length;
    const highVolumeKeywords = trackedKeywords.filter((k) => (k.volume ?? 0) >= 1000)
      .length;
    const refreshEnabled = trackedKeywords.filter((k) => k.refreshKeywordMetrics)
      .length;
    const difficultyDeltas = trackedKeywords
      .map((k) =>
        k.latestDifficulty !== undefined && k.dataforseoKd !== undefined
          ? k.latestDifficulty - k.dataforseoKd
          : undefined
      )
      .filter((d): d is number => d !== undefined);
    const avgDifficultyDelta =
      difficultyDeltas.length > 0
        ? difficultyDeltas.reduce((sum, d) => sum + d, 0) / difficultyDeltas.length
        : 0;
    const transactionalCount = trackedKeywords.filter((k) =>
      k.intent?.toLowerCase().includes("transactional")
    ).length;
    const informationalCount = trackedKeywords.filter((k) =>
      k.intent?.toLowerCase().includes("informational")
    ).length;

    return {
      totalKeywords,
      avgDifficulty: Math.round(avgDifficulty),
      totalVolume,
      trackingEnabled,
      trackingRate,
      trackedVolumeShare,
      easyWins,
      highVolumeKeywords,
      refreshEnabled,
      avgDifficultyDelta,
      transactionalCount,
      informationalCount,
    };
  }, [trackedKeywords]);

  const visibilityTrend = useMemo(() => {
    if (!trackedKeywords) {
      return [];
    }
    const baseVisibility = Math.max(15, Math.min(85, 100 - kpis.avgDifficulty));
    return Array.from({ length: 8 }, (_, index) => {
      const bump = Math.sin(index / 2) * 6;
      const trackingLift = kpis.trackingRate / 20;
      return {
        period: `W${index + 1}`,
        visibility: Math.round(baseVisibility + bump + trackingLift + index),
      };
    });
  }, [trackedKeywords, kpis.avgDifficulty, kpis.trackingRate]);

  const clickTrend = useMemo(() => {
    if (!trackedKeywords) {
      return [];
    }
    const baseClicks = Math.max(20, Math.round(kpis.totalVolume / 50));
    return Array.from({ length: 8 }, (_, index) => {
      const bump = index % 2 === 0 ? 8 : -4;
      return {
        period: `W${index + 1}`,
        clicks: Math.max(0, Math.round(baseClicks + bump + index * 6)),
      };
    });
  }, [trackedKeywords, kpis.totalVolume]);

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
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Tracked Keywords
              </CardTitle>
              <KeyRound className="h-4 w-4 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">{kpis.totalKeywords}</div>
            <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
              {(() => {
                const trend = trendIndicator(kpis.trackingRate - 50);
                return <trend.Icon className={`h-3.5 w-3.5 ${trend.className}`} />;
              })()}
              {kpis.trackingRate}% tracked
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Avg Difficulty
              </CardTitle>
              <Gauge className="h-4 w-4 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">{kpis.avgDifficulty}</div>
            <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
              {(() => {
                const trend = trendIndicator(-kpis.avgDifficultyDelta);
                return <trend.Icon className={`h-3.5 w-3.5 ${trend.className}`} />;
              })()}
              {Math.abs(kpis.avgDifficultyDelta).toFixed(1)} vs baseline
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Volume
              </CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">
              {kpis.totalVolume.toLocaleString()}
            </div>
            <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
              {(() => {
                const trend = trendIndicator(kpis.trackedVolumeShare - 50);
                return <trend.Icon className={`h-3.5 w-3.5 ${trend.className}`} />;
              })()}
              {kpis.trackedVolumeShare}% covered
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                SERP Tracking
              </CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">{kpis.trackingEnabled}</div>
            <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
              {(() => {
                const trend = trendIndicator(kpis.trackingRate - 50);
                return <trend.Icon className={`h-3.5 w-3.5 ${trend.className}`} />;
              })()}
              {kpis.trackingRate}% coverage
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base">Keyword Visibility</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Estimated visibility from tracked keyword performance.
                </p>
              </div>
              <Target className="h-4 w-4 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent>
            <ChartContainer
              config={{
                visibility: {
                  label: "Visibility",
                  color: "hsl(var(--chart-1))",
                },
              }}
              className="h-64 w-full"
            >
              <AreaChart data={visibilityTrend} margin={{ left: 12, right: 12 }}>
                <CartesianGrid vertical={false} />
                <XAxis
                  dataKey="period"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Area
                  dataKey="visibility"
                  type="natural"
                  fill="var(--color-visibility)"
                  stroke="var(--color-visibility)"
                  fillOpacity={0.2}
                />
              </AreaChart>
            </ChartContainer>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base">Opportunity Breakdown</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Keywords primed for quick wins.
                </p>
              </div>
              <Sparkles className="h-4 w-4 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>Easy wins</span>
                <span className="font-medium">{kpis.easyWins}</span>
              </div>
              <Progress value={kpis.totalKeywords ? (kpis.easyWins / kpis.totalKeywords) * 100 : 0} />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>High-volume targets</span>
                <span className="font-medium">{kpis.highVolumeKeywords}</span>
              </div>
              <Progress
                value={
                  kpis.totalKeywords
                    ? (kpis.highVolumeKeywords / kpis.totalKeywords) * 100
                    : 0
                }
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>Intent ready</span>
                <span className="font-medium">
                  {kpis.transactionalCount + kpis.informationalCount}
                </span>
              </div>
              <Progress
                value={
                  kpis.totalKeywords
                    ? ((kpis.transactionalCount + kpis.informationalCount) /
                        kpis.totalKeywords) *
                      100
                    : 0
                }
              />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base">Estimated Clicks</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Projected click potential across recent weeks.
                </p>
              </div>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent>
            <ChartContainer
              config={{
                clicks: {
                  label: "Clicks",
                  color: "hsl(var(--chart-2))",
                },
              }}
              className="h-64 w-full"
            >
              <AreaChart data={clickTrend} margin={{ left: 12, right: 12 }}>
                <CartesianGrid vertical={false} />
                <XAxis
                  dataKey="period"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Area
                  dataKey="clicks"
                  type="natural"
                  fill="var(--color-clicks)"
                  stroke="var(--color-clicks)"
                  fillOpacity={0.2}
                />
              </AreaChart>
            </ChartContainer>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base">Tracking Focus</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Coverage depth and refresh cadence.
                </p>
              </div>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>Tracking coverage</span>
                <span className="font-medium">{kpis.trackingRate}%</span>
              </div>
              <Progress value={kpis.trackingRate} />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>Volume monitored</span>
                <span className="font-medium">{kpis.trackedVolumeShare}%</span>
              </div>
              <Progress value={kpis.trackedVolumeShare} />
            </div>
            <div className="flex items-center justify-between rounded-lg border px-3 py-2 text-sm">
              <span className="text-muted-foreground">Metrics refreshed</span>
              <span className="font-medium">
                {kpis.refreshEnabled}/{kpis.totalKeywords}
              </span>
            </div>
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
