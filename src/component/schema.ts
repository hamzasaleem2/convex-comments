import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

/**
 * Comments Component Schema
 *
 * Data model:
 * - Zones: Container for threads, tied to an external entity (e.g., a document)
 * - Threads: Container for messages within a zone
 * - Messages: Individual comments with body, mentions, attachments, resolved state
 * - Reactions: Emoji reactions on messages
 * - TypingIndicators: Real-time typing status with auto-expiry
 */

// ============================================================================
// Validators (exported for use in function args/returns)
// ============================================================================

/** Attachment metadata - URLs, file references, etc. */
export const attachmentValidator = v.object({
  type: v.union(v.literal("url"), v.literal("file"), v.literal("image")),
  url: v.string(),
  name: v.optional(v.string()),
  mimeType: v.optional(v.string()),
  size: v.optional(v.number()),
});

/** Mention extracted from message body */
export const mentionValidator = v.object({
  userId: v.string(),
  /** Start position in the body text */
  start: v.number(),
  /** End position in the body text */
  end: v.number(),
});

/** Link extracted from message body */
export const linkValidator = v.object({
  url: v.string(),
  start: v.number(),
  end: v.number(),
});

// ============================================================================
// Schema Definition
// ============================================================================

export default defineSchema({
  /**
   * Zones - Container for threads, tied to an external entity
   *
   * A zone represents a commentable area (e.g., a document, a task, a post).
   * The `entityId` is a string representation of whatever the parent app uses
   * to identify the entity (could be a Convex ID, UUID, slug, etc.)
   */
  zones: defineTable({
    /** External entity ID this zone belongs to (stored as string for flexibility) */
    entityId: v.string(),
    /** Optional metadata about the zone */
    metadata: v.optional(v.any()),
    /** Timestamp when zone was created */
    createdAt: v.number(),
  })
    .index("entityId", ["entityId"]),

  /**
   * Threads - Container for messages within a zone
   *
   * Threads group related messages together. A zone can have multiple threads.
   */
  threads: defineTable({
    /** Zone this thread belongs to */
    zoneId: v.id("zones"),
    /** Whether the entire thread is resolved */
    resolved: v.boolean(),
    /** User who resolved the thread (if resolved) */
    resolvedBy: v.optional(v.string()),
    /** When the thread was resolved */
    resolvedAt: v.optional(v.number()),
    /** Timestamp when thread was created */
    createdAt: v.number(),
    /** Timestamp of last activity (new message, reaction, etc.) */
    lastActivityAt: v.number(),
    /** Optional position data for positioned comments (e.g., x, y coordinates) */
    position: v.optional(v.object({
      x: v.number(),
      y: v.number(),
      /** Optional anchor data (e.g., element ID, text range) */
      anchor: v.optional(v.string()),
    })),
    /** Optional metadata */
    metadata: v.optional(v.any()),
  })
    .index("zoneId", ["zoneId"])
    .index("zoneId_lastActivity", ["zoneId", "lastActivityAt"])
    .index("zoneId_resolved", ["zoneId", "resolved"]),

  /**
   * Messages - Individual comments within a thread
   */
  messages: defineTable({
    /** Thread this message belongs to */
    threadId: v.id("threads"),
    /** User who authored this message (stored as string for flexibility) */
    authorId: v.string(),
    /** Message body (plain text or markdown) */
    body: v.string(),
    /** Parsed mentions from the body */
    mentions: v.array(mentionValidator),
    /** Parsed links from the body */
    links: v.array(linkValidator),
    /** Attachments on this message */
    attachments: v.array(attachmentValidator),
    /** Whether this message has been edited */
    isEdited: v.boolean(),
    /** Whether this message is deleted (soft delete) */
    isDeleted: v.boolean(),
    /** Whether this message is resolved */
    resolved: v.optional(v.boolean()),
    /** User who resolved the message */
    resolvedBy: v.optional(v.string()),
    /** When the message was resolved */
    resolvedAt: v.optional(v.number()),
    /** Timestamp when created */
    createdAt: v.number(),
    /** Timestamp when last edited */
    editedAt: v.optional(v.number()),
  })
    .index("threadId", ["threadId"])
    .index("threadId_createdAt", ["threadId", "createdAt"])
    .index("authorId", ["authorId"]),

  /**
   * Reactions - Emoji reactions on messages
   */
  reactions: defineTable({
    /** Message this reaction is on */
    messageId: v.id("messages"),
    /** User who reacted */
    userId: v.string(),
    /** Emoji used (e.g., "👍", "❤️", "🎉") */
    emoji: v.string(),
    /** When the reaction was added */
    createdAt: v.number(),
  })
    .index("messageId", ["messageId"])
    .index("messageId_emoji", ["messageId", "emoji"])
    .index("messageId_userId", ["messageId", "userId"])
    .index("messageId_emoji_userId", ["messageId", "emoji", "userId"]),

  /**
   * TypingIndicators - Real-time typing status
   *
   * These records auto-expire after a timeout (handled by scheduled function)
   */
  typingIndicators: defineTable({
    /** Thread where user is typing */
    threadId: v.id("threads"),
    /** User who is typing */
    userId: v.string(),
    /** When the typing indicator was last updated */
    updatedAt: v.number(),
    /** When this indicator should expire (for cleanup) */
    expiresAt: v.number(),
  })
    .index("threadId", ["threadId"])
    .index("threadId_userId", ["threadId", "userId"])
    .index("expiresAt", ["expiresAt"]),
});
