import { useState, useEffect, useRef, useCallback } from "react";
import { Input, Button, Spinner } from "@heroui/react";
import { useAuth } from "@/contexts/AuthContext";
import { useMessages, type Message } from "@/hooks/useMessages";
import { apiGet, api, getApiBase } from "@/lib/api";

interface ContractSummary {
    id: string;
    title: string;
    client_id: string;
    freelancer_id: string;
    client_name?: string;
    freelancer_name?: string;
}

interface Conversation {
    id: string;
    title?: string;
    contract_id?: string;
    last_message_at?: string;
    participants?: Array<{ id: string; display_name: string; avatar_url?: string }>;
    unread_count?: number;
}

export interface ChatHandle {
    unreadCount: number;
}

interface ChatProps {
    onUnreadChange?: (count: number) => void;
}

export default function Chat({ onUnreadChange }: ChatProps) {
    const { user, token } = useAuth();
    const {
        messages: realtimeMessages,
        typingUsers,
        joinConversation,
        leaveConversation,
        sendTyping,
        stopTyping,
    } = useMessages(token ?? undefined);

    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [activeConv, setActiveConv] = useState<Conversation | null>(null);
    const [messageHistory, setMessageHistory] = useState<Message[]>([]);
    const [newMessage, setNewMessage] = useState("");
    const [loadingConvs, setLoadingConvs] = useState(true);
    const [loadingMessages, setLoadingMessages] = useState(false);
    const [sending, setSending] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const composeFileInputRef = useRef<HTMLInputElement>(null);

    // New conversation compose
    const [showCompose, setShowCompose] = useState(false);
    const [contracts, setContracts] = useState<ContractSummary[]>([]);
    const [loadingContracts, setLoadingContracts] = useState(false);
    const [selectedContract, setSelectedContract] = useState<ContractSummary | null>(null);
    const [composeSubject, setComposeSubject] = useState("");
    const [composeBody, setComposeBody] = useState("");
    const [creating, setCreating] = useState(false);
    const [composeFiles, setComposeFiles] = useState<File[]>([]);

    // Attachment state for existing conversation
    const [pendingFiles, setPendingFiles] = useState<File[]>([]);

    const apiOrigin = new URL(getApiBase()).origin;

    // Upload files helper
    async function uploadFiles(files: File[]): Promise<string[]> {
        if (files.length === 0) return [];
        const formData = new FormData();
        files.forEach((f) => formData.append("files[]", f));
        const res = await fetch(`${apiOrigin}/api/v1/attachments/upload`, {
            method: "POST",
            headers: token ? { Authorization: `Bearer ${token}` } : {},
            body: formData,
        });
        const json = await res.json();
        return (json.data ?? []).map((a: { file_url?: string; url?: string }) => a.file_url ?? a.url ?? "");
    }

    // Load conversations
    const loadConversations = useCallback(async () => {
        try {
            const res = await apiGet<{ data: Conversation[] }>("/conversations");
            setConversations(res.data || []);
        } catch { /* silent */ }
        setLoadingConvs(false);
    }, []);

    useEffect(() => { loadConversations(); }, [loadConversations]);

    // Report total unread count to parent
    useEffect(() => {
        const total = conversations.reduce((a, c) => a + (c.unread_count ?? 0), 0);
        onUnreadChange?.(total);
    }, [conversations, onUnreadChange]);

    // Load contracts for compose
    async function openCompose() {
        setShowCompose(true);
        setSelectedContract(null);
        setComposeSubject("");
        setComposeBody("");
        setLoadingContracts(true);
        try {
            const res = await apiGet<{ data: ContractSummary[] }>("/contracts?status=active");
            setContracts(res.data || []);
        } catch { /* silent */ }
        setLoadingContracts(false);
    }

    // Create new conversation
    async function handleCreateConversation(e: React.FormEvent) {
        e.preventDefault();
        if (!selectedContract || !composeBody.trim()) return;
        setCreating(true);
        try {
            const otherPartyId = selectedContract.client_id === user?.id
                ? selectedContract.freelancer_id
                : selectedContract.client_id;
            const subject = composeSubject.trim() || `Re: ${selectedContract.title}`;
            const res = await api<{ data: { id: string } }>("/conversations", {
                method: "POST",
                body: JSON.stringify({
                    contract_id: selectedContract.id,
                    title: subject,
                    participant_ids: [otherPartyId],
                }),
            });
            // Send first message with optional attachments
            let attachmentUrl: string | undefined;
            if (composeFiles.length > 0) {
                const urls = await uploadFiles(composeFiles);
                if (urls.length > 0) attachmentUrl = urls.join(",");
            }
            const msgPayload: Record<string, string> = { body: composeBody.trim() };
            if (attachmentUrl) msgPayload.attachment_url = attachmentUrl;
            await api(`/conversations/${res.data.id}/messages`, {
                method: "POST",
                body: JSON.stringify(msgPayload),
            });
            setShowCompose(false);
            await loadConversations();
            // Open the newly created conversation
            const newConv: Conversation = {
                id: res.data.id,
                title: subject,
                contract_id: selectedContract.id,
            };
            openConversation(newConv);
        } catch { /* silent */ }
        setCreating(false);
        setComposeFiles([]);
    }

    // Open a conversation
    const openConversation = useCallback(async (conv: Conversation) => {
        if (activeConv?.id) {
            leaveConversation(activeConv.id);
        }
        setActiveConv(conv);
        setMessageHistory([]);
        setLoadingMessages(true);

        try {
            const res = await apiGet<{ data: { messages: Message[]; participants: Array<{ id: string; display_name: string; avatar_url?: string }> } }>(
                `/conversations/${conv.id}`
            );
            setMessageHistory((res.data.messages || []).reverse());
            // Update participants on active conv AND on conversations list
            if (res.data.participants) {
                setActiveConv((prev) => prev ? { ...prev, participants: res.data.participants } : null);
                // Cache participants in the sidebar list so avatars persist
                setConversations((prev) =>
                    prev.map((c) => c.id === conv.id ? { ...c, participants: res.data.participants } : c)
                );
            }
        } catch { /* silent */ }
        setLoadingMessages(false);

        joinConversation(conv.id);
    }, [activeConv, joinConversation, leaveConversation]);

    // Merge real-time messages
    const allMessages = [...messageHistory, ...realtimeMessages.filter(
        (rm) => rm.conversation_id === activeConv?.id && !messageHistory.some((m) => m.id === rm.id)
    )];

    // Scroll to bottom on new messages
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [allMessages.length]);

    // Send message
    async function handleSend(e: React.FormEvent) {
        e.preventDefault();
        if ((!newMessage.trim() && pendingFiles.length === 0) || !activeConv) return;
        setSending(true);
        try {
            // Upload attachments first
            let attachmentUrl: string | undefined;
            if (pendingFiles.length > 0) {
                const urls = await uploadFiles(pendingFiles);
                if (urls.length > 0) attachmentUrl = urls.join(",");
            }
            const payload: Record<string, string> = { body: newMessage.trim() || "📎 Attachment" };
            if (attachmentUrl) payload.attachment_url = attachmentUrl;
            await api(`/conversations/${activeConv.id}/messages`, {
                method: "POST",
                body: JSON.stringify(payload),
            });
            // Optimistic: add to history
            const attArr = attachmentUrl
                ? attachmentUrl.split(",").map((u) => ({ url: u }))
                : [];
            setMessageHistory((prev) => [
                ...prev,
                {
                    id: `temp-${Date.now()}`,
                    conversation_id: activeConv.id,
                    sender_id: user?.id ?? "",
                    sender_name: user?.display_name,
                    content: newMessage.trim() || "📎 Attachment",
                    message_type: "text",
                    attachments: attArr,
                    created_at: new Date().toISOString(),
                },
            ]);
            setNewMessage("");
            setPendingFiles([]);
            if (activeConv.id) stopTyping(activeConv.id);
        } catch { /* silent */ }
        setSending(false);
    }

    // Typing indicator
    function handleTyping() {
        if (!activeConv) return;
        sendTyping(activeConv.id);
        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = setTimeout(() => {
            if (activeConv) stopTyping(activeConv.id);
        }, 2000);
    }

    // Other participant
    const otherParticipant = activeConv?.participants?.find((p) => p.id !== user?.id);

    return (
        <div className="h-full flex">
            {/* ── Conversation List ── */}
            <div className="w-72 bg-white/[0.05] border-r border-white/10 flex flex-col flex-shrink-0">
                <div className="px-4 py-3 border-b border-white/10 flex items-center justify-between">
                    <h2 className="text-sm font-bold text-white">Messages</h2>
                    <Button
                        size="sm"
                        className="bg-[#f08a11] text-white font-semibold text-xs px-3 h-7 rounded-lg min-w-0"
                        onPress={openCompose}
                    >
                        ✏️ New
                    </Button>
                </div>
                <div className="flex-1 overflow-y-auto">
                    {loadingConvs ? (
                        <div className="flex justify-center py-10">
                            <Spinner size="sm" color="warning" />
                        </div>
                    ) : conversations.length === 0 ? (
                        <div className="text-center py-10 px-4">
                            <p className="text-white/40 text-xs">No conversations yet.</p>
                        </div>
                    ) : (
                        conversations.map((conv) => {
                            const other = conv.participants?.find((p) => p.id !== user?.id);
                            const isActive = activeConv?.id === conv.id;
                            return (
                                <button
                                    key={conv.id}
                                    onClick={() => openConversation(conv)}
                                    className={`
                    w-full text-left px-4 py-3 border-b border-white/[0.06] transition-colors
                    ${isActive
                                            ? "bg-[#f08a11]/10 border-l-2 border-l-[#f08a11]"
                                            : "hover:bg-white/[0.05]"
                                        }
                  `}
                                >
                                    <div className="flex items-center gap-3">
                                        {other?.avatar_url ? (
                                            <img
                                                src={other.avatar_url.startsWith("http") ? other.avatar_url : `${apiOrigin}${other.avatar_url}`}
                                                alt={other.display_name}
                                                className="w-9 h-9 rounded-full object-cover flex-shrink-0"
                                                onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; (e.target as HTMLImageElement).nextElementSibling?.classList.remove('hidden'); }}
                                            />
                                        ) : null}
                                        <div className={`w-9 h-9 rounded-full bg-[#f08a11]/20 flex items-center justify-center text-sm font-bold text-[#f08a11] flex-shrink-0 ${other?.avatar_url ? 'hidden' : ''}`}>
                                            {(other?.display_name?.[0] || conv.title?.replace(/^Re:\s*/i, "")?.[0] || "C").toUpperCase()}
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <p className="text-sm font-semibold text-white truncate">
                                                {other?.display_name || conv.title || "Conversation"}
                                            </p>
                                            <p className="text-[10px] text-white/40 truncate">
                                                {conv.last_message_at
                                                    ? new Date(conv.last_message_at).toLocaleDateString()
                                                    : "No messages"}
                                            </p>
                                        </div>
                                        {(conv.unread_count ?? 0) > 0 && (
                                            <span className="w-5 h-5 bg-[#f08a11] rounded-full text-[9px] font-bold text-white flex items-center justify-center flex-shrink-0">
                                                {conv.unread_count}
                                            </span>
                                        )}
                                    </div>
                                </button>
                            );
                        })
                    )}
                </div>
            </div>

            {/* ── Message Thread ── */}
            <div className="flex-1 flex flex-col bg-transparent">
                {!activeConv ? (
                    <div className="flex-1 flex items-center justify-center">
                        <div className="text-center">
                            <span className="text-4xl mb-3 block">💬</span>
                            <p className="text-white/40 text-sm">Select a conversation</p>
                        </div>
                    </div>
                ) : (
                    <>
                        {/* Thread header */}
                        <div className="px-5 py-3 bg-white/[0.05] border-b border-white/10 flex items-center gap-3">
                            {otherParticipant?.avatar_url ? (
                                <img
                                    src={otherParticipant.avatar_url.startsWith("http") ? otherParticipant.avatar_url : `${apiOrigin}${otherParticipant.avatar_url}`}
                                    alt={otherParticipant.display_name}
                                    className="w-8 h-8 rounded-full object-cover"
                                    onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; (e.target as HTMLImageElement).nextElementSibling?.classList.remove('hidden'); }}
                                />
                            ) : null}
                            <div className={`w-8 h-8 rounded-full bg-[#f08a11]/20 flex items-center justify-center text-sm font-bold text-[#f08a11] ${otherParticipant?.avatar_url ? 'hidden' : ''}`}>
                                {(otherParticipant?.display_name?.[0] || activeConv?.title?.[0] || "C").toUpperCase()}
                            </div>
                            <div>
                                <p className="text-sm font-semibold text-white">
                                    {otherParticipant?.display_name || activeConv.title}
                                </p>
                                {typingUsers.length > 0 && (
                                    <p className="text-[10px] text-[#f08a11] animate-pulse">typing…</p>
                                )}
                            </div>
                        </div>

                        {/* Messages */}
                        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
                            {loadingMessages ? (
                                <div className="flex justify-center py-10">
                                    <Spinner size="sm" color="warning" />
                                </div>
                            ) : allMessages.length === 0 ? (
                                <div className="text-center py-10">
                                    <p className="text-white/40 text-xs">No messages yet. Say hello!</p>
                                </div>
                            ) : (
                                allMessages.map((msg) => {
                                    const isMine = msg.sender_id === user?.id;
                                    return (
                                        <div
                                            key={msg.id}
                                            className={`flex ${isMine ? "justify-end" : "justify-start"}`}
                                        >
                                            <div
                                                className={`
                          max-w-[70%] rounded-2xl px-4 py-2.5 text-sm
                          ${isMine
                                                        ? "bg-[#f08a11] text-white rounded-br-md"
                                                        : "bg-white/[0.08] text-white border border-white/10 rounded-bl-md"
                                                    }
                        `}
                                            >
                                                {!isMine && (
                                                    <p className="text-[10px] font-semibold text-white/50 mb-0.5">
                                                        {msg.sender_name}
                                                    </p>
                                                )}
                                                <p className="whitespace-pre-wrap break-words">{msg.content}</p>
                                                {/* Attachments */}
                                                {(() => {
                                                    const attList: { url: string }[] = typeof msg.attachments === "string"
                                                        ? (msg.attachments ? JSON.parse(msg.attachments) : [])
                                                        : (msg.attachments ?? []);
                                                    return attList.length > 0 ? (
                                                        <div className="mt-1.5 space-y-1">
                                                            {attList.map((att, i) => {
                                                                const url = att.url.startsWith("http") ? att.url : `${apiOrigin}${att.url}`;
                                                                const name = att.url.split("/").pop() ?? "file";
                                                                const isImage = /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(att.url);
                                                                return isImage ? (
                                                                    <img key={i} src={url} alt={name} className="max-w-[200px] rounded-lg mt-1 cursor-pointer" onClick={() => window.open(url, "_blank")} />
                                                                ) : (
                                                                    <a key={i} href={url} target="_blank" rel="noreferrer" className={`flex items-center gap-1.5 text-[11px] underline ${isMine ? "text-white/80" : "text-[#f08a11]"}`}>
                                                                        📎 {name}
                                                                    </a>
                                                                );
                                                            })}
                                                        </div>
                                                    ) : null;
                                                })()}
                                                <p className={`text-[9px] mt-1 ${isMine ? "text-white/60" : "text-white/30"}`}>
                                                    {formatMessageTime(msg.created_at)}
                                                </p>
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                            <div ref={messagesEndRef} />
                        </div>

                        {/* Input */}
                        {/* Pending files preview */}
                        {pendingFiles.length > 0 && (
                            <div className="px-5 pt-2 bg-white/[0.03] border-t border-white/[0.06] flex flex-wrap gap-2">
                                {pendingFiles.map((f, i) => (
                                    <div key={i} className="flex items-center gap-1 bg-white/[0.08] rounded-lg px-2.5 py-1 text-xs text-white">
                                        <span className="truncate max-w-[120px]">{f.name}</span>
                                        <button
                                            type="button"
                                            onClick={() => setPendingFiles((prev) => prev.filter((_, j) => j !== i))}
                                            className="text-white/40 hover:text-red-400 ml-1 text-sm leading-none"
                                        >
                                            ✕
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                        <form onSubmit={handleSend} className="px-5 py-3 bg-white/[0.05] border-t border-white/10 flex gap-2 items-center">
                            <input
                                ref={fileInputRef}
                                type="file"
                                multiple
                                className="hidden"
                                onChange={(e) => {
                                    if (e.target.files) setPendingFiles((prev) => [...prev, ...Array.from(e.target.files!)]);
                                    e.target.value = "";
                                }}
                            />
                            <button
                                type="button"
                                onClick={() => fileInputRef.current?.click()}
                                className="p-1.5 text-white/40 hover:text-[#f08a11] transition-colors flex-shrink-0"
                                title="Attach file"
                            >
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M21.44 11.05l-9.19 9.19a6 6 0 01-8.49-8.49l9.19-9.19a4 4 0 015.66 5.66l-9.2 9.19a2 2 0 01-2.83-2.83l8.49-8.48" />
                                </svg>
                            </button>
                            <Input
                                value={newMessage}
                                onValueChange={(val) => {
                                    setNewMessage(val);
                                    handleTyping();
                                }}
                                placeholder="Type a message…"
                                variant="bordered"
                                size="sm"
                                classNames={{
                                    inputWrapper: "border-white/10 bg-white/[0.05] focus-within:border-[#f08a11]",
                                    input: "text-white placeholder:text-white/30",
                                }}
                            />
                            <Button
                                type="submit"
                                isLoading={sending}
                                isDisabled={!newMessage.trim() && pendingFiles.length === 0}
                                size="sm"
                                className="bg-[#f08a11] text-white font-semibold px-4 rounded-xl"
                            >
                                Send
                            </Button>
                        </form>
                    </>
                )}
            </div>

            {/* ── Compose Modal ── */}
            {showCompose && (
                <div className="absolute inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center">
                    <div className="bg-[#2a2b3d] border border-white/10 rounded-2xl shadow-2xl w-[400px] max-h-[80vh] flex flex-col overflow-hidden">
                        {/* Modal header */}
                        <div className="px-5 py-3 border-b border-white/10 flex items-center justify-between">
                            <h3 className="text-sm font-bold text-white">New Conversation</h3>
                            <button
                                onClick={() => setShowCompose(false)}
                                className="text-white/40 hover:text-white transition-colors text-lg leading-none"
                            >
                                ✕
                            </button>
                        </div>

                        <form onSubmit={handleCreateConversation} className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
                            {/* Contract picker */}
                            <div>
                                <label className="block text-xs font-semibold text-white/50 mb-1.5">Contract</label>
                                {loadingContracts ? (
                                    <div className="flex justify-center py-4">
                                        <Spinner size="sm" color="warning" />
                                    </div>
                                ) : contracts.length === 0 ? (
                                    <p className="text-xs text-white/40 py-2">No active contracts found.</p>
                                ) : (
                                    <div className="space-y-1 max-h-36 overflow-y-auto">
                                        {contracts.map((ct) => {
                                            const isSelected = selectedContract?.id === ct.id;
                                            const otherName = ct.client_id === user?.id ? ct.freelancer_name : ct.client_name;
                                            return (
                                                <button
                                                    key={ct.id}
                                                    type="button"
                                                    onClick={() => setSelectedContract(ct)}
                                                    className={`w-full text-left px-3 py-2.5 rounded-lg border transition-all text-xs ${isSelected
                                                        ? "border-[#f08a11] bg-[#f08a11]/10"
                                                        : "border-white/10 hover:border-[#f08a11]/40 bg-white/[0.03]"
                                                        }`}
                                                >
                                                    <p className="font-semibold text-white truncate">{ct.title}</p>
                                                    {otherName && (
                                                        <p className="text-[10px] text-white/40 mt-0.5">with {otherName}</p>
                                                    )}
                                                </button>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>

                            {/* Subject */}
                            <div>
                                <label className="block text-xs font-semibold text-white/50 mb-1.5">Subject (optional)</label>
                                <Input
                                    value={composeSubject}
                                    onValueChange={setComposeSubject}
                                    placeholder={selectedContract ? `Re: ${selectedContract.title}` : "Enter subject..."}
                                    variant="bordered"
                                    size="sm"
                                    classNames={{
                                        inputWrapper: "border-white/10 bg-white/[0.05] focus-within:border-[#f08a11]",
                                        input: "text-white placeholder:text-white/30",
                                    }}
                                />
                            </div>

                            {/* Message body */}
                            <div>
                                <label className="block text-xs font-semibold text-white/50 mb-1.5">Message</label>
                                <textarea
                                    value={composeBody}
                                    onChange={(e) => setComposeBody(e.target.value)}
                                    placeholder="Type your message..."
                                    rows={4}
                                    className="w-full rounded-xl border border-white/10 bg-white/[0.05] px-3 py-2.5 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-[#f08a11] resize-none"
                                />
                            </div>

                            {/* Attachments */}
                            <div>
                                <input
                                    ref={composeFileInputRef}
                                    type="file"
                                    multiple
                                    className="hidden"
                                    onChange={(e) => {
                                        if (e.target.files) setComposeFiles((prev) => [...prev, ...Array.from(e.target.files!)]);
                                        e.target.value = "";
                                    }}
                                />
                                <button
                                    type="button"
                                    onClick={() => composeFileInputRef.current?.click()}
                                    className="flex items-center gap-1.5 text-xs text-white/40 hover:text-[#f08a11] transition-colors"
                                >
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M21.44 11.05l-9.19 9.19a6 6 0 01-8.49-8.49l9.19-9.19a4 4 0 015.66 5.66l-9.2 9.19a2 2 0 01-2.83-2.83l8.49-8.48" />
                                    </svg>
                                    Attach files
                                </button>
                                {composeFiles.length > 0 && (
                                    <div className="flex flex-wrap gap-1.5 mt-2">
                                        {composeFiles.map((f, i) => (
                                            <div key={i} className="flex items-center gap-1 bg-white/[0.08] rounded-lg px-2.5 py-1 text-xs text-white">
                                                <span className="truncate max-w-[100px]">{f.name}</span>
                                                <button
                                                    type="button"
                                                    onClick={() => setComposeFiles((prev) => prev.filter((_, j) => j !== i))}
                                                    className="text-white/40 hover:text-red-400 ml-0.5 text-sm leading-none"
                                                >
                                                    ✕
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Actions */}
                            <div className="flex justify-end gap-2 pt-1">
                                <Button
                                    type="button"
                                    size="sm"
                                    variant="bordered"
                                    className="font-semibold text-xs text-white/70 border-white/20"
                                    onPress={() => setShowCompose(false)}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    type="submit"
                                    size="sm"
                                    isLoading={creating}
                                    isDisabled={!selectedContract || !composeBody.trim()}
                                    className="bg-[#f08a11] text-white font-semibold text-xs px-5 rounded-xl"
                                >
                                    Send
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

function formatMessageTime(iso: string) {
    try {
        return new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    } catch { return ""; }
}
