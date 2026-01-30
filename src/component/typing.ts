import { v } from "convex/values";
import { mutation, query, internalMutation } from "./_generated/server.js";
import { internal } from "./_generated/api.js";

// ============================================================================
// Typing Indicator Configuration
// ============================================================================

/** How long (in ms) before a typing indicator expires */
const TYPING_EXPIRY_MS = 5000; // 5 seconds

// ============================================================================
// Typing Indicator Validators
// ============================================================================

const typingUserValidator = v.object({
    userId: v.string(),
    updatedAt: v.number(),
});

// ============================================================================
// Typing Indicator Functions
// ============================================================================

/**
 * Set typing indicator for a user in a thread.
 * Automatically schedules expiry cleanup.
 */
export const setIsTyping = mutation({
    args: {
        threadId: v.id("threads"),
        userId: v.string(),
        isTyping: v.boolean(),
    },
    returns: v.null(),
    handler: async (ctx, args) => {
        // Verify thread exists
        const thread = await ctx.db.get(args.threadId);
        if (!thread) {
            throw new Error(`Thread ${args.threadId} not found`);
        }

        const now = Date.now();
        const expiresAt = now + TYPING_EXPIRY_MS;

        // Find existing indicator
        const existing = await ctx.db
            .query("typingIndicators")
            .withIndex("threadId_userId", (q) =>
                q.eq("threadId", args.threadId).eq("userId", args.userId)
            )
            .first();

        if (args.isTyping) {
            if (existing) {
                // Update existing indicator
                await ctx.db.patch(existing._id, {
                    updatedAt: now,
                    expiresAt,
                });
            } else {
                // Create new indicator
                await ctx.db.insert("typingIndicators", {
                    threadId: args.threadId,
                    userId: args.userId,
                    updatedAt: now,
                    expiresAt,
                });
            }

            // Schedule cleanup
            await ctx.scheduler.runAfter(
                TYPING_EXPIRY_MS + 1000, // Add a small buffer
                internal.typing.cleanupExpiredIndicators,
                {}
            );
        } else {
            // Remove indicator if exists
            if (existing) {
                await ctx.db.delete(existing._id);
            }
        }

        return null;
    },
});

/**
 * Get all users currently typing in a thread.
 */
export const getTypingUsers = query({
    args: {
        threadId: v.id("threads"),
        excludeUserId: v.optional(v.string()),
    },
    returns: v.array(typingUserValidator),
    handler: async (ctx, args) => {
        const now = Date.now();

        const indicators = await ctx.db
            .query("typingIndicators")
            .withIndex("threadId", (q) => q.eq("threadId", args.threadId))
            .collect();

        // Filter to only non-expired indicators and optionally exclude current user
        return indicators
            .filter((i) => {
                if (i.expiresAt < now) return false;
                if (args.excludeUserId && i.userId === args.excludeUserId) return false;
                return true;
            })
            .map((i) => ({
                userId: i.userId,
                updatedAt: i.updatedAt,
            }));
    },
});

/**
 * Internal function to cleanup expired typing indicators.
 */
export const cleanupExpiredIndicators = internalMutation({
    args: {},
    returns: v.number(),
    handler: async (ctx) => {
        const now = Date.now();
        let deleted = 0;

        // Get all expired indicators
        const expired = await ctx.db
            .query("typingIndicators")
            .withIndex("expiresAt", (q) => q.lt("expiresAt", now))
            .collect();

        for (const indicator of expired) {
            await ctx.db.delete(indicator._id);
            deleted++;
        }

        return deleted;
    },
});

/**
 * Clear all typing indicators for a user across all threads.
 * Useful when a user disconnects.
 */
export const clearUserTyping = mutation({
    args: {
        userId: v.string(),
    },
    returns: v.number(),
    handler: async (ctx, args) => {
        // We need to scan all indicators since we don't have a userId index
        // In production, you might want to add an index on userId
        const allIndicators = await ctx.db.query("typingIndicators").collect();
        let deleted = 0;

        for (const indicator of allIndicators) {
            if (indicator.userId === args.userId) {
                await ctx.db.delete(indicator._id);
                deleted++;
            }
        }

        return deleted;
    },
});
