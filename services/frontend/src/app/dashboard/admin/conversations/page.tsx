"use client";

import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import AdminTable, { type Column } from "@/components/admin/AdminTable";

const API =
    process.env.NEXT_PUBLIC_API_URL || "http://localhost:8086/api/v1";

interface Conversation {
    id: string;
    title: string;
    contract_id: string;
    contract_title: string;
    contract_status: string;
    client_name: string;
    client_avatar: string | null;
    freelancer_name: string;
    freelancer_avatar: string | null;
    message_count: number;
    last_message_at: string | null;
    created_at: string;
    [key: string]: unknown;
}

interface Message {
    id: string;
    content: string;
    message_type: string;
    attachments: { url: string; name: string }[];
    created_at: string;
    sender_name: string;
    sender_avatar: string | null;
    sender_role: string;
}

const PER_PAGE = 20;

export default function AdminConversationsPage() {
    const { token } = useAuth();

    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(1);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");

    // Thread view
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [selectedTitle, setSelectedTitle] = useState("");
    const [messages, setMessages] = useState<Message[]>([]);
    const [loadingMsgs, setLoadingMsgs] = useState(false);
    const [msgPage, setMsgPage] = useState(1);
    const [msgTotal, setMsgTotal] = useState(0);

    const fetchConversations = useCallback(async () => {
        setLoading(true);
        const params = new URLSearchParams({
            page: String(page),
            per_page: String(PER_PAGE),
        });
        if (search) params.set("search", search);

        try {
            const res = await fetch(`${API}/admin/conversations?${params}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            const json = await res.json();
            setConversations(json.data ?? []);
            setTotal(json.meta?.total ?? 0);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    }, [token, page, search]);

    useEffect(() => {
        fetchConversations();
    }, [fetchConversations]);

    const openThread = async (conv: Conversation, pg = 1) => {
        setSelectedId(conv.id);
        setSelectedTitle(conv.contract_title || conv.title || "Conversation");
        setLoadingMsgs(true);
        setMsgPage(pg);
        try {
            const params = new URLSearchParams({
                page: String(pg),
                per_page: "50",
            });
            const res = await fetch(
                `${API}/admin/conversations/${conv.id}/messages?${params}`,
                { headers: { Authorization: `Bearer ${token}` } },
            );
            const json = await res.json();
            setMessages(json.data ?? []);
            setMsgTotal(json.meta?.total ?? 0);
        } catch (e) {
            console.error(e);
        } finally {
            setLoadingMsgs(false);
        }
    };

    const columns: Column<Conversation>[] = [
        {
            key: "contract_title",
            label: "Conversation",
            render: (c) => (
                <div>
                    <span className="font-semibold text-brand-text">
                        {c.contract_title || c.title || "Untitled"}
                    </span>
                    {c.contract_status && (
                        <span className="ml-2 text-xs text-gray-400">
                            ({c.contract_status})
                        </span>
                    )}
                </div>
            ),
        },
        {
            key: "client_name",
            label: "Client",
            render: (c) => (
                <div className="flex items-center gap-2">
                    {c.client_avatar ? (
                        <img src={c.client_avatar} alt="" className="w-6 h-6 rounded-full" />
                    ) : (
                        <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs font-bold">
                            {c.client_name?.[0]}
                        </div>
                    )}
                    <span className="text-sm">{c.client_name}</span>
                </div>
            ),
        },
        {
            key: "freelancer_name",
            label: "Freelancer",
            render: (c) => (
                <div className="flex items-center gap-2">
                    {c.freelancer_avatar ? (
                        <img src={c.freelancer_avatar} alt="" className="w-6 h-6 rounded-full" />
                    ) : (
                        <div className="w-6 h-6 rounded-full bg-green-100 text-green-600 flex items-center justify-center text-xs font-bold">
                            {c.freelancer_name?.[0]}
                        </div>
                    )}
                    <span className="text-sm">{c.freelancer_name}</span>
                </div>
            ),
        },
        {
            key: "message_count",
            label: "Messages",
            render: (c) => (
                <span className="text-sm font-medium bg-gray-100 px-2 py-0.5 rounded-full">
                    {c.message_count}
                </span>
            ),
        },
        {
            key: "last_message_at",
            label: "Last Activity",
            render: (c) =>
                c.last_message_at
                    ? new Date(c.last_message_at).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                      })
                    : "—",
        },
    ];

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-brand-text">
                    Conversations
                </h1>
                <p className="text-sm text-gray-500 mt-1">
                    Monitor platform messaging (read-only)
                </p>
            </div>

            <div className="flex flex-wrap gap-3">
                <input
                    type="text"
                    placeholder="Search by user or contract…"
                    value={search}
                    onChange={(e) => {
                        setSearch(e.target.value);
                        setPage(1);
                    }}
                    className="px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-orange/30 w-64"
                />
            </div>

            <AdminTable
                columns={columns}
                data={conversations}
                loading={loading}
                page={page}
                totalPages={Math.ceil(total / PER_PAGE)}
                total={total}
                onPageChange={setPage}
                onRowClick={(c) => openThread(c)}
                emptyMessage="No conversations found."
            />

            {/* Thread View */}
            {selectedId && (
                <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
                    <div className="flex items-center justify-between px-5 py-3 bg-gray-50 border-b border-gray-100">
                        <h3 className="text-sm font-bold text-brand-text">
                            📬 {selectedTitle}
                        </h3>
                        <div className="flex items-center gap-3">
                            <span className="text-xs text-gray-400">
                                {msgTotal} messages
                            </span>
                            <button
                                onClick={() => setSelectedId(null)}
                                className="text-sm text-gray-400 hover:text-gray-600"
                            >
                                ✕
                            </button>
                        </div>
                    </div>
                    <div className="p-5 max-h-[500px] overflow-y-auto space-y-4">
                        {loadingMsgs ? (
                            <div className="flex items-center justify-center py-12">
                                <div className="animate-spin h-6 w-6 border-3 border-brand-orange border-t-transparent rounded-full" />
                            </div>
                        ) : messages.length === 0 ? (
                            <p className="text-center text-gray-400 text-sm py-8">
                                No messages
                            </p>
                        ) : (
                            messages.map((m) => (
                                <div key={m.id} className="flex gap-3">
                                    {m.sender_avatar ? (
                                        <img
                                            src={m.sender_avatar}
                                            alt=""
                                            className="w-8 h-8 rounded-full flex-shrink-0"
                                        />
                                    ) : (
                                        <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-xs font-bold flex-shrink-0">
                                            {m.sender_name?.[0]}
                                        </div>
                                    )}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-0.5">
                                            <span className="text-sm font-semibold text-brand-text">
                                                {m.sender_name}
                                            </span>
                                            <span className="text-xs text-gray-400">
                                                {new Date(
                                                    m.created_at,
                                                ).toLocaleString("en-US", {
                                                    month: "short",
                                                    day: "numeric",
                                                    hour: "2-digit",
                                                    minute: "2-digit",
                                                })}
                                            </span>
                                            <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${
                                                m.sender_role === "client"
                                                    ? "bg-blue-50 text-blue-600"
                                                    : "bg-green-50 text-green-600"
                                            }`}>
                                                {m.sender_role}
                                            </span>
                                        </div>
                                        <p className="text-sm text-gray-700 whitespace-pre-wrap">
                                            {m.content}
                                        </p>
                                        {m.attachments && m.attachments.length > 0 && (
                                            <div className="mt-1 flex flex-wrap gap-2">
                                                {m.attachments.map((a, i) => (
                                                    <span
                                                        key={i}
                                                        className="text-xs bg-gray-100 px-2 py-1 rounded text-gray-500"
                                                    >
                                                        📎 {a.name}
                                                    </span>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                    {msgTotal > 50 && (
                        <div className="flex items-center justify-center gap-3 px-5 py-3 border-t border-gray-100">
                            <button
                                disabled={msgPage <= 1}
                                onClick={() => {
                                    const conv = conversations.find((c) => c.id === selectedId);
                                    if (conv) openThread(conv, msgPage - 1);
                                }}
                                className="text-xs px-3 py-1 rounded bg-gray-100 text-gray-600 hover:bg-gray-200 disabled:opacity-50"
                            >
                                ← Previous
                            </button>
                            <span className="text-xs text-gray-400">
                                Page {msgPage} of {Math.ceil(msgTotal / 50)}
                            </span>
                            <button
                                disabled={msgPage >= Math.ceil(msgTotal / 50)}
                                onClick={() => {
                                    const conv = conversations.find((c) => c.id === selectedId);
                                    if (conv) openThread(conv, msgPage + 1);
                                }}
                                className="text-xs px-3 py-1 rounded bg-gray-100 text-gray-600 hover:bg-gray-200 disabled:opacity-50"
                            >
                                Next →
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
