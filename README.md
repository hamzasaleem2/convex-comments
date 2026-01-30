# Convex Comments Component

A comments system for Convex with threads, mentions, reactions, and typing indicators. Includes backend functions and optional React UI components.

## Installation

```bash
npm install @hamzasaleemorg/convex-comments
```

Add the component to your Convex app:

```typescript
// convex/convex.config.ts
import { defineApp } from "convex/server";
import comments from "@hamzasaleemorg/convex-comments/convex.config.js";

const app = defineApp();
app.use(comments);

export default app;
```

## Quick Start (5 minutes)

Get comments working in your Convex app:

**1. Create backend functions:**

```typescript
// convex/comments.ts
import { v } from "convex/values";
import { Comments } from "@hamzasaleemorg/convex-comments";
import { mutation, query } from "./_generated/server";
import { components } from "./_generated/api";

const comments = new Comments(components.comments);

// Create a zone for an entity (e.g., a document)
export const createZone = mutation({
  args: { documentId: v.string() },
  handler: async (ctx, args) => {
    return await comments.getOrCreateZone(ctx, { 
      entityId: args.documentId 
    });
  },
});

// Add a comment
export const addComment = mutation({
  args: { 
    threadId: v.string(), 
    userId: v.string(), 
    body: v.string() 
  },
  handler: async (ctx, args) => {
    return await comments.addComment(ctx, {
      threadId: args.threadId,
      authorId: args.userId,
      body: args.body,
    });
  },
});

// Get messages in a thread
export const getMessages = query({
  args: { threadId: v.string() },
  handler: async (ctx, args) => {
    return await comments.getMessages(ctx, { 
      threadId: args.threadId 
    });
  },
});
```

**2. Use in React:**

```typescript
import { useMutation, useQuery } from "convex/react";
import { api } from "../convex/_generated/api";

function CommentThread({ threadId, userId }) {
  const messages = useQuery(api.comments.getMessages, { threadId });
  const addComment = useMutation(api.comments.addComment);

  return (
    <div>
      {messages?.messages.map((msg) => (
        <div key={msg.message._id}>
          <strong>{msg.message.authorId}:</strong> {msg.message.body}
        </div>
      ))}
      <button onClick={() => 
        addComment({ threadId, userId, body: "Hello!" })
      }>
        Add Comment
      </button>
    </div>
  );
}
```

**That's it!** You now have threaded comments with mentions, reactions, and typing indicators available.

See below for the complete API reference and React components.

## Data Model

The component organizes comments into three levels:

- **Zones** - Containers for threads, tied to your entities (documents, tasks, etc.)
- **Threads** - Groups of messages within a zone
- **Messages** - Individual comments with mentions, reactions, and attachments

Each message can have:
- Body text with automatic mention and link parsing
- Attachments (URLs, files, images)
- Emoji reactions
- Resolved state
- Edit history

## Backend Usage

### Method 1: Comments Class

The recommended approach. Provides type-safe methods and optional callbacks.

```typescript
import { Comments } from "@hamzasaleemorg/convex-comments";
import { components } from "./_generated/api";
import { mutation, query } from "./_generated/server";

const comments = new Comments(components.comments);

export const createZone = mutation({
  args: { entityId: v.string() },
  handler: async (ctx, args) => {
    return await comments.getOrCreateZone(ctx, {
      entityId: args.entityId,
    });
  },
});

export const addComment = mutation({
  args: { threadId: v.string(), body: v.string() },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    return await comments.addComment(ctx, {
      threadId: args.threadId,
      authorId: userId,
      body: args.body,
    });
  },
});
```

### Method 2: Direct Component Calls

Call component functions directly through `ctx.runMutation` or `ctx.runQuery`.

```typescript
import { components } from "./_generated/api";

export const addComment = mutation({
  args: { threadId: v.string(), body: v.string() },
  handler: async (ctx, args) => {
    return await ctx.runMutation(components.comments.lib.addComment, {
      threadId: args.threadId,
      authorId: await getAuthUserId(ctx),
      body: args.body,
    });
  },
});
```

### Method 3: Exposed API

Generate wrapper functions for frontend use.

```typescript
import { exposeApi } from "@hamzasaleemorg/convex-comments";
import { components } from "./_generated/api";

export const {
  getThreads,
  addThread,
  addComment,
  toggleReaction,
  setIsTyping,
  getTypingUsers,
} = exposeApi(components.comments, {
  auth: async (ctx, operation) => {
    return await getAuthUserId(ctx);
  },
});
```

## API Reference

### Zones

**getOrCreateZone(ctx, args)**
- Args: `{ entityId: string, metadata?: any }`
- Returns: `Id<"zones">`
- Creates a zone if it doesn't exist, otherwise returns existing zone

**getZone(ctx, args)**
- Args: `{ entityId: string }`
- Returns: Zone or null
- Get zone by entity ID

