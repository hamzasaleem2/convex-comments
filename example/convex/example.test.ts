import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { initConvexTest } from "./setup.test";
import { api } from "./_generated/api";

describe("example", () => {
  beforeEach(async () => {
    vi.useFakeTimers();
  });

  afterEach(async () => {
    vi.useRealTimers();
  });

  test("getOrCreateZone and addThread", async () => {
    const t = initConvexTest();
    const entityId = "test-doc-1";

    // Get or create a zone
    const zoneId = await t.mutation(api.example.getOrCreateZone, {
      entityId,
    });
    expect(zoneId).toBeDefined();

    // Add a thread
    const threadId = await t.mutation(api.example.addThread, {
      zoneId,
    });
    expect(threadId).toBeDefined();

    // Get threads
    const result = await t.query(api.example.getThreads, { zoneId });
    expect(result.threads).toHaveLength(1);
  });

  test("addComment with mentions", async () => {
    const t = initConvexTest();

    // Create zone and thread
    const zoneId = await t.mutation(api.example.getOrCreateZone, {
      entityId: "test-doc-2",
    });
    const threadId = await t.mutation(api.example.addThread, {
      zoneId,
    });

    // Add a comment with a mention
    const result = await t.mutation(api.example.addComment, {
      threadId,
      body: "Hello @user123, check this out!",
    });

    expect(result.messageId).toBeDefined();
    expect(result.mentions).toHaveLength(1);
    expect(result.mentions[0].userId).toBe("user123");
  });

  test("toggleReaction", async () => {
    const t = initConvexTest();

    // Create zone, thread, and message
    const zoneId = await t.mutation(api.example.getOrCreateZone, {
      entityId: "test-doc-3",
    });
    const threadId = await t.mutation(api.example.addThread, {
      zoneId,
    });
    const { messageId } = await t.mutation(api.example.addComment, {
      threadId,
      body: "Great work!",
    });

    // Toggle reaction
    const result = await t.mutation(api.example.toggleReaction, {
      messageId,
      emoji: "👍",
    });

    expect(result.added).toBe(true);
  });
});
