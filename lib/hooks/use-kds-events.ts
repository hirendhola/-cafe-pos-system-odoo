"use client"

import * as React from "react"

import type { KdsUpdatePayload } from "@/lib/events"

export function useKdsEvents(onUpdate: (payload: KdsUpdatePayload) => void) {
  const handlerRef = React.useRef(onUpdate)
  handlerRef.current = onUpdate

  React.useEffect(() => {
    const source = new EventSource("/api/events")

    source.onmessage = (event) => {
      try {
        handlerRef.current(JSON.parse(event.data))
      } catch {
        // ignore malformed/heartbeat frames
      }
    }

    return () => source.close()
  }, [])
}
