/**
 * Comments Context Provider
 *
 * Provides the Comments API instance to all child components.
 */

import { createContext, useContext, useMemo, type ReactNode, type CSSProperties } from "react";

// ============================================================================
// Types
// ============================================================================

export interface CommentsStyles {
    /** Primary accent color (buttons, links, highlights) */
    accentColor?: string;
    /** Background color for the comments container */
    backgroundColor?: string;
    /** Text color */
    textColor?: string;
    /** Secondary/muted text color */
    textColorMuted?: string;
    /** Border color */
    borderColor?: string;
    /** Border radius for cards and buttons */
    borderRadius?: string;
    /** Font family */
    fontFamily?: string;
    /** Base font size */
    fontSize?: string;
}

export interface CommentsContextValue {
    /** Current user ID */
    userId: string | null;
    /** Function to resolve user display info */
    resolveUser?: (userId: string) => Promise<{ name: string; avatar?: string }> | { name: string; avatar?: string };
    /** Available reaction emojis */
    reactionChoices: string[];
    /** Whether the current user can edit/delete messages */
    canModerate?: boolean;
    /** Custom styles */
    styles?: CommentsStyles;
    /** CSS variables for theming */
    cssVars: Record<string, string>;
}

// ============================================================================
// Default Theme
// ============================================================================

const defaultStyles: Required<CommentsStyles> = {
    accentColor: "#3b82f6",
    backgroundColor: "#ffffff",
    textColor: "#1f2937",
    textColorMuted: "#6b7280",
    borderColor: "#e5e7eb",
    borderRadius: "8px",
    fontFamily: "system-ui, -apple-system, sans-serif",
    fontSize: "14px",
};

// ============================================================================
// Context
// ============================================================================

const CommentsContext = createContext<CommentsContextValue | null>(null);

// ============================================================================
// Provider
// ============================================================================

export interface CommentsProviderProps {
    /** Current user ID (null if not authenticated) */
    userId: string | null;
    /** Function to resolve user info for display */
    resolveUser?: (userId: string) => Promise<{ name: string; avatar?: string }> | { name: string; avatar?: string };
    /** Available reaction emojis (defaults to common emojis) */
    reactionChoices?: string[];
    /** Whether the current user has moderator privileges */
    canModerate?: boolean;
    /** 
     * Custom styling options. Can also use CSS variables:
     * --comments-accent-color, --comments-bg-color, etc.
     */
    styles?: CommentsStyles;
    /** Optional class name for the wrapper */
    className?: string;
    /** Child components */
    children: ReactNode;
}

/**
 * Provider component that supplies comments configuration to all child components.
 *
 * Usage:
 * ```tsx
 * <CommentsProvider
 *   userId={currentUserId}
 *   resolveUser={async (id) => ({ name: users[id].name, avatar: users[id].avatar })}
 *   reactionChoices={["👍", "❤️", "😄", "🎉", "😮", "😢"]}
 *   styles={{
 *     accentColor: "#8b5cf6",
 *     borderRadius: "12px",
 *   }}
 * >
 *   <Comments threads={threads} />
 * </CommentsProvider>
 * ```
 * 
 * CSS Variables (can be set in your CSS):
 * - --comments-accent-color
 * - --comments-bg-color
 * - --comments-text-color
 * - --comments-text-color-muted
 * - --comments-border-color
 * - --comments-border-radius
 * - --comments-font-family
 * - --comments-font-size
 */
export function CommentsProvider({
    userId,
    resolveUser,
    reactionChoices = ["👍", "❤️", "😄", "🎉", "😮", "😢", "👀", "🚀"],
    canModerate = false,
    styles,
    className,
    children,
}: CommentsProviderProps) {
    const mergedStyles = useMemo<Required<CommentsStyles>>(
        () => ({
            ...defaultStyles,
            ...styles,
        }),
        [styles]
    );

    const cssVars = useMemo<Record<string, string>>(
        () => ({
            "--comments-accent-color": mergedStyles.accentColor,
            "--comments-bg-color": mergedStyles.backgroundColor,
            "--comments-text-color": mergedStyles.textColor,
            "--comments-text-color-muted": mergedStyles.textColorMuted,
            "--comments-border-color": mergedStyles.borderColor,
            "--comments-border-radius": mergedStyles.borderRadius,
            "--comments-font-family": mergedStyles.fontFamily,
            "--comments-font-size": mergedStyles.fontSize,
        }),
        [mergedStyles]
    );

    const value = useMemo<CommentsContextValue>(
        () => ({
            userId,
            resolveUser,
            reactionChoices,
            canModerate,
            styles: mergedStyles,
            cssVars,
        }),
        [userId, resolveUser, reactionChoices, canModerate, mergedStyles, cssVars]
    );

    const wrapperStyle: CSSProperties = {
        ...cssVars as CSSProperties,
        fontFamily: mergedStyles.fontFamily,
        fontSize: mergedStyles.fontSize,
        color: mergedStyles.textColor,
    };

    return (
        <CommentsContext.Provider value={value}>
            <div
                className={`comments-provider ${className ?? ""}`}
                style={wrapperStyle}
                data-comments-provider=""
            >
                {children}
            </div>
        </CommentsContext.Provider>
    );
}

// ============================================================================
// Hook
// ============================================================================

/**
 * Hook to access the comments context.
 * Must be used within a CommentsProvider.
 */
export function useComments(): CommentsContextValue {
    const context = useContext(CommentsContext);
    if (!context) {
        throw new Error("useComments must be used within a CommentsProvider");
    }
    return context;
}
