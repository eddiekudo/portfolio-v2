"use client";

import { useEffect, useRef } from "react";
import { gsap } from "../lib/gsap";

export default function Cursor() {
  const dotRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);
  const labelRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (
      window.matchMedia("(pointer: coarse)").matches ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      return;
    }

    const dot = dotRef.current;
    const ring = ringRef.current;
    const label = labelRef.current;
    if (!dot || !ring || !label) return;

    document.documentElement.classList.add("has-custom-cursor");
    gsap.set([dot, ring], { xPercent: -50, yPercent: -50, force3D: true });

    const dotX = gsap.quickTo(dot, "x", { duration: 0.12, ease: "power3" });
    const dotY = gsap.quickTo(dot, "y", { duration: 0.12, ease: "power3" });
    const ringX = gsap.quickTo(ring, "x", { duration: 0.4, ease: "power3" });
    const ringY = gsap.quickTo(ring, "y", { duration: 0.4, ease: "power3" });

    const onMove = (e: MouseEvent) => {
      dotX(e.clientX);
      dotY(e.clientY);
      ringX(e.clientX);
      ringY(e.clientY);
    };

    const onOver = (e: MouseEvent) => {
      const el = e.target as HTMLElement;
      const view = el.closest("[data-cursor='view']");
      const interactive = el.closest("a, button, [data-cursor]");
      gsap.to(ring, {
        scale: view ? 3 : interactive ? 1.8 : 1,
        duration: 0.35,
        ease: "power3.out",
      });
      gsap.to(dot, {
        scale: view || interactive ? 0 : 1,
        duration: 0.35,
        ease: "power3.out",
      });
      gsap.to(label, { opacity: view ? 1 : 0, duration: 0.25 });
    };

    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseover", onOver);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseover", onOver);
      document.documentElement.classList.remove("has-custom-cursor");
    };
  }, []);

  return (
    <>
      <div
        ref={ringRef}
        className="pointer-events-none fixed left-0 top-0 z-[200] hidden h-9 w-9 items-center justify-center rounded-full border border-white mix-blend-difference md:flex"
      >
        <span
          ref={labelRef}
          className="text-[8px] font-bold uppercase tracking-wide opacity-0"
        >
          View
        </span>
      </div>
      <div
        ref={dotRef}
        className="pointer-events-none fixed left-0 top-0 z-[200] hidden h-1.5 w-1.5 rounded-full bg-white mix-blend-difference md:block"
      />
    </>
  );
}