**deleteZone(ctx, args)**
- Args: `{ zoneId: Id<"zones"> }`
- Deletes zone and all threads/messages within it

### Threads

**addThread(ctx, args)**
- Args: `{ zoneId: Id<"zones">, position?: { x: number, y: number, anchor?: string }, metadata?: any }`
- Returns: `Id<"threads">`
- Creates a new thread in the zone
- The `position` field is **optional** - use it for positioned comments (document editors, design tools, video timestamps). See [#positioned-comments-optional](#positioned-comments-optional) for examples.

**getThreads(ctx, args)**
- Args: `{ zoneId: Id<"zones">, limit?: number, cursor?: string, includeResolved?: boolean }`
- Returns: `{ threads: Thread[], nextCursor?: string, hasMore: boolean }`
- Lists threads with first message preview and pagination

**resolveThread(ctx, args)**
- Args: `{ threadId: Id<"threads">, userId: string }`
- Marks thread as resolved

**unresolveThread(ctx, args)**
- Args: `{ threadId: Id<"threads"> }`
- Reopens a resolved thread

**deleteThread(ctx, args)**
- Args: `{ threadId: Id<"threads"> }`
- Deletes thread and all messages

### Messages

**addComment(ctx, args)**
- Args: `{ threadId: Id<"threads">, authorId: string, body: string, attachments?: Attachment[] }`
- Returns: `{ messageId: Id<"messages">, mentions: Mention[], links: Link[] }`
- Creates message and parses mentions/links automatically

**getMessages(ctx, args)**
- Args: `{ threadId: Id<"threads">, limit?: number, cursor?: string, currentUserId?: string }`
- Returns: `{ messages: Message[], nextCursor?: string, hasMore: boolean }`
- Lists messages with reactions, supports pagination

**editMessage(ctx, args)**
- Args: `{ messageId: Id<"messages">, body: string, authorId?: string }`
- Updates message body

**deleteMessage(ctx, args)**
- Args: `{ messageId: Id<"messages">, authorId?: string }`
- Soft deletes message (marks as deleted, preserves data)

### Reactions

**toggleReaction(ctx, args)**
- Args: `{ messageId: Id<"messages">, userId: string, emoji: string }`
- Returns: `{ added: boolean }`
- Adds reaction if not present, removes if already exists

**addReaction(ctx, args)**
- Args: `{ messageId: Id<"messages">, userId: string, emoji: string }`
- Adds reaction (idempotent)

**removeReaction(ctx, args)**
- Args: `{ messageId: Id<"messages">, userId: string, emoji: string }`
- Removes reaction

**getReactions(ctx, args)**
- Args: `{ messageId: Id<"messages">, currentUserId?: string }`
- Returns grouped reactions with counts and user lists

### Typing Indicators

**setIsTyping(ctx, args)**
- Args: `{ threadId: Id<"threads">, userId: string, isTyping: boolean }`
- Sets typing state, automatically expires after 3 seconds

**getTypingUsers(ctx, args)**
- Args: `{ threadId: Id<"threads">, excludeUserId?: string }`
- Returns list of users currently typing (filters expired)

**clearUserTyping(ctx, args)**
- Args: `{ userId: string }`
- Clears all typing indicators for user

## React Components

Optional UI components for displaying comments.

```typescript
import {
  CommentsProvider,
  Comments,
  Thread,
  Comment,
  AddComment,
} from "@hamzasaleemorg/convex-comments/react";

function App() {
  return (
    <CommentsProvider
      userId={currentUser.id}
      resolveUser={(id) => ({ name: users[id].name })}
      reactionChoices={["👍", "❤️", "😄", "🎉"]}
    >
      <Comments threads={threads} />
    </CommentsProvider>
  );
}
```

### CommentsProvider

Required wrapper that provides configuration to child components.

Props:
- `userId: string | null` - Current user ID
- `resolveUser?: (userId: string) => Promise<{ name: string, avatar?: string }>` - Function to fetch user details
- `reactionChoices?: string[]` - Available emoji reactions
- `canModerate?: boolean` - Whether user can moderate comments
- `styles?: CommentsStyles` - Custom styling

### Comments

Displays list of threads.

Props:
- `threads: Thread[]` - Array of threads to display
- `hasMore?: boolean` - Whether more threads exist
- `onThreadClick?: (threadId: string) => void` - Thread click handler
- `onNewThread?: () => void` - New thread button handler

### Thread

Displays single thread with messages.

Props:
- `thread: Thread` - Thread data
- `messages: Message[]` - Array of messages
- `typingUsers?: TypingUser[]` - Users currently typing
- `onSubmit?: (body: string) => void` - Submit handler
- `onToggleReaction?: (messageId: string, emoji: string) => void`
- `onResolve?: () => void`

### Comment

Displays single message.

Props:
- `comment: Message` - Message data
- `mine?: boolean` - Whether current user authored message
- `onToggleReaction?: (emoji: string) => void`
- `onEdit?: (newBody: string) => void`
- `onDelete?: () => void`

### AddComment

Message composer with mention autocomplete.

Props:
- `onSubmit?: (body: string, attachments?: Attachment[]) => void`
- `onTypingChange?: (isTyping: boolean) => void`
- `mentionableUsers?: MentionableUser[]` - Users for autocomplete
- `placeholder?: string`
- `allowEditing?: boolean`

## Positioned Comments (Optional)

The `position` field in `addThread()` is an **optional feature** for anchoring comments to specific locations. This is useful for:

- Document editors (comment on specific paragraphs)
- Design tools (comment at x/y coordinates on canvas)  
- Video players (comment at specific timestamps)
- Code review (comment on specific line numbers)

### Position Object

```typescript
position?: {
  x: number;        // X coordinate (pixels, percentage, line number, etc.)
  y: number;        // Y coordinate (pixels, percentage, timestamp, etc.)
  anchor?: string;  // Optional identifier (element ID, paragraph, filename)
}
```

### When to Use Position

**Use positioned comments if:**
- Your UI needs to show comments at specific visual locations
- You want to anchor threads to content that can move (paragraphs, code blocks)
- You're building collaborative editing tools
- Comments need to appear as overlays or annotations

**Skip position if:**
- You only need general discussions (like GitHub issue comments)
- All comments appear in a single list/feed
- Location doesn't matter for your use case

### Examples

**Document editor (like Google Docs):**
```typescript
await comments.addThread(ctx, {
  zoneId,
  position: {
    x: 120,              // Pixels from left
    y: 450,              // Pixels from top
    anchor: "para-3"     // Paragraph identifier
  }
});
```

**Design tool (like Figma):**
```typescript
await comments.addThread(ctx, {
  zoneId,
  position: {
    x: 500,              // Canvas X coordinate
    y: 300,              // Canvas Y coordinate
    anchor: "layer-5"    // Layer name
  }
});
```

**Video player:**
```typescript
await comments.addThread(ctx, {
  zoneId,
  position: {
    x: 0,                // Not used for video
    y: 125,              // Timestamp in seconds
    anchor: "timecode"   // Indicates this is a timestamp
  }
});
```

**Code review:**
```typescript
await comments.addThread(ctx, {
  zoneId,
  position: {
    x: 0,                    // Not used
    y: 42,                   // Line number
    anchor: "src/main.ts"    // File path
  }
});
```

### No Position Needed

For simple comment threads (like chat, issue tracking, general discussions), just omit the position field:

```typescript
// Simple thread without position
await comments.addThread(ctx, { zoneId });
```

**Key Point:** The component stores position data but doesn't render it. Your UI decides how to display positioned threads based on the stored coordinates.



## Mention Parsing

Mentions use `@userId` format and are parsed automatically when creating messages.

Supported characters in user IDs:
- Letters and numbers
- Underscores, hyphens, colons

Examples:
- `@alice`
- `@user_123`
- `@clerk:user_abc`

The `addComment` function returns parsed mentions with their positions in the text:

```typescript
{
  mentions: [
    { userId: "alice", start: 0, end: 6 },
    { userId: "bob", start: 11, end: 15 }
  ]
}
```

## Attachments

Messages support attachments with metadata:

```typescript
await comments.addComment(ctx, {
  threadId: "...",
  authorId: "...",
  body: "Attached files",
  attachments: [
    {
      type: "image",
      url: "https://example.com/image.png",
      name: "Screenshot.png",
      mimeType: "image/png",
      size: 145678,
    },
    {
      type: "file",
      url: "https://example.com/doc.pdf",
      name: "Document.pdf",
    },
  ],
});
```

Supported types: `"url"`, `"file"`, `"image"`

## Callbacks

The Comments class accepts optional callbacks for notifications:

```typescript
const comments = new Comments(components.comments, {
  onNewMessage: async ({ messageId, threadId, authorId, body, mentions }) => {
    // Send notification about new message
  },
  onMention: async ({ messageId, mentionedUserId, authorId, body }) => {
    // Send notification to mentioned user
  },
});
```

Both callbacks are triggered automatically when messages are created through the Comments class methods.

## HTTP Routes

Expose comments data through HTTP endpoints:

```typescript
// convex/http.ts
import { httpRouter } from "convex/server";
import { registerRoutes } from "@hamzasaleemorg/convex-comments";
import { components } from "./_generated/api";

const http = httpRouter();
registerRoutes(http, components.comments, {
  pathPrefix: "/api/comments",
});

export default http;
```

Endpoints:
- `GET /api/comments/zones?entityId=...`
- `GET /api/comments/threads?zoneId=...`
- `GET /api/comments/messages?threadId=...`

## Development

```bash
npm install
npm run dev
```

Runs:
- Component build watcher
- Example app with Vite and Convex dev

## Testing

```bash
npm test
```

## License

Apache-2.0
