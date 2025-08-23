"use client";

import {
  ColumnDef,
  ColumnFiltersState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  SortingState,
  useReactTable,
} from "@tanstack/react-table";
import { Archive, Calendar, ChevronDown, ChevronUp, ExternalLink, FileText, Search } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import useSWR from "swr";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { apiClient, type Transcription } from "@/lib/api";
import { Badge } from "./ui/badge";

export function TranscriptionsDataTable() {
  // Use SWR for data fetching
  const {
    data: transcriptions = [],
    isLoading,
    error,
    mutate,
  } = useSWR("transcriptions", () => apiClient.getTranscriptions(), {
    revalidateOnFocus: false,
    revalidateOnReconnect: true,
  });

  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [globalFilter, setGlobalFilter] = useState("");

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const handleCopyText = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const columns: ColumnDef<Transcription>[] = useMemo(
    () => [
      {
        accessorKey: "filename",
        header: ({ column }) => {
          return (
            <Button
              variant="ghost"
              onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
              className="h-auto p-0 font-medium text-muted-foreground hover:text-foreground"
            >
              <FileText className="mr-2 h-4 w-4" />
              Recording
              {column.getIsSorted() === "asc" && <ChevronUp className="ml-2 h-4 w-4" />}
              {column.getIsSorted() === "desc" && <ChevronDown className="ml-2 h-4 w-4" />}
            </Button>
          );
        },
        cell: ({ row }) => {
          const filename = row.getValue("filename") as string;
          return <div className="font-medium text-foreground max-w-xs truncate">{filename}</div>;
        },
      },
      {
        accessorKey: "text",
        header: "Interior Voice",
        cell: ({ row }) => {
          const text = row.getValue("text") as string;
          return (
            <div className="max-w-md">
              <p className="text-sm text-muted-foreground leading-relaxed line-clamp-3">
                {text ? (
                  text.substring(0, 120) + (text.length > 120 ? "..." : "")
                ) : (
                  <span className="italic opacity-75">Processing the stream of consciousness...</span>
                )}
              </p>
            </div>
          );
        },
        enableSorting: false,
      },
      {
        accessorKey: "created_at",
        header: ({ column }) => {
          return (
            <Button
              variant="ghost"
              onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
              className="h-auto p-0 font-medium text-muted-foreground hover:text-foreground"
            >
              <Calendar className="mr-2 h-4 w-4" />
              Captured
              {column.getIsSorted() === "asc" && <ChevronUp className="ml-2 h-4 w-4" />}
              {column.getIsSorted() === "desc" && <ChevronDown className="ml-2 h-4 w-4" />}
            </Button>
          );
        },
        cell: ({ row }) => {
          const date = row.getValue("created_at") as string;
          return <div className="text-sm text-muted-foreground">{formatDate(date)}</div>;
        },
      },
      {
        accessorKey: "tags",
        header: "Tags",
        cell: ({ row }) => {
          const tags: string[] = row.getValue("tags") ?? [];
          if (tags.length === 0) return "-";
          return (
            <div className="text-sm text-muted-foreground">
              {tags.map(tag => (
                <Badge key={tag}>{tag}</Badge>
              ))}
            </div>
          );
        },
      },
      {
        id: "actions",
        header: "Actions",
        cell: ({ row }) => {
          const transcription = row.original;
          return (
            <div className="flex items-center gap-2">
              <Link href={`/transcription/${transcription.id}`}>
                <Button variant="outline" size="sm" className="h-8 text-xs">
                  <ExternalLink className="mr-1 h-3 w-3" />
                </Button>
              </Link>
              <Button variant="outline" size="sm" className="h-8 text-xs" disabled>
                <Archive className="mr-1 h-3 w-3" />
              </Button>
            </div>
          );
        },
        enableSorting: false,
      },
    ],
    [],
  );

  const table = useReactTable({
    data: transcriptions,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    state: {
      sorting,
      columnFilters,
      globalFilter,
    },
    initialState: {
      pagination: {
        pageSize: 10,
      },
      sorting: [
        {
          id: "created_at",
          desc: true,
        },
      ],
    },
  });

  if (isLoading) {
    return (
      <Card className="shadow-lg border-border bg-card">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-card-foreground">Interior Monologues</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="text-muted-foreground">Loading consciousness...</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="shadow-lg border-border bg-card">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-card-foreground">Interior Monologues</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-destructive bg-destructive/10 p-3 rounded-md">{error}</div>
          <Button onClick={() => mutate()} className="mt-4">
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-lg border-border bg-card">
      <CardHeader className="space-y-4">
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-2xl font-bold text-card-foreground">Interior Monologues</CardTitle>
            <CardDescription className="text-muted-foreground">
              {transcriptions.length === 0
                ? "No captured thoughts yet. Begin with your first recording to populate this consciousness."
                : `${transcriptions.length} recorded thought${transcriptions.length === 1 ? "" : "s"} preserved`}
            </CardDescription>
          </div>
        </div>

        {transcriptions.length > 0 ? (
          <div className="flex items-center space-x-2">
            <Search className="h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search the stream of consciousness..."
              value={globalFilter ?? ""}
              onChange={event => setGlobalFilter(String(event.target.value))}
              className="max-w-sm"
            />
          </div>
        ) : null}
      </CardHeader>

      <CardContent>
        {transcriptions.length === 0 ? (
          <div className="text-center py-12">
            <div className="max-w-sm mx-auto space-y-4">
              <div className="w-16 h-16 mx-auto bg-muted rounded-full flex items-center justify-center">
                <div className="w-8 h-8 border-2 border-muted-foreground rounded-full border-dashed"></div>
              </div>
              <div className="space-y-2">
                <p className="text-muted-foreground">Your transcribed thoughts will appear here</p>
                <p className="text-xs text-muted-foreground italic">
                  &quot;Stream of consciousness flows into written word&quot;
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="rounded-md border border-border">
              <Table>
                <TableHeader>
                  {table.getHeaderGroups().map(headerGroup => (
                    <TableRow key={headerGroup.id}>
                      {headerGroup.headers.map(header => (
                        <TableHead key={header.id}>
                          {header.isPlaceholder
                            ? null
                            : flexRender(header.column.columnDef.header, header.getContext())}
                        </TableHead>
                      ))}
                    </TableRow>
                  ))}
                </TableHeader>
                <TableBody>
                  {table.getRowModel().rows?.length ? (
                    table.getRowModel().rows.map(row => (
                      <TableRow
                        key={row.id}
                        data-state={row.getIsSelected() && "selected"}
                        className="hover:bg-accent/50"
                      >
                        {row.getVisibleCells().map(cell => (
                          <TableCell key={cell.id}>
                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
                          </TableCell>
                        ))}
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={columns.length} className="h-24 text-center">
                        <div className="text-muted-foreground italic">No thoughts found in the stream...</div>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-between space-x-2 py-4">
              <div className="text-sm text-muted-foreground">
                Showing {table.getState().pagination.pageIndex * table.getState().pagination.pageSize + 1} to{" "}
                {Math.min(
                  (table.getState().pagination.pageIndex + 1) * table.getState().pagination.pageSize,
                  table.getFilteredRowModel().rows.length,
                )}{" "}
                of {table.getFilteredRowModel().rows.length} thoughts
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => table.previousPage()}
                  disabled={!table.getCanPreviousPage()}
                >
                  Previous
                </Button>
                <Button variant="outline" size="sm" onClick={() => table.nextPage()} disabled={!table.getCanNextPage()}>
                  Next
                </Button>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
