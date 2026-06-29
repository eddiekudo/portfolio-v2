"use client";

import { useEffect, useRef, useState } from "react";
import ImageTrail from "./ImageTrail";

const TOTAL_MS = 5000;
const REDUCED_MOTION_TOTAL_MS = 900;
const END_FADE_DELAY_MS = 210;

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

const leftNumbers = Array.from({ length: 10 }, (_, index) => index);
const rightNumbers = [0, 9, 5, 4, 6, 8, 5, 4, 6, 9];

export default function Preloader() {
  const rootRef = useRef<HTMLDivElement>(null);
  const [isRemoved, setIsRemoved] = useState(false);
  const [isComplete, setIsComplete] = useState(false);

  useEffect(() => {
    const root = rootRef.current;

    if (!root) return;

    const squareContainer = root.querySelector<HTMLElement>(
      "[data-preloader-square]",
    )!;
    const squareLeft = root.querySelector<HTMLElement>(
      "[data-preloader-square-left]",
    )!;
    const squareRight = root.querySelector<HTMLElement>(
      "[data-preloader-square-right]",
    )!;
    const leftColumn = root.querySelector<HTMLElement>(
      "[data-preloader-left-column]",
    )!;
    const rightColumn = root.querySelector<HTMLElement>(
      "[data-preloader-right-column]",
    )!;
    const leftDigitNodes = root.querySelectorAll<HTMLElement>(
      "[data-preloader-left-digit]",
    );
    const rightDigitNodes = root.querySelectorAll<HTMLElement>(
      "[data-preloader-right-digit]",
    );

    if (
      !squareContainer ||
      !squareLeft ||
      !squareRight ||
      !leftColumn ||
      !rightColumn
    ) {
      return;
    }

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const timeoutIds: number[] = [];
    const animationFrames = new Set<number>();

    let lastDecade = -1;
    let isCompleteLocal = false;
    let tickFrame = 0;

    function requestFrame(callback: FrameRequestCallback) {
      const frame = window.requestAnimationFrame((time) => {
        animationFrames.delete(frame);
        callback(time);
      });

      animationFrames.add(frame);
      return frame;
    }

    function addTimeout(callback: () => void, delay: number) {
      const timeout = window.setTimeout(() => {
        const index = timeoutIds.indexOf(timeout);

        if (index >= 0) {
          timeoutIds.splice(index, 1);
        }

        callback();
      }, delay);

      timeoutIds.push(timeout);
      return timeout;
    }

    function setColumnState(percent: number) {
      const isDesktop = window.innerWidth > 767;
      const decade = Math.floor(percent / 10);

      if (percent > 2) {
        leftColumn.style.opacity = "1";
        rightColumn.style.opacity = "1";
      }

      if (decade === lastDecade) {
        return;
      }

      lastDecade = decade;

      const topShift = -45 * (decade / 9);
      const leftYOffset = -(decade * 100) / leftDigitNodes.length;
      const rightYOffset = -(decade * 100) / rightDigitNodes.length;

      leftColumn.style.left = isDesktop ? "50%" : "70%";
      leftColumn.style.top = isDesktop ? `${topShift}%` : `${topShift - 10}%`;
      leftColumn.style.transform = isDesktop
        ? `translate(-50%, ${leftYOffset}%)`
        : `translate(30%, ${leftYOffset}%)`;

      rightColumn.style.top = isDesktop ? `${topShift - 65}%` : `${topShift - 45}%`;
      rightColumn.style.transform = `translate(-55%, ${rightYOffset}%)`;
    }

    function completeLoader() {
      if (isCompleteLocal) {
        return;
      }

      isCompleteLocal = true;
      setIsComplete(true);
      leftColumn.style.opacity = "0";
      rightColumn.style.opacity = "0";
      leftColumn.style.transform = "translate(-50%, -100%)";
      rightColumn.style.transform = "translate(-55%, -100%)";

      addTimeout(() => {
        const rect = squareLeft.getBoundingClientRect();

        squareRight.classList.add("is-collapsed");
        squareContainer.classList.add("is-dot-container");

        squareLeft.style.position = "fixed";
        squareLeft.style.left = `${rect.left}px`;
        squareLeft.style.top = `${rect.top}px`;
        squareLeft.style.width = `${rect.width}px`;
        squareLeft.style.height = `${rect.height}px`;
        squareLeft.style.transform = "translate3d(0, 0, 0)";

        requestFrame(() => {
          squareLeft.style.left = "50%";
          squareLeft.style.top = "50%";
          squareLeft.style.width = "1rem";
          squareLeft.style.height = "1rem";
          squareLeft.style.borderRadius = "50%";
          squareLeft.style.backgroundColor = "var(--preloader-difference)";
          squareLeft.style.transform = "translate(-50%, -50%)";
          root!.classList.add("is-hiding");

          addTimeout(() => setIsRemoved(true), 650);
        });
      }, END_FADE_DELAY_MS);
    }

    function tick(startTime: number, now: number) {
      const duration = reduceMotion.matches ? REDUCED_MOTION_TOTAL_MS : TOTAL_MS;
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const percent = Math.ceil(progress * 99);

      setColumnState(percent);

      if (progress < 1) {
        tickFrame = requestFrame((nextNow) => tick(startTime, nextNow));
        return;
      }

      completeLoader();
    }

    tickFrame = requestFrame((startTime) => tick(startTime, startTime));

    return () => {
      timeoutIds.forEach((timeout) => window.clearTimeout(timeout));
      animationFrames.forEach((frame) => window.cancelAnimationFrame(frame));

      if (tickFrame) {
        window.cancelAnimationFrame(tickFrame);
      }
    };
  }, []);

  if (isRemoved) {
    return null;
  }

  return (
    <div
      ref={rootRef}
      className="portfolio-preloader"
      aria-label="Loading portfolio"
      role="status"
    >
      <div className="portfolio-preloader__square" data-preloader-square>
        <div
          className="portfolio-preloader__square-left"
          data-preloader-square-left
        >
          <div
            className="portfolio-preloader__number-left"
            aria-hidden="true"
            data-preloader-left-column
          >
            {leftNumbers.map((number) => (
              <span
                className="portfolio-preloader__number"
                data-preloader-left-digit
                key={number}
              >
                {number}
              </span>
            ))}
          </div>
        </div>

        <div
          className="portfolio-preloader__square-right"
          data-preloader-square-right
        >
          <div
            className="portfolio-preloader__number-right"
            aria-hidden="true"
            data-preloader-right-column
          >
            {rightNumbers.map((number, index) => (
              <span
                className="portfolio-preloader__number"
                data-preloader-right-digit
                key={`${number}-${index}`}
              >
                {number}
              </span>
            ))}
          </div>
        </div>
      </div>

      <ImageTrail
        containerRef={rootRef}
        images={stickerImages}
        enabled={!isComplete}
        className="portfolio-preloader__stickers"
        stickerClass="portfolio-preloader__sticker"
        innerClass="portfolio-preloader__sticker-inner"
      />
    </div>
  );
}
