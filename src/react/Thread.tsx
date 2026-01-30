/**
 * Thread Component
 *
 * Displays a single thread with all its messages.
 */

import { useEffect, useRef, type ReactNode } from "react";
import { useComments } from "./CommentsProvider";
import { Comment, type MessageData } from "./Comment";
import { AddComment } from "./AddComment";
import { TypingIndicator } from "./TypingIndicator";

// ============================================================================
// Types
// ============================================================================

export interface ThreadInfo {
    _id: string;
    zoneId: string;
    resolved: boolean;
    resolvedBy?: string;
    resolvedAt?: number;
    createdAt: number;
    lastActivityAt: number;
    position?: { x: number; y: number; anchor?: string };
    metadata?: unknown;
}

export interface ThreadProps {
    /** Thread data */
    thread: ThreadInfo;
    /** Messages in this thread */
    messages: MessageData[];
    /** Typing users in this thread */
    typingUsers?: Array<{ userId: string; updatedAt: number }>;
    /** Whether there are more messages to load */
    hasMore?: boolean;
    /** Loading state */
    isLoading?: boolean;
    /** Callback when load more is triggered */
    onLoadMore?: () => void;
    /** Callback when a new message is submitted */
    onSubmit?: (body: string, attachments?: Array<{ type: "url" | "file" | "image"; url: string; name?: string }>) => void;
    /** Callback when typing state changes */
    onTypingChange?: (isTyping: boolean) => void;
    /** Callback when a reaction is toggled */
    onToggleReaction?: (messageId: string, emoji: string) => void;
    /** Callback when a message is edited */
    onEditMessage?: (messageId: string, newBody: string) => void;
    /** Callback when a message is deleted */
    onDeleteMessage?: (messageId: string) => void;
    /** Callback to resolve the thread */
    onResolve?: () => void;
    /** Callback to unresolve the thread */
    onUnresolve?: () => void;
    /** Callback to close/go back */
    onClose?: () => void;
    /** Whether editing is allowed */
    allowEditing?: boolean;
    /** Whether to auto-scroll to bottom on new messages */
    autoScroll?: boolean;
    /** Custom message renderer */
    renderMessage?: (message: MessageData, mine: boolean) => ReactNode;
    /** CSS class name */
    className?: string;
}

// ============================================================================
// Component
// ============================================================================

/**
 * Component to display a single thread with its messages.
 *
 * Usage:
 * ```tsx
 * <Thread
 *   thread={thread}
 *   messages={messages}
 *   typingUsers={typingUsers}
 *   onSubmit={(body) => addComment({ threadId: thread._id, body })}
 *   onTypingChange={(isTyping) => setIsTyping({ threadId: thread._id, isTyping })}
 *   onToggleReaction={(messageId, emoji) => toggleReaction({ messageId, emoji })}
 * />
 * ```
 */
