import { v } from "convex/values";
import { mutation, query } from "./_generated/server.js";
import { attachmentValidator, mentionValidator, linkValidator } from "./schema.js";

// ============================================================================
// Message Validators
// ============================================================================

const messageValidator = v.object({
    _id: v.id("messages"),
    _creationTime: v.number(),
    threadId: v.id("threads"),
    authorId: v.string(),
    body: v.string(),
    mentions: v.array(mentionValidator),
    links: v.array(linkValidator),
    attachments: v.array(attachmentValidator),
    isEdited: v.boolean(),
    isDeleted: v.boolean(),
    resolved: v.optional(v.boolean()),
    resolvedBy: v.optional(v.string()),
    resolvedAt: v.optional(v.number()),
    createdAt: v.number(),
    editedAt: v.optional(v.number()),
});

const reactionSummaryValidator = v.object({
    emoji: v.string(),
    count: v.number(),
    users: v.array(v.string()),
    includesMe: v.boolean(),
});

const messageWithReactionsValidator = v.object({
    message: messageValidator,
    reactions: v.array(reactionSummaryValidator),
});

// ============================================================================
// Mention & Link Parsing
// ============================================================================

/**
 * Parse mentions from message body.
 * Supports @userId format where userId can contain alphanumeric, underscore, hyphen.
 */
function parseMentions(body: string): Array<{ userId: string; start: number; end: number }> {
    const mentions: Array<{ userId: string; start: number; end: number }> = [];
    // Match @mentions - supports various ID formats
    const mentionRegex = /@([a-zA-Z0-9_\-:]+)/g;
    let match;

    while ((match = mentionRegex.exec(body)) !== null) {
        mentions.push({
            userId: match[1],
            start: match.index,
            end: match.index + match[0].length,
        });
    }

    return mentions;
}

/**
 * Parse links from message body.
 */
