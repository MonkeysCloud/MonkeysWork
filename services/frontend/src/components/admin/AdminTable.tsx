"use client";

import React from "react";

/* ── Column definition ──────────────────────────────── */
export interface Column<T> {
    key: string;
    label: string;
    render?: (row: T) => React.ReactNode;
    className?: string;
}

interface AdminTableProps<T> {
    columns: Column<T>[];
    data: T[];
    loading?: boolean;
    page: number;
    totalPages: number;
    total: number;
    onPageChange: (p: number) => void;
    onRowClick?: (row: T) => void;
    emptyMessage?: string;
}

/* ── Skeleton row ───────────────────────────────────── */
function SkeletonRow({ cols }: { cols: number }) {
    return (
        <tr className="animate-pulse">
            {Array.from({ length: cols }).map((_, i) => (
                <td key={i} className="px-4 py-3">
                    <div className="h-4 bg-gray-200 rounded w-3/4" />
                </td>
            ))}
        </tr>
    );
}

/* ── Main component ─────────────────────────────────── */
export default function AdminTable<T extends Record<string, unknown>>({
    columns,
    data,
    loading = false,
    page,
    totalPages,
    total,
    onPageChange,
    onRowClick,
    emptyMessage = "No records found.",
}: AdminTableProps<T>) {
    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            {/* Table */}
            <div className="overflow-x-auto">
                <table className="w-full text-sm">
                    <thead>
                        <tr className="bg-gray-50/80 border-b border-gray-100">
                            {columns.map((col) => (
                                <th
                                    key={col.key}
                                    className={`px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider ${col.className ?? ""}`}
                                >
                                    {col.label}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                        {loading
                            ? Array.from({ length: 5 }).map((_, i) => (
                                <SkeletonRow
                                    key={i}
                                    cols={columns.length}
                                />
                            ))
                            : data.length === 0
                                ? (
                                    <tr>
                                        <td
                                            colSpan={columns.length}
                                            className="px-4 py-12 text-center text-gray-400"
                                        >
                                            {emptyMessage}
                                        </td>
                                    </tr>
                                )
                                : data.map((row, idx) => (
                                    <tr
                                        key={(row.id as string) ?? idx}
                                        onClick={() => onRowClick?.(row)}
                                        className={`transition-colors hover:bg-orange-50/40 ${onRowClick ? "cursor-pointer" : ""}`}
                                    >
                                        {columns.map((col) => (
                                            <td
                                                key={col.key}
                                                className={`px-4 py-3 text-gray-700 ${col.className ?? ""}`}
                                            >
                                                {col.render
                                                    ? col.render(row)
                                                    : (row[col.key] as React.ReactNode) ??
                                                    "—"}
                                            </td>
                                        ))}
                                    </tr>
                                ))}
                    </tbody>
                </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100 bg-gray-50/40">
                    <span className="text-xs text-gray-500">
                        {total.toLocaleString()} total records · Page {page} of{" "}
                        {totalPages}
                    </span>
                    <div className="flex gap-1">
                        <button
                            onClick={() => onPageChange(page - 1)}
                            disabled={page <= 1}
                            className="px-3 py-1.5 text-xs font-medium rounded-lg border border-gray-200 hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                        >
                            ← Prev
                        </button>
                        {Array.from({ length: Math.min(totalPages, 5) }).map(
                            (_, i) => {
                                const p =
                                    totalPages <= 5
                                        ? i + 1
                                        : Math.max(
                                            1,
                                            Math.min(
                                                page - 2,
                                                totalPages - 4,
                                            ),
                                        ) + i;
                                return (
                                    <button
                                        key={p}
                                        onClick={() => onPageChange(p)}
                                        className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors ${p === page
                                                ? "bg-brand-orange text-white border-brand-orange"
                                                : "border-gray-200 hover:bg-white"
                                            }`}
                                    >
                                        {p}
                                    </button>
                                );
                            },
                        )}
                        <button
                            onClick={() => onPageChange(page + 1)}
                            disabled={page >= totalPages}
                            className="px-3 py-1.5 text-xs font-medium rounded-lg border border-gray-200 hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                        >
                            Next →
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
