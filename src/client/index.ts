/**
 * Comments Component - Client Library
 *
 * This module provides a class-based client for interacting with the
 * comments component, plus helper functions for re-exporting APIs.
 */

import {
  httpActionGeneric,
  mutationGeneric,
  queryGeneric,
} from "convex/server";
import type {
  Auth,

  GenericDataModel,
  GenericMutationCtx,
  GenericQueryCtx,
  HttpRouter,
} from "convex/server";
import { v } from "convex/values";
import type { ComponentApi } from "../component/_generated/component.js";

// ============================================================================
// Types
// ============================================================================

/** Minimal context types for flexibility */
type QueryCtx = Pick<GenericQueryCtx<GenericDataModel>, "runQuery">;
type MutationCtx = Pick<GenericMutationCtx<GenericDataModel>, "runQuery" | "runMutation">;


/** Authentication operation types */
type AuthOperation =
  | { type: "read"; zoneId?: string; threadId?: string }
  | { type: "create"; zoneId?: string; threadId?: string }
  | { type: "update"; messageId?: string; threadId?: string }
  | { type: "delete"; messageId?: string; threadId?: string }
  | { type: "react"; messageId?: string };

/** Authentication callback that returns the user ID or throws */
type AuthCallback = (
  ctx: { auth: Auth },
  operation: AuthOperation
) => Promise<string>;

/** Attachment metadata */
interface Attachment {
  type: "url" | "file" | "image";
  url: string;
  name?: string;
  mimeType?: string;
  size?: number;
}

/** Mention callbacks */
interface MentionCallbacks {
  /** Called when a new message is created */
  onNewMessage?: (params: {
    messageId: string;
    threadId: string;
    authorId: string;
    body: string;
    mentions: Array<{ userId: string; start: number; end: number }>;
  }) => Promise<void>;

  /** Called for each mention in a message */
  onMention?: (params: {
    messageId: string;
    mentionedUserId: string;
    authorId: string;
    body: string;
  }) => Promise<void>;
}

// ============================================================================
// Comments Client Class
// ============================================================================

/**
 * Class-based client for the Comments component.
 *
 * Usage:
 * ```ts
 * import { Comments } from "@your-org/comments";
 * import { components } from "./_generated/api";
 *
 * const comments = new Comments(components.comments);
 *
 * // In a mutation/query handler:
 * const zoneId = await comments.getOrCreateZone(ctx, { entityId: "doc_123" });
 * const threads = await comments.getThreads(ctx, { zoneId });
 * ```
 */
export class Comments {
  constructor(
    public readonly component: ComponentApi,
    private readonly callbacks?: MentionCallbacks
  ) { }

  // ==========================================================================
  // Zone Methods
  // ==========================================================================

  /**
   * Get or create a zone for an entity.
   */
  async getOrCreateZone(
    ctx: MutationCtx,
    args: { entityId: string; metadata?: unknown }
  ): Promise<string> {
    return await ctx.runMutation(this.component.lib.getOrCreateZone, args);
  }

  /**
   * Get a zone by entity ID (without creating).
   */
  async getZone(ctx: QueryCtx, args: { entityId: string }) {
    return await ctx.runQuery(this.component.lib.getZone, args);
  }

  /**
   * Get a zone by its ID.
   */
  async getZoneById(ctx: QueryCtx, args: { zoneId: string }) {
    return await ctx.runQuery(this.component.lib.getZoneById, { zoneId: args.zoneId });
  }

  /**
   * Delete a zone and all its contents.
   */
  async deleteZone(ctx: MutationCtx, args: { zoneId: string }) {
    return await ctx.runMutation(this.component.lib.deleteZone, { zoneId: args.zoneId });
  }

  // ==========================================================================
  // Thread Methods
  // ==========================================================================

  /**
   * Create a new thread in a zone.
   */
  async addThread(
    ctx: MutationCtx,
    args: {
      zoneId: string;
      position?: { x: number; y: number; anchor?: string };
      metadata?: unknown;
    }
  ): Promise<string> {
    return await ctx.runMutation(this.component.lib.addThread, {
      zoneId: args.zoneId,
      position: args.position,
      metadata: args.metadata,
    });
  }

  /**
   * Get a thread by ID.
   */
  async getThread(ctx: QueryCtx, args: { threadId: string }) {
    return await ctx.runQuery(this.component.lib.getThread, { threadId: args.threadId });
  }

