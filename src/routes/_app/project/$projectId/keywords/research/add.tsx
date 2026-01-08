"use client";

import { useId, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { api, type Id } from "@/convex";
import { useMutation, useQuery } from "convex/react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getLanguageByCode, getLocationByCode, LANGUAGES, LOCATIONS } from "@/lib/locations";
import { ChevronRight } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const Route = createFileRoute(
  "/_app/project/$projectId/keywords/research/add"
)({
  component: AddKeywords,
});

function AddKeywords() {
  const { projectId } = Route.useParams();
  const id = projectId as Id<"projects">;
  const navigate = useNavigate();
  const startResearch = useMutation(api.keywordResearch.startResearchRun);
  const project = useQuery(api.projects.get, { projectId: id });

  const [seedKeywords, setSeedKeywords] = useState("");
  const [device, setDevice] = useState<string>("desktop");
  const [includeBulkKd, setIncludeBulkKd] = useState(true);
  const [isLoading, setIsLoading] = useState(false);

  const keywordsId = useId();
  const deviceId = useId();
  const bulkKdId = useId();

  const handleContinue = async () => {
    if (!project) {
      alert("Project not found. Please check your project settings.");
      return;
    }

    const keywords = seedKeywords
      .split("\n")
      .map((k) => k.trim())
      .filter((k) => k.length > 0);

    if (keywords.length === 0) {
      alert("Please enter at least one seed keyword");
      return;
    }

    setIsLoading(true);
    try {
      const resolvedLocationCode = Number(project.default_region);
      const locationCode = Number.isFinite(resolvedLocationCode)
        ? resolvedLocationCode
        : (LOCATIONS[1]?.code ?? LOCATIONS[0]?.code ?? 2826);
      const languageCode = project.default_language || (LANGUAGES[0]?.code ?? "en");

      const jobId = await startResearch({
        projectId: id,
        seedKeywords: keywords,
        locationCode,
        languageCode,
        device,
        includeBulkKd,
      });

      navigate({
        to: "/project/$projectId/keywords/research",
        params: { projectId: id },
        search: { jobId, device },
      });
    } catch (error) {
      console.error("Failed to start research:", error);
      alert("Failed to start research. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  if (project === undefined) {
    return <div className="text-muted-foreground">Loading…</div>;
  }

  if (project === null) {
    return (
      <div>
        <h2 className="text-2xl font-semibold">Add Keywords</h2>
        <p className="text-muted-foreground">
          This project doesn’t exist or you don’t have access.
        </p>
      </div>
    );
  }

  const resolvedLocationCode = Number(project.default_region);
  const locationCode = Number.isFinite(resolvedLocationCode)
    ? resolvedLocationCode
    : (LOCATIONS[1]?.code ?? LOCATIONS[0]?.code ?? 2826);
  const locationName = getLocationByCode(locationCode)?.name ?? "Unknown";
  const languageName = getLanguageByCode(project.default_language)?.name ?? "Unknown";

  return (
    <div className="flex flex-col gap-6 max-w-2xl mx-auto">
      <div>
        <h2 className="text-2xl font-semibold">Add Keywords</h2>
        <p className="text-muted-foreground">
          Enter seed keywords to discover related keywords and ideas.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Seed Keywords</CardTitle>
          <CardDescription>
            Enter one keyword per line. These will be used to discover related keywords.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-md border p-3 text-sm text-muted-foreground">
            Using project settings: <span className="font-medium text-foreground">{locationName}</span>{" "}
            • <span className="font-medium text-foreground">{languageName}</span>. Update these in{" "}
            <Link
              to="/project/$projectId/settings"
              params={{ projectId: id }}
              className="underline"
            >
              project settings
            </Link>
            .
          </div>

          <div className="space-y-2">
            <Label htmlFor={keywordsId}>Keywords</Label>
            <Textarea
              id={keywordsId}
              placeholder="seo tools&#10;keyword research&#10;content optimization"
              value={seedKeywords}
              onChange={(e) => setSeedKeywords(e.target.value)}
              rows={6}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor={deviceId}>Device</Label>
            <Select value={device} onValueChange={setDevice}>
              <SelectTrigger id={deviceId}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="desktop">Desktop</SelectItem>
                <SelectItem value="mobile">Mobile</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id={bulkKdId}
              checked={includeBulkKd}
              onChange={(e) => setIncludeBulkKd(e.target.checked)}
              className="rounded"
            />
            <Label htmlFor={bulkKdId} className="cursor-pointer">
              Include bulk keyword difficulty (recommended)
            </Label>
          </div>
        </CardContent>
      </Card>

      <div className={cn("flex mt-4", "justify-between")}>
        <Link
          to="/project/$projectId/keywords/research"
          params={{ projectId: id }}
          className={buttonVariants({ variant: "ghost" })}
        >
          Cancel
        </Link>
        <Button
          onClick={handleContinue}
          disabled={isLoading || seedKeywords.trim().length === 0}
        >
          {isLoading ? "Starting research..." : "Continue"}
          <ChevronRight className="h-4 w-4 ml-2" />
        </Button>
      </div>
    </div>
  );
}

