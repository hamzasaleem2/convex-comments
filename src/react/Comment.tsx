/**
 * Comment Component
 *
 * Displays a single comment/message with reactions and actions.
 */

import { useState, useEffect } from "react";
import { useComments } from "./CommentsProvider";
import { ReactionPicker } from "./ReactionPicker";

// ============================================================================
// Types
// ============================================================================

export interface MessageData {
    message: {
        _id: string;
        threadId: string;
        authorId: string;
        body: string;
        mentions: Array<{ userId: string; start: number; end: number }>;
        links: Array<{ url: string; start: number; end: number }>;
        attachments: Array<{
            type: "url" | "file" | "image";
            url: string;
            name?: string;
            mimeType?: string;
            size?: number;
        }>;
        isEdited: boolean;
        isDeleted: boolean;
        createdAt: number;
        editedAt?: number;
    };
    reactions: Array<{
        emoji: string;
        count: number;
        users: string[];
        includesMe: boolean;
    }>;
}

export interface CommentProps {
    /** Comment data */
    comment: MessageData;
    /** Whether this comment belongs to the current user */
    mine?: boolean;
    /** Callback when a reaction is toggled */
    onToggleReaction?: (emoji: string) => void;
    /** Callback when the comment is edited */
    onEdit?: (newBody: string) => void;
    /** Callback when the comment is deleted */
    onDelete?: () => void;
    /** CSS class name */
    className?: string;
}

// ============================================================================
// Helpers
// ============================================================================

function formatTime(timestamp: number): string {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;

    return date.toLocaleDateString();
}

function renderBodyWithMentionsAndLinks(
    body: string,
    mentions: MessageData["message"]["mentions"],
    links: MessageData["message"]["links"]
): React.ReactNode {
    // Combine mentions and links, sort by start position
    const segments: Array<{
        type: "mention" | "link";
        start: number;
        end: number;
        data: { userId?: string; url?: string };
    }> = [
        ...mentions.map((m) => ({
            type: "mention" as const,
            start: m.start,
            end: m.end,
            data: { userId: m.userId },
        })),
        ...links.map((l) => ({
            type: "link" as const,
            start: l.start,
            end: l.end,
            data: { url: l.url },
        })),
    ].sort((a, b) => a.start - b.start);

    if (segments.length === 0) {
        return body;
    }

    const parts: React.ReactNode[] = [];
    let lastIndex = 0;

    segments.forEach((segment, i) => {
        // Add text before this segment
        if (segment.start > lastIndex) {
            parts.push(body.slice(lastIndex, segment.start));
        }

        // Add the highlighted segment
        const segmentText = body.slice(segment.start, segment.end);
        if (segment.type === "mention") {
            parts.push(
                <span
                    key={`mention-${i}`}
                    style={{
                        color: "#3b82f6",
                        fontWeight: 500,
                        backgroundColor: "#eff6ff",
                        padding: "0 2px",
                        borderRadius: "2px",
                    }}
                >
                    {segmentText}
                </span>
            );
        } else {
            parts.push(
                <a
                    key={`link-${i}`}
                    href={segment.data.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                        color: "#3b82f6",
                        textDecoration: "underline",
                    }}
                >
                    {segmentText}
                </a>
            );
        }

        lastIndex = segment.end;
    });

    // Add remaining text
    if (lastIndex < body.length) {
        parts.push(body.slice(lastIndex));
    }

    return parts;
}

// ============================================================================
// Component
// ============================================================================

/**
 * Component to display a single comment with reactions and actions.
 *
 * Usage:
 * ```tsx
 * <Comment
 *   comment={messageData}
 *   mine={true}
 *   onToggleReaction={(emoji) => toggleReaction({ messageId, emoji })}
 *   onEdit={(newBody) => editMessage({ messageId, body: newBody })}
 *   onDelete={() => deleteMessage({ messageId })}
 * />
 * ```
 */
