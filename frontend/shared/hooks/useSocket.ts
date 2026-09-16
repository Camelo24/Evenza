"use client";

import { useEffect, useState } from "react";
import { io, type Socket } from "socket.io-client";

export type SocketLike = {
  connected: boolean;
  emit: (_event: string, _payload?: unknown) => void;
  on?: (_event: string, _handler: (...args: unknown[]) => void) => void;
  off?: (_event: string, _handler: (...args: unknown[]) => void) => void;
};

/** Connects only in the browser; messages remain usable when the socket service is offline. */
export function useSocket(namespace = "/booking"): SocketLike | null {
  const [socket, setSocket] = useState<Socket | null>(null);

  useEffect(() => {
    const endpoint = process.env.NEXT_PUBLIC_SOCKET_URL;
    if (!endpoint) return;
    const client = io(`${endpoint}${namespace}`, { withCredentials: true, transports: ["websocket", "polling"] });
    setSocket(client);
    return () => {
      client.close();
      setSocket(null);
    };
  }, [namespace]);

  return socket;
}
