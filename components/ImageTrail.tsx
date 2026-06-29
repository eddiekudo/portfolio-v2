"use client";

import { useEffect, useRef, useState } from "react";

const TRAIL_THRESHOLD = 80;
const STICKER_MOVE_MS = 800;
const STICKER_FADE_DELAY_MS = 400;
const STICKER_TOTAL_MS = 1200;

type Point = {
  x: number;
  y: number;
};

function clamp01(value: number) {
  return Math.max(0, Math.min(1, value));
}

function easeInOutQuad(value: number) {
  return value < 0.5
    ? 2 * value * value
    : 1 - Math.pow(-2 * value + 2, 2) / 2;
}

function easeInOutCubic(value: number) {
  return value < 0.5
    ? 4 * value * value * value
    : 1 - Math.pow(-2 * value + 2, 3) / 2;
}

function lerp(start: number, end: number, amount: number) {
  return start + (end - start) * amount;
}

function distanceBetween(a: Point, b: Point) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

function shuffleImages(images: string[]) {
  const shuffled = images.slice();

  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    const current = shuffled[index];

    shuffled[index] = shuffled[swapIndex];
    shuffled[swapIndex] = current;
  }

  return shuffled;
}

function getPointerPosition(event: MouseEvent | TouchEvent, container: HTMLElement): Point {
  const source = "touches" in event ? event.touches[0] : event;
  const rect = container.getBoundingClientRect();

  return {
    x: source.clientX - rect.left,
    y: source.clientY - rect.top,
  };
}

interface ImageTrailProps {
  containerRef: React.RefObject<HTMLElement | null>;
  images: string[];
  count?: number;
  enabled?: boolean;
  className?: string;
  stickerClass?: string;
  innerClass?: string;
  zIndexStart?: number;
}