  /**
   * Get all threads in a zone with pagination.
   */
  async getThreads(
    ctx: QueryCtx,
    args: {
      zoneId: string;
      limit?: number;
      includeResolved?: boolean;
      cursor?: string;
    }
  ) {
    return await ctx.runQuery(this.component.lib.getThreads, {
      zoneId: args.zoneId,
      limit: args.limit,
      includeResolved: args.includeResolved,
      cursor: args.cursor,
    });
  }

  /**
   * Resolve a thread.
   */
  async resolveThread(
    ctx: MutationCtx,
    args: { threadId: string; userId: string }
  ) {
    return await ctx.runMutation(this.component.lib.resolveThread, args);
  }

  /**
   * Unresolve a thread.
   */
  async unresolveThread(ctx: MutationCtx, args: { threadId: string }) {
    return await ctx.runMutation(this.component.lib.unresolveThread, args);
  }

  /**
   * Update thread position.
   */
  async updateThreadPosition(
    ctx: MutationCtx,
    args: {
      threadId: string;
      position?: { x: number; y: number; anchor?: string };
    }
  ) {
    return await ctx.runMutation(this.component.lib.updateThreadPosition, args);
  }

  /**
   * Delete a thread and all its messages.
   */
  async deleteThread(ctx: MutationCtx, args: { threadId: string }) {
    return await ctx.runMutation(this.component.lib.deleteThread, { threadId: args.threadId });
  }

  // ==========================================================================
  // Message Methods
  // ==========================================================================

  /**
   * Add a comment to a thread.
   * Returns the message ID and parsed mentions/links.
   */
  async addComment(
    ctx: MutationCtx,
    args: {
      threadId: string;
      authorId: string;
      body: string;
      attachments?: Attachment[];
    }
  ) {
    const result = await ctx.runMutation(this.component.lib.addComment, {
      threadId: args.threadId,
      authorId: args.authorId,
      body: args.body,
      attachments: args.attachments,
    });

    // Fire callbacks if configured
    if (this.callbacks?.onNewMessage) {
      await this.callbacks.onNewMessage({
        messageId: result.messageId,
        threadId: args.threadId,
        authorId: args.authorId,
        body: args.body,
        mentions: result.mentions,
      });
    }

    if (this.callbacks?.onMention) {
      for (const mention of result.mentions) {
        await this.callbacks.onMention({
          messageId: result.messageId,
          mentionedUserId: mention.userId,
          authorId: args.authorId,
          body: args.body,
        });
      }
    }

    return result;
  }

  /**
   * Get a single message with reactions.
   */
  async getMessage(
    ctx: QueryCtx,
    args: { messageId: string; currentUserId?: string }
  ) {
    return await ctx.runQuery(this.component.lib.getMessage, args);
  }

  /**
   * Get messages in a thread with pagination.
   */
  async getMessages(
    ctx: QueryCtx,
    args: {
      threadId: string;
      limit?: number;
      cursor?: string;
      order?: "asc" | "desc";
      currentUserId?: string;
      includeDeleted?: boolean;
    }
  ) {
    return await ctx.runQuery(this.component.lib.getMessages, args);
  }

  /**
   * Edit a message.
   */
  async editMessage(
    ctx: MutationCtx,
    args: { messageId: string; body: string; authorId?: string }
  ) {
    return await ctx.runMutation(this.component.lib.editMessage, args);
  }

  /**
   * Soft delete a message.
   */
  async deleteMessage(
    ctx: MutationCtx,
    args: { messageId: string; authorId?: string }
  ) {
    return await ctx.runMutation(this.component.lib.deleteMessage, args);
  }

  // ==========================================================================
  // Reaction Methods
  // ==========================================================================

  /**
   * Add a reaction to a message.
   */
  async addReaction(
    ctx: MutationCtx,
    args: { messageId: string; userId: string; emoji: string }
  ) {
    return await ctx.runMutation(this.component.lib.addReaction, args);
  }

  /**
   * Remove a reaction from a message.
   */
  async removeReaction(
    ctx: MutationCtx,
    args: { messageId: string; userId: string; emoji: string }
  ) {
    return await ctx.runMutation(this.component.lib.removeReaction, args);
  }

  /**
   * Toggle a reaction (add if not present, remove if present).
   */
  async toggleReaction(
    ctx: MutationCtx,
    args: { messageId: string; userId: string; emoji: string }
  ) {
    return await ctx.runMutation(this.component.lib.toggleReaction, args);
  }

