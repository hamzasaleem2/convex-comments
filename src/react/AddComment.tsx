/**
 * AddComment Component
 *
 * Composer for adding new comments with mention autocomplete.
 */

import { useState, useRef, useCallback, useEffect } from "react";
import { useComments } from "./CommentsProvider";

// ============================================================================
// Types
// ============================================================================

export interface MentionableUser {
    /** User ID */
    id: string;
    /** Display name */
    name: string;
    /** Optional avatar URL */
    avatar?: string;
}

export interface AddCommentProps {
    /** Callback when a comment is submitted */
    onSubmit?: (
        body: string,
        attachments?: Array<{
            type: "url" | "file" | "image";
            url: string;
            name?: string;
        }>
    ) => void;
    /** Callback when typing state changes */
    onTypingChange?: (isTyping: boolean) => void;
    /** List of users that can be mentioned */
    mentionableUsers?: MentionableUser[];
    /** Whether editing features are enabled */
    allowEditing?: boolean;
    /** Placeholder text */
    placeholder?: string;
    /** Initial value */
    initialValue?: string;
    /** Whether the composer is disabled */
    disabled?: boolean;
    /** Auto-focus on mount */
    autoFocus?: boolean;
    /** Minimum height of the textarea */
    minHeight?: number;
    /** CSS class name */
    className?: string;
}

// ============================================================================
// Component
// ============================================================================

/**
 * Comment composer with mention autocomplete support.
 *
 * Usage:
 * ```tsx
 * <AddComment
 *   onSubmit={(body) => addComment({ threadId, body })}
 *   onTypingChange={(isTyping) => setIsTyping({ threadId, isTyping })}
 *   mentionableUsers={[
 *     { id: "user1", name: "Alice" },
 *     { id: "user2", name: "Bob" },
 *   ]}
 *   placeholder="Write a comment..."
 * />
 * ```
 */
