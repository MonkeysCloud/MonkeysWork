/**
 * Socket.IO Event Types & Channel Constants
 *
 * Shared type definitions for events flowing between
 * PHP API → Redis → Socket.IO → Frontend
 */

// ── Redis Channels ──

export const REDIS_CHANNEL = "mw:events";

// ── Socket.IO Namespaces ──

export const NAMESPACES = {
    NOTIFICATIONS: "/notifications",
    MESSAGES: "/messages",
    CONTRACTS: "/contracts",
} as const;

// ── Event Names ──

export const EVENTS = {
    // Notifications
    NOTIFICATION_NEW: "notification:new",
    NOTIFICATION_READ: "notification:read",

    // Messages
    MESSAGE_NEW: "message:new",
    MESSAGE_READ: "message:read",
    MESSAGE_EDITED: "message:edited",
    MESSAGE_DELETED: "message:deleted",
    TYPING_START: "typing:start",
    TYPING_STOP: "typing:stop",

    // Contracts
    CONTRACT_STATUS: "contract:status",
    MILESTONE_STATUS: "milestone:status",
    PROPOSAL_STATUS: "proposal:status",
    ESCROW_STATUS: "escrow:status",
    DISPUTE_UPDATE: "dispute:update",
    INVOICE_STATUS: "invoice:status",

    // System
    CONNECTION_ERROR: "connection:error",
} as const;

// ── Payload Interfaces ──

export interface RedisEventPayload {
    /** Target namespace (e.g. /notifications) */
    namespace: string;
    /** Socket.IO event name */
    event: string;
    /** Target room (e.g. user:<uuid>, conversation:<uuid>) */
    room: string;
    /** Event data payload */
    data: Record<string, unknown>;
}

export interface NotificationPayload {
    id: string;
    type: string;
    title: string;
    body?: string;
    data: Record<string, unknown>;
    priority: string;
    created_at: string;
}

export interface MessagePayload {
    id: string;
    conversation_id: string;
    sender_id: string;
    content: string;
    message_type: string;
    attachments: Array<{
        url: string;
        name: string;
        size: number;
        mime: string;
    }>;
    created_at: string;
}

export interface TypingPayload {
    conversation_id: string;
    user_id: string;
    display_name: string;
}

export interface ContractStatusPayload {
    contract_id: string;
    status: string;
    updated_at: string;
}

export interface MilestoneStatusPayload {
    milestone_id: string;
    contract_id: string;
    status: string;
    updated_at: string;
}

export interface ProposalStatusPayload {
    proposal_id: string;
    job_id: string;
    status: string;
    updated_at: string;
}

export interface EscrowStatusPayload {
    transaction_id: string;
    contract_id: string;
    type: string;
    status: string;
    amount: string;
    currency: string;
}

export interface DisputeUpdatePayload {
    dispute_id: string;
    contract_id: string;
    status: string;
    updated_at: string;
}

export interface InvoiceStatusPayload {
    invoice_id: string;
    contract_id: string;
    status: string;
    updated_at: string;
}
