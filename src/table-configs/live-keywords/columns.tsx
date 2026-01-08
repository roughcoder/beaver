"use client";

import { type ColumnDef } from "@tanstack/react-table";
import { type Id } from "@/convex";
import { Badge } from "@/components/ui/badge";
import { DataTableColumnHeader } from "@/components/data-table/data-table-column-header";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { MoreHorizontal } from "lucide-react";
import type { LiveKeywordRow } from "./types";

interface LiveKeywordColumnsOptions {
  onViewSerp?: (row: LiveKeywordRow) => void;
  onViewDetails?: (row: LiveKeywordRow) => void;
}

export const createLiveKeywordColumns = (
  options?: LiveKeywordColumnsOptions
): ColumnDef<LiveKeywordRow>[] => [
  {
    accessorKey: "keyword",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Keyword" />
    ),
    cell: ({ row }) => (
      <div className="font-medium max-w-xs truncate" title={row.getValue("keyword")}>
        {row.getValue("keyword")}
      </div>
    ),
  },
  {
    accessorKey: "latestDifficulty",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Difficulty" />
    ),
    cell: ({ row }) => {
      const difficulty = row.getValue<number | undefined>("latestDifficulty") ?? 
                        row.original.dataforseoKd;
      if (difficulty === undefined) return "—";
      if (difficulty < 30)
        return (
          <Badge variant="outline" className="text-green-600 border-green-600">
            {difficulty}
          </Badge>
        );
      if (difficulty < 70)
        return (
          <Badge variant="outline" className="text-yellow-600 border-yellow-600">
            {difficulty}
          </Badge>
        );
      return (
        <Badge variant="outline" className="text-red-600 border-red-600">
          {difficulty}
        </Badge>
      );
    },
    sortingFn: (rowA, rowB) => {
      const a = rowA.original.latestDifficulty ?? rowA.original.dataforseoKd ?? 0;
      const b = rowB.original.latestDifficulty ?? rowB.original.dataforseoKd ?? 0;
      return a - b;
    },
  },
  {
    accessorKey: "volume",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Volume" />
    ),
    cell: ({ row }) => {
      const volume = row.getValue<number | undefined>("volume");
      return volume ? volume.toLocaleString() : "—";
    },
  },
  {
    accessorKey: "intent",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Intent" />
    ),
    cell: ({ row }) => {
      const intent = row.getValue<string | undefined>("intent");
      return intent ? (
        <Badge variant="secondary">{intent}</Badge>
      ) : (
        "—"
      );
    },
  },
  {
    accessorKey: "locationCode",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Location" />
    ),
    cell: ({ row }) => {
      const location = row.getValue<number>("locationCode");
      const language = row.original.languageCode;
      return `${location} / ${language}`;
    },
  },
  {
    accessorKey: "trackSerpDaily",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="SERP Tracking" />
    ),
    cell: ({ row }) => {
      const enabled = row.getValue<boolean>("trackSerpDaily");
      return enabled ? (
        <Badge variant="outline" className="text-green-600 border-green-600">
          Enabled
        </Badge>
      ) : (
        <Badge variant="outline">Disabled</Badge>
      );
    },
  },
  {
    accessorKey: "lastMetricsUpdate",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Last Update" />
    ),
    cell: ({ row }) => {
      const timestamp = row.getValue<number | undefined>("lastMetricsUpdate");
      return timestamp
        ? new Date(timestamp).toLocaleDateString()
        : "—";
    },
  },
  // Hidden by default columns
  {
    accessorKey: "_id",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="ID" />
    ),
    cell: ({ row }) => {
      const id = row.getValue<Id<"trackedKeywords">>("_id");
      return <span className="font-mono text-xs">{id.slice(0, 8)}...</span>;
    },
    meta: {
      defaultHidden: true,
    },
  },
  {
    accessorKey: "keywordId",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Keyword ID" />
    ),
    cell: ({ row }) => {
      const id = row.getValue<Id<"keywords">>("keywordId");
      return <span className="font-mono text-xs">{id.slice(0, 8)}...</span>;
    },
    meta: {
      defaultHidden: true,
    },
  },
  {
    accessorKey: "contextId",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Context ID" />
    ),
    cell: ({ row }) => {
      const id = row.getValue<Id<"keywordContexts">>("contextId");
      return <span className="font-mono text-xs">{id.slice(0, 8)}...</span>;
    },
    meta: {
      defaultHidden: true,
    },
  },
  {
    accessorKey: "device",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Device" />
    ),
    cell: ({ row }) => {
      const device = row.getValue<string | undefined>("device");
      return device || "—";
    },
    meta: {
      defaultHidden: true,
    },
  },
  {
    accessorKey: "dataforseoKd",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="DataForSEO KD" />
    ),
    cell: ({ row }) => {
      const kd = row.getValue<number | undefined>("dataforseoKd");
      return kd !== undefined ? kd.toString() : "—";
    },
    meta: {
      defaultHidden: true,
    },
  },
  {
    accessorKey: "refreshKeywordMetrics",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Refresh Metrics" />
    ),
    cell: ({ row }) => {
      const enabled = row.getValue<boolean>("refreshKeywordMetrics");
      return enabled ? (
        <Badge variant="outline" className="text-green-600 border-green-600">
          Yes
        </Badge>
      ) : (
        <Badge variant="outline">No</Badge>
      );
    },
    meta: {
      defaultHidden: true,
    },
  },
  {
    accessorKey: "fetchBacklinks",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Fetch Backlinks" />
    ),
    cell: ({ row }) => {
      const enabled = row.getValue<boolean>("fetchBacklinks");
      return enabled ? (
        <Badge variant="outline" className="text-green-600 border-green-600">
          Yes
        </Badge>
      ) : (
        <Badge variant="outline">No</Badge>
      );
    },
    meta: {
      defaultHidden: true,
    },
  },
  {
    accessorKey: "lastSerpUpdate",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Last SERP Update" />
    ),
    cell: ({ row }) => {
      const timestamp = row.getValue<number | undefined>("lastSerpUpdate");
      return timestamp
        ? new Date(timestamp).toLocaleDateString()
        : "—";
    },
    meta: {
      defaultHidden: true,
    },
  },
  {
    accessorKey: "nextScheduledRefresh",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Next Refresh" />
    ),
    cell: ({ row }) => {
      const timestamp = row.getValue<number | undefined>("nextScheduledRefresh");
      return timestamp
        ? new Date(timestamp).toLocaleDateString()
        : "—";
    },
    meta: {
      defaultHidden: true,
    },
  },
  {
    accessorKey: "languageCode",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Language Code" />
    ),
    cell: ({ row }) => {
      const code = row.getValue<string>("languageCode");
      return code;
    },
    meta: {
      defaultHidden: true,
    },
  },
  {
    id: "actions",
    header: () => <div className="text-right">Actions</div>,
    cell: ({ row }) => {
      const rowData = row.original;
      return (
        <div className="flex justify-end">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">Open menu</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {options?.onViewDetails && (
                <DropdownMenuItem onClick={() => options.onViewDetails?.(rowData)}>
                  View details
                </DropdownMenuItem>
              )}
              {options?.onViewSerp && (
                <DropdownMenuItem onClick={() => options.onViewSerp?.(rowData)}>
                  View SERP
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      );
    },
    enableSorting: false,
    enableHiding: false,
  },
];

// Export default columns for backward compatibility
export const liveKeywordColumns = createLiveKeywordColumns();

