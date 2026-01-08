"use client";

import { useState, useCallback, useEffect } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { api, type Id } from "@/convex";
import { useQuery } from "convex/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, ChevronRight, Plus, List } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { z } from "zod";
import type { Table, SortingState } from "@tanstack/react-table";
import { DataTable } from "@/components/data-table/data-table";
import { DataTablePagination } from "@/components/data-table/data-table-pagination";
import { DataTableViewOptions } from "@/components/data-table/data-table-view-options";
import { researchKeywordColumns } from "@/table-configs/research-keywords/columns";
import type { ResearchKeywordRow } from "@/table-configs/research-keywords/types";
import { KeywordDetailsSheet } from "@/components/keywords/keyword-details-sheet";

const searchSchema = z.object({
	jobId: z.string().optional(),
	device: z.string().optional(),
});

export const Route = createFileRoute(
	"/_app/project/$projectId/keywords/research/",
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
	const [pageIndex, setPageIndex] = useState(0);
	const [pageSize, setPageSize] = useState(50);
	const [sorting, setSorting] = useState<SortingState>([]);
	const [table, setTable] = useState<Table<ResearchKeywordRow> | null>(null);
	const [selectedCount, setSelectedCount] = useState(0);
	const [sheetOpen, setSheetOpen] = useState(false);
	const [selectedKeywordId, setSelectedKeywordId] = useState<Id<"keywords"> | null>(null);
	const [selectedContextId, setSelectedContextId] = useState<Id<"keywordContexts"> | null>(null);

	// Get paginated data for table
	const paginatedData = useQuery(api.keywordResearch.listResearchResultsPaged, {
		projectId: id,
		jobId: search.jobId ? (search.jobId as Id<"jobs">) : undefined,
		pageIndex,
		pageSize,
		search: searchQuery || undefined,
		sortColumn: sorting[0]?.id,
		sortDirection: sorting[0]?.desc ? "desc" : "asc",
	});

	// Keep previous data to show while loading (prevents table disappearing)
	const [previousData, setPreviousData] = useState<typeof paginatedData>(undefined);
	useEffect(() => {
		if (paginatedData !== undefined) {
			setPreviousData(paginatedData);
		}
	}, [paginatedData]);

	// Show loading when query is undefined (initial load or refetch)
	const isLoading = paginatedData === undefined;
	// Use previous data if available, otherwise empty array
	const displayData = previousData ?? paginatedData;

	const handleTableReady = useCallback(
		(tableInstance: Table<ResearchKeywordRow>) => {
			setTable(tableInstance);
		},
		[],
	);

	const handleSortingChange = useCallback((newSorting: SortingState) => {
		setSorting(newSorting);
	}, []);

	const handlePaginationChange = useCallback((pagination: { pageIndex: number; pageSize: number }) => {
		setPageIndex(pagination.pageIndex);
		setPageSize(pagination.pageSize);
	}, []);

	const handleRowDoubleClick = useCallback((row: ResearchKeywordRow) => {
		setSelectedKeywordId(row.keywordId);
		setSelectedContextId(row.contextId);
		setSheetOpen(true);
	}, []);

	// Reset to first page when search or sorting changes
	useEffect(() => {
		// These are intentionally "trigger-only" deps; we still want to reset page
		// even though we don't otherwise use them in the effect.
		void searchQuery;
		void sorting;
		setPageIndex(0);
	}, [searchQuery, sorting]);

	const handleAddToProject = () => {
		if (!table) return;

		const selectedRows = table.getSelectedRowModel().rows;
		if (selectedRows.length === 0) {
			alert("Please select at least one keyword");
			return;
		}

		// A keyword can appear multiple times (e.g. once per discovery source).
		// De-dupe before passing to step 3.
		const selectedKeywordIds = Array.from(
			new Set(selectedRows.map((row) => row.original.keywordId)),
		);

		navigate({
			to: "/project/$projectId/keywords/research/step-3",
			params: { projectId: id },
			search: {
				keywordIds: selectedKeywordIds,
				device: search.device,
			},
		});
	};

	const totalCount = displayData?.totalCount ?? 0;

	// Show initial loading state only if we have no previous data
	if (paginatedData === undefined && previousData === undefined) {
		return <div className="text-muted-foreground">Loading results...</div>;
	}

	return (
    <div className="flex flex-col gap-6">
			<div className="flex items-center justify-between">
				<div>
					<h2 className="text-2xl font-semibold">Keyword Ideas</h2>
					<p className="text-muted-foreground">
						Review and select keywords to add to your project.
					</p>
				</div>
				<div className="flex items-center gap-2">
					<Button asChild variant="secondary">
						<Link
							to="/project/$projectId/keywords/research/add"
							params={{ projectId: id }}
						>
							<Plus className="h-4 w-4 mr-2" />
							Add keywords
						</Link>
					</Button>
					<Button onClick={handleAddToProject} disabled={selectedCount === 0}>
						Add to project
						<ChevronRight className="h-4 w-4 ml-2" />
					</Button>
					<Button asChild>
						<Link to="/project/$projectId/keywords" params={{ projectId: id }}>
							<List className="h-4 w-4 mr-2" />
							Live Mode
						</Link>
					</Button>
				</div>
			</div>

   
			{/* Table Section */}
			<div className="flex flex-col gap-4">
				<div className="flex items-center justify-between">
					<div className="text-sm text-muted-foreground">
						{totalCount} keyword{totalCount !== 1 ? "s" : ""} found
						{selectedCount > 0 && <> • {selectedCount} selected</>}
					</div>
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
						{table && <DataTableViewOptions table={table} />}
					</div>
				</div>

				<DataTable
					columns={researchKeywordColumns}
					data={(displayData?.rows ?? []) as ResearchKeywordRow[]}
					onTableReady={handleTableReady}
					initialColumnFilters={[]}
					sorting={sorting}
					onSortingChange={handleSortingChange}
					pagination={{ pageIndex, pageSize }}
					onPaginationChange={handlePaginationChange}
					manualPagination={true}
					isLoading={isLoading}
					onRowDoubleClick={handleRowDoubleClick}
					onSelectedRowCountChange={setSelectedCount}
				/>

				{table && (
					<DataTablePagination
						table={table}
						totalCount={totalCount}
						selectedCount={selectedCount}
						onPageChange={setPageIndex}
						onPageSizeChange={(newSize) => {
							setPageSize(newSize);
							setPageIndex(0);
						}}
					/>
				)}
			</div>

			{selectedKeywordId && selectedContextId && (
				<KeywordDetailsSheet
					open={sheetOpen}
					onOpenChange={setSheetOpen}
					projectId={id}
					keywordId={selectedKeywordId}
					contextId={selectedContextId}
				/>
			)}
		</div>
	);
}