export function AddComment({
    onSubmit,
    onTypingChange,
    mentionableUsers = [],
    placeholder = "Write a comment...",
    initialValue = "",
    disabled = false,
    autoFocus = false,
    minHeight = 60,
    className = "",
}: AddCommentProps) {
    const { userId, styles } = useComments();
    const [body, setBody] = useState(initialValue);
    const [isTyping, setIsTyping] = useState(false);
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    // Mention autocomplete state
    const [showMentionPicker, setShowMentionPicker] = useState(false);
    const [mentionQuery, setMentionQuery] = useState("");
    const [mentionStartPos, setMentionStartPos] = useState(0);
    const [selectedMentionIndex, setSelectedMentionIndex] = useState(0);
    const mentionPickerRef = useRef<HTMLDivElement>(null);

    // Filter mentionable users based on query
    const filteredUsers = mentionableUsers.filter((user) =>
        user.name.toLowerCase().includes(mentionQuery.toLowerCase()) ||
        user.id.toLowerCase().includes(mentionQuery.toLowerCase())
    );

    // Debounced typing indicator
    const updateTypingState = useCallback(
        (typing: boolean) => {
            if (typing !== isTyping) {
                setIsTyping(typing);
                onTypingChange?.(typing);
            }
        },
        [isTyping, onTypingChange]
    );

    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const value = e.target.value;
        const cursorPos = e.target.selectionStart;
        setBody(value);

        // Check for mention trigger
        if (mentionableUsers.length > 0) {
            // Find the last @ before cursor that's not already complete
            const textBeforeCursor = value.slice(0, cursorPos);
            const lastAtIndex = textBeforeCursor.lastIndexOf("@");

            if (lastAtIndex >= 0) {
                const textAfterAt = textBeforeCursor.slice(lastAtIndex + 1);
                // Check if there's no space after @ (still typing the mention)
                if (!textAfterAt.includes(" ") && !textAfterAt.includes("\n")) {
                    setShowMentionPicker(true);
                    setMentionQuery(textAfterAt);
                    setMentionStartPos(lastAtIndex);
                    setSelectedMentionIndex(0);
                } else {
                    setShowMentionPicker(false);
                }
            } else {
                setShowMentionPicker(false);
            }
        }

        // Start typing indicator
        if (value.length > 0) {
            updateTypingState(true);

            // Clear existing timeout
            if (typingTimeoutRef.current) {
                clearTimeout(typingTimeoutRef.current);
            }

            // Set new timeout to stop typing
            typingTimeoutRef.current = setTimeout(() => {
                updateTypingState(false);
            }, 2000);
        } else {
            updateTypingState(false);
        }
    };

    const insertMention = (user: MentionableUser) => {
        const beforeMention = body.slice(0, mentionStartPos);
        const afterMention = body.slice(
            mentionStartPos + 1 + mentionQuery.length
        );
        const newBody = `${beforeMention}@${user.id} ${afterMention}`;
        setBody(newBody);
        setShowMentionPicker(false);
        setMentionQuery("");

        // Focus textarea and set cursor position
        if (textareaRef.current) {
            const newCursorPos = mentionStartPos + user.id.length + 2; // +2 for @ and space
            textareaRef.current.focus();
            setTimeout(() => {
                textareaRef.current?.setSelectionRange(newCursorPos, newCursorPos);
            }, 0);
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!body.trim() || disabled) return;

        // Clear typing indicator
        updateTypingState(false);
        if (typingTimeoutRef.current) {
            clearTimeout(typingTimeoutRef.current);
        }

        onSubmit?.(body.trim());
        setBody("");
        setShowMentionPicker(false);

        // Reset textarea height
        if (textareaRef.current) {
            textareaRef.current.style.height = `${minHeight}px`;
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        // Handle mention picker navigation
        if (showMentionPicker && filteredUsers.length > 0) {
            if (e.key === "ArrowDown") {
                e.preventDefault();
                setSelectedMentionIndex((prev) =>
                    prev < filteredUsers.length - 1 ? prev + 1 : prev
                );
                return;
            }
            if (e.key === "ArrowUp") {
                e.preventDefault();
                setSelectedMentionIndex((prev) => (prev > 0 ? prev - 1 : prev));
                return;
            }
            if (e.key === "Enter" || e.key === "Tab") {
                e.preventDefault();
                insertMention(filteredUsers[selectedMentionIndex]);
                return;
            }
            if (e.key === "Escape") {
                e.preventDefault();
                setShowMentionPicker(false);
                return;
            }
        }

        // Submit on Enter (without Shift)
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSubmit(e);
        }
    };

    // Auto-resize textarea
    useEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.style.height = `${minHeight}px`;
            textareaRef.current.style.height = `${Math.max(
                minHeight,
                textareaRef.current.scrollHeight
            )}px`;
        }
    }, [body, minHeight]);

    // Cleanup typing timeout on unmount
    useEffect(() => {
        return () => {
            if (typingTimeoutRef.current) {
                clearTimeout(typingTimeoutRef.current);
            }
            if (isTyping) {
                onTypingChange?.(false);
            }
        };
    }, [isTyping, onTypingChange]);

    // Close mention picker on click outside
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (
                mentionPickerRef.current &&
                !mentionPickerRef.current.contains(e.target as Node) &&
                textareaRef.current &&
                !textareaRef.current.contains(e.target as Node)
            ) {
                setShowMentionPicker(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    if (!userId) {
        return (
            <div
                className={className}
                style={{
                    padding: "12px 16px",
                    textAlign: "center",
                    color: "#6b7280",
                    fontSize: "13px",
                }}
            >
                Sign in to comment
            </div>
        );
    }

    return (
        <form
            onSubmit={handleSubmit}
            className={`add-comment ${className}`}
            style={{
                padding: "12px",
            }}
        >
            <div style={{ position: "relative" }}>
                <textarea
                    ref={textareaRef}
                    value={body}
                    onChange={handleChange}
                    onKeyDown={handleKeyDown}
                    placeholder={placeholder}
                    disabled={disabled}
                    autoFocus={autoFocus}
                    style={{
                        width: "100%",
                        padding: "10px 12px",
                        paddingRight: "80px",
                        border: "1px solid #d1d5db",
                        borderRadius: styles?.borderRadius ?? "8px",
                        fontSize: "14px",
                        fontFamily: styles?.fontFamily ?? "inherit",
                        resize: "none",
                        minHeight: `${minHeight}px`,
                        outline: "none",
                        transition: "border-color 0.15s",
                    }}
                    onFocus={(e) => {
                        e.target.style.borderColor = styles?.accentColor ?? "#3b82f6";
                    }}
                    onBlur={(e) => {
                        e.target.style.borderColor = "#d1d5db";
                    }}
                />

                {/* Mention Autocomplete Dropdown */}
                {showMentionPicker && filteredUsers.length > 0 && (
                    <div
                        ref={mentionPickerRef}
                        style={{
                            position: "absolute",
                            bottom: "100%",
                            left: "0",
                            right: "0",
                            marginBottom: "4px",
                            maxHeight: "200px",
                            overflowY: "auto",
                            backgroundColor: "#fff",
                            border: "1px solid #d1d5db",
                            borderRadius: "8px",
                            boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)",
                            zIndex: 100,
                        }}
                    >
                        {filteredUsers.map((user, index) => (
                            <div
                                key={user.id}
                                onClick={() => insertMention(user)}
                                style={{
                                    padding: "8px 12px",
                                    cursor: "pointer",
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "8px",
                                    backgroundColor:
                                        index === selectedMentionIndex
                                            ? "#f3f4f6"
                                            : "transparent",
                                }}
                                onMouseEnter={() => setSelectedMentionIndex(index)}
                            >
                                {user.avatar ? (
                                    <img
                                        src={user.avatar}
                                        alt={user.name}
                                        style={{
                                            width: "24px",
                                            height: "24px",
                                            borderRadius: "50%",
                                            objectFit: "cover",
                                        }}
                                    />
                                ) : (
                                    <div
                                        style={{
                                            width: "24px",
                                            height: "24px",
                                            borderRadius: "50%",
                                            backgroundColor: "#e5e7eb",
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "center",
                                            fontSize: "12px",
                                            fontWeight: 500,
                                            color: "#6b7280",
                                        }}
                                    >
                                        {user.name.charAt(0).toUpperCase()}
                                    </div>
                                )}
                                <div>
                                    <div style={{ fontWeight: 500, fontSize: "13px" }}>
                                        {user.name}
                                    </div>
                                    <div style={{ fontSize: "11px", color: "#9ca3af" }}>
                                        @{user.id}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* No matches message */}
                {showMentionPicker && filteredUsers.length === 0 && mentionQuery.length > 0 && (
                    <div
                        style={{
                            position: "absolute",
                            bottom: "100%",
                            left: "0",
                            right: "0",
                            marginBottom: "4px",
                            padding: "12px",
                            backgroundColor: "#fff",
                            border: "1px solid #d1d5db",
                            borderRadius: "8px",
                            boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)",
                            color: "#9ca3af",
                            fontSize: "13px",
                            textAlign: "center",
                        }}
                    >
                        No users found matching "{mentionQuery}"
                    </div>
                )}

                <button
                    type="submit"
                    disabled={!body.trim() || disabled}
                    style={{
                        position: "absolute",
                        right: "8px",
                        bottom: "8px",
                        padding: "6px 14px",
                        fontSize: "13px",
                        fontWeight: 500,
                        border: "none",
                        borderRadius: "6px",
                        backgroundColor:
                            !body.trim() || disabled
                                ? "#e5e7eb"
                                : styles?.accentColor ?? "#3b82f6",
                        color: !body.trim() || disabled ? "#9ca3af" : "white",
                        cursor: !body.trim() || disabled ? "not-allowed" : "pointer",
                        transition: "background-color 0.15s",
                    }}
                >
                    Send
                </button>
            </div>
            <div
                style={{
                    marginTop: "6px",
                    fontSize: "11px",
                    color: "#9ca3af",
                }}
            >
                Press Enter to send, Shift+Enter for new line
                {mentionableUsers.length > 0 && " • Type @ to mention"}
            </div>
        </form>
    );
}
