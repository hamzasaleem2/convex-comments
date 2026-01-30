/**
 * ReactionPicker Component
 *
 * A popup picker for selecting emoji reactions.
 */

import { useComments } from "./CommentsProvider";

// ============================================================================
// Types
// ============================================================================

export interface ReactionPickerProps {
    /** Callback when an emoji is selected */
    onSelect: (emoji: string) => void;
    /** Callback when the picker is closed */
    onClose?: () => void;
    /** Custom reaction choices (overrides provider) */
    reactionChoices?: string[];
    /** CSS class name */
    className?: string;
}

// ============================================================================
// Component
// ============================================================================

/**
 * Emoji reaction picker popup.
 *
 * Usage:
 * ```tsx
 * <ReactionPicker
 *   onSelect={(emoji) => toggleReaction({ messageId, emoji })}
 *   onClose={() => setShowPicker(false)}
 * />
 * ```
 */
export function ReactionPicker({
    onSelect,
    onClose,
    reactionChoices: customChoices,
    className = "",
}: ReactionPickerProps) {
    const { reactionChoices: providerChoices, styles } = useComments();
    const choices = customChoices ?? providerChoices;

    return (
        <div
            className={`reaction-picker ${className}`}
            style={{
                display: "flex",
                flexWrap: "wrap",
                gap: "4px",
                padding: "8px",
                backgroundColor: "white",
                borderRadius: styles?.borderRadius ?? "8px",
                boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
                border: "1px solid #e5e7eb",
                maxWidth: "200px",
            }}
        >
            {choices.map((emoji) => (
                <button
                    key={emoji}
                    onClick={() => {
                        onSelect(emoji);
                        onClose?.();
                    }}
                    style={{
                        width: "32px",
                        height: "32px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        border: "none",
                        background: "transparent",
                        borderRadius: "4px",
                        cursor: "pointer",
                        fontSize: "18px",
                        transition: "background-color 0.15s",
                    }}
                    onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = "#f3f4f6";
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = "transparent";
                    }}
                >
                    {emoji}
                </button>
            ))}
        </div>
    );
}
