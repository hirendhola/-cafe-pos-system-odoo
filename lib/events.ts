import { EventEmitter } from "events";

export type KdsUpdatePayload = {
  orderId: string;
  tableId: string | null;
};

const globalForEvents = globalThis as unknown as { kdsEvents: EventEmitter | undefined };

const emitter = globalForEvents.kdsEvents ?? new EventEmitter();
emitter.setMaxListeners(0);

if (process.env.NODE_ENV !== "production") {
  globalForEvents.kdsEvents = emitter;
}

export function emitKdsUpdate(payload: KdsUpdatePayload) {
  emitter.emit("update", payload);
}

export function subscribeToKdsUpdates(listener: (payload: KdsUpdatePayload) => void) {
  emitter.on("update", listener);
  return () => emitter.off("update", listener);
}