  /**
   * Get all reactions for a message.
   */
  async getReactions(
    ctx: QueryCtx,
    args: { messageId: string; currentUserId?: string }
  ) {
    return await ctx.runQuery(this.component.lib.getReactions, args);
  }

  // ==========================================================================
  // Typing Indicator Methods
  // ==========================================================================

  /**
   * Set typing indicator for a user in a thread.
   */
  async setIsTyping(
    ctx: MutationCtx,
    args: { threadId: string; userId: string; isTyping: boolean }
  ) {
    return await ctx.runMutation(this.component.lib.setIsTyping, args);
  }

  /**
   * Get all users currently typing in a thread.
   */
  async getTypingUsers(
    ctx: QueryCtx,
    args: { threadId: string; excludeUserId?: string }
  ) {
    return await ctx.runQuery(this.component.lib.getTypingUsers, args);
  }

  /**
   * Clear all typing indicators for a user.
   */
  async clearUserTyping(ctx: MutationCtx, args: { userId: string }) {
    return await ctx.runMutation(this.component.lib.clearUserTyping, args);
  }

  /**
   * Resolve a message.
   */
  async resolveMessage(
    ctx: MutationCtx,
    args: { messageId: string; userId: string }
  ) {
    return await ctx.runMutation(this.component.lib.resolveMessage, args);
  }

  /**
   * Unresolve a message.
   */
  async unresolveMessage(ctx: MutationCtx, args: { messageId: string }) {
    return await ctx.runMutation(this.component.lib.unresolveMessage, args);
  }
}

// ============================================================================
// API Re-export Functions
// ============================================================================

/**
 * Create a re-exportable API for the Comments component.
 *
 * This allows apps to expose comments functionality directly to React clients
 * with authentication. The auth callback is called before each operation.
 *
 * Usage:
 * ```ts
 * // In convex/comments.ts
 * import { exposeApi } from "@your-org/comments";
 * import { components } from "./_generated/api";
 *
 * export const { getThreads, addComment, toggleReaction } = exposeApi(
 *   components.comments,
 *   {
 *     auth: async (ctx, operation) => {
 *       const userId = await getAuthUserId(ctx);
 *       if (!userId && operation.type !== "read") {
 *         throw new Error("Authentication required");
 *       }
 *       return userId ?? "anonymous";
 *     },
 *   }
 * );
 * ```
 */