export default function ImageTrail({
  containerRef,
  images,
  count = 12,
  enabled = true,
  className = "image-trail",
  stickerClass = "image-trail__sticker",
  innerClass = "image-trail__sticker-inner",
  zIndexStart = 1,
}: ImageTrailProps) {
  const [slots] = useState(() => Array.from({ length: count }, (_, index) => index));
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!enabled) return;

    const container = containerRef.current;
    const root = rootRef.current;

    if (!container || !root) return;

    const stickerElements = Array.from(
      root.querySelectorAll<HTMLElement>("[data-trail-sticker]"),
    );

    if (stickerElements.length === 0) return;

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const stickerOrder = shuffleImages(images);
    const stickerAnimations = new Map<HTMLElement, number>();
    const mousePos = { x: 0, y: 0 };
    const cacheMousePos = { x: 0, y: 0 };
    const lastMousePos = { x: 0, y: 0 };
    const animationFrames = new Set<number>();

    let isTrailRunning = false;
    let trailFrame = 0;
    let stickerIndex = -1;
    let stickerZIndex = zIndexStart;
    let activeStickerCount = 0;

    function requestFrame(callback: FrameRequestCallback) {
      const frame = window.requestAnimationFrame((time) => {
        animationFrames.delete(frame);
        callback(time);
      });

      animationFrames.add(frame);
      return frame;
    }

    function isTrailEnabled() {
      return (
        !reduceMotion.matches &&
        window.innerWidth > 767 &&
        stickerElements.length > 0
      );
    }

    function stopStickerAnimation(sticker: HTMLElement) {
      const runningFrame = stickerAnimations.get(sticker);

      if (!runningFrame) {
        return;
      }

      window.cancelAnimationFrame(runningFrame);
      animationFrames.delete(runningFrame);
      stickerAnimations.delete(sticker);
      activeStickerCount = Math.max(0, activeStickerCount - 1);
    }

    function animateSticker(
      sticker: HTMLElement,
      from: Point,
      to: Point,
      rotation: number,
    ) {
      stopStickerAnimation(sticker);
      activeStickerCount += 1;

      let startTime = 0;

      function step(now: number) {
        if (!startTime) {
          startTime = now;
        }

        const elapsed = now - startTime;
        const moveProgress = easeInOutQuad(clamp01(elapsed / STICKER_MOVE_MS));
        const fadeProgress = easeInOutCubic(
          clamp01((elapsed - STICKER_FADE_DELAY_MS) / STICKER_MOVE_MS),
        );
        const x = lerp(from.x, to.x, moveProgress);
        const y = lerp(from.y, to.y, moveProgress);
        const opacity = 1 - fadeProgress;
        const scale = lerp(1, 0.2, fadeProgress);

        sticker.style.opacity = String(opacity);
        sticker.style.transform = `translate3d(${x}px, ${y}px, 0) rotate(${rotation}deg) scale(${scale})`;

        if (elapsed < STICKER_TOTAL_MS) {
          const frame = requestFrame(step);
          stickerAnimations.set(sticker, frame);
          return;
        }

        sticker.style.opacity = "0";
        sticker.style.transform = `translate3d(${to.x}px, ${to.y}px, 0) rotate(${rotation}deg) scale(0.2)`;
        stickerAnimations.delete(sticker);
        activeStickerCount = Math.max(0, activeStickerCount - 1);
      }

      const frame = requestFrame(step);
      stickerAnimations.set(sticker, frame);
    }

    function showNextSticker() {
      if (!isTrailEnabled()) {
        return;
      }

      stickerZIndex += 1;
      stickerIndex = stickerIndex < stickerElements.length - 1 ? stickerIndex + 1 : 0;

      const sticker = stickerElements[stickerIndex];
      const rect = sticker.getBoundingClientRect();
      const width = rect.width || 220;
      const height = rect.height || 220;
      const from = {
        x: cacheMousePos.x - width / 2,
        y: cacheMousePos.y - height / 2,
      };
      const to = {
        x: mousePos.x - width / 2,
        y: mousePos.y - height / 2,
      };
      const rotationSign = Math.random() < 0.5 ? -1 : 1;
      const rotation = rotationSign * (10 + Math.random() * 10);

      sticker.style.zIndex = String(stickerZIndex);
      animateSticker(sticker, from, to, rotation);
    }

    function renderStickerTrail() {
      if (!isTrailEnabled()) {
        trailFrame = 0;
        return;
      }

      const distance = distanceBetween(mousePos, lastMousePos);

      cacheMousePos.x = lerp(cacheMousePos.x || mousePos.x, mousePos.x, 0.1);
      cacheMousePos.y = lerp(cacheMousePos.y || mousePos.y, mousePos.y, 0.1);

      if (distance > TRAIL_THRESHOLD) {
        showNextSticker();
        lastMousePos.x = mousePos.x;
        lastMousePos.y = mousePos.y;
      }

      if (activeStickerCount === 0 && stickerZIndex !== zIndexStart) {
        stickerZIndex = zIndexStart;
      }

      trailFrame = requestFrame(renderStickerTrail);
    }

    function handleTrailMove(event: MouseEvent | TouchEvent) {
      if (!isTrailEnabled()) {
        return;
      }

      const container = containerRef.current;
      if (!container) {
        return;
      }

      const position = getPointerPosition(event, container);

      mousePos.x = position.x;
      mousePos.y = position.y;

      if (isTrailRunning) {
        return;
      }

      isTrailRunning = true;
      cacheMousePos.x = position.x;
      cacheMousePos.y = position.y;
      lastMousePos.x = position.x;
      lastMousePos.y = position.y;
      trailFrame = requestFrame(renderStickerTrail);
    }

    function stopStickerTrail() {
      if (trailFrame) {
        window.cancelAnimationFrame(trailFrame);
        animationFrames.delete(trailFrame);
        trailFrame = 0;
      }
      isTrailRunning = false;
    }

    container.addEventListener("mousemove", handleTrailMove, { passive: true });
    container.addEventListener("touchmove", handleTrailMove, { passive: true });

    // Initialize sticker backgrounds
    stickerElements.forEach((sticker, index) => {
      const inner = sticker.querySelector<HTMLElement>("[data-trail-sticker-inner]");
      const image = stickerOrder[index % stickerOrder.length];

      if (inner) {
        inner.style.backgroundImage = `url("${image}")`;
      }
    });

    return () => {
      container.removeEventListener("mousemove", handleTrailMove);
      container.removeEventListener("touchmove", handleTrailMove);
      stopStickerTrail();
      stickerAnimations.forEach((frame) => window.cancelAnimationFrame(frame));
      animationFrames.forEach((frame) => window.cancelAnimationFrame(frame));
    };
  }, [containerRef, images, enabled, count, zIndexStart]);

  if (!enabled) return null;

  return (
    <div ref={rootRef} className={className} aria-hidden="true">
      {slots.map((slot) => (
        <div
          className={stickerClass}
          data-trail-sticker
          key={slot}
        >
          <div
            className={innerClass}
            data-trail-sticker-inner
          />
        </div>
      ))}
    </div>
  );
}
