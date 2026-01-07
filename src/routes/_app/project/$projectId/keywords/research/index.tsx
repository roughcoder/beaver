"use client";

import { useState, useMemo } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { api, type Id } from "@/convex";
import { useQuery } from "convex/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Search, ChevronRight, Plus, List } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { z } from "zod";

const searchSchema = z.object({
  jobId: z.string().optional(),
  locationCode: z.string().optional(),
  languageCode: z.string().optional(),
  device: z.string().optional(),
});

export const Route = createFileRoute(
  "/_app/project/$projectId/keywords/research/"
)({
  validateSearch: searchSchema,
  component: ResearchMode,
});

function ResearchMode() {
  const { projectId } = Route.useParams();
  const id = projectId as Id<"projects">;
  const search = Route.useSearch();
  const navigate = useNavigate();

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedKeywordIds, setSelectedKeywordIds] = useState<Set<Id<"keywords">>>(
    new Set()
  );

  const results = useQuery(api.keywordResearch.listResearchResults, {
    projectId: id,
    jobId: search.jobId ? (search.jobId as Id<"jobs">) : undefined,
  });

  const filteredResults = useMemo(() => {
    if (!results) return [];
    if (!searchQuery.trim()) return results;
    const query = searchQuery.toLowerCase();
    return results.filter((r) => r.keyword.toLowerCase().includes(query));
  }, [results, searchQuery]);

  const toggleSelection = (keywordId: Id<"keywords">) => {
    const newSet = new Set(selectedKeywordIds);
    if (newSet.has(keywordId)) {
      newSet.delete(keywordId);
    } else {
      newSet.add(keywordId);
    }
    setSelectedKeywordIds(newSet);
  };

  const toggleAll = () => {
    if (selectedKeywordIds.size === filteredResults.length) {
      setSelectedKeywordIds(new Set());
    } else {
      setSelectedKeywordIds(new Set(filteredResults.map((r) => r.keywordId)));
    }
  };

  const handleContinue = () => {
    if (selectedKeywordIds.size === 0) {
      alert("Please select at least one keyword");
      return;
    }

      navigate({
        to: "/project/$projectId/keywords/research/step-3",
        params: { projectId: id },
        search: { 
          keywordIds: Array.from(selectedKeywordIds),
          locationCode: search.locationCode,
          languageCode: search.languageCode,
          device: search.device,
        },
      });
  };

  const formatDifficulty = (kd: number | undefined) => {
    if (kd === undefined) return "—";
    if (kd < 30)
      return (
        <Badge variant="outline" className="text-green-600 border-green-600">
          {kd}
        </Badge>
      );
    if (kd < 70)
      return (
        <Badge variant="outline" className="text-yellow-600 border-yellow-600">
          {kd}
        </Badge>
      );
    return (
      <Badge variant="outline" className="text-red-600 border-red-600">
        {kd}
      </Badge>
    );
  };

  if (results === undefined) {
    return <div className="text-muted-foreground">Loading results...</div>;
  }

  return (
    <div className="flex flex-col gap-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold">Keyword Ideas</h2>
          <p className="text-muted-foreground">
            Review and select keywords to add to your project.
          </p>
        </div>
        <Button asChild>
          <Link
            to="/project/$projectId/keywords"
            params={{ projectId: id }}
          >
            <List className="h-4 w-4 mr-2" />
            Live Mode
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>
              {filteredResults.length} keyword{filteredResults.length !== 1 ? "s" : ""} found
            </CardTitle>
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
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">
                    <Checkbox
                      checked={
                        filteredResults.length > 0 &&
                        selectedKeywordIds.size === filteredResults.length
                      }
                      onCheckedChange={toggleAll}
                    />
                  </TableHead>
                  <TableHead>Keyword</TableHead>
                  <TableHead>Source</TableHead>
                  <TableHead>Difficulty</TableHead>
                  <TableHead>Volume</TableHead>
                  <TableHead>CPC</TableHead>
                  <TableHead>Intent</TableHead>
                  <TableHead>Freshness</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredResults.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center text-muted-foreground">
                      No keywords found. Try adjusting your search.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredResults.map((result) => (
                    <TableRow key={result.keywordId}>
                      <TableCell>
                        <Checkbox
                          checked={selectedKeywordIds.has(result.keywordId)}
                          onCheckedChange={() => toggleSelection(result.keywordId)}
                        />
                      </TableCell>
                      <TableCell className="font-medium max-w-xs truncate" title={result.keyword}>
                        {result.keyword}
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">{result.source}</Badge>
                      </TableCell>
                      <TableCell>{formatDifficulty(result.baselineKd)}</TableCell>
                      <TableCell>
                        {result.searchVolume?.toLocaleString() || "—"}
                      </TableCell>
                      <TableCell>
                        {result.cpc ? `$${result.cpc.toFixed(2)}` : "—"}
                      </TableCell>
                      <TableCell>
                        {result.intent ? (
                          <Badge variant="outline">{result.intent}</Badge>
                        ) : (
                          "—"
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            result.freshness === "Fresh"
                              ? "default"
                              : result.freshness === "Cached"
                              ? "secondary"
                              : "outline"
                          }
                        >
                          {result.freshness}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          <div className="flex items-center justify-between mt-4">
            <div className="text-sm text-muted-foreground">
              {selectedKeywordIds.size} of {filteredResults.length} selected
            </div>
            <div className="flex items-center gap-2">
              <Button asChild>
                <Link
                  to="/project/$projectId/keywords/research/add"
                  params={{ projectId: id }}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add keywords
                </Link>
              </Button>
              <Button onClick={handleContinue} disabled={selectedKeywordIds.size === 0}>
                Continue
                <ChevronRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