export function Comment({
    comment,
    mine = false,
    onToggleReaction,
    onEdit,
    onDelete,
    className = "",
}: CommentProps) {
    const { resolveUser, canModerate, styles } = useComments();
    const [isEditing, setIsEditing] = useState(false);
    const [editBody, setEditBody] = useState(comment.message.body);
    const [showReactionPicker, setShowReactionPicker] = useState(false);
    const [showActions, setShowActions] = useState(false);
    const [authorInfo, setAuthorInfo] = useState<{ name: string; avatar?: string } | null>(null);

    // Resolve author info
    useEffect(() => {
        if (resolveUser) {
            Promise.resolve(resolveUser(comment.message.authorId)).then(setAuthorInfo);
        }
    }, [comment.message.authorId, resolveUser]);

    const handleSaveEdit = () => {
        if (editBody.trim() && editBody !== comment.message.body) {
            onEdit?.(editBody.trim());
        }
        setIsEditing(false);
    };

    const handleCancelEdit = () => {
        setEditBody(comment.message.body);
        setIsEditing(false);
    };

    const canEdit = (mine || canModerate) && onEdit && !comment.message.isDeleted;
    const canDelete = (mine || canModerate) && onDelete && !comment.message.isDeleted;

    // Deleted message
    if (comment.message.isDeleted) {
        return (
            <div
                className={`comment comment-deleted ${className}`}
                style={{
                    padding: "12px",
                    color: "#9ca3af",
                    fontStyle: "italic",
                    fontSize: "13px",
                }}
            >
                This message was deleted.
            </div>
        );
    }

    return (
        <div
            className={`comment ${mine ? "comment-mine" : ""} ${className}`}
            onMouseEnter={() => setShowActions(true)}
            onMouseLeave={() => {
                setShowActions(false);
                setShowReactionPicker(false);
            }}
            style={{
                position: "relative",
                padding: "12px",
                backgroundColor: mine ? "#eff6ff" : "#f9fafb",
                borderRadius: styles?.borderRadius ?? "8px",
            }}
        >
            {/* Author and time */}
            <div
                style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: "8px",
                }}
            >
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    {authorInfo?.avatar ? (
                        <img
                            src={authorInfo.avatar}
                            alt=""
                            style={{
                                width: "24px",
                                height: "24px",
                                borderRadius: "50%",
                            }}
                        />
                    ) : (
                        <div
                            style={{
                                width: "24px",
                                height: "24px",
                                borderRadius: "50%",
                                backgroundColor: "#d1d5db",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                fontSize: "12px",
                                fontWeight: 600,
                                color: "#4b5563",
                            }}
                        >
                            {(authorInfo?.name ?? comment.message.authorId).charAt(0).toUpperCase()}
                        </div>
                    )}
                    <span style={{ fontWeight: 600, fontSize: "13px", color: "#111827" }}>
                        {authorInfo?.name ?? comment.message.authorId}
                    </span>
                    {mine && (
                        <span
                            style={{
                                fontSize: "11px",
                                color: "#6b7280",
                                backgroundColor: "#e5e7eb",
                                padding: "1px 6px",
                                borderRadius: "4px",
                            }}
                        >
                            You
                        </span>
                    )}
                </div>
                <span style={{ fontSize: "12px", color: "#6b7280" }}>
                    {formatTime(comment.message.createdAt)}
                    {comment.message.isEdited && " (edited)"}
                </span>
            </div>

            {/* Message body */}
            {isEditing ? (
                <div style={{ marginBottom: "8px" }}>
                    <textarea
                        value={editBody}
                        onChange={(e) => setEditBody(e.target.value)}
                        style={{
                            width: "100%",
                            padding: "8px",
                            border: "1px solid #d1d5db",
                            borderRadius: "6px",
                            fontSize: "14px",
                            resize: "vertical",
                            minHeight: "60px",
                        }}
                        autoFocus
                    />
                    <div style={{ display: "flex", gap: "8px", marginTop: "8px" }}>
                        <button
                            onClick={handleSaveEdit}
                            style={{
                                padding: "4px 12px",
                                fontSize: "13px",
                                fontWeight: 500,
                                border: "none",
                                borderRadius: "4px",
                                backgroundColor: styles?.accentColor ?? "#3b82f6",
                                color: "white",
                                cursor: "pointer",
                            }}
                        >
                            Save
                        </button>
                        <button
                            onClick={handleCancelEdit}
                            style={{
                                padding: "4px 12px",
                                fontSize: "13px",
                                border: "1px solid #d1d5db",
                                borderRadius: "4px",
                                background: "white",
                                cursor: "pointer",
                            }}
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            ) : (
                <div style={{ fontSize: "14px", color: "#111827", lineHeight: 1.5 }}>
                    {renderBodyWithMentionsAndLinks(
                        comment.message.body,
                        comment.message.mentions,
                        comment.message.links
                    )}
                </div>
            )}

            {/* Attachments */}
            {comment.message.attachments.length > 0 && (
                <div style={{ marginTop: "8px", display: "flex", flexWrap: "wrap", gap: "8px" }}>
                    {comment.message.attachments.map((attachment, i) => (
                        <a
                            key={i}
                            href={attachment.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "4px",
                                padding: "4px 8px",
                                backgroundColor: "#e5e7eb",
                                borderRadius: "4px",
                                fontSize: "12px",
                                color: "#374151",
                                textDecoration: "none",
                            }}
                        >
                            {attachment.type === "image" ? "🖼️" : "📎"}
                            {attachment.name ?? "Attachment"}
                        </a>
                    ))}
                </div>
            )}

            {/* Reactions display */}
            {comment.reactions.length > 0 && (
                <div
                    style={{
                        marginTop: "8px",
                        display: "flex",
                        flexWrap: "wrap",
                        gap: "6px",
                    }}
                >
                    {comment.reactions.map((reaction) => (
                        <button
                            key={reaction.emoji}
                            onClick={() => onToggleReaction?.(reaction.emoji)}
                            style={{
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "4px",
                                padding: "2px 8px",
                                border: reaction.includesMe
                                    ? `1px solid ${styles?.accentColor ?? "#3b82f6"}`
                                    : "1px solid #d1d5db",
                                borderRadius: "12px",
                                backgroundColor: reaction.includesMe ? "#eff6ff" : "white",
                                fontSize: "13px",
                                cursor: onToggleReaction ? "pointer" : "default",
                            }}
                        >
                            <span>{reaction.emoji}</span>
                            <span style={{ color: "#6b7280" }}>{reaction.count}</span>
                        </button>
                    ))}
                </div>
            )}

            {/* Action buttons (shown on hover) */}
            {showActions && !isEditing && (
                <div
                    style={{
                        position: "absolute",
                        top: "8px",
                        right: "8px",
                        display: "flex",
                        gap: "4px",
                        backgroundColor: "white",
                        padding: "4px",
                        borderRadius: "6px",
                        boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
                    }}
                >
                    {onToggleReaction && (
                        <button
                            onClick={() => setShowReactionPicker(!showReactionPicker)}
                            style={{
                                padding: "4px 6px",
                                border: "none",
                                background: "transparent",
                                cursor: "pointer",
                                fontSize: "14px",
                            }}
                            title="Add reaction"
                        >
                            😀
                        </button>
                    )}
                    {canEdit && (
                        <button
                            onClick={() => setIsEditing(true)}
                            style={{
                                padding: "4px 6px",
                                border: "none",
                                background: "transparent",
                                cursor: "pointer",
                                fontSize: "12px",
                            }}
                            title="Edit"
                        >
                            ✏️
                        </button>
                    )}
                    {canDelete && (
                        <button
                            onClick={() => {
                                if (window.confirm("Delete this message?")) {
                                    onDelete?.();
                                }
                            }}
                            style={{
                                padding: "4px 6px",
                                border: "none",
                                background: "transparent",
                                cursor: "pointer",
                                fontSize: "12px",
                            }}
                            title="Delete"
                        >
                            🗑️
                        </button>
                    )}
                </div>
            )}

            {/* Reaction picker */}
            {showReactionPicker && onToggleReaction && (
                <div
                    style={{
                        position: "absolute",
                        top: "40px",
                        right: "8px",
                        zIndex: 10,
                    }}
                >
                    <ReactionPicker
                        onSelect={(emoji) => {
                            onToggleReaction(emoji);
                            setShowReactionPicker(false);
                        }}
                        onClose={() => setShowReactionPicker(false)}
                    />
                </div>
            )}
        </div>
    );
}
