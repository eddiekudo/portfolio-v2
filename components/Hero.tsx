"use client";

import { useEffect, useRef, useState } from "react";
import type { CSSProperties } from "react";
import Image from "next/image";
import dynamic from "next/dynamic";

import { createEddieLaptopScene } from "./EddieHero/createEddieLaptopScene";

const Work = dynamic(() => import("./Work"), { ssr: false });
const ImageTrail = dynamic(() => import("./ImageTrail"), { ssr: false });

const stickerImages = [
  "/preloader-eddie/assets/loader-asset-01-3.webp",
  "/preloader-eddie/assets/loader-asset-02-4.webp",
  "/preloader-eddie/assets/loader-asset-03-5.webp",
  "/preloader-eddie/assets/loader-asset-04-6.webp",
  "/preloader-eddie/assets/loader-asset-05-7.webp",
  "/preloader-eddie/assets/loader-asset-06-8.webp",
  "/preloader-eddie/assets/loader-asset-07-9.webp",
  "/preloader-eddie/assets/loader-asset-08-10.webp",
  "/preloader-eddie/assets/loader-asset-09-chatgpt-image-jun-23-2026-06-27-18-pm.webp",
  "/preloader-eddie/assets/loader-asset-10-loader-1.webp",
  "/preloader-eddie/assets/loader-asset-11-pink-squirt-gun.webp",
  "/preloader-eddie/assets/loader-asset-12-untitled-1.webp",
];

const TAKEOVER_START = 1050;
const TAKEOVER_END = 1200;
const HOVER_X_INTENSITY = 170;
const HOVER_Y_INTENSITY = 115;
const HOVER_EASE = 0.085;

type EddieLayer = {
  src: string;
  depth: number;
  scrollDepth?: number;
  scrollMaxY?: number;
  offsetX?: number;
  offsetY?: number;
  positionX?: string;
  positionY?: string;
  scaleModifier?: number;
};

type LayerStyle = CSSProperties & {
  "--img": string;
  "--pos-x"?: string;
  "--pos-y"?: string;
};

const backLayers: EddieLayer[] = [
  { src: "/hero-eddie/layers/1.webp", depth: 0.03 },
  { src: "/hero-eddie/layers/2.webp", depth: 0.07 },
];

const frontLayers: EddieLayer[] = [
  { src: "/hero-eddie/layers/3.webp", depth: 0.1 },
  {
    src: "/hero-eddie/layers/4.webp",
    depth: 0.16,
    scrollDepth: 0.08,
    offsetX: 20,
  },
  {
    src: "/hero-eddie/layers/5.webp",
    depth: 0.2,
    scrollDepth: 0.11,
    scrollMaxY: 40,
    offsetX: 86,
    offsetY: 96,
    positionX: "left",
    positionY: "top",
  },
  {
    src: "/hero-eddie/layers/6.webp",
    depth: 0.25,
    offsetX: 24,
    positionX: "left",
    positionY: "top",
  },
  {
    src: "/hero-eddie/layers/7.webp",
    depth: 0.32,
    scrollDepth: 0.16,
    scrollMaxY: 125,
    offsetX: 40,
    offsetY: 160,
    positionX: "left",
    positionY: "bottom",
  },
];

const occluderLayer: EddieLayer = {
  src: "/hero-eddie/layers/8.webp",
  depth: 0.36,
  scrollDepth: 0.18,
  scrollMaxY: 120,
  scaleModifier: 0.85,
  offsetY: -40,
};

const clamp = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), max);

const parseNumber = (value: string | undefined, fallback: number) => {
  const parsed = Number.parseFloat(value ?? "");
  return Number.isFinite(parsed) ? parsed : fallback;
};

const smooth = (t: number) => t * t * (3 - 2 * t);

