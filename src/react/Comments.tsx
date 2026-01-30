/**
 * Comments Component
 *
 * Top-level component that displays all threads in a zone.
 */

import { type ReactNode } from "react";
import { useComments } from "./CommentsProvider";

// ============================================================================
// Types
// ============================================================================

export interface ThreadData {
    thread: {
        _id: string;
        zoneId: string;
        resolved: boolean;
        resolvedBy?: string;
        resolvedAt?: number;
        createdAt: number;
        lastActivityAt: number;
        position?: { x: number; y: number; anchor?: string };
        metadata?: unknown;
    };
    firstMessage: {
        _id: string;
        body: string;
        authorId: string;
        createdAt: number;
    } | null;
    messageCount: number;
}

export interface CommentsProps {
    /** Threads data from getThreads query */
    threads: ThreadData[];
    /** Whether there are more threads to load */
    hasMore?: boolean;
    /** Loading state */
    isLoading?: boolean;
    /** Callback when load more is clicked */
    onLoadMore?: () => void;
    /** Callback when a thread is clicked */
    onThreadClick?: (threadId: string) => void;
    /** Callback when new thread button is clicked */
    onNewThread?: () => void;
    /** Callback when thread is resolved */
    onResolveThread?: (threadId: string) => void;
    /** Callback when thread is unresolve */
    onUnresolveThread?: (threadId: string) => void;
    /** Whether to show resolved threads */
    showResolved?: boolean;
    /** Custom thread renderer */
    renderThread?: (thread: ThreadData) => ReactNode;
    /** Empty state message */
    emptyMessage?: string;
    /** CSS class name */
    className?: string;
}

// ============================================================================
// Component
// ============================================================================

/**
 * Main comments component that displays all threads in a zone.
 *
 * Usage:
 * ```tsx
 * const { threads, hasMore } = useQuery(api.comments.getThreads, { zoneId });
 *
 * <Comments
 *   threads={threads}
 *   hasMore={hasMore}
 *   onLoadMore={loadMore}
 *   onThreadClick={(id) => setSelectedThread(id)}
 *   onNewThread={() => createThread()}
 * />
 * ```
 */
export function Comments({
    threads,
    hasMore = false,
    isLoading = false,
    onLoadMore,
    onThreadClick,
    onNewThread,
    onResolveThread,
    onUnresolveThread,
    showResolved = true,
    renderThread,
    emptyMessage = "No comments yet. Start a conversation!",
    className = "",
}: CommentsProps) {
    const { userId, styles } = useComments();


    // Filter threads based on showResolved
    const visibleThreads = showResolved
        ? threads
        : threads.filter((t) => !t.thread.resolved);



    // Default thread renderer
    const defaultRenderThread = (data: ThreadData) => {
        const { thread, firstMessage, messageCount } = data;
        const isResolved = thread.resolved;

        return (
            <div
                key={thread._id}
                className={`comments-thread-preview ${isResolved ? "resolved" : ""}`}
                onClick={() => onThreadClick?.(thread._id)}
                style={{
                    padding: "12px 16px",
                    borderBottom: "1px solid #e5e7eb",
                    cursor: "pointer",
                    opacity: isResolved ? 0.6 : 1,
                    backgroundColor: isResolved ? "#f9fafb" : "white",
                }}
            >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                        {firstMessage ? (
                            <>
                                <div
                                    style={{
                                        fontSize: "14px",
                                        color: "#111827",
                                        whiteSpace: "nowrap",
                                        overflow: "hidden",
                                        textOverflow: "ellipsis",
                                    }}
                                >
                                    {firstMessage.body}
                                </div>
                                <div style={{ fontSize: "12px", color: "#6b7280", marginTop: "4px" }}>
                                    {messageCount} {messageCount === 1 ? "message" : "messages"}
                                    {isResolved && " • Resolved"}
                                </div>
                            </>
                        ) : (
                            <div style={{ fontSize: "14px", color: "#6b7280", fontStyle: "italic" }}>
                                Empty thread
                            </div>
                        )}
                    </div>
                    {isResolved && onUnresolveThread && (
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                onUnresolveThread(thread._id);
                            }}
                            style={{
                                padding: "4px 8px",
                                fontSize: "12px",
                                border: "1px solid #d1d5db",
                                borderRadius: "4px",
                                background: "white",
                                cursor: "pointer",
                            }}
                        >
                            Reopen
                        </button>
                    )}
                    {!isResolved && onResolveThread && (
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                onResolveThread(thread._id);
                            }}
                            style={{
                                padding: "4px 8px",
                                fontSize: "12px",
                                border: "1px solid #d1d5db",
                                borderRadius: "4px",
                                background: "white",
                                cursor: "pointer",
                            }}
                        >
                            Resolve
                        </button>
                    )}
                </div>
            </div>
        );
    };

    return (
        <div
            className={`comments-container ${className}`}
            style={{
                fontFamily: styles?.fontFamily ?? "system-ui, -apple-system, sans-serif",
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
                    backgroundColor: "#f9fafb",
                }}
            >
                <span style={{ fontWeight: 600, fontSize: "14px" }}>
                    Comments ({threads.length})
                </span>
                {onNewThread && userId && (
                    <button
                        onClick={onNewThread}
                        style={{
                            padding: "6px 12px",
                            fontSize: "13px",
                            fontWeight: 500,
                            border: "none",
                            borderRadius: "6px",
                            backgroundColor: styles?.accentColor ?? "#3b82f6",
                            color: "white",
                            cursor: "pointer",
                        }}
                    >
                        + New Thread
                    </button>
                )}
            </div>

            {/* Thread list */}
            <div style={{ maxHeight: "400px", overflowY: "auto" }}>
                {visibleThreads.length === 0 ? (
                    <div
                        style={{
                            padding: "40px 16px",
                            textAlign: "center",
                            color: "#6b7280",
                            fontSize: "14px",
                        }}
                    >
                        {emptyMessage}
                    </div>
                ) : (
                    visibleThreads.map((data) =>
                        renderThread ? renderThread(data) : defaultRenderThread(data)
                    )
                )}

                {/* Load more */}
                {hasMore && (
                    <div style={{ padding: "12px 16px", textAlign: "center" }}>
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
                            {isLoading ? "Loading..." : "Load More"}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
