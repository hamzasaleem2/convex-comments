import { v } from "convex/values";
import { mutation, query } from "./_generated/server.js";

// ============================================================================
// Thread Validators
// ============================================================================

const positionValidator = v.object({
    x: v.number(),
    y: v.number(),
    anchor: v.optional(v.string()),
});

const threadValidator = v.object({
    _id: v.id("threads"),
    _creationTime: v.number(),
    zoneId: v.id("zones"),
    resolved: v.boolean(),
    resolvedBy: v.optional(v.string()),
    resolvedAt: v.optional(v.number()),
    createdAt: v.number(),
    lastActivityAt: v.number(),
    position: v.optional(positionValidator),
    metadata: v.optional(v.any()),
});

const messagePreviewValidator = v.object({
    _id: v.id("messages"),
    body: v.string(),
    authorId: v.string(),
    createdAt: v.number(),
});

const threadWithPreviewValidator = v.object({
    thread: threadValidator,
    firstMessage: v.union(v.null(), messagePreviewValidator),
    messageCount: v.number(),
});

// ============================================================================
// Thread Functions
// ============================================================================

/**
 * Create a new thread in a zone.
 */
export const addThread = mutation({
    args: {
        zoneId: v.id("zones"),
        position: v.optional(positionValidator),
        metadata: v.optional(v.any()),
    },
    returns: v.id("threads"),
    handler: async (ctx, args) => {
        // Verify zone exists
        const zone = await ctx.db.get(args.zoneId);
        if (!zone) {
            throw new Error(`Zone ${args.zoneId} not found`);
        }

        const now = Date.now();
        const threadId = await ctx.db.insert("threads", {
            zoneId: args.zoneId,
            resolved: false,
            createdAt: now,
            lastActivityAt: now,
            position: args.position,
            metadata: args.metadata,
        });

        return threadId;
    },
});

/**
 * Get a thread by ID.
 */
export const getThread = query({
    args: {
        threadId: v.id("threads"),
    },
    returns: v.union(v.null(), threadValidator),
    handler: async (ctx, args) => {
        return await ctx.db.get(args.threadId);
    },
});

/**
 * Get all threads in a zone with optional pagination and filtering.
 */
export const getThreads = query({
    args: {
        zoneId: v.id("zones"),
        limit: v.optional(v.number()),
        includeResolved: v.optional(v.boolean()),
        cursor: v.optional(v.string()),
    },
    returns: v.object({
        threads: v.array(threadWithPreviewValidator),
        nextCursor: v.optional(v.string()),
        hasMore: v.boolean(),
    }),
    handler: async (ctx, args) => {
        const limit = args.limit ?? 50;
        const includeResolved = args.includeResolved ?? true;

        // Build query
        let query = ctx.db
            .query("threads")
            .withIndex("zoneId_lastActivity", (q) => q.eq("zoneId", args.zoneId))
            .order("desc");

        // Apply cursor if provided
        if (args.cursor) {
            // Cursor is the lastActivityAt timestamp
            const cursorTime = parseInt(args.cursor, 10);
            query = ctx.db
                .query("threads")
                .withIndex("zoneId_lastActivity", (q) =>
                    q.eq("zoneId", args.zoneId).lt("lastActivityAt", cursorTime)
                )
                .order("desc");
        }

        // Fetch one extra to check if there are more
        const threads = await query.take(limit + 1);

        // Filter by resolved status if needed
        const filteredThreads = includeResolved
            ? threads
            : threads.filter((t) => !t.resolved);

        const hasMore = filteredThreads.length > limit;
        const resultThreads = filteredThreads.slice(0, limit);

        // Get first message preview and count for each thread
        const threadsWithPreviews = await Promise.all(
            resultThreads.map(async (thread) => {
                const messages = await ctx.db
                    .query("messages")
                    .withIndex("threadId_createdAt", (q) => q.eq("threadId", thread._id))
                    .order("asc")
                    .take(1);

                const firstMessage = messages[0] ?? null;

                // Get message count
                const allMessages = await ctx.db
                    .query("messages")
                    .withIndex("threadId", (q) => q.eq("threadId", thread._id))
                    .collect();

                const messageCount = allMessages.filter((m) => !m.isDeleted).length;

                return {
                    thread,
                    firstMessage: firstMessage
                        ? {
                            _id: firstMessage._id,
                            body: firstMessage.body,
                            authorId: firstMessage.authorId,
                            createdAt: firstMessage.createdAt,
                        }
                        : null,
                    messageCount,
                };
            })
        );

        // Generate next cursor
        const lastThread = resultThreads[resultThreads.length - 1];
        const nextCursor = hasMore && lastThread
            ? lastThread.lastActivityAt.toString()
            : undefined;

        return {
            threads: threadsWithPreviews,
            nextCursor,
            hasMore,
        };
    },
});

