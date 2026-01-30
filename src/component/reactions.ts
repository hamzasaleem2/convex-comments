import { v } from "convex/values";
import { mutation, query } from "./_generated/server.js";

// ============================================================================
// Reaction Functions
// ============================================================================

/**
 * Add a reaction to a message.
 * If the user already has the same reaction, this is a no-op.
 */
export const addReaction = mutation({
    args: {
        messageId: v.id("messages"),
        userId: v.string(),
        emoji: v.string(),
    },
    returns: v.union(v.id("reactions"), v.null()),
    handler: async (ctx, args) => {
        // Verify message exists
        const message = await ctx.db.get(args.messageId);
        if (!message) {
            throw new Error(`Message ${args.messageId} not found`);
        }

        if (message.isDeleted) {
            throw new Error("Cannot react to a deleted message");
        }

        // Check if reaction already exists
        const existing = await ctx.db
            .query("reactions")
            .withIndex("messageId_emoji_userId", (q) =>
                q
                    .eq("messageId", args.messageId)
                    .eq("emoji", args.emoji)
                    .eq("userId", args.userId)
            )
            .first();

        if (existing) {
            // Already reacted with this emoji
            return null;
        }

        // Add reaction
        const reactionId = await ctx.db.insert("reactions", {
            messageId: args.messageId,
            userId: args.userId,
            emoji: args.emoji,
            createdAt: Date.now(),
        });

        // Update thread activity
        const thread = await ctx.db.get(message.threadId);
        if (thread) {
            await ctx.db.patch(message.threadId, {
                lastActivityAt: Date.now(),
            });
        }

        return reactionId;
    },
});

/**
 * Remove a reaction from a message.
 */
export const removeReaction = mutation({
    args: {
        messageId: v.id("messages"),
        userId: v.string(),
        emoji: v.string(),
    },
    returns: v.boolean(),
    handler: async (ctx, args) => {
        // Find the reaction
        const reaction = await ctx.db
            .query("reactions")
            .withIndex("messageId_emoji_userId", (q) =>
                q
                    .eq("messageId", args.messageId)
                    .eq("emoji", args.emoji)
                    .eq("userId", args.userId)
            )
            .first();

        if (!reaction) {
            return false;
        }

        await ctx.db.delete(reaction._id);
        return true;
    },
});

/**
 * Toggle a reaction (add if not present, remove if present).
 */
export const toggleReaction = mutation({
    args: {
        messageId: v.id("messages"),
        userId: v.string(),
        emoji: v.string(),
    },
    returns: v.object({
        added: v.boolean(),
        reactionId: v.optional(v.id("reactions")),
    }),
    handler: async (ctx, args) => {
        // Verify message exists
        const message = await ctx.db.get(args.messageId);
        if (!message) {
            throw new Error(`Message ${args.messageId} not found`);
        }

        if (message.isDeleted) {
            throw new Error("Cannot react to a deleted message");
        }

        // Check if reaction already exists
        const existing = await ctx.db
            .query("reactions")
            .withIndex("messageId_emoji_userId", (q) =>
                q
                    .eq("messageId", args.messageId)
                    .eq("emoji", args.emoji)
                    .eq("userId", args.userId)
            )
            .first();

        if (existing) {
            // Remove existing reaction
            await ctx.db.delete(existing._id);
            return { added: false, reactionId: undefined };
        }

        // Add new reaction
        const reactionId = await ctx.db.insert("reactions", {
            messageId: args.messageId,
            userId: args.userId,
            emoji: args.emoji,
            createdAt: Date.now(),
        });

        // Update thread activity
        const thread = await ctx.db.get(message.threadId);
        if (thread) {
            await ctx.db.patch(message.threadId, {
                lastActivityAt: Date.now(),
            });
        }

        return { added: true, reactionId };
    },
});

/**
 * Get all reactions for a message.
 */
export const getReactions = query({
    args: {
        messageId: v.id("messages"),
        currentUserId: v.optional(v.string()),
    },
    returns: v.array(
        v.object({
            emoji: v.string(),
            count: v.number(),
            users: v.array(v.string()),
            includesMe: v.boolean(),
        })
    ),
    handler: async (ctx, args) => {
        const reactions = await ctx.db
            .query("reactions")
            .withIndex("messageId", (q) => q.eq("messageId", args.messageId))
            .collect();

        // Group by emoji
        const reactionMap = new Map<string, { count: number; users: string[] }>();
        for (const reaction of reactions) {
            const existing = reactionMap.get(reaction.emoji);
            if (existing) {
                existing.count++;
                existing.users.push(reaction.userId);
            } else {
                reactionMap.set(reaction.emoji, { count: 1, users: [reaction.userId] });
            }
        }

        return Array.from(reactionMap.entries()).map(([emoji, data]) => ({
            emoji,
            count: data.count,
            users: data.users,
            includesMe: args.currentUserId
                ? data.users.includes(args.currentUserId)
                : false,
        }));
    },
});

/**
 * Get users who reacted with a specific emoji.
 */
export const getReactionUsers = query({
    args: {
        messageId: v.id("messages"),
        emoji: v.string(),
    },
    returns: v.array(v.string()),
    handler: async (ctx, args) => {
        const reactions = await ctx.db
            .query("reactions")
            .withIndex("messageId_emoji", (q) =>
                q.eq("messageId", args.messageId).eq("emoji", args.emoji)
            )
            .collect();

        return reactions.map((r) => r.userId);
    },
});
