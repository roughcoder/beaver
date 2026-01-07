"use client";

import { useState } from "react";
import { createFileRoute, useNavigate, useSearch } from "@tanstack/react-router";
import { api, type Id } from "@/convex";
import { useQuery, useMutation } from "convex/react";
import { useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { ChevronLeft, Check } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { z } from "zod";

const searchSchema = z.object({
  keywordIds: z.array(z.string()).optional(),
  locationCode: z.string().optional(),
  languageCode: z.string().optional(),
  device: z.string().optional(),
});

export const Route = createFileRoute(
  "/_app/project/$projectId/keywords/research/step-3"
)({
  validateSearch: searchSchema,
  component: ResearchStep3,
});

function ResearchStep3() {
  const { projectId } = Route.useParams();
  const id = projectId as Id<"projects">;
  const search = Route.useSearch();
  const navigate = useNavigate();
  const addToProject = useMutation(api.keywordResearch.addSelectedToProject);
  const getOrCreateContext = useMutation(api.keywordContexts.getOrCreate);

  const project = useQuery(api.projects.get, { projectId: id });

  const [refreshKeywordMetrics, setRefreshKeywordMetrics] = useState(true);
  const [trackSerpDaily, setTrackSerpDaily] = useState(false);
  const [fetchBacklinks, setFetchBacklinks] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [contextId, setContextId] = useState<Id<"keywordContexts"> | null>(null);

  const keywordIds = search.keywordIds
    ? (search.keywordIds.map((id) => id as Id<"keywords">) as Id<"keywords">[])
    : [];

  // Get or create context on mount
  useEffect(() => {
    if (search.locationCode && search.languageCode) {
      getOrCreateContext({
        seType: "google",
        locationCode: Number(search.locationCode),
        languageCode: search.languageCode,
        device: search.device,
      }).then(setContextId).catch(console.error);
    }
  }, [search.locationCode, search.languageCode, search.device, getOrCreateContext]);

  const handleAddToProject = async () => {
    if (!contextId) {
      alert("Context not found. Please go back and restart the research.");
      return;
    }

    setIsLoading(true);
    try {
      await addToProject({
        projectId: id,
        keywordIds,
        contextId,
        refreshKeywordMetrics,
        trackSerpDaily,
        fetchBacklinks,
      });

      navigate({
        to: "/project/$projectId/keywords",
        params: { projectId: id },
      });
    } catch (error) {
      console.error("Failed to add keywords:", error);
      alert("Failed to add keywords. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  if (project === undefined || contextId === null) {
    return <div className="text-muted-foreground">Loading...</div>;
  }

  return (
    <div className="flex flex-col gap-6 max-w-2xl mx-auto">
      <div>
        <h2 className="text-2xl font-semibold">Add to Project</h2>
        <p className="text-muted-foreground">
          Confirm settings for adding {keywordIds.length} keyword{keywordIds.length !== 1 ? "s" : ""} to{" "}
          {project?.name}.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Tracking Options</CardTitle>
          <CardDescription>
            Choose how you want to track these keywords. Option A (default) adds them
            with cached data and no immediate API costs.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="refreshMetrics"
              checked={refreshKeywordMetrics}
              onCheckedChange={(checked) =>
                setRefreshKeywordMetrics(checked === true)
              }
            />
            <Label htmlFor="refreshMetrics" className="cursor-pointer">
              Refresh keyword metrics every 7 days (default ON)
            </Label>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="trackSerp"
              checked={trackSerpDaily}
              onCheckedChange={(checked) => setTrackSerpDaily(checked === true)}
            />
            <Label htmlFor="trackSerp" className="cursor-pointer">
              Track SERP daily (24h) - default OFF
            </Label>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="fetchBacklinks"
              checked={fetchBacklinks}
              onCheckedChange={(checked) => setFetchBacklinks(checked === true)}
              disabled={!trackSerpDaily}
            />
            <Label
              htmlFor="fetchBacklinks"
              className={`cursor-pointer ${!trackSerpDaily ? "text-muted-foreground" : ""}`}
            >
              Fetch competitor backlink summaries (7d) - only if SERP tracking enabled
            </Label>
          </div>

          <div className="bg-muted p-4 rounded-md text-sm">
            <p className="font-medium mb-2">Option A (default):</p>
            <ul className="list-disc list-inside space-y-1 text-muted-foreground">
              <li>Added to project with cached data where available</li>
              <li>No additional API calls will run now</li>
              <li>You can enrich or enable daily tracking at any time</li>
            </ul>
          </div>

          <div className="flex items-center justify-between pt-4">
            <Button variant="outline" asChild>
              <Link
                to="/project/$projectId/keywords/research"
                params={{ projectId: id }}
              >
                <ChevronLeft className="h-4 w-4 mr-2" />
                Back
              </Link>
            </Button>
            <Button onClick={handleAddToProject} disabled={isLoading}>
              {isLoading ? "Adding..." : "Add to Project"}
              <Check className="h-4 w-4 ml-2" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