function EddieImageLayer({ layer, isTabletPortrait }: { layer: EddieLayer; isTabletPortrait?: boolean }) {
  const src = isTabletPortrait
    ? layer.src.replace(/\.webp$/, "-tablet.webp")
    : layer.src;

  return (
    <div
      className="layer overflow-hidden"
      data-eddie-layer
      data-depth={layer.depth}
      data-scroll-depth={layer.scrollDepth}
      data-scroll-max-y={layer.scrollMaxY}
      data-offset-x={isTabletPortrait ? undefined : layer.offsetX}
      data-offset-y={isTabletPortrait ? undefined : layer.offsetY}
      data-scale-modifier={layer.scaleModifier}
    >
      <Image
        src={src}
        alt=""
        fill
        sizes="100vw"
        className="object-cover"
        style={{
          objectPosition: isTabletPortrait ? "center center" : `${layer.positionX ?? "center"} ${layer.positionY ?? "center"}`
        }}
      />
    </div>
  );
}

export default function Hero() {
  const sectionRef = useRef<HTMLElement>(null);
  const backStageRef = useRef<HTMLDivElement>(null);
  const frontStageRef = useRef<HTMLDivElement>(null);
  const occluderStageRef = useRef<HTMLDivElement>(null);
  const laptopStageRef = useRef<HTMLDivElement>(null);
  const animationFrameRef = useRef<HTMLDivElement>(null);
  const [revealActive, setRevealActive] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isTabletPortrait, setIsTabletPortrait] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    const checkMobile = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      setIsMobile(width < 768);
      setIsTabletPortrait(
        width >= 768 &&
        width <= 1024 &&
        height > width
      );
    };
    checkMobile();
    window.addEventListener("resize", checkMobile, { passive: true });
    return () => {
      window.removeEventListener("resize", checkMobile);
    };
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      const shouldReveal = window.scrollY > 5;
      setRevealActive((prev) => {
        if (prev !== shouldReveal) {
          return shouldReveal;
        }
        return prev;
      });
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  useEffect(() => {
    if (typeof window !== "undefined" && window.innerWidth < 768) {
      return;
    }
    if (isMobile) return;

    const section = sectionRef.current;
    const laptopStage = laptopStageRef.current;

    if (!section || !laptopStage) return;

    const reducedMotionQuery = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    );
    let reducedMotion = reducedMotionQuery.matches;
    let renderX = 0;
    let renderY = 0;

    const stages = [
      backStageRef.current,
      frontStageRef.current,
      occluderStageRef.current,
    ].filter(Boolean) as HTMLElement[];
    const layers = Array.from(
      section.querySelectorAll<HTMLElement>("[data-eddie-layer]"),
    );

    const onReducedMotionChange = (event: MediaQueryListEvent) => {
      reducedMotion = event.matches;
    };

    const cleanupLaptop = createEddieLaptopScene({
      mount: laptopStage,
      hero: section,
      transitionRoot: section,
      onUpdate: ({ scrollY, time, ambientStrength, mouseX, mouseY }) => {
        if (reducedMotion) {
          for (const layer of layers) {
            layer.style.transform = "none";
          }
          for (const stage of stages) {
            stage.style.opacity = "1";
            stage.style.transform = "none";
          }
          return;
        }

        renderX += (mouseX - renderX) * HOVER_EASE;
        renderY += (mouseY - renderY) * HOVER_EASE;

        const takeover = smooth(
          clamp((scrollY - TAKEOVER_START) / (TAKEOVER_END - TAKEOVER_START), 0, 1),
        );
        const scrollFade = 1 - takeover;

        const maxSwayX = 0.12;
        const maxSwayY = 0.08;
        const swayX = Math.sin(time) * maxSwayX * ambientStrength * scrollFade;
        const swayY = Math.cos(time * 0.7) * maxSwayY * ambientStrength * scrollFade;

        const totalOffsetX = renderX + swayX;
        const totalOffsetY = renderY + swayY;

        for (const layer of layers) {
          const depth = parseNumber(layer.dataset.depth, 0);
          const scrollDepth = parseNumber(layer.dataset.scrollDepth, depth);
          const scrollMaxY = parseNumber(layer.dataset.scrollMaxY, Infinity);
          const offsetX = parseNumber(layer.dataset.offsetX, 0);
          const offsetY = parseNumber(layer.dataset.offsetY, 0);
          const scaleModifier = parseNumber(layer.dataset.scaleModifier, 1);
          const scrollTravelY = Math.min(scrollY * scrollDepth * 0.9, scrollMaxY);
          const x = offsetX - totalOffsetX * depth * HOVER_X_INTENSITY;
          const y = offsetY - totalOffsetY * depth * HOVER_Y_INTENSITY - scrollTravelY;
          const scale = (1 + depth * 0.08) * scaleModifier;

          layer.style.transform = `translate3d(${x.toFixed(2)}px, ${y.toFixed(
            2,
          )}px, 0) scale(${scale})`;
        }

        for (const stage of stages) {
          stage.style.opacity = (1 - takeover * 0.94).toFixed(3);
          stage.style.transform = `scale(${(1 + takeover * 0.12).toFixed(3)})`;
        }
      },
    });

    reducedMotionQuery.addEventListener("change", onReducedMotionChange);

    return () => {
      reducedMotionQuery.removeEventListener("change", onReducedMotionChange);
      cleanupLaptop();
    };
  }, [isMobile]);

  return (
    <section
      id="home"
      ref={sectionRef}
      className="hero-animation"
      aria-labelledby="hero-title"
    >
      <h1 id="hero-title" className="sr-only">
        Aditya Rawat builds cinematic web experiences with interface design,
        GSAP motion, and interactive 3D.
      </h1>

      <div ref={animationFrameRef} className="animation-frame" aria-hidden="true">
        {/* Mobile Background Fallback */}
        <div className="absolute inset-0 block md:hidden">
          <Image
            src="/hero-eddie/hero-section-all-layers.webp"
            alt=""
            fill
            priority
            fetchPriority="high"
            sizes="100vw"
            className="object-cover"
          />
        </div>

        <div ref={backStageRef} className="stage stage-back">
          {backLayers.map((layer) => (
            <EddieImageLayer key={layer.src} layer={layer} isTabletPortrait={isTabletPortrait} />
          ))}
        </div>

        {isMounted && !isMobile && !isTabletPortrait && (
          <ImageTrail
            containerRef={animationFrameRef}
            images={stickerImages}
            zIndexStart={2}
            enabled={!isMobile && !isTabletPortrait}
          />
        )}

        <div ref={laptopStageRef} className="laptop-stage" />

        <div ref={frontStageRef} className="stage stage-front">
          {frontLayers.map((layer) => (
            <EddieImageLayer key={layer.src} layer={layer} isTabletPortrait={isTabletPortrait} />
          ))}
        </div>

        <div ref={occluderStageRef} className="stage stage-occluder">
          <EddieImageLayer layer={occluderLayer} isTabletPortrait={isTabletPortrait} />
        </div>

        <div 
          className="hero-text-container absolute left-[5%] md:left-[6%] lg:left-[8%] bottom-[6%] lg:bottom-[8%] z-[10] max-w-[85%] lg:max-w-[48%] pointer-events-auto select-none"
          style={{ opacity: "var(--text-opacity, 1)" }}
        >
          <p className={`hero-reveal-text ${revealActive ? "reveal-active" : ""}`}>
            Hi, I am{" "}
            <span className="name-group">
              <span className="name-label">Aditya</span>
              <span className="avatar-wrapper">
                <span className="avatar-inner">
                  <Image
                    src="/avatar.webp"
                    alt="Aditya"
                    width={72}
                    height={72}
                    className="avatar-img"
                    priority
                  />
                </span>
              </span>
            </span>{" "}
            <span className="arrow-wrapper">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="arrow-svg">
                <line x1="5" y1="12" x2="19" y2="12"></line>
                <polyline points="12 5 19 12 12 19"></polyline>
              </svg>
            </span>{" "}
            <span className="desc-text">
              and I translate complex logic into beautiful visual stories
            </span>
          </p>
        </div>

        <div className="transition-handoff">
          <div className="transition-handoff__content">
            {isMounted && !isMobile && <Work preview={true} />}
          </div>
        </div>
      </div>
    </section>
  );
}