export function Thread({
    thread,
    messages,
    typingUsers = [],
    hasMore = false,
    isLoading = false,
    onLoadMore,
    onSubmit,
    onTypingChange,
    onToggleReaction,
    onEditMessage,
    onDeleteMessage,
    onResolve,
    onUnresolve,
    onClose,
    allowEditing = true,
    autoScroll = true,
    renderMessage,
    className = "",
}: ThreadProps) {
    const { userId, styles } = useComments();
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const prevMessageCount = useRef(messages.length);

    // Auto-scroll to bottom on new messages
    useEffect(() => {
        if (autoScroll && messages.length > prevMessageCount.current) {
            messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
        }
        prevMessageCount.current = messages.length;
    }, [messages.length, autoScroll]);

    const handleSubmit = (body: string, attachments?: Array<{ type: "url" | "file" | "image"; url: string; name?: string }>) => {
        onSubmit?.(body, attachments);
    };

    return (
        <div
            className={`thread-container ${className}`}
            style={{
                fontFamily: styles?.fontFamily ?? "system-ui, -apple-system, sans-serif",
                display: "flex",
                flexDirection: "column",
                height: "100%",
                border: "1px solid #e5e7eb",
                borderRadius: styles?.borderRadius ?? "8px",
                overflow: "hidden",
            }}
        >
            {/* Header */}
            <div
                style={{
                    padding: "12px 16px",
                    borderBottom: "1px solid #e5e7eb",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    backgroundColor: thread.resolved ? "#f0fdf4" : "#f9fafb",
                }}
            >
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    {onClose && (
                        <button
                            onClick={onClose}
                            style={{
                                padding: "4px 8px",
                                border: "none",
                                background: "transparent",
                                cursor: "pointer",
                                fontSize: "16px",
                            }}
                        >
                            ←
                        </button>
                    )}
                    <span style={{ fontWeight: 600, fontSize: "14px" }}>
                        Thread
                        {thread.resolved && (
                            <span style={{ color: "#16a34a", marginLeft: "8px", fontWeight: 400 }}>
                                ✓ Resolved
                            </span>
                        )}
                    </span>
                </div>
                <div style={{ display: "flex", gap: "8px" }}>
                    {thread.resolved && onUnresolve && (
                        <button
                            onClick={onUnresolve}
                            style={{
                                padding: "6px 12px",
                                fontSize: "13px",
                                border: "1px solid #d1d5db",
                                borderRadius: "6px",
                                background: "white",
                                cursor: "pointer",
                            }}
                        >
                            Reopen
                        </button>
                    )}
                    {!thread.resolved && onResolve && userId && (
                        <button
                            onClick={onResolve}
                            style={{
                                padding: "6px 12px",
                                fontSize: "13px",
                                fontWeight: 500,
                                border: "none",
                                borderRadius: "6px",
                                backgroundColor: "#16a34a",
                                color: "white",
                                cursor: "pointer",
                            }}
                        >
                            Resolve
                        </button>
                    )}
                </div>
            </div>

            {/* Messages */}
            <div
                style={{
                    flex: 1,
                    overflowY: "auto",
                    padding: "16px",
                }}
            >
                {/* Load more button */}
                {hasMore && (
                    <div style={{ textAlign: "center", marginBottom: "16px" }}>
                        <button
                            onClick={onLoadMore}
                            disabled={isLoading}
                            style={{
                                padding: "8px 16px",
                                fontSize: "13px",
                                border: "1px solid #d1d5db",
                                borderRadius: "6px",
                                background: "white",
                                cursor: isLoading ? "not-allowed" : "pointer",
                                opacity: isLoading ? 0.6 : 1,
                            }}
                        >
                            {isLoading ? "Loading..." : "Load Earlier Messages"}
                        </button>
                    </div>
                )}

                {/* Message list */}
                {messages.length === 0 ? (
                    <div
                        style={{
                            textAlign: "center",
                            color: "#6b7280",
                            fontSize: "14px",
                            padding: "40px 0",
                        }}
                    >
                        No messages yet. Start the conversation!
                    </div>
                ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                        {messages.map((message) => {
                            const isMine = userId === message.message.authorId;
                            return renderMessage ? (
                                renderMessage(message, isMine)
                            ) : (
                                <Comment
                                    key={message.message._id}
                                    comment={message}
                                    mine={isMine}
                                    onToggleReaction={
                                        onToggleReaction
                                            ? (emoji) => onToggleReaction(message.message._id, emoji)
                                            : undefined
                                    }
                                    onEdit={
                                        onEditMessage && isMine
                                            ? (newBody) => onEditMessage(message.message._id, newBody)
                                            : undefined
                                    }
                                    onDelete={
                                        onDeleteMessage && isMine
                                            ? () => onDeleteMessage(message.message._id)
                                            : undefined
                                    }
                                />
                            );
                        })}
                    </div>
                )}

                {/* Typing indicator */}
                {typingUsers.length > 0 && (
                    <div style={{ marginTop: "12px" }}>
                        <TypingIndicator users={typingUsers.map((u) => u.userId)} />
                    </div>
                )}

                {/* Scroll anchor */}
                <div ref={messagesEndRef} />
            </div>

            {/* Composer */}
            {userId && !thread.resolved && (
                <div style={{ borderTop: "1px solid #e5e7eb" }}>
                    <AddComment
                        onSubmit={handleSubmit}
                        onTypingChange={onTypingChange}
                        allowEditing={allowEditing}
                        placeholder="Write a reply..."
                    />
                </div>
            )}

            {/* Resolved state message */}
            {thread.resolved && (
                <div
                    style={{
                        padding: "12px 16px",
                        borderTop: "1px solid #e5e7eb",
                        textAlign: "center",
                        color: "#6b7280",
                        fontSize: "13px",
                        backgroundColor: "#f9fafb",
                    }}
                >
                    This thread has been resolved.
                    {onUnresolve && (
                        <button
                            onClick={onUnresolve}
                            style={{
                                marginLeft: "8px",
                                padding: "0",
                                border: "none",
                                background: "transparent",
                                color: styles?.accentColor ?? "#3b82f6",
                                cursor: "pointer",
                                textDecoration: "underline",
                            }}
                        >
                            Reopen
                        </button>
                    )}
                </div>
            )}
        </div>
    );
}
