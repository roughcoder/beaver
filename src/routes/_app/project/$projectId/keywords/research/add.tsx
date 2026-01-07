"use client";

import { useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { api, type Id } from "@/convex";
import { useMutation } from "convex/react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { LOCATIONS, LANGUAGES } from "@/lib/locations";
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

  const [seedKeywords, setSeedKeywords] = useState("");
  const [locationCode, setLocationCode] = useState<number>(LOCATIONS[1].code); // UK default
  const [languageCode, setLanguageCode] = useState<string>(LANGUAGES[0].code); // English default
  const [device, setDevice] = useState<string>("desktop");
  const [includeBulkKd, setIncludeBulkKd] = useState(true);
  const [isLoading, setIsLoading] = useState(false);

  const handleContinue = async () => {
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
        search: { 
          jobId,
          locationCode: locationCode.toString(),
          languageCode,
          device,
        },
      });
    } catch (error) {
      console.error("Failed to start research:", error);
      alert("Failed to start research. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

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
          <div className="space-y-2">
            <Label htmlFor="keywords">Keywords</Label>
            <Textarea
              id="keywords"
              placeholder="seo tools&#10;keyword research&#10;content optimization"
              value={seedKeywords}
              onChange={(e) => setSeedKeywords(e.target.value)}
              rows={6}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="location">Location</Label>
              <Select
                value={locationCode.toString()}
                onValueChange={(v) => setLocationCode(Number(v))}
              >
                <SelectTrigger id="location">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {LOCATIONS.map((loc) => (
                    <SelectItem key={loc.code} value={loc.code.toString()}>
                      {loc.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="language">Language</Label>
              <Select value={languageCode} onValueChange={setLanguageCode}>
                <SelectTrigger id="language">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {LANGUAGES.map((lang) => (
                    <SelectItem key={lang.code} value={lang.code}>
                      {lang.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="device">Device</Label>
            <Select value={device} onValueChange={setDevice}>
              <SelectTrigger id="device">
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
              id="bulkKd"
              checked={includeBulkKd}
              onChange={(e) => setIncludeBulkKd(e.target.checked)}
              className="rounded"
            />
            <Label htmlFor="bulkKd" className="cursor-pointer">
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

