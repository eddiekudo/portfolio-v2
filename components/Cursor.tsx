"use client";

import { useEffect, useRef } from "react";
import { gsap } from "../lib/gsap";

export default function Cursor() {
  const bubbleRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Skip on mobile/touch devices
    const isTouchDevice =
      window.matchMedia("(pointer: coarse)").matches ||
      window.matchMedia("(hover: none)").matches ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (isTouchDevice) return;

    const cursorBubble = bubbleRef.current;
    if (!cursorBubble) return;

    // Add HTML class to hide the native cursor
    document.documentElement.classList.add("has-custom-cursor");

    // Smooth follow using GSAP quickTo
    const xTo = gsap.quickTo(cursorBubble, "x", {
      duration: 0.5,
      ease: "power3",
    });
    const yTo = gsap.quickTo(cursorBubble, "y", {
      duration: 0.5,
      ease: "power3",
    });

    let currentHoverLabel: string | null = null;
    gsap.set(cursorBubble, { rotation: -30 });

    const updateHoverState = (label: string) => {
      if (currentHoverLabel === label) return;
      currentHoverLabel = label;

      cursorBubble.textContent = label;
      gsap.killTweensOf(cursorBubble, "opacity,scale,rotation");
      gsap.to(cursorBubble, {
        opacity: 1,
        scale: 1,
        rotation: 0,
        duration: 1.7,
        delay: 0.1,
        ease: "elastic.out(1, 0.4)",
      });
    };

    const resetHoverState = () => {
      if (currentHoverLabel === null) return;
      currentHoverLabel = null;

      gsap.killTweensOf(cursorBubble, "opacity,scale,rotation");
      gsap.to(cursorBubble, {
        opacity: 1,
        scale: 0,
        rotation: -30,
        duration: 0.3,
        ease: "sine.inOut",
      });
    };

    const checkHover = (target: HTMLElement | null) => {
      if (!target) {
        resetHoverState();
        return;
      }

      const interactiveEl = target.closest("[data-cursor]") as HTMLElement | null;
      if (interactiveEl) {
        const label = interactiveEl.getAttribute("data-cursor") || "click";
        updateHoverState(label);
        return;
      }

      const defaultClickable = target.closest("a, button, [role='button']") as HTMLElement | null;
      if (defaultClickable) {
        updateHoverState("click");
        return;
      }

      resetHoverState();
    };

    const onMouseMove = (e: MouseEvent) => {
      // Offset the bubble slightly from the pointer tip
      xTo(e.clientX + 13);
      yTo(e.clientY - 43);

      checkHover(e.target as HTMLElement);
    };

    const onMouseOver = (e: MouseEvent) => {
      checkHover(e.target as HTMLElement);
    };

    const onMouseLeave = () => {
      resetHoverState();
    };

    window.addEventListener("mousemove", onMouseMove);
    document.addEventListener("mouseover", onMouseOver);
    document.addEventListener("mouseleave", onMouseLeave);

    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("mouseover", onMouseOver);
      document.removeEventListener("mouseleave", onMouseLeave);
      document.documentElement.classList.remove("has-custom-cursor");
    };
  }, []);

  return (
    <div
      ref={bubbleRef}
      className="cursor-bubble pointer-events-none fixed left-0 top-0 z-[10000] hidden md:block"
      aria-hidden="true"
    >
      click
    </div>
  );
}
