import cors from "cors";
import express, { type NextFunction, type Request, type Response } from "express";
import * as pendo from "pendo-server-sdk";
import { type AuthLocals, requireAuth } from "./auth/require-auth.js";
import { accountsRouter } from "./routes/accounts.js";
import { assistantRouter } from "./routes/assistant.js";
import { authRouter } from "./routes/auth.js";
import { tripsRouter } from "./routes/trips.js";
import { usersRouter } from "./routes/users.js";
import type { ChatRequest } from "./types.js";

/** Builds the Tripwise API: JSON only, no pages of its own. */
export function createApp(corsOrigin: string) {
  const app = express();
  app.use(cors({ origin: corsOrigin }));
  app.use(express.json({ limit: "100kb" }));

  app.get("/health", (_req, res) => {
    res.json({ status: "ok" });
  });
  app.use("/api/auth", authRouter);

  // Everything else needs a signed-in session.
  app.use("/api/trips", requireAuth, tripsRouter);
  app.use("/api/users", requireAuth, usersRouter);
  app.use("/api/accounts", requireAuth, accountsRouter);
  app.use(
    "/api/assistant",
    requireAuth,
    // Names the user and conversation of each Tripwise Assistant turn for Pendo Agent Analytics. Runs after
    // requireAuth, so the signed-in user and account are on res.locals.
    pendo.middleware((req: Request) => {
      const auth = req.res?.locals as Partial<AuthLocals> | undefined;
      const body = req.body as Partial<ChatRequest> | undefined;
      return {
        visitorId: auth?.user?.id, // TODO: map to the visitor id your Pendo web snippet uses
        accountId: auth?.account?.id, // TODO: map to the Pendo account id your Pendo web snippet uses
        conversationId: typeof body?.conversationId === "string" ? body.conversationId : undefined,
      };
    }),
    assistantRouter,
  );

  app.use((_req, res) => {
    res.status(404).json({ error: "not found" });
  });
  app.use((error: unknown, _req: Request, res: Response, _next: NextFunction) => {
    console.error(error);
    res.status(500).json({ error: "something went wrong" });
  });
  return app;
}
