"use client";

import { useMemo, useState, useEffect } from "react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { ChevronDown, ChevronRight } from "lucide-react";
import { api, type Id } from "@/convex";
import { useQuery } from "convex/react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Spinner } from "@/components/ui/spinner";
import { Separator } from "@/components/ui/separator";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { HelpCircle } from "lucide-react";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts";

interface KeywordDetailsSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: Id<"projects">;
  keywordId: Id<"keywords">;
  contextId: Id<"keywordContexts">;
  defaultTab?: "overview" | "serp";
}

export function KeywordDetailsSheet({
  open,
  onOpenChange,
  projectId,
  keywordId,
  contextId,
  defaultTab = "overview",
}: KeywordDetailsSheetProps) {
  const [activeTab, setActiveTab] = useState<"overview" | "serp">(defaultTab);
  const [selectedSnapshotId, setSelectedSnapshotId] = useState<Id<"serpSnapshots"> | null>(null);

  const details = useQuery(api.keywordDetails.get, {
    projectId,
    keywordId,
    contextId,
  });

  // Get SERP snapshots for the keyword/context
  const serpSnapshots = useQuery(api.serp.listSnapshotsForKeywordContext, {
    projectId,
    keywordId,
    contextId,
  });

  // Get items for selected snapshot
  const serpItems = useQuery(
    api.serp.getSnapshotItems,
    selectedSnapshotId
      ? {
          projectId,
          serpSnapshotId: selectedSnapshotId,
        }
      : "skip"
  );

  // Set default snapshot when snapshots load or when tab changes to serp
  useEffect(() => {
    if (activeTab === "serp" && serpSnapshots && serpSnapshots.length > 0 && !selectedSnapshotId) {
      setSelectedSnapshotId(serpSnapshots[0]._id);
    }
  }, [activeTab, serpSnapshots, selectedSnapshotId]);

  // Reset tab when defaultTab changes (e.g., when opening from menu)
  useEffect(() => {
    if (open) {
      setActiveTab(defaultTab);
      if (defaultTab === "serp" && serpSnapshots && serpSnapshots.length > 0) {
        setSelectedSnapshotId(serpSnapshots[0]._id);
      }
    }
  }, [open, defaultTab, serpSnapshots]);

  // Process monthly search volumes for chart (last 12 months, sorted chronologically)
  const chartData = useMemo(() => {
    const monthlySearches = details?.snapshot?.keywordInfo?.monthlySearches;
    if (!monthlySearches || monthlySearches.length === 0) return [];

    const sorted = [...monthlySearches].sort((a, b) => {
      // Sort by year ascending, then month ascending (oldest first)
      if (a.year !== b.year) return a.year - b.year;
      return a.month - b.month;
    });

    // Take the last 12 months
    const last12 = sorted.slice(-12);

    // Format for chart: { month: "MMM YYYY", volume: number }
    return last12.map((item) => {
      const date = new Date(item.year, item.month - 1);
      const monthLabel = date.toLocaleString("default", {
        month: "short",
        year: "numeric",
      });
      return {
        month: monthLabel,
        volume: item.searchVolume,
      };
    });
  }, [details?.snapshot?.keywordInfo?.monthlySearches]);

  const chartConfig = {
    volume: {
      label: "Search Volume",
      color: "hsl(var(--chart-1))",
    },
  } satisfies ChartConfig;

  if (!open) {
    return null;
  }

  const isLoading = details === undefined;
  const hasData = details !== null;

  // Get difficulty value for badge display
  const difficultyValue =
    details?.computedDifficulty?.difficulty ??
    details?.snapshot?.keywordProperties?.keywordDifficulty;

  const difficultyColorClass =
    difficultyValue === undefined
      ? ""
      : difficultyValue < 30
        ? "text-green-600 border-green-600 bg-green-50 dark:bg-green-950"
        : difficultyValue < 70
          ? "text-yellow-600 border-yellow-600 bg-yellow-50 dark:bg-yellow-950"
          : "text-red-600 border-red-600 bg-red-50 dark:bg-red-950";

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-2xl overflow-y-auto">
        <SheetHeader>
          <div className="flex items-start gap-4">
            {difficultyValue !== undefined && (
              <div
                className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full border-2 font-semibold text-lg ${difficultyColorClass}`}
              >
                {difficultyValue}
              </div>
            )}
            <div className="flex-1">
              <SheetTitle className="text-2xl font-bold">
                {isLoading ? "Loading..." : hasData && details ? details.keyword.text : "Keyword Details"}
              </SheetTitle>
              {hasData && details && (
                <div className="mt-2 space-y-2">
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="outline">{details.context.locationCode}</Badge>
                    <Badge variant="outline">{details.context.languageCode}</Badge>
                    {details.context.device && (
                      <Badge variant="outline">{details.context.device}</Badge>
                    )}
                  </div>
                  {details.snapshot?.searchIntentInfo?.mainIntent && (
                    <div>
                      <Badge variant="outline">
                        {details.snapshot.searchIntentInfo.mainIntent}
                      </Badge>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </SheetHeader>

        <Separator className="my-6" />

        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "overview" | "serp")} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="serp">SERP</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6 mt-6">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Spinner className="size-6" />
              </div>
            ) : !hasData ? (
              <div className="text-center py-12 text-muted-foreground">
                No data available for this keyword.
              </div>
            ) : (
              <>
              {/* Metrics Section */}
              {details.snapshot?.keywordInfo && (
                <div>
                  <div className="grid grid-cols-2 gap-4 px-5">
                    {details.snapshot.keywordInfo.volume !== undefined && (
                      <div>
                        <div className="text-sm text-muted-foreground flex items-center gap-1">
                          Search Volume
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <HelpCircle className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>The average number of monthly searches for this keyword</p>
                            </TooltipContent>
                          </Tooltip>
                        </div>
                        <div className="text-lg font-semibold">
                          {details.snapshot.keywordInfo.volume.toLocaleString()}
                        </div>
                      </div>
                    )}
                    {details.snapshot.keywordInfo.cpc !== undefined && (
                      <div>
                        <div className="text-sm text-muted-foreground flex items-center gap-1">
                          CPC
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <HelpCircle className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Cost Per Click - The average amount advertisers pay for each click on this keyword</p>
                            </TooltipContent>
                          </Tooltip>
                        </div>
                        <div className="text-lg font-semibold">
                          ${details.snapshot.keywordInfo.cpc.toFixed(2)}
                        </div>
                      </div>
                    )}
                    {details.snapshot.keywordInfo.competition !== undefined && (
                      <div>
                        <div className="text-sm text-muted-foreground flex items-center gap-1">
                          Competition
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <HelpCircle className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Competition level (0-1) indicating how many advertisers are bidding on this keyword</p>
                            </TooltipContent>
                          </Tooltip>
                        </div>
                        <div className="text-lg font-semibold">
                          {details.snapshot.keywordInfo.competition.toFixed(2)}
                        </div>
                      </div>
                    )}
                    {details.snapshot.keywordInfo.competitionLevel && (
                      <div>
                        <div className="text-sm text-muted-foreground flex items-center gap-1">
                          Competition Level
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <HelpCircle className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Categorical competition level (Low, Medium, High) for this keyword</p>
                            </TooltipContent>
                          </Tooltip>
                        </div>
                        <div className="font-medium">
                          {details.snapshot.keywordInfo.competitionLevel}
                        </div>
                      </div>
                    )}
                    {details.snapshot.keywordInfo.bids !== undefined && (
                      <div>
                        <div className="text-sm text-muted-foreground flex items-center gap-1">
                          Bids
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <HelpCircle className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>The number of advertisers bidding on this keyword</p>
                            </TooltipContent>
                          </Tooltip>
                        </div>
                        <div className="text-lg font-semibold">
                          {details.snapshot.keywordInfo.bids.toLocaleString()}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Monthly Search Volumes Section */}
              {chartData.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold mb-3">Monthly Search Volumes</h3>
                  <ChartContainer config={chartConfig} className="h-[300px] w-full">
                    <AreaChart
                      data={chartData}
                      margin={{
                        left: 12,
                        right: 12,
                        top: 12,
                        bottom: 12,
                      }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis
                        dataKey="month"
                        tickLine={false}
                        axisLine={false}
                        tickMargin={8}
                        tickFormatter={(value) => value}
                      />
                      <YAxis
                        tickLine={false}
                        axisLine={false}
                        tickMargin={8}
                        tickFormatter={(value) => value.toLocaleString()}
                      />
                      <ChartTooltip
                        cursor={false}
                        content={<ChartTooltipContent indicator="dot" />}
                      />
                      <Area
                        dataKey="volume"
                        type="monotone"
                        fill="var(--color-volume)"
                        fillOpacity={0.2}
                        stroke="var(--color-volume)"
                        strokeWidth={2}
                      />
                    </AreaChart>
                  </ChartContainer>
                </div>
              )}

              {/* SERP Section */}
              {(details.snapshot?.serpInfo || details.serpSnapshot) && (
                <div className="space-y-3">
                  <h3 className="text-lg font-semibold">SERP Information</h3>
                    {details.serpSnapshot && (
                      <div className="grid grid-cols-2 gap-4">
                        {details.serpSnapshot.resultsCount !== undefined && (
                          <div>
                            <div className="text-sm text-muted-foreground">Results Count</div>
                            <div className="text-lg font-semibold">
                              {details.serpSnapshot.resultsCount.toLocaleString()}
                            </div>
                          </div>
                        )}
                        {details.serpSnapshot.itemsCount !== undefined && (
                          <div>
                            <div className="text-sm text-muted-foreground">Items Count</div>
                            <div className="text-lg font-semibold">
                              {details.serpSnapshot.itemsCount.toLocaleString()}
                            </div>
                          </div>
                        )}
                        {details.serpSnapshot.pagesCount !== undefined && (
                          <div>
                            <div className="text-sm text-muted-foreground">Pages Count</div>
                            <div className="text-lg font-semibold">
                              {details.serpSnapshot.pagesCount.toLocaleString()}
                            </div>
                          </div>
                        )}
                        <div>
                          <div className="text-sm text-muted-foreground">Last Updated</div>
                          <div className="font-medium">
                            {new Date(details.serpSnapshot.fetchedAt).toLocaleString()}
                          </div>
                        </div>
                      </div>
                    )}
                    {(details.snapshot?.serpInfo?.serpItemTypes ||
                      details.serpSnapshot?.serpItemTypesPresent) && (
                      <div>
                        <div className="text-sm text-muted-foreground mb-2">SERP Types</div>
                        <div className="flex flex-wrap gap-2">
                          {(
                            details.serpSnapshot?.serpItemTypesPresent ??
                            details.snapshot?.serpInfo?.serpItemTypes ??
                            []
                          ).map((type) => (
                            <Badge key={type} variant="secondary" className="text-xs">
                              {type}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                    {details.snapshot?.serpInfo?.resultsCount !== undefined && (
                      <div>
                        <div className="text-sm text-muted-foreground">SERP Results (from snapshot)</div>
                        <div className="font-medium">
                          {details.snapshot.serpInfo.resultsCount.toLocaleString()}
                        </div>
                      </div>
                    )}
                </div>
              )}

              {/* Backlinks Section */}
              {details.snapshot?.avgBacklinksInfo && (
                <div>
                  <h3 className="text-lg font-semibold mb-3">Backlinks</h3>
                  <div className="grid grid-cols-2 gap-4">
                    {details.snapshot.avgBacklinksInfo.avgBacklinks !== undefined && (
                      <div>
                        <div className="text-sm text-muted-foreground">Avg Backlinks</div>
                        <div className="text-lg font-semibold">
                          {details.snapshot.avgBacklinksInfo.avgBacklinks.toLocaleString()}
                        </div>
                      </div>
                    )}
                    {details.snapshot.avgBacklinksInfo.avgReferringDomains !== undefined && (
                      <div>
                        <div className="text-sm text-muted-foreground">Avg Referring Domains</div>
                        <div className="text-lg font-semibold">
                          {details.snapshot.avgBacklinksInfo.avgReferringDomains.toLocaleString()}
                        </div>
                      </div>
                    )}
                    {details.snapshot.avgBacklinksInfo.avgRank !== undefined && (
                      <div>
                        <div className="text-sm text-muted-foreground">Avg Rank</div>
                        <div className="text-lg font-semibold">
                          {details.snapshot.avgBacklinksInfo.avgRank.toFixed(1)}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Additional Properties */}
              {details.snapshot?.keywordProperties && (
                <div>
                  <h3 className="text-lg font-semibold mb-3">Properties</h3>
                  <div className="grid grid-cols-2 gap-4">
                    {details.snapshot.keywordProperties.coreKeyword && (
                      <div>
                        <div className="text-sm text-muted-foreground">Core Keyword</div>
                        <div className="font-medium">
                          {details.snapshot.keywordProperties.coreKeyword}
                        </div>
                      </div>
                    )}
                    {details.snapshot.keywordProperties.wordsCount !== undefined && (
                      <div>
                        <div className="text-sm text-muted-foreground">Words Count</div>
                        <div className="font-medium">
                          {details.snapshot.keywordProperties.wordsCount}
                        </div>
                      </div>
                    )}
                    {details.snapshot.keywordProperties.clustering !== undefined && (
                      <div>
                        <div className="text-sm text-muted-foreground">Clustering</div>
                        <div className="font-medium">
                          {details.snapshot.keywordProperties.clustering.toFixed(2)}
                        </div>
                      </div>
                    )}
                    {details.snapshot.keywordProperties.language && (
                      <div>
                        <div className="text-sm text-muted-foreground">Language</div>
                        <div className="font-medium">
                          {details.snapshot.keywordProperties.language}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
              </>
            )}
          </TabsContent>

          <TabsContent value="serp" className="space-y-6 mt-6">
            {serpSnapshots === undefined ? (
              <div className="flex items-center justify-center py-12">
                <Spinner className="size-6" />
              </div>
            ) : serpSnapshots.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                No SERP snapshots available for this keyword.
              </div>
            ) : (
              <>
                {/* Snapshot Picker */}
                <div className="space-y-2">
                  <div className="text-sm font-medium">Snapshot</div>
                  <Select
                    value={selectedSnapshotId ?? undefined}
                    onValueChange={(value) => setSelectedSnapshotId(value as Id<"serpSnapshots">)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a snapshot" />
                    </SelectTrigger>
                    <SelectContent>
                      {serpSnapshots.map((snapshot) => (
                        <SelectItem key={snapshot._id} value={snapshot._id}>
                          {new Date(snapshot.fetchedAt).toLocaleString()} 
                          {snapshot.itemsCount !== undefined && ` (${snapshot.itemsCount} items)`}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* SERP Items by Type */}
                {serpItems === undefined ? (
                  <div className="flex items-center justify-center py-12">
                    <Spinner className="size-6" />
                  </div>
                ) : serpItems.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    No SERP items found for this snapshot.
                  </div>
                ) : (
                  <SerpItemsByType items={serpItems} />
                )}
              </>
            )}
          </TabsContent>
        </Tabs>
      </SheetContent>
    </Sheet>
  );
}

function SerpItemsByType({ items }: { items: Array<{
  _id: Id<"serpItems">;
  type: string;
  rankGroup?: number;
  rankAbsolute?: number;
  page?: number;
  domain?: string;
  url?: string;
  title?: string;
  description?: string;
  breadcrumb?: string;
  websiteName?: string;
  isFeaturedSnippet?: boolean;
  isVideo?: boolean;
  isImage?: boolean;
  isMalicious?: boolean;
  isWebStory?: boolean;
  urlBacklinks?: {
    backlinks?: number;
    dofollowBacklinks?: number;
    nofollowBacklinks?: number;
    referringDomains?: number;
    referringMainDomains?: number;
    referringPages?: number;
    rank?: number;
    mainDomainRank?: number;
    backlinksSpamScore?: number;
  };
  domainBacklinks?: {
    backlinks?: number;
    dofollowBacklinks?: number;
    nofollowBacklinks?: number;
    referringDomains?: number;
    referringMainDomains?: number;
    referringPages?: number;
    rank?: number;
    mainDomainRank?: number;
    backlinksSpamScore?: number;
  };
}> }) {
  // Group items by type
  const grouped = useMemo(() => {
    const groups: Record<string, typeof items> = {};
    for (const item of items) {
      if (!groups[item.type]) {
        groups[item.type] = [];
      }
      groups[item.type].push(item);
    }
    return groups;
  }, [items]);

  // Sort types: organic first, then alphabetical
  const sortedTypes = useMemo(() => {
    const types = Object.keys(grouped);
    return types.sort((a, b) => {
      if (a === "organic") return -1;
      if (b === "organic") return 1;
      return a.localeCompare(b);
    });
  }, [grouped]);

  return (
    <div className="space-y-6">
      {sortedTypes.map((type) => {
        const typeItems = grouped[type];
        return (
          <div key={type} className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold capitalize">{type.replace(/_/g, " ")}</h3>
              <Badge variant="secondary">{typeItems.length} items</Badge>
            </div>
            <div className="space-y-2">
              {typeItems
                .sort((a, b) => {
                  // Sort by rankAbsolute if available, otherwise by rankGroup
                  const aRank = a.rankAbsolute ?? a.rankGroup ?? 999;
                  const bRank = b.rankAbsolute ?? b.rankGroup ?? 999;
                  return aRank - bRank;
                })
                .map((item) => (
                  <SerpItemCard key={item._id} item={item} />
                ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function SerpItemCard({ item }: { item: {
  _id: Id<"serpItems">;
  type: string;
  rankGroup?: number;
  rankAbsolute?: number;
  page?: number;
  domain?: string;
  url?: string;
  title?: string;
  description?: string;
  breadcrumb?: string;
  websiteName?: string;
  isFeaturedSnippet?: boolean;
  isVideo?: boolean;
  isImage?: boolean;
  isMalicious?: boolean;
  isWebStory?: boolean;
  urlBacklinks?: {
    backlinks?: number;
    dofollowBacklinks?: number;
    nofollowBacklinks?: number;
    referringDomains?: number;
    referringMainDomains?: number;
    referringPages?: number;
    rank?: number;
    mainDomainRank?: number;
    backlinksSpamScore?: number;
  };
  domainBacklinks?: {
    backlinks?: number;
    dofollowBacklinks?: number;
    nofollowBacklinks?: number;
    referringDomains?: number;
    referringMainDomains?: number;
    referringPages?: number;
    rank?: number;
    mainDomainRank?: number;
    backlinksSpamScore?: number;
  };
} }) {
  const [isOpen, setIsOpen] = useState(false);
  const hasBacklinks = !!(item.urlBacklinks || item.domainBacklinks);

  return (
    <div className="border rounded-lg hover:bg-muted/50 transition-colors">
      <div className="p-3 space-y-1">
        {item.rankAbsolute !== undefined && (
          <div className="text-xs text-muted-foreground">
            Rank: {item.rankAbsolute}
            {item.page !== undefined && ` (Page ${item.page})`}
          </div>
        )}
        {item.title && (
          <div className="font-medium text-sm">
            {item.title}
            {item.isFeaturedSnippet && (
              <Badge variant="outline" className="ml-2 text-xs">
                Featured
              </Badge>
            )}
            {item.isVideo && (
              <Badge variant="outline" className="ml-2 text-xs">
                Video
              </Badge>
            )}
            {item.isImage && (
              <Badge variant="outline" className="ml-2 text-xs">
                Image
              </Badge>
            )}
          </div>
        )}
        {item.url && (
          <div className="text-xs text-muted-foreground truncate">
            <a
              href={item.url}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:underline text-blue-600 dark:text-blue-400"
            >
              {item.url}
            </a>
          </div>
        )}
        {item.domain && (
          <div className="text-xs text-muted-foreground">
            {item.domain}
          </div>
        )}
        {item.description && (
          <div className="text-sm text-muted-foreground line-clamp-2">
            {item.description}
          </div>
        )}
        {item.breadcrumb && (
          <div className="text-xs text-muted-foreground">
            {item.breadcrumb}
          </div>
        )}
      </div>

      {hasBacklinks && (
        <Collapsible open={isOpen} onOpenChange={setIsOpen}>
          <CollapsibleTrigger className="w-full px-3 py-2 text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 border-t">
            {isOpen ? (
              <ChevronDown className="h-3 w-3" />
            ) : (
              <ChevronRight className="h-3 w-3" />
            )}
            <span>Backlink Data</span>
          </CollapsibleTrigger>
          <CollapsibleContent className="px-3 pb-3 pt-2 space-y-3 border-t">
            {item.urlBacklinks && (
              <div className="space-y-2">
                <div className="text-xs font-medium text-muted-foreground">URL Backlinks</div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  {item.urlBacklinks.referringDomains !== undefined && (
                    <div>
                      <span className="text-muted-foreground">Referring Domains:</span>{" "}
                      <span className="font-medium">{item.urlBacklinks.referringDomains.toLocaleString()}</span>
                    </div>
                  )}
                  {item.urlBacklinks.backlinks !== undefined && (
                    <div>
                      <span className="text-muted-foreground">Backlinks:</span>{" "}
                      <span className="font-medium">{item.urlBacklinks.backlinks.toLocaleString()}</span>
                    </div>
                  )}
                  {item.urlBacklinks.dofollowBacklinks !== undefined && (
                    <div>
                      <span className="text-muted-foreground">Dofollow:</span>{" "}
                      <span className="font-medium">{item.urlBacklinks.dofollowBacklinks.toLocaleString()}</span>
                    </div>
                  )}
                  {item.urlBacklinks.nofollowBacklinks !== undefined && (
                    <div>
                      <span className="text-muted-foreground">Nofollow:</span>{" "}
                      <span className="font-medium">{item.urlBacklinks.nofollowBacklinks.toLocaleString()}</span>
                    </div>
                  )}
                  {item.urlBacklinks.rank !== undefined && (
                    <div>
                      <span className="text-muted-foreground">Rank:</span>{" "}
                      <span className="font-medium">{item.urlBacklinks.rank.toLocaleString()}</span>
                    </div>
                  )}
                  {item.urlBacklinks.mainDomainRank !== undefined && (
                    <div>
                      <span className="text-muted-foreground">Domain Rank:</span>{" "}
                      <span className="font-medium">{item.urlBacklinks.mainDomainRank.toLocaleString()}</span>
                    </div>
                  )}
                  {item.urlBacklinks.backlinksSpamScore !== undefined && (
                    <div>
                      <span className="text-muted-foreground">Spam Score:</span>{" "}
                      <span className="font-medium">{item.urlBacklinks.backlinksSpamScore}</span>
                    </div>
                  )}
                </div>
              </div>
            )}
            {item.domainBacklinks && (
              <div className="space-y-2">
                <div className="text-xs font-medium text-muted-foreground">Domain Backlinks</div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  {item.domainBacklinks.referringDomains !== undefined && (
                    <div>
                      <span className="text-muted-foreground">Referring Domains:</span>{" "}
                      <span className="font-medium">{item.domainBacklinks.referringDomains.toLocaleString()}</span>
                    </div>
                  )}
                  {item.domainBacklinks.backlinks !== undefined && (
                    <div>
                      <span className="text-muted-foreground">Backlinks:</span>{" "}
                      <span className="font-medium">{item.domainBacklinks.backlinks.toLocaleString()}</span>
                    </div>
                  )}
                  {item.domainBacklinks.dofollowBacklinks !== undefined && (
                    <div>
                      <span className="text-muted-foreground">Dofollow:</span>{" "}
                      <span className="font-medium">{item.domainBacklinks.dofollowBacklinks.toLocaleString()}</span>
                    </div>
                  )}
                  {item.domainBacklinks.nofollowBacklinks !== undefined && (
                    <div>
                      <span className="text-muted-foreground">Nofollow:</span>{" "}
                      <span className="font-medium">{item.domainBacklinks.nofollowBacklinks.toLocaleString()}</span>
                    </div>
                  )}
                  {item.domainBacklinks.rank !== undefined && (
                    <div>
                      <span className="text-muted-foreground">Rank:</span>{" "}
                      <span className="font-medium">{item.domainBacklinks.rank.toLocaleString()}</span>
                    </div>
                  )}
                  {item.domainBacklinks.mainDomainRank !== undefined && (
                    <div>
                      <span className="text-muted-foreground">Domain Rank:</span>{" "}
                      <span className="font-medium">{item.domainBacklinks.mainDomainRank.toLocaleString()}</span>
                    </div>
                  )}
                  {item.domainBacklinks.backlinksSpamScore !== undefined && (
                    <div>
                      <span className="text-muted-foreground">Spam Score:</span>{" "}
                      <span className="font-medium">{item.domainBacklinks.backlinksSpamScore}</span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </CollapsibleContent>
        </Collapsible>
      )}
    </div>
  );
}

