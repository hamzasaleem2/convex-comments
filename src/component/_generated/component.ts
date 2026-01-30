/* eslint-disable */
/**
 * Generated `ComponentApi` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type { FunctionReference } from "convex/server";

/**
 * A utility for referencing a Convex component's exposed API.
 *
 * Useful when expecting a parameter like `components.myComponent`.
 * Usage:
 * ```ts
 * async function myFunction(ctx: QueryCtx, component: ComponentApi) {
 *   return ctx.runQuery(component.someFile.someQuery, { ...args });
 * }
 * ```
 */
export type ComponentApi<Name extends string | undefined = string | undefined> =
  {
    lib: {
      addComment: FunctionReference<
        "mutation",
        "internal",
        {
          attachments?: Array<{
            mimeType?: string;
            name?: string;
            size?: number;
            type: "url" | "file" | "image";
            url: string;
          }>;
          authorId: string;
          body: string;
          threadId: string;
        },
        {
          links: Array<{ end: number; start: number; url: string }>;
          mentions: Array<{ end: number; start: number; userId: string }>;
          messageId: string;
        },
        Name
      >;
      addReaction: FunctionReference<
        "mutation",
        "internal",
        { emoji: string; messageId: string; userId: string },
        string | null,
        Name
      >;
      addThread: FunctionReference<
        "mutation",
        "internal",
        {
          metadata?: any;
          position?: { anchor?: string; x: number; y: number };
          zoneId: string;
        },
        string,
        Name
      >;
      clearUserTyping: FunctionReference<
        "mutation",
        "internal",
        { userId: string },
        number,
        Name
      >;
      deleteMessage: FunctionReference<
        "mutation",
        "internal",
        { authorId?: string; messageId: string },
        null,
        Name
      >;
      deleteThread: FunctionReference<
        "mutation",
        "internal",
        { threadId: string },
        { deletedMessages: number; deletedReactions: number },
        Name
      >;
      deleteZone: FunctionReference<
        "mutation",
        "internal",
        { zoneId: string },
        {
          deletedMessages: number;
          deletedReactions: number;
          deletedThreads: number;
        },
        Name
      >;
      editMessage: FunctionReference<
        "mutation",
        "internal",
        { authorId?: string; body: string; messageId: string },
        {
          links: Array<{ end: number; start: number; url: string }>;
          mentions: Array<{ end: number; start: number; userId: string }>;
        },
        Name
      >;
      getMessage: FunctionReference<
        "query",
        "internal",
        { currentUserId?: string; messageId: string },
        null | {
          message: {
            _creationTime: number;
            _id: string;
            attachments: Array<{
              mimeType?: string;
              name?: string;
              size?: number;
              type: "url" | "file" | "image";
              url: string;
            }>;
            authorId: string;
            body: string;
            createdAt: number;
            editedAt?: number;
            isDeleted: boolean;
            isEdited: boolean;
            links: Array<{ end: number; start: number; url: string }>;
            mentions: Array<{ end: number; start: number; userId: string }>;
            resolved?: boolean;
            resolvedAt?: number;
            resolvedBy?: string;
            threadId: string;
          };
          reactions: Array<{
            count: number;
            emoji: string;
            includesMe: boolean;
            users: Array<string>;
          }>;
        },
        Name
      >;
      getMessages: FunctionReference<
        "query",
        "internal",
        {
          currentUserId?: string;
          cursor?: string;
          includeDeleted?: boolean;
          limit?: number;
          order?: "asc" | "desc";
          threadId: string;
        },
        {
          hasMore: boolean;
          messages: Array<{
            message: {
              _creationTime: number;
              _id: string;
              attachments: Array<{
                mimeType?: string;
                name?: string;
                size?: number;
                type: "url" | "file" | "image";
                url: string;
              }>;
              authorId: string;
              body: string;
              createdAt: number;
              editedAt?: number;
              isDeleted: boolean;
              isEdited: boolean;
              links: Array<{ end: number; start: number; url: string }>;
              mentions: Array<{ end: number; start: number; userId: string }>;
              resolved?: boolean;
              resolvedAt?: number;
              resolvedBy?: string;
              threadId: string;
            };
            reactions: Array<{
              count: number;
              emoji: string;
              includesMe: boolean;
              users: Array<string>;
            }>;
          }>;
          nextCursor?: string;
        },
        Name
      >;
      getOrCreateZone: FunctionReference<
        "mutation",
        "internal",
        { entityId: string; metadata?: any },
        string,
        Name
      >;
      getReactions: FunctionReference<
        "query",
        "internal",
        { currentUserId?: string; messageId: string },
        Array<{
          count: number;
          emoji: string;
          includesMe: boolean;
          users: Array<string>;
        }>,
        Name
      >;
      getReactionUsers: FunctionReference<
        "query",
        "internal",
        { emoji: string; messageId: string },
        Array<string>,
        Name
      >;
      getThread: FunctionReference<
        "query",
        "internal",
        { threadId: string },
        null | {
          _creationTime: number;
          _id: string;
          createdAt: number;
          lastActivityAt: number;
          metadata?: any;
          position?: { anchor?: string; x: number; y: number };
          resolved: boolean;
          resolvedAt?: number;
          resolvedBy?: string;
          zoneId: string;
        },
        Name
      >;
      getThreads: FunctionReference<
        "query",
        "internal",
        {
          cursor?: string;
          includeResolved?: boolean;
          limit?: number;
          zoneId: string;
        },
        {
          hasMore: boolean;
          nextCursor?: string;
          threads: Array<{
            firstMessage: null | {
              _id: string;
              authorId: string;
              body: string;
              createdAt: number;
            };
            messageCount: number;
            thread: {
              _creationTime: number;
              _id: string;
              createdAt: number;
              lastActivityAt: number;
              metadata?: any;
              position?: { anchor?: string; x: number; y: number };
              resolved: boolean;
              resolvedAt?: number;
              resolvedBy?: string;
              zoneId: string;
            };
          }>;
        },
        Name
      >;
      getTypingUsers: FunctionReference<
        "query",
        "internal",
        { excludeUserId?: string; threadId: string },
        Array<{ updatedAt: number; userId: string }>,
        Name
      >;
      getZone: FunctionReference<
        "query",
        "internal",
        { entityId: string },
        null | {
          _creationTime: number;
          _id: string;
          createdAt: number;
          entityId: string;
          metadata?: any;
        },
        Name
      >;
      getZoneById: FunctionReference<
        "query",
        "internal",
        { zoneId: string },
        null | {
          _creationTime: number;
          _id: string;
          createdAt: number;
          entityId: string;
          metadata?: any;
        },
        Name
      >;
      listZones: FunctionReference<
        "query",
        "internal",
        { limit?: number },
        Array<{
          _creationTime: number;
          _id: string;
          createdAt: number;
          entityId: string;
          metadata?: any;
        }>,
        Name
      >;
      permanentlyDeleteMessage: FunctionReference<
        "mutation",
        "internal",
        { messageId: string },
        null,
        Name
      >;
      removeReaction: FunctionReference<
        "mutation",
        "internal",
        { emoji: string; messageId: string; userId: string },
        boolean,
        Name
      >;
      resolveMessage: FunctionReference<
        "mutation",
        "internal",
        { messageId: string; userId: string },
        null,
        Name
      >;
      resolveThread: FunctionReference<
        "mutation",
        "internal",
        { threadId: string; userId: string },
        null,
        Name
      >;
      setIsTyping: FunctionReference<
        "mutation",
        "internal",
        { isTyping: boolean; threadId: string; userId: string },
        null,
        Name
      >;
      toggleReaction: FunctionReference<
        "mutation",
        "internal",
        { emoji: string; messageId: string; userId: string },
        { added: boolean; reactionId?: string },
        Name
      >;
      unresolveMessage: FunctionReference<
        "mutation",
        "internal",
        { messageId: string },
        null,
        Name
      >;
      unresolveThread: FunctionReference<
        "mutation",
        "internal",
        { threadId: string },
        null,
        Name
      >;
      updateThreadActivity: FunctionReference<
        "mutation",
        "internal",
        { threadId: string },
        null,
        Name
      >;
      updateThreadPosition: FunctionReference<
        "mutation",
        "internal",
        {
          position?: { anchor?: string; x: number; y: number };
          threadId: string;
        },
        null,
        Name
      >;
      updateZoneMetadata: FunctionReference<
        "mutation",
        "internal",
        { metadata: any; zoneId: string },
        null,
        Name
      >;
    };
    messages: {
      addComment: FunctionReference<
        "mutation",
        "internal",
        {
          attachments?: Array<{
            mimeType?: string;
            name?: string;
            size?: number;
            type: "url" | "file" | "image";
            url: string;
          }>;
          authorId: string;
          body: string;
          threadId: string;
        },
        {
          links: Array<{ end: number; start: number; url: string }>;
          mentions: Array<{ end: number; start: number; userId: string }>;
          messageId: string;
        },
        Name
      >;
      deleteMessage: FunctionReference<
        "mutation",
        "internal",
        { authorId?: string; messageId: string },
        null,
        Name
      >;
      editMessage: FunctionReference<
        "mutation",
        "internal",
        { authorId?: string; body: string; messageId: string },
        {
          links: Array<{ end: number; start: number; url: string }>;
          mentions: Array<{ end: number; start: number; userId: string }>;
        },
        Name
      >;
      getMessage: FunctionReference<
        "query",
        "internal",
        { currentUserId?: string; messageId: string },
        null | {
          message: {
            _creationTime: number;
            _id: string;
            attachments: Array<{
              mimeType?: string;
              name?: string;
              size?: number;
              type: "url" | "file" | "image";
              url: string;
            }>;
            authorId: string;
            body: string;
            createdAt: number;
            editedAt?: number;
            isDeleted: boolean;
            isEdited: boolean;
            links: Array<{ end: number; start: number; url: string }>;
            mentions: Array<{ end: number; start: number; userId: string }>;
            resolved?: boolean;
            resolvedAt?: number;
            resolvedBy?: string;
            threadId: string;
          };
          reactions: Array<{
            count: number;
            emoji: string;
            includesMe: boolean;
            users: Array<string>;
          }>;
        },
        Name
      >;
      getMessages: FunctionReference<
        "query",
        "internal",
        {
          currentUserId?: string;
          cursor?: string;
          includeDeleted?: boolean;
          limit?: number;
          order?: "asc" | "desc";
          threadId: string;
        },
        {
          hasMore: boolean;
          messages: Array<{
            message: {
              _creationTime: number;
              _id: string;
              attachments: Array<{
                mimeType?: string;
                name?: string;
                size?: number;
                type: "url" | "file" | "image";
                url: string;
              }>;
              authorId: string;
              body: string;
              createdAt: number;
              editedAt?: number;
              isDeleted: boolean;
              isEdited: boolean;
              links: Array<{ end: number; start: number; url: string }>;
              mentions: Array<{ end: number; start: number; userId: string }>;
              resolved?: boolean;
              resolvedAt?: number;
              resolvedBy?: string;
              threadId: string;
            };
            reactions: Array<{
              count: number;
              emoji: string;
              includesMe: boolean;
              users: Array<string>;
            }>;
          }>;
          nextCursor?: string;
        },
        Name
      >;
      permanentlyDeleteMessage: FunctionReference<
        "mutation",
        "internal",
        { messageId: string },
        null,
        Name
      >;
      resolveMessage: FunctionReference<
        "mutation",
        "internal",
        { messageId: string; userId: string },
        null,
        Name
      >;
      unresolveMessage: FunctionReference<
        "mutation",
        "internal",
        { messageId: string },
        null,
        Name
      >;
    };
    reactions: {
      addReaction: FunctionReference<
        "mutation",
        "internal",
        { emoji: string; messageId: string; userId: string },
        string | null,
        Name
      >;
      getReactions: FunctionReference<
        "query",
        "internal",
        { currentUserId?: string; messageId: string },
        Array<{
          count: number;
          emoji: string;
          includesMe: boolean;
          users: Array<string>;
        }>,
        Name
      >;
      getReactionUsers: FunctionReference<
        "query",
        "internal",
        { emoji: string; messageId: string },
        Array<string>,
        Name
      >;
      removeReaction: FunctionReference<
        "mutation",
        "internal",
        { emoji: string; messageId: string; userId: string },
        boolean,
        Name
      >;
      toggleReaction: FunctionReference<
        "mutation",
        "internal",
        { emoji: string; messageId: string; userId: string },
        { added: boolean; reactionId?: string },
        Name
      >;
    };
    threads: {
      addThread: FunctionReference<
        "mutation",
        "internal",
        {
          metadata?: any;
          position?: { anchor?: string; x: number; y: number };
          zoneId: string;
        },
        string,
        Name
      >;
      deleteThread: FunctionReference<
        "mutation",
        "internal",
        { threadId: string },
        { deletedMessages: number; deletedReactions: number },
        Name
      >;
      getThread: FunctionReference<
        "query",
        "internal",
        { threadId: string },
        null | {
          _creationTime: number;
          _id: string;
          createdAt: number;
          lastActivityAt: number;
          metadata?: any;
          position?: { anchor?: string; x: number; y: number };
          resolved: boolean;
          resolvedAt?: number;
          resolvedBy?: string;
          zoneId: string;
        },
        Name
      >;
      getThreads: FunctionReference<
        "query",
        "internal",
        {
          cursor?: string;
          includeResolved?: boolean;
          limit?: number;
          zoneId: string;
        },
        {
          hasMore: boolean;
          nextCursor?: string;
          threads: Array<{
            firstMessage: null | {
              _id: string;
              authorId: string;
              body: string;
              createdAt: number;
            };
            messageCount: number;
            thread: {
              _creationTime: number;
              _id: string;
              createdAt: number;
              lastActivityAt: number;
              metadata?: any;
              position?: { anchor?: string; x: number; y: number };
              resolved: boolean;
              resolvedAt?: number;
              resolvedBy?: string;
              zoneId: string;
            };
          }>;
        },
        Name
      >;
      resolveThread: FunctionReference<
        "mutation",
        "internal",
        { threadId: string; userId: string },
        null,
        Name
      >;
      unresolveThread: FunctionReference<
        "mutation",
        "internal",
        { threadId: string },
        null,
        Name
      >;
      updateThreadActivity: FunctionReference<
        "mutation",
        "internal",
        { threadId: string },
        null,
        Name
      >;
      updateThreadPosition: FunctionReference<
        "mutation",
        "internal",
        {
          position?: { anchor?: string; x: number; y: number };
          threadId: string;
        },
        null,
        Name
      >;
    };
    typing: {
      clearUserTyping: FunctionReference<
        "mutation",
        "internal",
        { userId: string },
        number,
        Name
      >;
      getTypingUsers: FunctionReference<
        "query",
        "internal",
        { excludeUserId?: string; threadId: string },
        Array<{ updatedAt: number; userId: string }>,
        Name
      >;
      setIsTyping: FunctionReference<
        "mutation",
        "internal",
        { isTyping: boolean; threadId: string; userId: string },
        null,
        Name
      >;
    };
    zones: {
      deleteZone: FunctionReference<
        "mutation",
        "internal",
        { zoneId: string },
        {
          deletedMessages: number;
          deletedReactions: number;
          deletedThreads: number;
        },
        Name
      >;
      getOrCreateZone: FunctionReference<
        "mutation",
        "internal",
        { entityId: string; metadata?: any },
        string,
        Name
      >;
      getZone: FunctionReference<
        "query",
        "internal",
        { entityId: string },
        null | {
          _creationTime: number;
          _id: string;
          createdAt: number;
          entityId: string;
          metadata?: any;
        },
        Name
      >;
      getZoneById: FunctionReference<
        "query",
        "internal",
        { zoneId: string },
        null | {
          _creationTime: number;
          _id: string;
          createdAt: number;
          entityId: string;
          metadata?: any;
        },
        Name
      >;
      listZones: FunctionReference<
        "query",
        "internal",
        { limit?: number },
        Array<{
          _creationTime: number;
          _id: string;
          createdAt: number;
          entityId: string;
          metadata?: any;
        }>,
        Name
      >;
      updateZoneMetadata: FunctionReference<
        "mutation",
        "internal",
        { metadata: any; zoneId: string },
        null,
        Name
      >;
    };
  };