export function exposeApi(
  component: ComponentApi,
  options: {
    /** Authentication callback - must return user ID or throw */
    auth: AuthCallback;
    /** Optional notification callbacks */
    callbacks?: MentionCallbacks;
  }
) {
  return {
    // Zone queries/mutations
    getOrCreateZone: mutationGeneric({
      args: { entityId: v.string(), metadata: v.optional(v.any()) },
      handler: async (ctx, args) => {
        await options.auth(ctx, { type: "create" });
        return await ctx.runMutation(component.lib.getOrCreateZone, args);
      },
    }),

    getZone: queryGeneric({
      args: { entityId: v.string() },
      handler: async (ctx, args) => {
        await options.auth(ctx, { type: "read" });
        return await ctx.runQuery(component.lib.getZone, args);
      },
    }),

    // Thread queries/mutations
    addThread: mutationGeneric({
      args: {
        zoneId: v.string(),
        position: v.optional(
          v.object({
            x: v.number(),
            y: v.number(),
            anchor: v.optional(v.string()),
          })
        ),
        metadata: v.optional(v.any()),
      },
      handler: async (ctx, args) => {
        await options.auth(ctx, { type: "create", zoneId: args.zoneId });
        return await ctx.runMutation(component.lib.addThread, {
          zoneId: args.zoneId,
          position: args.position,
          metadata: args.metadata,
        });
      },
    }),

    getThread: queryGeneric({
      args: { threadId: v.string() },
      handler: async (ctx, args) => {
        await options.auth(ctx, { type: "read", threadId: args.threadId });
        return await ctx.runQuery(component.lib.getThread, { threadId: args.threadId });
      },
    }),

    getThreads: queryGeneric({
      args: {
        zoneId: v.string(),
        limit: v.optional(v.number()),
        includeResolved: v.optional(v.boolean()),
        cursor: v.optional(v.string()),
      },
      handler: async (ctx, args) => {
        await options.auth(ctx, { type: "read", zoneId: args.zoneId });
        return await ctx.runQuery(component.lib.getThreads, {
          zoneId: args.zoneId,
          limit: args.limit,
          includeResolved: args.includeResolved,
          cursor: args.cursor,
        });
      },
    }),

    resolveThread: mutationGeneric({
      args: { threadId: v.string() },
      handler: async (ctx, args) => {
        const userId = await options.auth(ctx, { type: "update", threadId: args.threadId });
        return await ctx.runMutation(component.lib.resolveThread, {
          threadId: args.threadId,
          userId,
        });
      },
    }),

    unresolveThread: mutationGeneric({
      args: { threadId: v.string() },
      handler: async (ctx, args) => {
        await options.auth(ctx, { type: "update", threadId: args.threadId });
        return await ctx.runMutation(component.lib.unresolveThread, { threadId: args.threadId });
      },
    }),

    // Message queries/mutations
    addComment: mutationGeneric({
      args: {
        threadId: v.string(),
        body: v.string(),
        attachments: v.optional(
          v.array(
            v.object({
              type: v.union(v.literal("url"), v.literal("file"), v.literal("image")),
              url: v.string(),
              name: v.optional(v.string()),
              mimeType: v.optional(v.string()),
              size: v.optional(v.number()),
            })
          )
        ),
      },
      handler: async (ctx, args) => {
        const userId = await options.auth(ctx, { type: "create", threadId: args.threadId });
        const result = await ctx.runMutation(component.lib.addComment, {
          threadId: args.threadId,
          authorId: userId,
          body: args.body,
          attachments: args.attachments,
        });

        // Fire callbacks
        if (options.callbacks?.onNewMessage) {
          await options.callbacks.onNewMessage({
            messageId: result.messageId,
            threadId: args.threadId,
            authorId: userId,
            body: args.body,
            mentions: result.mentions,
          });
        }

        if (options.callbacks?.onMention) {
          for (const mention of result.mentions) {
            await options.callbacks.onMention({
              messageId: result.messageId,
              mentionedUserId: mention.userId,
              authorId: userId,
              body: args.body,
            });
          }
        }

        return result;
      },
    }),

    getMessage: queryGeneric({
      args: { messageId: v.string() },
      handler: async (ctx, args) => {
        const userId = await options.auth(ctx, { type: "read" }).catch(() => undefined);
        return await ctx.runQuery(component.lib.getMessage, {
          messageId: args.messageId,
          currentUserId: userId,
        });
      },
    }),

    getMessages: queryGeneric({
      args: {
        threadId: v.string(),
        limit: v.optional(v.number()),
        cursor: v.optional(v.string()),
        order: v.optional(v.union(v.literal("asc"), v.literal("desc"))),
        includeDeleted: v.optional(v.boolean()),
      },
      handler: async (ctx, args) => {
        const userId = await options.auth(ctx, { type: "read", threadId: args.threadId }).catch(() => undefined);
        return await ctx.runQuery(component.lib.getMessages, {
          threadId: args.threadId,
          limit: args.limit,
          cursor: args.cursor,
          order: args.order,
          currentUserId: userId,
          includeDeleted: args.includeDeleted,
        });
      },
    }),

    editMessage: mutationGeneric({
      args: { messageId: v.string(), body: v.string() },
      handler: async (ctx, args) => {
        const userId = await options.auth(ctx, { type: "update", messageId: args.messageId });
        return await ctx.runMutation(component.lib.editMessage, {
          messageId: args.messageId,
          body: args.body,
          authorId: userId,
        });
      },
    }),

    deleteMessage: mutationGeneric({
      args: { messageId: v.string() },
      handler: async (ctx, args) => {
        const userId = await options.auth(ctx, { type: "delete", messageId: args.messageId });
        return await ctx.runMutation(component.lib.deleteMessage, {
          messageId: args.messageId,
          authorId: userId,
        });
      },
    }),

    // Reactions
    toggleReaction: mutationGeneric({
      args: { messageId: v.string(), emoji: v.string() },
      handler: async (ctx, args) => {
        const userId = await options.auth(ctx, { type: "react", messageId: args.messageId });
        return await ctx.runMutation(component.lib.toggleReaction, {
          messageId: args.messageId,
          userId,
          emoji: args.emoji,
        });
      },
    }),

    getReactions: queryGeneric({
      args: { messageId: v.string() },
      handler: async (ctx, args) => {
        const userId = await options.auth(ctx, { type: "read" }).catch(() => undefined);
        return await ctx.runQuery(component.lib.getReactions, {
          messageId: args.messageId,
          currentUserId: userId,
        });
      },
    }),

    // Typing indicators
    setIsTyping: mutationGeneric({
      args: { threadId: v.string(), isTyping: v.boolean() },
      handler: async (ctx, args) => {
        const userId = await options.auth(ctx, { type: "create", threadId: args.threadId });
        return await ctx.runMutation(component.lib.setIsTyping, {
          threadId: args.threadId,
          userId,
          isTyping: args.isTyping,
        });
      },
    }),

    getTypingUsers: queryGeneric({
      args: { threadId: v.string() },
      handler: async (ctx, args) => {
        const userId = await options.auth(ctx, { type: "read", threadId: args.threadId }).catch(() => undefined);
        return await ctx.runQuery(component.lib.getTypingUsers, {
          threadId: args.threadId,
          excludeUserId: userId,
        });
      },
    }),
  };
}

