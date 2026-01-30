import { v } from "convex/values";
import { mutation, query } from "./_generated/server.js";

// ============================================================================
// Zone Validators
// ============================================================================

const zoneValidator = v.object({
    _id: v.id("zones"),
    _creationTime: v.number(),
    entityId: v.string(),
    metadata: v.optional(v.any()),
    createdAt: v.number(),
});

// ============================================================================
// Zone Functions
// ============================================================================

/**
 * Get or create a zone for an entity.
 * This is the main entry point - lazily creates a zone if it doesn't exist.
 */
export const getOrCreateZone = mutation({
    args: {
        entityId: v.string(),
        metadata: v.optional(v.any()),
    },
    returns: v.id("zones"),
    handler: async (ctx, args) => {
        // Check if zone already exists
        const existing = await ctx.db
            .query("zones")
            .withIndex("entityId", (q) => q.eq("entityId", args.entityId))
            .first();

        if (existing) {
            return existing._id;
        }

        // Create new zone
        const zoneId = await ctx.db.insert("zones", {
            entityId: args.entityId,
            metadata: args.metadata,
            createdAt: Date.now(),
        });

        return zoneId;
    },
});

/**
 * List all zones with optional pagination.
 */
export const listZones = query({
    args: {
        limit: v.optional(v.number()),
    },
    returns: v.array(zoneValidator),
    handler: async (ctx, args) => {
        const limit = args.limit ?? 100;
        return await ctx.db.query("zones").take(limit);
    },
});

/**
 * Get a zone by entity ID (without creating).
 */
export const getZone = query({
    args: {
        entityId: v.string(),
    },
    returns: v.union(v.null(), zoneValidator),
    handler: async (ctx, args) => {
        return await ctx.db
            .query("zones")
            .withIndex("entityId", (q) => q.eq("entityId", args.entityId))
            .first();
    },
});

/**
 * Get a zone by its ID.
 */
export const getZoneById = query({
    args: {
        zoneId: v.id("zones"),
    },
    returns: v.union(v.null(), zoneValidator),
    handler: async (ctx, args) => {
        return await ctx.db.get(args.zoneId);
    },
});

/**
 * Update zone metadata.
 */
export const updateZoneMetadata = mutation({
    args: {
        zoneId: v.id("zones"),
        metadata: v.any(),
    },
    returns: v.null(),
    handler: async (ctx, args) => {
        await ctx.db.patch(args.zoneId, {
            metadata: args.metadata,
        });
        return null;
    },
});

/**
 * Delete a zone and all its threads/messages.
 * Use with caution - this is a destructive operation.
 */
export const deleteZone = mutation({
    args: {
        zoneId: v.id("zones"),
    },
    returns: v.object({
        deletedThreads: v.number(),
        deletedMessages: v.number(),
        deletedReactions: v.number(),
    }),
    handler: async (ctx, args) => {
        let deletedThreads = 0;
        let deletedMessages = 0;
        let deletedReactions = 0;

        // Get all threads in this zone
        const threads = await ctx.db
            .query("threads")
            .withIndex("zoneId", (q) => q.eq("zoneId", args.zoneId))
            .collect();

        for (const thread of threads) {
            // Get all messages in this thread
            const messages = await ctx.db
                .query("messages")
                .withIndex("threadId", (q) => q.eq("threadId", thread._id))
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

            // Delete typing indicators for this thread
            const typingIndicators = await ctx.db
                .query("typingIndicators")
                .withIndex("threadId", (q) => q.eq("threadId", thread._id))
                .collect();

            for (const indicator of typingIndicators) {
                await ctx.db.delete(indicator._id);
            }

            // Delete the thread
            await ctx.db.delete(thread._id);
            deletedThreads++;
        }

        // Delete the zone
        await ctx.db.delete(args.zoneId);

        return { deletedThreads, deletedMessages, deletedReactions };
    },
});
