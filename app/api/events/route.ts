import { NextRequest } from "next/server";

import { requireUser } from "@/lib/api-helpers";
import { subscribeToKdsUpdates } from "@/lib/events";

export const dynamic = "force-dynamic";

const HEARTBEAT_MS = 25000;

export async function GET(request: NextRequest) {
  const { response } = await requireUser();
  if (response) return response;

  const encoder = new TextEncoder();

  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      const send = (data: string) => controller.enqueue(encoder.encode(data));

      const unsubscribe = subscribeToKdsUpdates((payload) => {
        send(`data: ${JSON.stringify(payload)}\n\n`);
      });

      const heartbeat = setInterval(() => {
        send(`: ping\n\n`);
      }, HEARTBEAT_MS);

      const cleanup = () => {
        clearInterval(heartbeat);
        unsubscribe();
        try {
          controller.close();
        } catch {
          // already closed by the runtime when the client disconnects
        }
      };

      request.signal.addEventListener("abort", cleanup);
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
