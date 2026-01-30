/**
 * Example usage of the Comments Component.
 *
 * This file demonstrates how to use the comments component in your app.
 */

import { v } from "convex/values";
import { mutation, query } from "./_generated/server.js";
import { components } from "./_generated/api.js";
import { Comments, exposeApi } from "@hamzasaleemorg/convex-comments";
import type { Auth } from "convex/server";

// ============================================================================
// Authentication Helper
// ============================================================================

async function getAuthUserId(ctx: { auth: Auth }): Promise<string> {
  const identity = await ctx.auth.getUserIdentity();
  return identity?.subject ?? "anonymous";
}

// ============================================================================
// Option 1: Using the Comments Class
// ============================================================================

// Initialize the Comments client
const comments = new Comments(components.comments, {
  // Optional: Notification callbacks
  onNewMessage: async ({ messageId, mentions }) => {
    console.log(`New message ${messageId} with ${mentions.length} mentions`);
  },
  onMention: async ({ mentionedUserId, authorId, body: _body }) => {
    console.log(`User ${mentionedUserId} was mentioned by ${authorId}`);
  },
});

// Get or create a zone for an entity
export const getOrCreateZone = mutation({
  args: { entityId: v.string() },
  handler: async (ctx, args) => {
    return await comments.getOrCreateZone(ctx, { entityId: args.entityId });
  },
});

// List all zones
export const listZones = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    return await ctx.runQuery(components.comments.lib.listZones, {
      limit: args.limit,
    });
  },
});

// Get threads in a zone
export const getThreads = query({
  args: {
    zoneId: v.string(),
    limit: v.optional(v.number()),
    includeResolved: v.optional(v.boolean()),
    cursor: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    return await comments.getThreads(ctx, {
      zoneId: args.zoneId,
      limit: args.limit,
      includeResolved: args.includeResolved,
      cursor: args.cursor,
    });
  },
});

// Add a thread to a zone
export const addThread = mutation({
  args: {
    zoneId: v.string(),
    position: v.optional(
      v.object({
        x: v.number(),
        y: v.number(),
        anchor: v.optional(v.string()),
      })
    ),
  },
  handler: async (ctx, args) => {
    return await comments.addThread(ctx, {
      zoneId: args.zoneId,
      position: args.position,
    });
  },
});

// Get messages in a thread
export const getMessages = query({
  args: {
    threadId: v.string(),
    limit: v.optional(v.number()),
    cursor: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    return await comments.getMessages(ctx, {
      threadId: args.threadId,
      limit: args.limit,
      cursor: args.cursor,
      currentUserId: userId,
    });
  },
});

// Add a comment to a thread
export const addComment = mutation({
  args: {
    threadId: v.string(),
    body: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    return await comments.addComment(ctx, {
      threadId: args.threadId,
      authorId: userId,
      body: args.body,
    });
  },
});

// Toggle a reaction on a message
export const toggleReaction = mutation({
  args: {
    messageId: v.string(),
    emoji: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    return await comments.toggleReaction(ctx, {
      messageId: args.messageId,
      userId,
      emoji: args.emoji,
    });
  },
});

// Set typing indicator
export const setIsTyping = mutation({
  args: {
    threadId: v.string(),
    userId: v.string(),
    isTyping: v.boolean(),
  },
  handler: async (ctx, args) => {
    return await comments.setIsTyping(ctx, {
      threadId: args.threadId,
      userId: args.userId,
      isTyping: args.isTyping,
    });
  },
});

// Get typing users in a thread
export const getTypingUsers = query({
  args: { threadId: v.string(), excludeUserId: v.optional(v.string()) },
  handler: async (ctx, args) => {
    return await comments.getTypingUsers(ctx, {
      threadId: args.threadId,
      excludeUserId: args.excludeUserId,
    });
  },
});

// Resolve a thread
export const resolveThread = mutation({
  args: { threadId: v.string() },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    return await comments.resolveThread(ctx, {
      threadId: args.threadId,
      userId,
    });
  },
});

// Unresolve a thread
export const unresolveThread = mutation({
  args: { threadId: v.string() },
  handler: async (ctx, args) => {
    return await comments.unresolveThread(ctx, {
      threadId: args.threadId,
    });
  },
});

// Resolve a message
export const resolveMessage = mutation({
  args: { messageId: v.string() },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    return await comments.resolveMessage(ctx, {
      messageId: args.messageId,
      userId,
    });
  },
});

// Unresolve a message
export const unresolveMessage = mutation({
  args: { messageId: v.string() },
  handler: async (ctx, args) => {
    return await comments.unresolveMessage(ctx, {
      messageId: args.messageId,
    });
  },
});

// ============================================================================
// Option 2: Using exposeApi for Direct Client Access
// ============================================================================

// This pattern is useful when you want to expose the component's API
// directly to React clients with authentication.

export const {
  getThreads: getThreadsPublic,
  addThread: addThreadPublic,
  addComment: addCommentPublic,
  toggleReaction: toggleReactionPublic,
  setIsTyping: setIsTypingPublic,
  getTypingUsers: getTypingUsersPublic,
} = exposeApi(components.comments, {
  auth: async (ctx, operation) => {
    const userId = await getAuthUserId(ctx);
    // Allow reads for anyone, writes only for authenticated users
    if (operation.type !== "read" && userId === "anonymous") {
      throw new Error("Authentication required");
    }
    return userId;
  },
  callbacks: {
    onNewMessage: async ({ messageId, mentions: _mentions }) => {
      // Handle new message notifications
      console.log(`New message: ${messageId}`);
    },
    onMention: async ({ mentionedUserId, authorId }) => {
      // Handle mention notifications
      console.log(`${authorId} mentioned ${mentionedUserId}`);
    },
  },
});

// ============================================================================
// Option 3: Direct Component Function Calls
// ============================================================================

// You can also call component functions directly without wrappers
export const directAddComment = mutation({
  args: {
    threadId: v.string(),
    body: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    return await ctx.runMutation(components.comments.lib.addComment, {
      threadId: args.threadId,
      authorId: userId,
      body: args.body,
    });
  },
});

export const directGetMessages = query({
  args: { threadId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.runQuery(components.comments.lib.getMessages, {
      threadId: args.threadId,
      limit: 50,
    });
  },
});
