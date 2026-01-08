"use client";

import { type ColumnDef } from "@tanstack/react-table";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { DataTableColumnHeader } from "@/components/data-table/data-table-column-header";
import { type ResearchKeywordRow } from "./types";

export const researchKeywordColumns: ColumnDef<ResearchKeywordRow>[] = [
  {
    id: "select",
    header: ({ table }) => (
      <Checkbox
        checked={
          table.getIsAllPageRowsSelected() ||
          (table.getIsSomePageRowsSelected() && "indeterminate")
        }
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label="Select all"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label="Select row"
      />
    ),
    enableSorting: false,
    enableHiding: false,
  },
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
    accessorKey: "source",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Source" />
    ),
    cell: ({ row }) => (
      <Badge variant="secondary">{row.getValue("source")}</Badge>
    ),
  },
  {
    accessorKey: "baselineKd",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Difficulty" />
    ),
    cell: ({ row }) => {
      const kd = row.getValue<number | undefined>("baselineKd");
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
    },
  },
  {
    accessorKey: "searchVolume",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Volume" />
    ),
    cell: ({ row }) => {
      const volume = row.getValue<number | undefined>("searchVolume");
      return volume ? volume.toLocaleString() : "—";
    },
  },
  {
    accessorKey: "cpc",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="CPC" />
    ),
    cell: ({ row }) => {
      const cpc = row.getValue<number | undefined>("cpc");
      return cpc ? `$${cpc.toFixed(2)}` : "—";
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
        <Badge variant="outline">{intent}</Badge>
      ) : (
        "—"
      );
    },
  },
  {
    accessorKey: "freshness",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Freshness" />
    ),
    cell: ({ row }) => {
      const freshness = row.getValue<string>("freshness");
      return (
        <Badge
          variant={
            freshness === "Fresh"
              ? "default"
              : freshness === "Cached"
                ? "secondary"
                : "outline"
          }
        >
          {freshness}
        </Badge>
      );
    },
  },
  // Hidden by default columns
  {
    accessorKey: "competition",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Competition" />
    ),
    cell: ({ row }) => {
      const competition = row.getValue<number | undefined>("competition");
      return competition !== undefined ? competition.toFixed(2) : "—";
    },
    meta: {
      defaultHidden: true,
    },
  },
  {
    accessorKey: "competitionLevel",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Competition Level" />
    ),
    cell: ({ row }) => {
      const level = row.getValue<string | undefined>("competitionLevel");
      return level || "—";
    },
    meta: {
      defaultHidden: true,
    },
  },
  {
    accessorKey: "bids",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Bids" />
    ),
    cell: ({ row }) => {
      const bids = row.getValue<number | undefined>("bids");
      return bids !== undefined ? bids.toLocaleString() : "—";
    },
    meta: {
      defaultHidden: true,
    },
  },
  {
    accessorKey: "avgBacklinks",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Avg Backlinks" />
    ),
    cell: ({ row }) => {
      const backlinks = row.getValue<number | undefined>("avgBacklinks");
      return backlinks !== undefined ? backlinks.toLocaleString() : "—";
    },
    meta: {
      defaultHidden: true,
    },
  },
  {
    accessorKey: "avgReferringDomains",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Avg Referring Domains" />
    ),
    cell: ({ row }) => {
      const domains = row.getValue<number | undefined>("avgReferringDomains");
      return domains !== undefined ? domains.toLocaleString() : "—";
    },
    meta: {
      defaultHidden: true,
    },
  },
  {
    accessorKey: "avgRank",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Avg Rank" />
    ),
    cell: ({ row }) => {
      const rank = row.getValue<number | undefined>("avgRank");
      return rank !== undefined ? rank.toFixed(1) : "—";
    },
    meta: {
      defaultHidden: true,
    },
  },
  {
    accessorKey: "serpResultsCount",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="SERP Results" />
    ),
    cell: ({ row }) => {
      const count = row.getValue<number | undefined>("serpResultsCount");
      return count !== undefined ? count.toLocaleString() : "—";
    },
    meta: {
      defaultHidden: true,
    },
  },
  {
    accessorKey: "serpItemTypes",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="SERP Types" />
    ),
    cell: ({ row }) => {
      const types = row.getValue<string[] | undefined>("serpItemTypes");
      return types && types.length > 0 ? (
        <div className="flex flex-wrap gap-1">
          {types.slice(0, 3).map((type, i) => (
            <Badge key={i} variant="outline" className="text-xs">
              {type}
            </Badge>
          ))}
          {types.length > 3 && (
            <Badge variant="outline" className="text-xs">
              +{types.length - 3}
            </Badge>
          )}
        </div>
      ) : (
        "—"
      );
    },
    meta: {
      defaultHidden: true,
    },
  },
  {
    accessorKey: "coreKeyword",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Core Keyword" />
    ),
    cell: ({ row }) => {
      const core = row.getValue<string | undefined>("coreKeyword");
      return core || "—";
    },
    meta: {
      defaultHidden: true,
    },
  },
  {
    accessorKey: "wordsCount",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Words" />
    ),
    cell: ({ row }) => {
      const count = row.getValue<number | undefined>("wordsCount");
      return count !== undefined ? count : "—";
    },
    meta: {
      defaultHidden: true,
    },
  },
  {
    accessorKey: "clustering",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Clustering" />
    ),
    cell: ({ row }) => {
      const clustering = row.getValue<number | undefined>("clustering");
      return clustering !== undefined ? clustering.toFixed(2) : "—";
    },
    meta: {
      defaultHidden: true,
    },
  },
  {
    accessorKey: "language",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Language" />
    ),
    cell: ({ row }) => {
      const lang = row.getValue<string | undefined>("language");
      return lang || "—";
    },
    meta: {
      defaultHidden: true,
    },
  },
  {
    accessorKey: "locationCode",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Location" />
    ),
    cell: ({ row }) => {
      const location = row.getValue<number | undefined>("locationCode");
      return location !== undefined ? location.toString() : "—";
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
      const code = row.getValue<string | undefined>("languageCode");
      return code || "—";
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
    accessorKey: "fetchedAt",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Fetched At" />
    ),
    cell: ({ row }) => {
      const timestamp = row.getValue<number | undefined>("fetchedAt");
      return timestamp
        ? new Date(timestamp).toLocaleDateString()
        : "—";
    },
    meta: {
      defaultHidden: true,
    },
  },
  {
    accessorKey: "serpUpdatedAt",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="SERP Updated" />
    ),
    cell: ({ row }) => {
      const timestamp = row.getValue<number | undefined>("serpUpdatedAt");
      return timestamp
        ? new Date(timestamp).toLocaleDateString()
        : "—";
    },
    meta: {
      defaultHidden: true,
    },
  },
];

