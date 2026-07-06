"use client";

import { useEffect, useRef, useState } from "react";
import { gsap, ScrollTrigger } from "../lib/gsap";
import BackgroundGrid from "../app/spiral/components/BackgroundGrid";
import { projects } from "../app/spiral/data/projects";
import dynamic from "next/dynamic";

const SpiralShowcase = dynamic(() => import("../app/spiral/components/SpiralShowcase"), { ssr: false });

interface WorkProps {
  preview?: boolean;
}

export default function Work({ preview = false }: WorkProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const stickyRef = useRef<HTMLDivElement>(null);
  const scrollProgressRef = useRef(0);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (preview) return;
    const trigger = containerRef.current;
    const pinTarget = stickyRef.current;
    if (!trigger || !pinTarget) return;

    // Set up GSAP ScrollTrigger to pin the work viewport during the section's scroll span.
    const ctx = gsap.context(() => {
      const snapPoints = Array.from({ length: projects.length + 1 }, (_, i) => i / projects.length);

      ScrollTrigger.create({
        trigger: trigger,
        start: "top top",
        end: "bottom bottom",
        anticipatePin: 1,
        scrub: 1.0, // Smooth scrubbing
        snap: {
          snapTo: (val) => {
            const threshold = 0.08;
            let closest = val;
            let minDistance = Infinity;

            for (const point of snapPoints) {
              const distance = Math.abs(point - val);
              if (distance < minDistance) {
                minDistance = distance;
                closest = point;
              }
            }

            if (minDistance < threshold) {
              if ((closest === 0 || closest === 1.0) && minDistance > 0.025) {
                return val;
              }
              return closest;
            }

            return val;
          },
          duration: { min: 0.3, max: 0.8 },
          ease: "power2.out",
          delay: 0.2
        },
        onUpdate: (self) => {
          scrollProgressRef.current = self.progress;
        },
      });

      // Animate the reveal of the title bar
      gsap.fromTo(
        ".work-header",
        { y: 30, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.8,
          ease: "power3.out",
          scrollTrigger: {
            trigger: trigger,
            start: "top 80%",
          },
        }
      );
    }, containerRef);

    return () => ctx.revert();
  }, [preview]);



  return (
    <section
      id={preview ? undefined : "work"}
      ref={containerRef}
      className={`relative w-full ${preview ? "h-dvh pointer-events-none" : "h-[200vh] md:h-[300vh] md:-mt-[100vh] z-[5]"} bg-[#090909]`}
      aria-hidden={preview ? "true" : undefined}
    >
      <div
        ref={stickyRef}
        className="work-sticky md:sticky md:top-0 relative grid h-dvh w-full grid-rows-[auto_minmax(0,1fr)_auto] overflow-hidden px-3 pb-[calc(5.5rem+env(safe-area-inset-bottom))] pt-[calc(3.75rem+env(safe-area-inset-top))] md:px-6 md:pt-16 md:pb-10"
      >
        <BackgroundGrid />

        <div className="work-header relative z-20 flex min-h-11 items-end justify-between border-b border-white/20 pb-3">
          <h2 className="text-xs font-bold uppercase tracking-wider text-white">Skills</h2>
          <span className="text-xs font-bold uppercase text-muted">
            (0{projects.length})
          </span>
        </div>

        {/* 3D Spiral Showcase Canvas Container */}
        <div className="relative min-h-0 w-full overflow-hidden">
          {isMounted && (
            <SpiralShowcase
              scrollProgressRef={scrollProgressRef}
              onProjectClick={() => {}}
            />
          )}
        </div>

        {/* Dynamic Footer Scroll Prompt */}
        <div className="relative z-20 flex min-w-0 justify-end pt-3 pr-16 text-[11px] leading-none font-bold text-muted uppercase sm:pr-0 sm:text-xs">
          <span className="min-w-0 animate-pulse truncate sm:text-right">Scroll down to explore ↓</span>
        </div>
      </div>
    </section>
  );
}
