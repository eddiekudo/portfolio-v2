"use client";

import { useEffect, useRef } from "react";
import { gsap } from "./gsap";

/**
 * Section-level scroll transitions + element reveals.
 *
 * 1. The section itself slides up, scales, and fades in as it enters,
 *    scrubbed to scroll position for a smooth section-to-section handoff.
 * 2. Every element marked with [data-reveal] inside the section reveals
 *    once as it enters the viewport.
 */
export function useReveal<T extends HTMLElement>() {
  const ref = useRef<T>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      if (ref.current) {
        gsap.fromTo(
          ref.current,
          { y: 90, scale: 0.98, opacity: 0.3 },
          {
            y: 0,
            scale: 1,
            opacity: 1,
            ease: "none",
            scrollTrigger: {
              trigger: ref.current,
              start: "top 96%",
              end: "top 50%",
              scrub: 0.6,
            },
          }
        );
      }

      gsap.utils.toArray<HTMLElement>("[data-reveal]").forEach((el) => {
        gsap.fromTo(
          el,
          { y: 48, opacity: 0 },
          {
            y: 0,
            opacity: 1,
            duration: 0.9,
            ease: "power3.out",
            scrollTrigger: { trigger: el, start: "top 88%" },
          }
        );
      });
    }, ref);
    return () => ctx.revert();
  }, []);

  return ref;
}
