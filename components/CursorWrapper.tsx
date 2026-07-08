"use client";

import { useSyncExternalStore } from "react";
import dynamic from "next/dynamic";

const Cursor = dynamic(() => import("./Cursor"), { ssr: false });

const emptySubscribe = () => () => {};
const isMountedStore = {
  subscribe: emptySubscribe,
  getSnapshot: () => true,
  getServerSnapshot: () => false,
};

const isMobileStore = {
  subscribe: (callback: () => void) => {
    window.addEventListener("resize", callback, { passive: true });
    return () => window.removeEventListener("resize", callback);
  },
  getSnapshot: () => window.innerWidth < 768,
  getServerSnapshot: () => false,
};

export default function CursorWrapper() {
  const isMounted = useSyncExternalStore(
    isMountedStore.subscribe,
    isMountedStore.getSnapshot,
    isMountedStore.getServerSnapshot
  );

  const isMobile = useSyncExternalStore(
    isMobileStore.subscribe,
    isMobileStore.getSnapshot,
    isMobileStore.getServerSnapshot
  );

  if (!isMounted || isMobile) return null;

  return <Cursor />;
}