// ============================================================================
// HTTP Route Registration
// ============================================================================

/**
 * Register HTTP routes for the Comments component.
 *
 * Provides REST-like endpoints for the comments API:
 * - GET /comments/zones/:entityId - Get zone by entity ID
 * - GET /comments/threads/:zoneId - Get threads in a zone
 * - GET /comments/messages/:threadId - Get messages in a thread
 *
 * Usage:
 * ```ts
 * // In convex/http.ts
 * import { registerRoutes } from "@your-org/comments";
 * import { components } from "./_generated/api";
 *
 * const http = httpRouter();
 * registerRoutes(http, components.comments, { pathPrefix: "/api/comments" });
 * export default http;
 * ```
 */
export function registerRoutes(
  http: HttpRouter,
  component: ComponentApi,
  options: { pathPrefix?: string } = {}
) {
  const prefix = options.pathPrefix ?? "/comments";

  // Get zone by entity ID
  http.route({
    path: `${prefix}/zones`,
    method: "GET",
    handler: httpActionGeneric(async (ctx, request) => {
      const entityId = new URL(request.url).searchParams.get("entityId");
      if (!entityId) {
        return new Response(
          JSON.stringify({ error: "entityId parameter required" }),
          { status: 400, headers: { "Content-Type": "application/json" } }
        );
      }

      const zone = await ctx.runQuery(component.lib.getZone, { entityId });
      return new Response(JSON.stringify(zone), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }),
  });

  // Get threads in a zone
  http.route({
    path: `${prefix}/threads`,
    method: "GET",
    handler: httpActionGeneric(async (ctx, request) => {
      const url = new URL(request.url);
      const zoneId = url.searchParams.get("zoneId");
      if (!zoneId) {
        return new Response(
          JSON.stringify({ error: "zoneId parameter required" }),
          { status: 400, headers: { "Content-Type": "application/json" } }
        );
      }

      const limit = url.searchParams.get("limit");
      const cursor = url.searchParams.get("cursor");
      const includeResolved = url.searchParams.get("includeResolved");

      const result = await ctx.runQuery(component.lib.getThreads, {
        zoneId,
        limit: limit ? parseInt(limit, 10) : undefined,
        cursor: cursor ?? undefined,
        includeResolved: includeResolved === "true",
      });

      return new Response(JSON.stringify(result), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }),
  });

  // Get messages in a thread
  http.route({
    path: `${prefix}/messages`,
    method: "GET",
    handler: httpActionGeneric(async (ctx, request) => {
      const url = new URL(request.url);
      const threadId = url.searchParams.get("threadId");
      if (!threadId) {
        return new Response(
          JSON.stringify({ error: "threadId parameter required" }),
          { status: 400, headers: { "Content-Type": "application/json" } }
        );
      }

      const limit = url.searchParams.get("limit");
      const cursor = url.searchParams.get("cursor");
      const order = url.searchParams.get("order") as "asc" | "desc" | null;

      const result = await ctx.runQuery(component.lib.getMessages, {
        threadId,
        limit: limit ? parseInt(limit, 10) : undefined,
        cursor: cursor ?? undefined,
        order: order ?? undefined,
      });

      return new Response(JSON.stringify(result), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }),
  });
}

// ============================================================================
// Default Export
// ============================================================================

export default Comments;
