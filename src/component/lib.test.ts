import { describe, test, expect } from "vitest";
import { convexTest } from "convex-test";
import schema from "./schema.js";
import { api } from "./_generated/api.js";

const modules = import.meta.glob("./**/*.ts");

describe("Comments Component", () => {
  describe("Zones", () => {
    test("getOrCreateZone creates a new zone", async () => {
      const t = convexTest(schema, modules);

      const zoneId = await t.mutation(api.zones.getOrCreateZone, {
        entityId: "doc_123",
      });

      expect(zoneId).toBeDefined();
      expect(typeof zoneId).toBe("string");

      // Calling again with same entityId should return the same zone
      const zoneId2 = await t.mutation(api.zones.getOrCreateZone, {
        entityId: "doc_123",
      });

      expect(zoneId2).toBe(zoneId);
    });

    test("getZone returns null for non-existent zone", async () => {
      const t = convexTest(schema, modules);

      const zone = await t.query(api.zones.getZone, {
        entityId: "non_existent",
      });

      expect(zone).toBeNull();
    });
  });

  describe("Threads", () => {
    test("addThread creates a new thread", async () => {
      const t = convexTest(schema, modules);

      // First create a zone
      const zoneId = await t.mutation(api.zones.getOrCreateZone, {
        entityId: "doc_123",
      });

      // Add a thread
      const threadId = await t.mutation(api.threads.addThread, {
        zoneId,
      });

      expect(threadId).toBeDefined();

      // Get the thread
      const thread = await t.query(api.threads.getThread, {
        threadId,
      });

      expect(thread).toBeDefined();
      expect(thread?.zoneId).toBe(zoneId);
      expect(thread?.resolved).toBe(false);
    });

    test("getThreads returns threads with previews", async () => {
      const t = convexTest(schema, modules);

      const zoneId = await t.mutation(api.zones.getOrCreateZone, {
        entityId: "doc_123",
      });

      const threadId = await t.mutation(api.threads.addThread, {
        zoneId,
      });

      // Add a message to the thread
      await t.mutation(api.messages.addComment, {
        threadId,
        authorId: "user_1",
        body: "Hello, world!",
      });

      const result = await t.query(api.threads.getThreads, {
        zoneId,
      });

      expect(result.threads).toHaveLength(1);
      expect(result.threads[0].messageCount).toBe(1);
      expect(result.threads[0].firstMessage?.body).toBe("Hello, world!");
    });
  });

  describe("Messages", () => {
    test("addComment creates a message with parsed mentions", async () => {
      const t = convexTest(schema, modules);

      const zoneId = await t.mutation(api.zones.getOrCreateZone, {
        entityId: "doc_123",
      });

      const threadId = await t.mutation(api.threads.addThread, {
        zoneId,
      });

      const result = await t.mutation(api.messages.addComment, {
        threadId,
        authorId: "user_1",
        body: "Hey @user_2, check this out!",
      });

      expect(result.messageId).toBeDefined();
      expect(result.mentions).toHaveLength(1);
      expect(result.mentions[0].userId).toBe("user_2");
    });

    test("addComment parses links", async () => {
      const t = convexTest(schema, modules);

      const zoneId = await t.mutation(api.zones.getOrCreateZone, {
        entityId: "doc_123",
      });

      const threadId = await t.mutation(api.threads.addThread, {
        zoneId,
      });

      const result = await t.mutation(api.messages.addComment, {
        threadId,
        authorId: "user_1",
        body: "Check out https://convex.dev for more info",
      });

      expect(result.links).toHaveLength(1);
      expect(result.links[0].url).toBe("https://convex.dev");
    });

    test("getMessages returns paginated messages", async () => {
      const t = convexTest(schema, modules);

      const zoneId = await t.mutation(api.zones.getOrCreateZone, {
        entityId: "doc_123",
      });

      const threadId = await t.mutation(api.threads.addThread, {
        zoneId,
      });

      // Add multiple messages
      for (let i = 1; i <= 5; i++) {
        await t.mutation(api.messages.addComment, {
          threadId,
          authorId: "user_1",
          body: `Message ${i}`,
        });
      }

      // Get first page
      const result = await t.query(api.messages.getMessages, {
        threadId,
        limit: 3,
      });

      expect(result.messages).toHaveLength(3);
      expect(result.hasMore).toBe(true);
      expect(result.nextCursor).toBeDefined();
    });
  });

  describe("Reactions", () => {
    test("toggleReaction adds and removes reactions", async () => {
      const t = convexTest(schema, modules);

      const zoneId = await t.mutation(api.zones.getOrCreateZone, {
        entityId: "doc_123",
      });

      const threadId = await t.mutation(api.threads.addThread, {
        zoneId,
      });

      const { messageId } = await t.mutation(api.messages.addComment, {
        threadId,
        authorId: "user_1",
        body: "Great work!",
      });

      // Add reaction
      const result1 = await t.mutation(api.reactions.toggleReaction, {
        messageId,
        userId: "user_2",
        emoji: "👍",
      });

      expect(result1.added).toBe(true);

      // Remove reaction
      const result2 = await t.mutation(api.reactions.toggleReaction, {
        messageId,
        userId: "user_2",
        emoji: "👍",
      });

      expect(result2.added).toBe(false);
    });

    test("getReactions returns grouped reactions", async () => {
      const t = convexTest(schema, modules);

      const zoneId = await t.mutation(api.zones.getOrCreateZone, {
        entityId: "doc_123",
      });

      const threadId = await t.mutation(api.threads.addThread, {
        zoneId,
      });

      const { messageId } = await t.mutation(api.messages.addComment, {
        threadId,
        authorId: "user_1",
        body: "Great work!",
      });

      // Add multiple reactions
      await t.mutation(api.reactions.addReaction, {
        messageId,
        userId: "user_2",
        emoji: "👍",
      });
      await t.mutation(api.reactions.addReaction, {
        messageId,
        userId: "user_3",
        emoji: "👍",
      });
      await t.mutation(api.reactions.addReaction, {
        messageId,
        userId: "user_2",
        emoji: "❤️",
      });

      const reactions = await t.query(api.reactions.getReactions, {
        messageId,
        currentUserId: "user_2",
      });

      expect(reactions).toHaveLength(2);

      const thumbsUp = reactions.find((r) => r.emoji === "👍");
      expect(thumbsUp?.count).toBe(2);
      expect(thumbsUp?.includesMe).toBe(true);
    });
  });

  describe("Typing Indicators", () => {
    test("setIsTyping creates and clears indicators", async () => {
      const t = convexTest(schema, modules);

      const zoneId = await t.mutation(api.zones.getOrCreateZone, {
        entityId: "doc_123",
      });

      const threadId = await t.mutation(api.threads.addThread, {
        zoneId,
      });

      // Start typing
      await t.mutation(api.typing.setIsTyping, {
        threadId,
        userId: "user_1",
        isTyping: true,
      });

      let typingUsers = await t.query(api.typing.getTypingUsers, {
        threadId,
      });

      expect(typingUsers).toHaveLength(1);
      expect(typingUsers[0].userId).toBe("user_1");

      // Stop typing
      await t.mutation(api.typing.setIsTyping, {
        threadId,
        userId: "user_1",
        isTyping: false,
      });

      typingUsers = await t.query(api.typing.getTypingUsers, {
        threadId,
      });

      expect(typingUsers).toHaveLength(0);
    });
  });
});