/**
 * Resolve a thread.
 */
export const resolveThread = mutation({
    args: {
        threadId: v.id("threads"),
        userId: v.string(),
    },
    returns: v.null(),
    handler: async (ctx, args) => {
        const thread = await ctx.db.get(args.threadId);
        if (!thread) {
            throw new Error(`Thread ${args.threadId} not found`);
        }

        await ctx.db.patch(args.threadId, {
            resolved: true,
            resolvedBy: args.userId,
            resolvedAt: Date.now(),
        });

        return null;
    },
});

/**
 * Unresolve a thread.
 */
export const unresolveThread = mutation({
    args: {
        threadId: v.id("threads"),
    },
    returns: v.null(),
    handler: async (ctx, args) => {
        const thread = await ctx.db.get(args.threadId);
        if (!thread) {
            throw new Error(`Thread ${args.threadId} not found`);
        }

        await ctx.db.patch(args.threadId, {
            resolved: false,
            resolvedBy: undefined,
            resolvedAt: undefined,
        });

        return null;
    },
});

/**
 * Update thread position (for positioned comments).
 */
export const updateThreadPosition = mutation({
    args: {
        threadId: v.id("threads"),
        position: v.optional(positionValidator),
    },
    returns: v.null(),
    handler: async (ctx, args) => {
        await ctx.db.patch(args.threadId, {
            position: args.position,
        });
        return null;
    },
});

/**
 * Delete a thread and all its messages.
 */
export const deleteThread = mutation({
    args: {
        threadId: v.id("threads"),
    },
    returns: v.object({
        deletedMessages: v.number(),
        deletedReactions: v.number(),
    }),
    handler: async (ctx, args) => {
        let deletedMessages = 0;
        let deletedReactions = 0;

        // Get all messages in this thread
        const messages = await ctx.db
            .query("messages")
            .withIndex("threadId", (q) => q.eq("threadId", args.threadId))
            .collect();

        for (const message of messages) {
            // Delete reactions on this message
            const reactions = await ctx.db
                .query("reactions")
                .withIndex("messageId", (q) => q.eq("messageId", message._id))
                .collect();

            for (const reaction of reactions) {
                await ctx.db.delete(reaction._id);
                deletedReactions++;
            }

            // Delete the message
            await ctx.db.delete(message._id);
            deletedMessages++;
        }

        // Delete typing indicators
        const typingIndicators = await ctx.db
            .query("typingIndicators")
            .withIndex("threadId", (q) => q.eq("threadId", args.threadId))
            .collect();

        for (const indicator of typingIndicators) {
            await ctx.db.delete(indicator._id);
        }

        // Delete the thread
        await ctx.db.delete(args.threadId);

        return { deletedMessages, deletedReactions };
    },
});

/**
 * Internal function to update thread's lastActivityAt.
 */
export const updateThreadActivity = mutation({
    args: {
        threadId: v.id("threads"),
    },
    returns: v.null(),
    handler: async (ctx, args) => {
        await ctx.db.patch(args.threadId, {
            lastActivityAt: Date.now(),
        });
        return null;
    },
});