function parseLinks(body: string): Array<{ url: string; start: number; end: number }> {
    const links: Array<{ url: string; start: number; end: number }> = [];
    // Simple URL regex - matches http(s) URLs
    const urlRegex = /(https?:\/\/[^\s<]+[^<.,:;"')\]\s])/g;
    let match;

    while ((match = urlRegex.exec(body)) !== null) {
        links.push({
            url: match[1],
            start: match.index,
            end: match.index + match[0].length,
        });
    }

    return links;
}

// ============================================================================
// Message Functions
// ============================================================================

/**
 * Add a new comment/message to a thread.
 * Parses mentions and links from the body.
 */
export const addComment = mutation({
    args: {
        threadId: v.id("threads"),
        authorId: v.string(),
        body: v.string(),
        attachments: v.optional(v.array(attachmentValidator)),
    },
    returns: v.object({
        messageId: v.id("messages"),
        mentions: v.array(mentionValidator),
        links: v.array(linkValidator),
    }),
    handler: async (ctx, args) => {
        // Verify thread exists
        const thread = await ctx.db.get(args.threadId);
        if (!thread) {
            throw new Error(`Thread ${args.threadId} not found`);
        }

        // Parse mentions and links
        const mentions = parseMentions(args.body);
        const links = parseLinks(args.body);

        const now = Date.now();

        // Insert message
        const messageId = await ctx.db.insert("messages", {
            threadId: args.threadId,
            authorId: args.authorId,
            body: args.body,
            mentions,
            links,
            attachments: args.attachments ?? [],
            isEdited: false,
            isDeleted: false,
            createdAt: now,
        });

        // Update thread's last activity
        await ctx.db.patch(args.threadId, {
            lastActivityAt: now,
        });

        // Clear typing indicator for this user
        const typingIndicator = await ctx.db
            .query("typingIndicators")
            .withIndex("threadId_userId", (q) =>
                q.eq("threadId", args.threadId).eq("userId", args.authorId)
            )
            .first();

        if (typingIndicator) {
            await ctx.db.delete(typingIndicator._id);
        }

        return { messageId, mentions, links };
    },
});

/**
 * Get a single message by ID.
 */
export const getMessage = query({
    args: {
        messageId: v.id("messages"),
        currentUserId: v.optional(v.string()),
    },
    returns: v.union(v.null(), messageWithReactionsValidator),
    handler: async (ctx, args) => {
        const message = await ctx.db.get(args.messageId);
        if (!message) {
            return null;
        }

        // Get reactions grouped by emoji
        const reactions = await ctx.db
            .query("reactions")
            .withIndex("messageId", (q) => q.eq("messageId", args.messageId))
            .collect();

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

        const reactionSummaries = Array.from(reactionMap.entries()).map(
            ([emoji, data]) => ({
                emoji,
                count: data.count,
                users: data.users,
                includesMe: args.currentUserId
                    ? data.users.includes(args.currentUserId)
                    : false,
            })
        );

        return {
            message,
            reactions: reactionSummaries,
        };
    },
});

/**
 * Get messages in a thread with pagination.
 * Uses cursor-based pagination for efficiency.
 */
export const getMessages = query({
    args: {
        threadId: v.id("threads"),
        limit: v.optional(v.number()),
        cursor: v.optional(v.string()),
        order: v.optional(v.union(v.literal("asc"), v.literal("desc"))),
        currentUserId: v.optional(v.string()),
        includeDeleted: v.optional(v.boolean()),
    },
    returns: v.object({
        messages: v.array(messageWithReactionsValidator),
        nextCursor: v.optional(v.string()),
        hasMore: v.boolean(),
    }),
    handler: async (ctx, args) => {
        const limit = args.limit ?? 50;
        const order = args.order ?? "asc";
        const includeDeleted = args.includeDeleted ?? false;

        // Build query
        let query;
        if (args.cursor) {
            const cursorTime = parseInt(args.cursor, 10);
            if (order === "asc") {
                query = ctx.db
                    .query("messages")
                    .withIndex("threadId_createdAt", (q) =>
                        q.eq("threadId", args.threadId).gt("createdAt", cursorTime)
                    )
                    .order("asc");
            } else {
                query = ctx.db
                    .query("messages")
                    .withIndex("threadId_createdAt", (q) =>
                        q.eq("threadId", args.threadId).lt("createdAt", cursorTime)
                    )
                    .order("desc");
            }
        } else {
            query = ctx.db
                .query("messages")
                .withIndex("threadId_createdAt", (q) => q.eq("threadId", args.threadId))
                .order(order);
        }

        // Fetch one extra to check if there are more
        const messages = await query.take(limit + 1);

        // Filter deleted if needed
        const filteredMessages = includeDeleted
            ? messages
            : messages.filter((m) => !m.isDeleted);

        const hasMore = filteredMessages.length > limit;
        const resultMessages = filteredMessages.slice(0, limit);

        // Get reactions for each message
        const messagesWithReactions = await Promise.all(
            resultMessages.map(async (message) => {
                const reactions = await ctx.db
                    .query("reactions")
                    .withIndex("messageId", (q) => q.eq("messageId", message._id))
                    .collect();

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

                const reactionSummaries = Array.from(reactionMap.entries()).map(
                    ([emoji, data]) => ({
                        emoji,
                        count: data.count,
                        users: data.users,
                        includesMe: args.currentUserId
                            ? data.users.includes(args.currentUserId)
                            : false,
                    })
                );

                return {
                    message,
                    reactions: reactionSummaries,
                };
            })
        );

        // Generate next cursor
        const lastMessage = resultMessages[resultMessages.length - 1];
        const nextCursor = hasMore && lastMessage
            ? lastMessage.createdAt.toString()
            : undefined;

        return {
            messages: messagesWithReactions,
            nextCursor,
            hasMore,
        };
    },
});

/**
 * Edit a message.
 */
export const editMessage = mutation({
    args: {
        messageId: v.id("messages"),
        body: v.string(),
        /** Optional: User ID to verify ownership */
        authorId: v.optional(v.string()),
    },
    returns: v.object({
        mentions: v.array(mentionValidator),
        links: v.array(linkValidator),
    }),
    handler: async (ctx, args) => {
        const message = await ctx.db.get(args.messageId);
        if (!message) {
            throw new Error(`Message ${args.messageId} not found`);
        }

        if (message.isDeleted) {
            throw new Error("Cannot edit a deleted message");
        }

        // Optionally verify ownership
        if (args.authorId && message.authorId !== args.authorId) {
            throw new Error("You can only edit your own messages");
        }

        // Re-parse mentions and links
        const mentions = parseMentions(args.body);
        const links = parseLinks(args.body);

        await ctx.db.patch(args.messageId, {
            body: args.body,
            mentions,
            links,
            isEdited: true,
            editedAt: Date.now(),
        });

        // Update thread activity
        const thread = await ctx.db.get(message.threadId);
        if (thread) {
            await ctx.db.patch(message.threadId, {
                lastActivityAt: Date.now(),
            });
        }

        return { mentions, links };
    },
});

/**
 * Soft delete a message.
 */
export const deleteMessage = mutation({
    args: {
        messageId: v.id("messages"),
        /** Optional: User ID to verify ownership */
        authorId: v.optional(v.string()),
    },
    returns: v.null(),
    handler: async (ctx, args) => {
        const message = await ctx.db.get(args.messageId);
        if (!message) {
            throw new Error(`Message ${args.messageId} not found`);
        }

        // Optionally verify ownership
        if (args.authorId && message.authorId !== args.authorId) {
            throw new Error("You can only delete your own messages");
        }

        await ctx.db.patch(args.messageId, {
            isDeleted: true,
            body: "[deleted]",
            mentions: [],
            links: [],
            attachments: [],
        });

        return null;
    },
});

/**
 * Hard delete a message (permanently remove).
 */
export const permanentlyDeleteMessage = mutation({
    args: {
        messageId: v.id("messages"),
    },
    returns: v.null(),
    handler: async (ctx, args) => {
        // Delete all reactions on this message
        const reactions = await ctx.db
            .query("reactions")
            .withIndex("messageId", (q) => q.eq("messageId", args.messageId))
            .collect();

        for (const reaction of reactions) {
            await ctx.db.delete(reaction._id);
        }

        // Delete the message
        await ctx.db.delete(args.messageId);

        return null;
    },
});

/**
 * Resolve a message (mark as addressed/completed).
 */
export const resolveMessage = mutation({
    args: {
        messageId: v.id("messages"),
        userId: v.string(),
    },
    returns: v.null(),
    handler: async (ctx, args) => {
        const message = await ctx.db.get(args.messageId);
        if (!message) {
            throw new Error(`Message ${args.messageId} not found`);
        }

        if (message.isDeleted) {
            throw new Error("Cannot resolve a deleted message");
        }

        await ctx.db.patch(args.messageId, {
            resolved: true,
            resolvedBy: args.userId,
            resolvedAt: Date.now(),
        });

        return null;
    },
});

/**
 * Unresolve a message (mark as not addressed).
 */
export const unresolveMessage = mutation({
    args: {
        messageId: v.id("messages"),
    },
    returns: v.null(),
    handler: async (ctx, args) => {
        const message = await ctx.db.get(args.messageId);
        if (!message) {
            throw new Error(`Message ${args.messageId} not found`);
        }

        await ctx.db.patch(args.messageId, {
            resolved: undefined,
            resolvedBy: undefined,
            resolvedAt: undefined,
        });

        return null;
    },
});

