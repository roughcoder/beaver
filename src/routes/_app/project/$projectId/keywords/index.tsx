"use client";

import { useState, useMemo } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { api, type Id } from "@/convex";
import { useQuery } from "convex/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Search, FlaskConical } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

export const Route = createFileRoute("/_app/project/$projectId/keywords/")({
  component: KeywordsDashboard,
});

function KeywordsDashboard() {
  const { projectId } = Route.useParams();
  const id = projectId as Id<"projects">;
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  const trackedKeywords = useQuery(api.trackedKeywords.listByProject, {
    projectId: id,
  });

  // Filter keywords by search query
  const filteredKeywords = useMemo(() => {
    if (!trackedKeywords) return [];
    if (!searchQuery.trim()) return trackedKeywords;
    const query = searchQuery.toLowerCase();
    return trackedKeywords.filter((k) => k.keyword.toLowerCase().includes(query));
  }, [trackedKeywords, searchQuery]);

  // Paginate filtered keywords
  const totalPages = Math.ceil(filteredKeywords.length / pageSize);
  const paginatedKeywords = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredKeywords.slice(start, start + pageSize);
  }, [filteredKeywords, currentPage, pageSize]);

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

  const formatDifficulty = (difficulty: number | undefined) => {
    if (difficulty === undefined) return "—";
    if (difficulty < 30) return <Badge variant="outline" className="text-green-600 border-green-600">{difficulty}</Badge>;
    if (difficulty < 70) return <Badge variant="outline" className="text-yellow-600 border-yellow-600">{difficulty}</Badge>;
    return <Badge variant="outline" className="text-red-600 border-red-600">{difficulty}</Badge>;
  };

  if (trackedKeywords === undefined) {
    return <div className="text-muted-foreground">Loading keywords…</div>;
  }

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
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Keywords</CardTitle>
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
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                    <TableHead>Keyword</TableHead>
                  <TableHead>Difficulty</TableHead>
                  <TableHead>Volume</TableHead>
                  <TableHead>CPC</TableHead>
                  <TableHead>Intent</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>SERP Tracking</TableHead>
                  <TableHead>Last Update</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedKeywords.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={8}
                      className="text-center text-muted-foreground"
                    >
                      {trackedKeywords.length === 0
                        ? "No keywords tracked yet. Start by researching new keywords."
                        : "No keywords match your search."}
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedKeywords.map((keyword) => (
                    <TableRow key={keyword._id}>
                        <TableCell className="font-medium max-w-xs truncate" title={keyword.keyword}>
                          {keyword.keyword}
                        </TableCell>
                      <TableCell>
                        {formatDifficulty(keyword.latestDifficulty ?? keyword.dataforseoKd)}
                      </TableCell>
                      <TableCell>
                        {keyword.volume?.toLocaleString() || "—"}
                      </TableCell>
                        <TableCell>
                        {keyword.cpc ? `$${keyword.cpc.toFixed(2)}` : "—"}
                        </TableCell>
                      <TableCell>
                        {keyword.intent ? (
                          <Badge variant="secondary">{keyword.intent}</Badge>
                        ) : (
                          "—"
                        )}
                      </TableCell>
                        <TableCell>
                        {keyword.locationCode} / {keyword.languageCode}
                        </TableCell>
                      <TableCell>
                        {keyword.trackSerpDaily ? (
                          <Badge variant="outline" className="text-green-600 border-green-600">
                            Enabled
                          </Badge>
                        ) : (
                          <Badge variant="outline">Disabled</Badge>
                        )}
                      </TableCell>
                        <TableCell>
                        {keyword.lastMetricsUpdate
                          ? new Date(keyword.lastMetricsUpdate).toLocaleDateString()
                          : "—"}
                        </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
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
                          currentPage === 1
                            ? "pointer-events-none opacity-50"
                            : ""
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
          )}
        </CardContent>
      </Card>
    </div>
  );
}
