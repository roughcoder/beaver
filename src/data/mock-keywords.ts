export type KeywordRow = {
  keyword: string;
  search_volume: number;
  cpc: number;
  low_top_of_page_bid: number;
  high_top_of_page_bid: number;
  competition: "LOW" | "MEDIUM" | "HIGH";
  competition_index: number;
  position_current: number;
  position_previous: number;
  position_change: number;
  movement: "up" | "down" | "flat" | "new";
  updatedAt: string;
};

export type TimelineRange = "24h" | "7d" | "14d" | "30d" | "90d";

export type TimeseriesPoint = {
  date: string;
  avgPosition: number;
  top10Count: number;
  top3Count: number;
  avgCompetitionIndex: number;
  totalSearchVolume: number;
  improvingCount: number;
  decliningCount: number;
};

// Simple seeded random number generator for deterministic data
function seededRandom(seed: number) {
  let value = seed;
  return () => {
    value = (value * 9301 + 49297) % 233280;
    return value / 233280;
  };
}

// Generate a seed from projectId string
function projectIdToSeed(projectId: string): number {
  let hash = 0;
  for (let i = 0; i < projectId.length; i++) {
    const char = projectId.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash);
}

const KEYWORD_TEMPLATES = [
  "best crm for startups",
  "crm onboarding checklist",
  "sales pipeline template",
  "lead scoring model",
  "customer relationship management",
  "sales automation tools",
  "crm software comparison",
  "crm integration guide",
  "sales forecasting methods",
  "customer data platform",
  "sales enablement platform",
  "crm analytics dashboard",
  "sales performance metrics",
  "customer retention strategies",
  "sales funnel optimization",
  "crm migration guide",
  "sales team collaboration",
  "customer journey mapping",
  "sales process automation",
  "crm best practices",
  "sales pipeline management",
  "customer engagement tools",
  "sales productivity software",
  "crm customization guide",
  "sales reporting dashboard",
  "customer success platform",
  "sales coaching techniques",
  "crm data migration",
  "sales territory planning",
  "customer feedback tools",
  "sales forecasting software",
  "crm workflow automation",
  "sales performance tracking",
  "customer segmentation tools",
  "sales lead generation",
  "crm mobile app",
  "sales training programs",
  "customer support software",
  "sales commission calculator",
  "crm security best practices",
  "sales email templates",
  "customer onboarding process",
  "sales meeting scheduler",
  "crm integration api",
  "sales dashboard design",
  "customer loyalty programs",
  "sales proposal templates",
  "crm data analytics",
  "sales territory management",
  "customer satisfaction survey",
];

export function makeMockKeywords({
  projectId,
  count = 50,
}: {
  projectId: string;
  count?: number;
}): KeywordRow[] {
  const seed = projectIdToSeed(projectId);
  const random = seededRandom(seed);
  const keywords: KeywordRow[] = [];

  for (let i = 0; i < count; i++) {
    const keywordSeed = seed + i;
    const keywordRandom = seededRandom(keywordSeed);
    const templateIndex = Math.floor(keywordRandom() * KEYWORD_TEMPLATES.length);
    const baseKeyword = KEYWORD_TEMPLATES[templateIndex];
    const keyword = i < KEYWORD_TEMPLATES.length
      ? baseKeyword
      : `${baseKeyword} ${Math.floor(keywordRandom() * 1000)}`;

    const searchVolume = Math.floor(10 + keywordRandom() * 990);
    const cpc = Number((1.5 + keywordRandom() * 18.5).toFixed(2));
    const lowBid = Number((cpc * 0.3).toFixed(2));
    const highBid = Number((cpc * 0.85).toFixed(2));
    
    const competitionRand = keywordRandom();
    const competition: "LOW" | "MEDIUM" | "HIGH" =
      competitionRand < 0.33 ? "LOW" : competitionRand < 0.66 ? "MEDIUM" : "HIGH";
    const competitionIndex = Math.floor(
      competition === "LOW" ? 20 + keywordRandom() * 30
      : competition === "MEDIUM" ? 50 + keywordRandom() * 20
      : 70 + keywordRandom() * 30
    );

    const positionCurrent = Math.floor(1 + keywordRandom() * 49);
    const positionPrevious = Math.floor(1 + keywordRandom() * 49);
    const positionChange = positionCurrent - positionPrevious;
    const movement: "up" | "down" | "flat" | "new" =
      positionChange < 0 ? "up"
      : positionChange > 0 ? "down"
      : positionChange === 0 && positionCurrent <= 3 ? "new"
      : "flat";

    const daysAgo = Math.floor(keywordRandom() * 7);
    const updatedAt = new Date();
    updatedAt.setDate(updatedAt.getDate() - daysAgo);
    const updatedAtStr = updatedAt.toISOString();

    keywords.push({
      keyword,
      search_volume: searchVolume,
      cpc,
      low_top_of_page_bid: lowBid,
      high_top_of_page_bid: highBid,
      competition,
      competition_index: competitionIndex,
      position_current: positionCurrent,
      position_previous: positionPrevious,
      position_change: positionChange,
      movement,
      updatedAt: updatedAtStr,
    });
  }

  return keywords;
}

export function makeMockTimeseries({
  projectId,
  range,
}: {
  projectId: string;
  range: TimelineRange;
}): TimeseriesPoint[] {
  const seed = projectIdToSeed(projectId);
  const random = seededRandom(seed);
  
  const daysMap: Record<TimelineRange, number> = {
    "24h": 1,
    "7d": 7,
    "14d": 14,
    "30d": 30,
    "90d": 90,
  };
  
  const days = daysMap[range];
  const points: TimeseriesPoint[] = [];
  const now = new Date();

  for (let i = days; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split("T")[0];
    
    // Generate deterministic but varied data based on day
    const daySeed = seed + i;
    const dayRandom = seededRandom(daySeed);
    
    // Simulate trends over time
    const trendFactor = 1 - (i / days) * 0.2; // Slight improvement trend
    const avgPosition = Number((10 + dayRandom() * 15 * trendFactor).toFixed(1));
    const top10Count = Math.floor(15 + dayRandom() * 20 + (days - i) * 0.5);
    const top3Count = Math.floor(3 + dayRandom() * 5 + (days - i) * 0.2);
    const avgCompetitionIndex = Math.floor(50 + dayRandom() * 30);
    const totalSearchVolume = Math.floor(5000 + dayRandom() * 5000);
    const improvingCount = Math.floor(10 + dayRandom() * 15 + (days - i) * 0.3);
    const decliningCount = Math.floor(5 + dayRandom() * 10 - (days - i) * 0.2);

    points.push({
      date: dateStr,
      avgPosition,
      top10Count,
      top3Count,
      avgCompetitionIndex,
      totalSearchVolume,
      improvingCount: Math.max(0, improvingCount),
      decliningCount: Math.max(0, decliningCount),
    });
  }

  return points;
}

