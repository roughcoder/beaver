"use client";

import { useState, useMemo } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
} from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import {
  makeMockKeywords,
  makeMockTimeseries,
  type KeywordRow,
  type TimelineRange,
} from "@/data/mock-keywords";
import { Columns3, Search, TrendingDown, TrendingUp } from "lucide-react";

export const Route = createFileRoute("/_app/project/$projectId/keywords/")({
  component: KeywordsDashboard,
});

type ColumnKey =
  | "keyword"
  | "search_volume"
  | "position_current"
  | "position_change"
  | "position_previous"
  | "movement"
  | "competition"
  | "competition_index"
  | "cpc"
  | "low_top_of_page_bid"
  | "high_top_of_page_bid"
  | "updatedAt";

const COLUMN_DEFINITIONS: Record<
  ColumnKey,
  { label: string; defaultVisible: boolean }
> = {
  keyword: { label: "Keyword", defaultVisible: true },
  search_volume: { label: "Search Volume", defaultVisible: true },
  position_current: { label: "Position", defaultVisible: true },
  position_change: { label: "Change", defaultVisible: true },
  position_previous: { label: "Previous", defaultVisible: false },
  movement: { label: "Movement", defaultVisible: true },
  competition: { label: "Competition", defaultVisible: true },
  competition_index: { label: "Competition Index", defaultVisible: false },
  cpc: { label: "CPC", defaultVisible: true },
  low_top_of_page_bid: { label: "Low Bid", defaultVisible: false },
  high_top_of_page_bid: { label: "High Bid", defaultVisible: false },
  updatedAt: { label: "Last Updated", defaultVisible: false },
};

