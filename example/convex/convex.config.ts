import { defineApp } from "convex/server";
import comments from "@hamzasaleemorg/convex-comments/convex.config";

const app = defineApp();
app.use(comments);

export default app;
