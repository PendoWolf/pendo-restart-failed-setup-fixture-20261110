import * as pendo from "pendo-server-sdk";
import { createApp } from "./app.js";

// Pendo Agent Analytics for the Tripwise Assistant (POST /api/assistant/chat): patches the Anthropic client so
// each of the assistant's replies is recorded. Set PENDO_DISABLED=true in the environment to turn it off.
pendo.init({
  apiKey: "b79f27bc-10ac-42e0-8956-ff19fd191e3d",
  agentId: "TIlAaDg8wCV987HkWx3wZn32QrM",
  endpoint: "https://app.pendo-dev.pendo-dev.com",
  autoPatch: true,
});

const port = Number(process.env.PORT) || 3001;
const corsOrigin = process.env.CORS_ORIGIN ?? "http://localhost:5173";

createApp(corsOrigin).listen(port, () => {
  console.log(`Tripwise API on port ${port}, allowing ${corsOrigin}`);
});

// Send Pendo's buffered events before the process exits.
for (const signal of ["SIGINT", "SIGTERM"] as const) {
  process.on(signal, async () => {
    await pendo.shutdown();
    process.exit(0);
  });
}
