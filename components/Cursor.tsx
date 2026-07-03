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

    let isHoveringClickable = false;
    gsap.set(cursorBubble, { rotation: -30 });

    const onMouseMove = (e: MouseEvent) => {
      // Offset the bubble slightly from the pointer tip
      xTo(e.clientX + 13);
      yTo(e.clientY - 43);

      // Check if cursor is over 3D Spiral Showcase
      const target = e.target as HTMLElement;
      const spiralStage = target.closest(".spiral-stage") as HTMLElement | null;

      if (spiralStage) {
        // If the computed cursor is 'pointer', we are hovering a 3D mesh project card
        const isOverMesh = window.getComputedStyle(spiralStage).cursor === "pointer";
        if (isOverMesh && !isHoveringClickable) {
          isHoveringClickable = true;
          cursorBubble.textContent = "view";
          gsap.killTweensOf(cursorBubble, "opacity,scale,rotation");
          gsap.to(cursorBubble, {
            opacity: 1,
            scale: 1,
            rotation: 0,
            duration: 1.7,
            delay: 0.1,
            ease: "elastic.out(1, 0.4)",
          });
        } else if (!isOverMesh && isHoveringClickable) {
          isHoveringClickable = false;
          gsap.killTweensOf(cursorBubble, "opacity,scale,rotation");
          gsap.to(cursorBubble, {
            opacity: 1,
            scale: 0,
            rotation: -30,
            duration: 0.3,
            ease: "sine.inOut",
          });
        }
      }
    };

    const onMouseOver = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      
      // Exclude the 3D stage itself, which is handled dynamically in mousemove
      if (target.closest(".spiral-stage")) return;

      const clickableSelector =
        "a, button, [role='button'], .spiral-fallback__card";
      const found = target.closest(clickableSelector) as HTMLElement | null;

      if (found && !isHoveringClickable) {
        isHoveringClickable = true;

        if (found.matches('a[href="#home"]') || found.textContent?.toLowerCase().includes("home")) {
          cursorBubble.textContent = "home";
        } else if (found.matches(".roll-btn") || found.matches('a[href^="mailto:"]')) {
          cursorBubble.textContent = "open";
        } else if (found.matches(".spiral-fallback__card")) {
          cursorBubble.textContent = "view";
        } else {
          cursorBubble.textContent = "click";
        }

        gsap.killTweensOf(cursorBubble, "opacity,scale,rotation");
        gsap.to(cursorBubble, {
          opacity: 1,
          scale: 1,
          rotation: 0,
          duration: 1.7,
          delay: 0.1,
          ease: "elastic.out(1, 0.4)",
        });
      } else if (!found && isHoveringClickable) {
        isHoveringClickable = false;

        gsap.killTweensOf(cursorBubble, "opacity,scale,rotation");
        gsap.to(cursorBubble, {
          opacity: 1,
          scale: 0,
          rotation: -30,
          duration: 0.3,
          ease: "sine.inOut",
        });
      }
    };

    const onMouseLeave = () => {
      if (isHoveringClickable) {
        isHoveringClickable = false;
        gsap.killTweensOf(cursorBubble, "opacity,scale,rotation");
        gsap.to(cursorBubble, {
          opacity: 1,
          scale: 0,
          rotation: -30,
          duration: 0.3,
          ease: "sine.inOut",
        });
      }
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
