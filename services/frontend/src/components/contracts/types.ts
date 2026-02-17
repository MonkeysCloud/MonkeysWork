/* ── Contract-related types ─────────────────────────── */
export interface Contract {
    id: string;
    job_id: string;
    job_title: string;
    proposal_id: string;
    client_id: string;
    freelancer_id: string;
    client_name?: string;
    freelancer_name?: string;
    title: string;
    description?: string;
    contract_type: "fixed" | "hourly";
    total_amount: string;
    hourly_rate?: string;
    weekly_hour_limit?: number;
    currency: string;
    status: string;
    platform_fee_percent: string;
    started_at: string;
    completed_at?: string;
    cancelled_at?: string;
    cancellation_reason?: string;
    total_hours_logged?: number;
    total_time_amount?: string;
    created_at: string;
    updated_at: string;
}

export interface Milestone {
    id: string;
    contract_id: string;
    title: string;
    description?: string;
    amount: string;
    currency: string;
    status: string;
    sort_order: number;
    due_date?: string;
    started_at?: string;
    submitted_at?: string;
    completed_at?: string;
    revision_count: number;
    client_feedback?: string;
    escrow_funded: boolean;
    escrow_released: boolean;
    funded_at?: string;
    created_at: string;
}

export interface Deliverable {
    id: string;
    milestone_id: string;
    file_url?: string;
    url?: string;
    file_name?: string;
    filename?: string;
    file_size: number;
    mime_type: string;
    notes?: string;
    description?: string;
    version: number;
    uploader_name?: string;
    uploaded_by?: string;
    created_at: string;
}

export interface Dispute {
    id: string;
    contract_id: string;
    milestone_id?: string;
    filed_by?: string;
    raised_by?: string;
    reason: string;
    description: string;
    evidence_urls?: { url: string; name: string }[];
    status: string;
    resolution_amount?: string;
    resolution_notes?: string;
    resolved_by?: string;
    resolved_at?: string;
    response_deadline?: string;
    awaiting_response_from?: string;
    message_count?: number;
    job_title?: string;
    client_name?: string;
    freelancer_name?: string;
    client_id?: string;
    freelancer_id?: string;
    filed_by_name?: string;
    total_amount?: string;
    currency?: string;
    created_at: string;
    updated_at?: string;
}

export interface DisputeMsg {
    id: string;
    dispute_id: string;
    sender_id: string;
    sender_name?: string;
    body: string;
    attachment_url?: string;
    attachments?: { url: string; name: string }[];
    is_internal?: boolean;
    created_at: string;
}

export const DISPUTE_STATUS: Record<string, { label: string; bg: string; fg: string; icon: string }> = {
    open: { label: "Open", bg: "#fef3c7", fg: "#92400e", icon: "⚠️" },
    under_review: { label: "Under Review", bg: "#dbeafe", fg: "#1d4ed8", icon: "🔍" },
    escalated: { label: "Escalated", bg: "#fce7f3", fg: "#be185d", icon: "🔺" },
    resolved_client: { label: "Client Won", bg: "#dcfce7", fg: "#15803d", icon: "✅" },
    resolved_freelancer: { label: "Freelancer Won", bg: "#dcfce7", fg: "#15803d", icon: "✅" },
    resolved_split: { label: "Split", bg: "#f0fdf4", fg: "#166534", icon: "🤝" },
};

export interface Conversation {
    id: string;
    contract_id?: string;
    title: string;
}

export interface ConvoMessage {
    id: string;
    sender_id: string;
    sender_name?: string;
    body: string;
    attachments?: string | { url: string }[];
    created_at: string;
}

/* ── Status style maps ─────────────────────────────── */
export const CONTRACT_STATUS: Record<string, { label: string; bg: string; fg: string; icon: string }> = {
    active: { label: "Active", bg: "#dcfce7", fg: "#15803d", icon: "🟢" },
    paused: { label: "Paused", bg: "#fef3c7", fg: "#92400e", icon: "⏸️" },
    completed: { label: "Completed", bg: "#dbeafe", fg: "#1d4ed8", icon: "✅" },
    disputed: { label: "Disputed", bg: "#fef2f2", fg: "#dc2626", icon: "⚠️" },
    cancelled: { label: "Cancelled", bg: "#f3f4f6", fg: "#6b7280", icon: "❌" },
};

export const MILESTONE_STATUS: Record<string, { label: string; bg: string; fg: string }> = {
    pending: { label: "Pending", bg: "#f1f5f9", fg: "#475569" },
    in_progress: { label: "In Progress", bg: "#dbeafe", fg: "#1d4ed8" },
    submitted: { label: "Submitted", bg: "#fef3c7", fg: "#92400e" },
    revision_requested: { label: "Revision", bg: "#fce7f3", fg: "#be185d" },
    accepted: { label: "Accepted", bg: "#dcfce7", fg: "#15803d" },
    disputed: { label: "Disputed", bg: "#fef2f2", fg: "#dc2626" },
};

export const DISPUTE_REASONS = [
    { value: "quality", label: "Quality Issues" },
    { value: "non_delivery", label: "Non-Delivery" },
    { value: "scope_change", label: "Scope Change" },
    { value: "payment", label: "Payment Issue" },
    { value: "communication", label: "Communication" },
    { value: "other", label: "Other" },
];

/* ── Formatting helpers ─────────────────────────────── */
export function formatDate(iso?: string) {
    if (!iso) return "—";
    return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export function formatMoney(amount: string | number, currency = "USD") {
    const num = typeof amount === "string" ? parseFloat(amount) : amount;
    return new Intl.NumberFormat("en-US", { style: "currency", currency }).format(num);
}

/* ── Shared inline styles ──────────────────────────── */
export const styles = {
    card: { background: "#fff", borderRadius: 14, border: "1px solid #e2e8f0", padding: "1.25rem 1.5rem", marginBottom: "1rem" } as React.CSSProperties,
    btnPrimary: { padding: "0.5rem 1rem", borderRadius: 8, border: "none", background: "#6366f1", color: "#fff", fontSize: "0.8125rem", fontWeight: 600, cursor: "pointer" } as React.CSSProperties,
    btnOutline: { padding: "0.5rem 1rem", borderRadius: 8, border: "1px solid #e2e8f0", background: "#fff", color: "#334155", fontSize: "0.8125rem", fontWeight: 500, cursor: "pointer" } as React.CSSProperties,
    btnDanger: { padding: "0.5rem 1rem", borderRadius: 8, border: "none", background: "#ef4444", color: "#fff", fontSize: "0.8125rem", fontWeight: 600, cursor: "pointer" } as React.CSSProperties,
    btnSuccess: { padding: "0.5rem 1rem", borderRadius: 8, border: "none", background: "#16a34a", color: "#fff", fontSize: "0.8125rem", fontWeight: 600, cursor: "pointer" } as React.CSSProperties,
    input: { width: "100%", padding: "0.5rem 0.75rem", borderRadius: 8, border: "1px solid #e2e8f0", fontSize: "0.875rem", outline: "none" } as React.CSSProperties,
    label: { display: "block", fontSize: "0.75rem", fontWeight: 600, color: "#64748b", marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.5px" } as React.CSSProperties,
};

export const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8086/api/v1";
export const FILE_HOST = API.replace("/api/v1", "");
