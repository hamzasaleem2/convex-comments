/**
 * Comments Component - Main API
 *
 * This file re-exports all public functions from the component.
 * All functions are organized by domain:
 * - zones.ts: Zone management (containers for threads)
 * - threads.ts: Thread management (containers for messages)
 * - messages.ts: Message CRUD with mentions/links parsing
 * - reactions.ts: Emoji reactions
 * - typing.ts: Real-time typing indicators
 */

// Re-export all public functions
export {
  getOrCreateZone,
  listZones,
  getZone,
  getZoneById,
  updateZoneMetadata,
  deleteZone,
} from "./zones.js";

export {
  addThread,
  getOrCreateThread,
  getThread,
  getThreads,
  resolveThread,
  unresolveThread,
  updateThreadPosition,
  deleteThread,
  updateThreadActivity,
} from "./threads.js";

export {
  addComment,
  getMessage,
  getMessages,
  editMessage,
  deleteMessage,
  permanentlyDeleteMessage,
  resolveMessage,
  unresolveMessage,
} from "./messages.js";

export {
  addReaction,
  removeReaction,
  toggleReaction,
  getReactions,
  getReactionUsers,
} from "./reactions.js";

export {
  setIsTyping,
  getTypingUsers,
  clearUserTyping,
} from "./typing.js";
