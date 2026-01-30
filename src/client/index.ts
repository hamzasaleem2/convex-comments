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
 * import { Comments } from "@hamzasaleemorg/convex-comments";
 * import { components } from "./_generated/api";
 *
 * const comments = new Comments(components.comments, {
 *   onMention: async ({ mentionedUserId, authorId, body }) => {
 *     // Send email or push notification to the mentioned user
 *     console.log(`${authorId} mentioned ${mentionedUserId}: ${body}`);
 *   }
 * });
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
   * Get or create a "Zone" for a specific entity.
   * 
   * A Zone is the top-level container for all threads and messages related to a specific
   * resource in your app (e.g., a specific document ID, a task ID, or a project page).
   * 
   * This method uses a "get or create" pattern, making it ideal for lazy-initializing
   * the comment system for an entity the first time a user interacts with it.
   * 
   * @param ctx - The mutation context (requires runMutation)
   * @param args.entityId - A unique string identifying your resource (e.g., "doc_123")
   * @param args.metadata - Optional arbitrary data to store with the zone
   * @returns The unique ID of the zone
   */
  async getOrCreateZone(
    ctx: MutationCtx,
    args: { entityId: string; metadata?: unknown }
  ): Promise<string> {
    return await ctx.runMutation(this.component.lib.getOrCreateZone, args);
  }

  /**
   * Retrieves an existing zone by its entity ID.
   * 
   * Unlike `getOrCreateZone`, this will return `null` if the zone doesn't exist yet.
   * Use this when you want to check if an entity has any comments without creating a container.
   * 
   * @param ctx - The query context
   * @param args.entityId - The unique resource identifier
   */
  async getZone(ctx: QueryCtx, args: { entityId: string }) {
    return await ctx.runQuery(this.component.lib.getZone, args);
  }

  /**
   * Retrieves a zone by its internal Convex ID.
   * 
   * Useful when you already have a `zoneId` (e.g., from a thread reference) and 
   * need to fetch its associated metadata or entity identifier.
   */
  async getZoneById(ctx: QueryCtx, args: { zoneId: string }) {
    return await ctx.runQuery(this.component.lib.getZoneById, { zoneId: args.zoneId });
  }

  /**
   * Permanently deletes a zone and every thread, message, and reaction within it.
   * 
   * This is a destructive operation often used when the parent resource 
   * (e.g., a document) is being deleted from your system.
   */
  async deleteZone(ctx: MutationCtx, args: { zoneId: string }) {
    return await ctx.runMutation(this.component.lib.deleteZone, { zoneId: args.zoneId });
  }

  // ==========================================================================
  // Thread Methods
  // ==========================================================================

  /**
   * Creates a new conversation thread within a specific zone.
   * 
   * Threads act as a grouping for related messages. They support "positioned" 
   * comments (e.g., pins on a PDF or coordinates on a canvas) via the `position` argument.
   * 
   * @param args.zoneId - The ID of the zone to contain this thread
   * @param args.position - Optional coordinates {x, y} and an anchor point for UI placement
   * @param args.metadata - Optional data (e.g., the specific version of a document)
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
   * Retrieves full details for a specific thread, including its position and resolution status.
   */
  async getThread(ctx: QueryCtx, args: { threadId: string }) {
    return await ctx.runQuery(this.component.lib.getThread, { threadId: args.threadId });
  }

  /**
   * Lists threads within a zone, typically used for a "Sidebar" or "Activity" view.
   * 
   * Supports pagination and filtering by resolution status.
   * 
   * @param args.includeResolved - If true, returns both open and resolved threads. Defaults to false.
   * @param args.limit - Maximum number of threads to return in one page.
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
   * Marks a thread as resolved.
   * 
   * Resolved threads are effectively "closed" and are hidden from the default `getThreads` view.
   * 
   * @param args.userId - The ID of the user who resolved the thread.
   */
  async resolveThread(
    ctx: MutationCtx,
    args: { threadId: string; userId: string }
  ) {
    return await ctx.runMutation(this.component.lib.resolveThread, args);
  }

  /**
   * Re-opens a previously resolved thread.
   */
  async unresolveThread(ctx: MutationCtx, args: { threadId: string }) {
    return await ctx.runMutation(this.component.lib.unresolveThread, args);
  }

  /**
   * Updates the visual position of a thread. 
   * 
   * Useful for "draggable" comment pins or when the underlying content changes layout.
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
   * Permanently deletes a thread and all its messages.
   */
  async deleteThread(ctx: MutationCtx, args: { threadId: string }) {
    return await ctx.runMutation(this.component.lib.deleteThread, { threadId: args.threadId });
  }

  // ==========================================================================
  // Message Methods
  // ==========================================================================

  /**
   * Adds a new comment (message) to a thread.
   * 
   * This method automatically parses the body for `@user` mentions and URLs.
   * If the `Comments` client was initialized with callbacks, `onNewMessage` and 
   * `onMention` will be triggered automatically.
   * 
   * @param args.authorId - The ID of the user sending the comment
   * @param args.body - The text content (supports markdown)
   * @param args.attachments - Optional array of file/url attachments
   * @returns The generated message ID and the list of detected mentions/links
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
   * Fetches a specific message, including its reaction and resolution status.
   * 
   * @param args.currentUserId - Optional. If provided, the response will include 
   *                             `includesMe` flags for reactions.
   */
  async getMessage(
    ctx: QueryCtx,
    args: { messageId: string; currentUserId?: string }
  ) {
    return await ctx.runQuery(this.component.lib.getMessage, args);
  }

  /**
   * Retrieves a paginated list of messages for a thread.
   * 
   * Typically used to populate the main comment list for a conversation.
   * 
   * @param args.order - "asc" for chronological (chat style) or "desc" for newest first.
   * @param args.includeDeleted - If true, includes placeholders for deleted messages.
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
   * Edits the content of an existing message.
   * 
   * The message will be marked as `isEdited: true`.
   */
  async editMessage(
    ctx: MutationCtx,
    args: { messageId: string; body: string; authorId?: string }
  ) {
    return await ctx.runMutation(this.component.lib.editMessage, args);
  }

  /**
   * Soft-deletes a message. 
   * 
   * The message record remains but its `body` is cleared and `isDeleted` is set to true.
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
   * Adds an emoji reaction to a message for a specific user.
   */
  async addReaction(
    ctx: MutationCtx,
    args: { messageId: string; userId: string; emoji: string }
  ) {
    return await ctx.runMutation(this.component.lib.addReaction, args);
  }

  /**
   * Removes an emoji reaction from a message.
   */
  async removeReaction(
    ctx: MutationCtx,
    args: { messageId: string; userId: string; emoji: string }
  ) {
    return await ctx.runMutation(this.component.lib.removeReaction, args);
  }

  /**
   * Toggles a reaction. If the user already reacted with this emoji, 
   * it removes it; otherwise, it adds it.
   */
  async toggleReaction(
    ctx: MutationCtx,
    args: { messageId: string; userId: string; emoji: string }
  ) {
    return await ctx.runMutation(this.component.lib.toggleReaction, args);
  }

  /**
   * Retrieves a summary of all reactions for a message.
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
   * Updates the "isTyping" status for a user in a specific thread.
   * 
   * This is used to drive real-time typing indicators in your UI. The typing status 
   * automatically expires after a short period (typically 5-10 seconds of inactivity).
   * 
   * For the best user experience, call this whenever the user types a character 
   * (debounced) or when the input field loses focus.
   * 
   * @param args.threadId - Internal ID of the thread
   * @param args.userId - The ID of the user who is typing
   * @param args.isTyping - true to show as typing, false to immediately clear
   */
  async setIsTyping(
    ctx: MutationCtx,
    args: { threadId: string; userId: string; isTyping: boolean }
  ) {
    return await ctx.runMutation(this.component.lib.setIsTyping, args);
  }

  /**
   * Returns a list of user IDs currently typing in a thread.
   * 
   * Use this in a reactive query to show "User A, User B are typing..." in your UI.
   * 
   * @param args.excludeUserId - Optional. Exclude the current user from the list to avoid 
   *                             showing an "I am typing" indicator to yourself.
   */
  async getTypingUsers(
    ctx: QueryCtx,
    args: { threadId: string; excludeUserId?: string }
  ) {
    return await ctx.runQuery(this.component.lib.getTypingUsers, args);
  }

  /**
   * Immediately clears all typing indicators for a specific user across all threads.
   * 
   * Useful to call when a user logs out or closes their browser tab to ensure 
   * typing indicators don't linger for the timeout duration.
   */
  async clearUserTyping(ctx: MutationCtx, args: { userId: string }) {
    return await ctx.runMutation(this.component.lib.clearUserTyping, args);
  }

  /**
   * Resolves an individual message. 
   * 
   * While `resolveThread` marks an entire conversation as closed, `resolveMessage` 
   * is useful for "task-style" comments where each message might represent a 
   * specific action item that can be checked off.
   * 
   * @param args.userId - The ID of the user who resolved the message.
   */
  async resolveMessage(
    ctx: MutationCtx,
    args: { messageId: string; userId: string }
  ) {
    return await ctx.runMutation(this.component.lib.resolveMessage, args);
  }

  /**
   * Re-opens a previously resolved message.
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
 * import { exposeApi } from "@hamzasaleemorg/convex-comments";
 * import { components } from "./_generated/api";
 *
 * export const { getThreads, addComment, toggleReaction, setIsTyping } = exposeApi(
 *   components.comments,
 *   {
 *     auth: async (ctx, operation) => {
 *       const identity = await ctx.auth.getUserIdentity();
 *       if (!identity && operation.type !== "read") {
 *         throw new Error("Authentication required");
 *       }
 *       return identity?.subject ?? "anonymous";
 *     },
 *     callbacks: {
 *       onMention: async ({ mentionedUserId }) => {
 *         // Handle notification logic here
 *       }
 *     }
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
    /** Initialize or fetch a zone for an entity. Access: create/admin. */
    getOrCreateZone: mutationGeneric({
      args: { entityId: v.string(), metadata: v.optional(v.any()) },
      handler: async (ctx, args) => {
        await options.auth(ctx, { type: "create" });
        return await ctx.runMutation(component.lib.getOrCreateZone, args);
      },
    }),

    /** Get zone by entity ID. Access: read. */
    getZone: queryGeneric({
      args: { entityId: v.string() },
      handler: async (ctx, args) => {
        await options.auth(ctx, { type: "read" });
        return await ctx.runQuery(component.lib.getZone, args);
      },
    }),

    /** Start a new thread. Access: create/write. */
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

    /** Fetch single thread details. Access: read. */
    getThread: queryGeneric({
      args: { threadId: v.string() },
      handler: async (ctx, args) => {
        await options.auth(ctx, { type: "read", threadId: args.threadId });
        return await ctx.runQuery(component.lib.getThread, { threadId: args.threadId });
      },
    }),

    /** List threads in a zone. Access: read. */
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

    /** Close a thread. Access: update/owner. */
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

    /** Re-open a thread. Access: update/owner. */
    unresolveThread: mutationGeneric({
      args: { threadId: v.string() },
      handler: async (ctx, args) => {
        await options.auth(ctx, { type: "update", threadId: args.threadId });
        return await ctx.runMutation(component.lib.unresolveThread, { threadId: args.threadId });
      },
    }),

    /** Post a new comment. Access: write. Mentions are parsed automatically. */
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

    /** Fetch single message. Access: read. */
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

    /** Fetch conversation history. Access: read. */
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

    /** Update message content. Access: update/owner. */
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

    /** Soft-delete message. Access: delete/owner. */
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

    /** Add/remove reaction. Access: react. */
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

    /** List reactions for message. Access: read. */
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

    /** Signal typing intent. Access: write. Indicators expire automatically. */
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

    /** List current typists. Access: read. */
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
 * - GET /comments/zones?entityId=...
 * - GET /comments/threads?zoneId=...
 * - GET /comments/messages?threadId=...
 *
 * Usage:
 * ```ts
 * // In convex/http.ts
 * import { httpRouter } from "convex/server";
 * import { registerRoutes } from "@hamzasaleemorg/convex-comments";
 * import { components } from "./_generated/api";
 *
 * const http = httpRouter();
 *
 * // Mount the comments API at /api/comments/*
 * registerRoutes(http, components.comments, { pathPrefix: "/api/comments" });
 *
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