function KeywordsDashboard() {
  const { projectId } = Route.useParams();
  const [timelineRange, setTimelineRange] = useState<TimelineRange>("30d");
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  // Load column visibility from localStorage
  const storageKey = `keywords:columns:${projectId}`;
  const [columnVisibility, setColumnVisibility] = useState<Record<
    ColumnKey,
    boolean
  >>(() => {
    try {
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        return { ...COLUMN_DEFINITIONS, ...JSON.parse(stored) };
      }
    } catch {
      // Ignore parse errors
    }
    return Object.fromEntries(
      Object.entries(COLUMN_DEFINITIONS).map(([key, def]) => [
        key,
        def.defaultVisible,
      ])
    ) as Record<ColumnKey, boolean>;
  });

  const toggleColumn = (column: ColumnKey) => {
    const newVisibility = {
      ...columnVisibility,
      [column]: !columnVisibility[column],
    };
    setColumnVisibility(newVisibility);
    try {
      localStorage.setItem(storageKey, JSON.stringify(newVisibility));
    } catch {
      // Ignore storage errors
    }
  };

  // Generate mock data
  const keywords = useMemo(
    () => makeMockKeywords({ projectId, count: 60 }),
    [projectId]
  );
  const timeseries = useMemo(
    () => makeMockTimeseries({ projectId, range: timelineRange }),
    [projectId, timelineRange]
  );

  // Filter keywords by search query
  const filteredKeywords = useMemo(() => {
    if (!searchQuery.trim()) return keywords;
    const query = searchQuery.toLowerCase();
    return keywords.filter((k) => k.keyword.toLowerCase().includes(query));
  }, [keywords, searchQuery]);

  // Calculate KPIs from current data
  const kpis = useMemo(() => {
    const avgPosition =
      keywords.reduce((sum, k) => sum + k.position_current, 0) / keywords.length;
    const top3Count = keywords.filter((k) => k.position_current <= 3).length;
    const top10Count = keywords.filter((k) => k.position_current <= 10).length;
    const improvingCount = keywords.filter((k) => k.movement === "up").length;
    const decliningCount = keywords.filter((k) => k.movement === "down").length;
    const improvingPercent = Math.round(
      (improvingCount / keywords.length) * 100
    );
    const decliningPercent = Math.round(
      (decliningCount / keywords.length) * 100
    );
    const avgCompetitionIndex =
      keywords.reduce((sum, k) => sum + k.competition_index, 0) /
      keywords.length;
    const totalSearchVolume = keywords.reduce(
      (sum, k) => sum + k.search_volume,
      0
    );

    return {
      totalKeywords: keywords.length,
      avgPosition: Number(avgPosition.toFixed(1)),
      top3Count,
      top10Count,
      improvingPercent,
      decliningPercent,
      avgCompetitionIndex: Math.round(avgCompetitionIndex),
      totalSearchVolume,
    };
  }, [keywords]);

  // Paginate filtered keywords
  const totalPages = Math.ceil(filteredKeywords.length / pageSize);
  const paginatedKeywords = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredKeywords.slice(start, start + pageSize);
  }, [filteredKeywords, currentPage, pageSize]);

  // Chart configs
  const positionChartConfig: ChartConfig = {
    avgPosition: {
      label: "Avg Position",
      color: "var(--chart-1)",
    },
  };

  const top10ChartConfig: ChartConfig = {
    top10Count: {
      label: "Top 10 Keywords",
      color: "var(--chart-2)",
    },
  };

  const competitionChartConfig: ChartConfig = {
    avgCompetitionIndex: {
      label: "Avg Competition Index",
      color: "var(--chart-3)",
    },
  };

  const movementChartConfig: ChartConfig = {
    improving: {
      label: "Improving",
      color: "var(--chart-4)",
    },
    declining: {
      label: "Declining",
      color: "var(--chart-5)",
    },
  };

  // Format date for display
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    if (timelineRange === "24h") {
      return date.toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
      });
    }
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  const formatMovement = (movement: KeywordRow["movement"]) => {
    switch (movement) {
      case "up":
        return (
          <Badge variant="outline" className="text-green-600 border-green-600">
            <TrendingUp className="h-3 w-3 mr-1" />
            Up
          </Badge>
        );
      case "down":
        return (
          <Badge variant="outline" className="text-red-600 border-red-600">
            <TrendingDown className="h-3 w-3 mr-1" />
            Down
          </Badge>
        );
      case "new":
        return <Badge variant="secondary">New</Badge>;
      default:
        return <Badge variant="outline">Flat</Badge>;
    }
  };

  const formatCompetition = (comp: KeywordRow["competition"]) => {
    const colors = {
      LOW: "text-green-600 border-green-600",
      MEDIUM: "text-yellow-600 border-yellow-600",
      HIGH: "text-red-600 border-red-600",
    };
    return (
      <Badge variant="outline" className={colors[comp]}>
        {comp}
      </Badge>
    );
  };

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-2xl font-semibold">Keywords Dashboard</h2>
        <p className="text-muted-foreground">
          Track keyword performance, SERP positions, and competition metrics.
        </p>
      </div>

      {/* Timeline Selector */}
      <div className="flex items-center justify-between">
        <Tabs value={timelineRange} onValueChange={(v) => setTimelineRange(v as TimelineRange)}>
          <TabsList>
            <TabsTrigger value="24h">24 Hours</TabsTrigger>
            <TabsTrigger value="7d">7 Days</TabsTrigger>
            <TabsTrigger value="14d">14 Days</TabsTrigger>
            <TabsTrigger value="30d">30 Days</TabsTrigger>
            <TabsTrigger value="90d">90 Days</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
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
              Avg Position
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">{kpis.avgPosition}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {kpis.top3Count} in Top 3, {kpis.top10Count} in Top 10
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Performance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold text-green-600">
              {kpis.improvingPercent}%
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {kpis.decliningPercent}% declining
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Competition Index
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">{kpis.avgCompetitionIndex}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Total volume: {kpis.totalSearchVolume.toLocaleString()}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Average Position Over Time</CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer config={positionChartConfig} className="min-h-[200px] w-full">
              <LineChart data={timeseries} accessibilityLayer>
                <CartesianGrid vertical={false} />
                <XAxis
                  dataKey="date"
                  tickLine={false}
                  tickMargin={10}
                  axisLine={false}
                  tickFormatter={formatDate}
                />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Line
                  type="monotone"
                  dataKey="avgPosition"
                  stroke="var(--color-avgPosition)"
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Top 10 Keywords Count</CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer config={top10ChartConfig} className="min-h-[200px] w-full">
              <AreaChart data={timeseries} accessibilityLayer>
                <CartesianGrid vertical={false} />
                <XAxis
                  dataKey="date"
                  tickLine={false}
                  tickMargin={10}
                  axisLine={false}
                  tickFormatter={formatDate}
                />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Area
                  type="monotone"
                  dataKey="top10Count"
                  fill="var(--color-top10Count)"
                  fillOpacity={0.6}
                  stroke="var(--color-top10Count)"
                  strokeWidth={2}
                />
              </AreaChart>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Competition Index Over Time</CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer config={competitionChartConfig} className="min-h-[200px] w-full">
              <LineChart data={timeseries} accessibilityLayer>
                <CartesianGrid vertical={false} />
                <XAxis
                  dataKey="date"
                  tickLine={false}
                  tickMargin={10}
                  axisLine={false}
                  tickFormatter={formatDate}
                />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Line
                  type="monotone"
                  dataKey="avgCompetitionIndex"
                  stroke="var(--color-avgCompetitionIndex)"
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Improving vs Declining</CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer config={movementChartConfig} className="min-h-[200px] w-full">
              <BarChart data={timeseries} accessibilityLayer>
                <CartesianGrid vertical={false} />
                <XAxis
                  dataKey="date"
                  tickLine={false}
                  tickMargin={10}
                  axisLine={false}
                  tickFormatter={formatDate}
                />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar
                  dataKey="improvingCount"
                  fill="var(--color-improving)"
                  radius={4}
                />
                <Bar
                  dataKey="decliningCount"
                  fill="var(--color-declining)"
                  radius={4}
                />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>

      {/* Table Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Tracked Keywords</CardTitle>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search keywords..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="pl-8 w-64"
                />
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="default">
                    <Columns3 className="h-4 w-4 mr-2" />
                    Columns
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuLabel>Toggle columns</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {Object.entries(COLUMN_DEFINITIONS).map(([key, def]) => (
                    <DropdownMenuCheckboxItem
                      key={key}
                      checked={columnVisibility[key as ColumnKey]}
                      onCheckedChange={() => toggleColumn(key as ColumnKey)}
                    >
                      {def.label}
                    </DropdownMenuCheckboxItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  {columnVisibility.keyword && (
                    <TableHead>Keyword</TableHead>
                  )}
                  {columnVisibility.search_volume && (
                    <TableHead>Search Volume</TableHead>
                  )}
                  {columnVisibility.position_current && (
                    <TableHead>Position</TableHead>
                  )}
                  {columnVisibility.position_change && (
                    <TableHead>Change</TableHead>
                  )}
                  {columnVisibility.position_previous && (
                    <TableHead>Previous</TableHead>
                  )}
                  {columnVisibility.movement && (
                    <TableHead>Movement</TableHead>
                  )}
                  {columnVisibility.competition && (
                    <TableHead>Competition</TableHead>
                  )}
                  {columnVisibility.competition_index && (
                    <TableHead>Comp. Index</TableHead>
                  )}
                  {columnVisibility.cpc && <TableHead>CPC</TableHead>}
                  {columnVisibility.low_top_of_page_bid && (
                    <TableHead>Low Bid</TableHead>
                  )}
                  {columnVisibility.high_top_of_page_bid && (
                    <TableHead>High Bid</TableHead>
                  )}
                  {columnVisibility.updatedAt && (
                    <TableHead>Last Updated</TableHead>
                  )}
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedKeywords.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={Object.values(columnVisibility).filter(Boolean).length}
                      className="text-center text-muted-foreground"
                    >
                      No keywords found
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedKeywords.map((keyword) => (
                    <TableRow key={keyword.keyword}>
                      {columnVisibility.keyword && (
                        <TableCell className="font-medium">
                          {keyword.keyword}
                        </TableCell>
                      )}
                      {columnVisibility.search_volume && (
                        <TableCell>{keyword.search_volume.toLocaleString()}</TableCell>
                      )}
                      {columnVisibility.position_current && (
                        <TableCell>{keyword.position_current}</TableCell>
                      )}
                      {columnVisibility.position_change && (
                        <TableCell>
                          <span
                            className={
                              keyword.position_change < 0
                                ? "text-green-600"
                                : keyword.position_change > 0
                                ? "text-red-600"
                                : ""
                            }
                          >
                            {keyword.position_change > 0
                              ? `+${keyword.position_change}`
                              : keyword.position_change}
                          </span>
                        </TableCell>
                      )}
                      {columnVisibility.position_previous && (
                        <TableCell>{keyword.position_previous}</TableCell>
                      )}
                      {columnVisibility.movement && (
                        <TableCell>{formatMovement(keyword.movement)}</TableCell>
                      )}
                      {columnVisibility.competition && (
                        <TableCell>
                          {formatCompetition(keyword.competition)}
                        </TableCell>
                      )}
                      {columnVisibility.competition_index && (
                        <TableCell>{keyword.competition_index}</TableCell>
                      )}
                      {columnVisibility.cpc && (
                        <TableCell>${keyword.cpc.toFixed(2)}</TableCell>
                      )}
                      {columnVisibility.low_top_of_page_bid && (
                        <TableCell>${keyword.low_top_of_page_bid.toFixed(2)}</TableCell>
                      )}
                      {columnVisibility.high_top_of_page_bid && (
                        <TableCell>${keyword.high_top_of_page_bid.toFixed(2)}</TableCell>
                      )}
                      {columnVisibility.updatedAt && (
                        <TableCell>
                          {new Date(keyword.updatedAt).toLocaleDateString()}
                        </TableCell>
                      )}
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between mt-4">
            <div className="text-sm text-muted-foreground">
              Showing {(currentPage - 1) * pageSize + 1} to{" "}
              {Math.min(currentPage * pageSize, filteredKeywords.length)} of{" "}
              {filteredKeywords.length} keywords
            </div>
            <div className="flex items-center gap-2">
              <Select
                value={pageSize.toString()}
                onValueChange={(v) => {
                  setPageSize(Number(v));
                  setCurrentPage(1);
                }}
              >
                <SelectTrigger className="w-20">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">10</SelectItem>
                  <SelectItem value="25">25</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                </SelectContent>
              </Select>
              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious
                      href="#"
                      onClick={(e) => {
                        e.preventDefault();
                        if (currentPage > 1) setCurrentPage(currentPage - 1);
                      }}
                      className={
                        currentPage === 1 ? "pointer-events-none opacity-50" : ""
                      }
                    />
                  </PaginationItem>
                  {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
                    let pageNum: number;
                    if (totalPages <= 7) {
                      pageNum = i + 1;
                    } else if (currentPage <= 4) {
                      pageNum = i + 1;
                    } else if (currentPage >= totalPages - 3) {
                      pageNum = totalPages - 6 + i;
                    } else {
                      pageNum = currentPage - 3 + i;
                    }
                    return (
                      <PaginationItem key={pageNum}>
                        {pageNum === currentPage ? (
                          <PaginationLink href="#" isActive>
                            {pageNum}
                          </PaginationLink>
                        ) : (
                          <PaginationLink
                            href="#"
                            onClick={(e) => {
                              e.preventDefault();
                              setCurrentPage(pageNum);
                            }}
                          >
                            {pageNum}
                          </PaginationLink>
                        )}
                      </PaginationItem>
                    );
                  })}
                  {totalPages > 7 && currentPage < totalPages - 3 && (
                    <PaginationItem>
                      <PaginationEllipsis />
                    </PaginationItem>
                  )}
                  <PaginationItem>
                    <PaginationNext
                      href="#"
                      onClick={(e) => {
                        e.preventDefault();
                        if (currentPage < totalPages)
                          setCurrentPage(currentPage + 1);
                      }}
                      className={
                        currentPage === totalPages
                          ? "pointer-events-none opacity-50"
                          : ""
                      }
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
