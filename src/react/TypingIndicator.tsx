/**
 * TypingIndicator Component
 *
 * Shows who is currently typing in a thread.
 */

import { useState, useEffect } from "react";
import { useComments } from "./CommentsProvider";

// ============================================================================
// Types
// ============================================================================

export interface TypingIndicatorProps {
    /** User IDs currently typing */
    users: string[];
    /** Max number of names to show before "and X others" */
    maxNamesToShow?: number;
    /** CSS class name */
    className?: string;
}

// ============================================================================
// Component
// ============================================================================

/**
 * Animated typing indicator showing who is typing.
 *
 * Usage:
 * ```tsx
 * const typingUsers = useQuery(api.comments.getTypingUsers, { threadId });
 *
 * <TypingIndicator users={typingUsers.map(u => u.userId)} />
 * ```
 */
export function TypingIndicator({
    users,
    maxNamesToShow = 3,
    className = "",
}: TypingIndicatorProps) {
    const { resolveUser } = useComments();
    const [userNames, setUserNames] = useState<Record<string, string>>({});

    // Resolve user names
    useEffect(() => {
        if (resolveUser) {
            users.forEach(async (userId) => {
                if (!userNames[userId]) {
                    const info = await resolveUser(userId);
                    setUserNames((prev) => ({ ...prev, [userId]: info.name }));
                }
            });
        }
    }, [users, resolveUser, userNames]);

    if (users.length === 0) {
        return null;
    }

    // Format the typing message
    const names = users.map((id) => userNames[id] ?? id);
    let message: string;

    if (names.length === 1) {
        message = `${names[0]} is typing`;
    } else if (names.length <= maxNamesToShow) {
        const lastN = names[names.length - 1];
        const restNames = names.slice(0, -1).join(", ");
        message = `${restNames} and ${lastN} are typing`;
    } else {
        const shown = names.slice(0, maxNamesToShow).join(", ");
        const remaining = names.length - maxNamesToShow;
        message = `${shown} and ${remaining} others are typing`;
    }

    return (
        <div
            className={`typing-indicator ${className}`}
            style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                fontSize: "13px",
                color: "#6b7280",
                fontStyle: "italic",
            }}
        >
            {/* Animated dots */}
            <span
                style={{
                    display: "inline-flex",
                    gap: "2px",
                }}
            >
                <span
                    style={{
                        width: "4px",
                        height: "4px",
                        borderRadius: "50%",
                        backgroundColor: "#9ca3af",
                        animation: "typingDot 1.4s infinite ease-in-out",
                        animationDelay: "0s",
                    }}
                />
                <span
                    style={{
                        width: "4px",
                        height: "4px",
                        borderRadius: "50%",
                        backgroundColor: "#9ca3af",
                        animation: "typingDot 1.4s infinite ease-in-out",
                        animationDelay: "0.2s",
                    }}
                />
                <span
                    style={{
                        width: "4px",
                        height: "4px",
                        borderRadius: "50%",
                        backgroundColor: "#9ca3af",
                        animation: "typingDot 1.4s infinite ease-in-out",
                        animationDelay: "0.4s",
                    }}
                />
            </span>
            <span>{message}</span>

            {/* Inline styles for animation */}
            <style>{`
        @keyframes typingDot {
          0%, 80%, 100% {
            transform: scale(1);
            opacity: 0.5;
          }
          40% {
            transform: scale(1.2);
            opacity: 1;
          }
        }
      `}</style>
        </div>
    );
}
