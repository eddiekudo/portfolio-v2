"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";

const Cursor = dynamic(() => import("./Cursor"), { ssr: false });

export default function CursorWrapper() {
  const [isMounted, setIsMounted] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    setIsMobile(window.innerWidth < 768);
  }, []);

  if (!isMounted || isMobile) return null;

  return <Cursor />;
}
