import { httpRouter } from "convex/server";
import { registerRoutes } from "@hamzasaleemorg/convex-comments";
import { components } from "./_generated/api.js";

const http = httpRouter();

// Register the comments component HTTP routes
// This exposes:
// - GET /api/comments/zones?entityId=...
// - GET /api/comments/threads?zoneId=...
// - GET /api/comments/messages?threadId=...
registerRoutes(http, components.comments, {
  pathPrefix: "/api/comments",
});

export default http;
