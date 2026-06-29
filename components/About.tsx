"use client";

import Image from "next/image";
import {
  Children,
  useEffect,
  useMemo,
  useRef,
} from "react";
import type { CSSProperties, ReactNode } from "react";

import { gsap, ScrollTrigger } from "../lib/gsap";

function cx(...parts: Array<string | undefined | false | null>) {
  return parts.filter(Boolean).join(" ");
}

type FlowSectionProps = {
  children: ReactNode;
  className?: string;
  innerClassName?: string;
  style?: CSSProperties;
  ariaLabel?: string;
};

const DEFAULT_STYLE: CSSProperties = {};

function FlowSection({
  children,
  className,
  innerClassName,
  style = DEFAULT_STYLE,
  ariaLabel,
}: FlowSectionProps) {
  return (
    <section
      aria-label={ariaLabel}
      data-flow-section
      className={cx(
        "relative min-h-dvh w-full overflow-hidden",
        className,
      )}
    >
      <div
        data-flow-inner
        className={cx(
          "flow-art-container relative flex min-h-dvh w-full flex-col justify-between gap-10 px-3 pb-8 pt-[calc(4rem+env(safe-area-inset-top))] md:px-6 md:pb-10 md:pt-16",
          innerClassName,
        )}
        style={{ transformOrigin: "bottom left", ...style }}
      >
        {children}
      </div>
    </section>
  );
}

type FlowArtProps = {
  children: ReactNode;
  className?: string;
  ariaLabel?: string;
};

function FlowArt({
  children,
  className,
  ariaLabel = "About scroll story",
}: FlowArtProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const childCount = useMemo(() => Children.count(children), [children]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let ctx: gsap.Context | null = null;
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

    const setupGSAP = () => {
      if (ctx) {
        ctx.revert();
        ctx = null;
      }
      if (reduceMotion.matches) return;

      ctx = gsap.context(() => {
        const sections = gsap.utils.toArray<HTMLElement>("[data-flow-section]");

        sections.forEach((section, index) => {
          gsap.set(section, { zIndex: index + 1 });

          const inner = section.querySelector<HTMLElement>("[data-flow-inner]");
          if (!inner) return;

          if (index > 0) {
            gsap.set(inner, { rotation: 30, transformOrigin: "bottom left" });
            gsap.to(inner, {
              rotation: 0,
              ease: "none",
              scrollTrigger: {
                trigger: section,
                start: "top bottom",
                end: "top 25%",
                scrub: true,
              },
            });
          }

          if (index < sections.length - 1) {
            ScrollTrigger.create({
              trigger: section,
              start: "bottom bottom",
              end: "bottom top",
              pin: true,
              pinSpacing: false,
            });
          }
        });

        ScrollTrigger.refresh();
      }, container);
    };

    setupGSAP();
    reduceMotion.addEventListener("change", setupGSAP);

    return () => {
      if (ctx) ctx.revert();
      reduceMotion.removeEventListener("change", setupGSAP);
    };
  }, [childCount]);

  return (
    <div
      ref={containerRef}
      aria-label={ariaLabel}
      className={cx("w-full overflow-x-hidden", className)}
    >
      {children}
    </div>
  );
}

const capabilities = [
  {
    index: "01",
    label: "Interface Design",
    detail: "Sharp responsive screens with hierarchy, rhythm, and restraint.",
  },
  {
    index: "02",
    label: "Motion Systems",
    detail: "Scroll, reveal, and micro-motion tuned to support the work.",
  },
  {
    index: "03",
    label: "Three.js Experiences",
    detail: "Interactive 3D moments with stable cameras and lean rendering.",
  },
  {
    index: "04",
    label: "Frontend Build",
    detail: "Production-ready React and Next.js execution from concept to UI.",
  },
  {
    index: "05",
    label: "Visual Systems",
    detail: "Monochrome editorial compositions with polished interaction.",
  },
];

const stack = [
  { name: "Figma", icon: "/stack-icons/figma.svg" },
  { name: "Next.js", icon: "/stack-icons/nextjs.svg" },
  { name: "TypeScript", icon: "/stack-icons/typescript.svg" },
  { name: "JavaScript", icon: "/stack-icons/javascript.svg" },
  { name: "CSS", icon: "/stack-icons/css.svg" },
  { name: "Tailwind CSS", icon: "/stack-icons/tailwindcss.svg" },
  { name: "Three.js", icon: "/stack-icons/threejs.svg" },
  { name: "GSAP", icon: "/stack-icons/gsap.svg" },
  { name: "React Three Fiber", icon: "/stack-icons/react.svg" },
  { name: "Vite", icon: "/stack-icons/vite.svg" },
];

function ChapterHeader({
  index,
  label,
  meta,
  dark = true,
}: {
  index: string;
  label: string;
  meta: string;
  dark?: boolean;
}) {
  return (
    <header
      className={cx(
        "grid gap-3 border-b pb-4 text-xs font-bold uppercase leading-none md:grid-cols-12",
        dark ? "border-line text-muted" : "border-black/20 text-black/55",
      )}
    >
      <p className="md:col-span-3">{index}</p>
      <p className="md:col-span-6">{label}</p>
      <p className="md:col-span-3 md:text-right">{meta}</p>
    </header>
  );
}

export default function About() {
  return (
    <section id="about" className="relative isolate bg-ink text-paper">
      <FlowArt>
        <FlowSection ariaLabel="About origin" className="bg-ink text-paper">
          <ChapterHeader
            index="01"
            label="Origin"
            meta="Interactive portfolio / 2026"
          />

          <div className="grid min-h-0 flex-1 items-end gap-10 lg:grid-cols-12">
            <div className="lg:col-span-8">
              <p className="text-xs font-bold uppercase leading-none text-muted">
                Hi, I am Aditya Rawat
              </p>
              <h2 className="mt-6 max-w-6xl text-[clamp(3rem,8.5vw,7.5rem)] font-bold uppercase leading-[0.86] tracking-[-0.055em]">
                Creative frontend for immersive digital systems.
              </h2>
            </div>

            <aside
              className="relative min-h-[18rem] border border-line p-4 md:min-h-[24rem] lg:col-span-4"
              aria-label="About visual mark"
            >
              <div
                aria-hidden="true"
                className="absolute left-1/2 top-1/2 h-px w-[calc(100%-2rem)] -translate-x-1/2 bg-line"
              />
              <div
                aria-hidden="true"
                className="absolute left-1/2 top-1/2 h-[calc(100%-2rem)] w-px -translate-y-1/2 bg-line"
              />
              <div className="relative grid h-full grid-cols-2 grid-rows-2 gap-3 text-xs font-bold uppercase leading-none text-muted">
                <span>Design</span>
                <span className="text-right">Code</span>
                <span className="self-end">Motion</span>
                <span className="self-end text-right">3D</span>
              </div>
              <div
                aria-hidden="true"
                className="absolute left-1/2 top-1/2 flex -translate-x-1/2 -translate-y-1/2 items-center gap-3 text-[clamp(4rem,9vw,8rem)] font-bold leading-none tracking-[-0.08em]"
              >
                <span>(</span>
                <span>*</span>
                <span>)</span>
              </div>
            </aside>
          </div>

          <div className="grid gap-4 border-t border-line pt-4 text-sm leading-[1.45] text-muted md:grid-cols-12 md:text-base">
            <p className="md:col-span-4">
              Interfaces where interaction, 3D, and motion feel like one
              designed system.
            </p>
            <p className="md:col-span-4 md:col-start-8">
              Built with a production mindset: responsive structure, measured
              animation, and clear technical execution.
            </p>
          </div>
        </FlowSection>

        <FlowSection
          ariaLabel="About craft"
          className="bg-paper text-ink"
          innerClassName="text-ink"
        >
          <ChapterHeader
            index="02"
            label="Craft"
            meta="Systems / motion / frontend"
            dark={false}
          />

          <div className="grid flex-1 gap-10 lg:grid-cols-12 lg:items-end">
            <div className="lg:col-span-5">
              <p className="text-xs font-bold uppercase leading-none text-black/55">
                What gets designed
              </p>
              <h2 className="mt-6 max-w-xl text-[clamp(2.5rem,6vw,5.75rem)] font-bold uppercase leading-[0.88] tracking-[-0.05em]">
                Motion with purpose. Interfaces with structure.
              </h2>
            </div>

            <div
              className="grid border-y border-black/20 md:grid-cols-2 lg:col-span-7"
              aria-label="About capabilities"
            >
              {capabilities.map((capability) => (
                <article
                  key={capability.index}
                  className="grid gap-6 border-black/20 py-5 md:grid-cols-[3rem_minmax(0,1fr)] md:odd:border-r md:odd:pr-5 md:even:pl-5"
                >
                  <span className="text-xs font-bold uppercase leading-none text-black/45">
                    {capability.index}
                  </span>
                  <div>
                    <h3 className="text-xl font-bold uppercase leading-[0.95] tracking-[-0.02em] md:text-2xl">
                      {capability.label}
                    </h3>
                    <p className="mt-3 max-w-xs text-sm leading-[1.5] text-black/55">
                      {capability.detail}
                    </p>
                  </div>
                </article>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3 border-t border-black/20 pt-4 text-xs font-bold uppercase leading-none text-black/55">
            <p>
              Scroll
              <br />
              Driven
            </p>
            <p>
              Design
              <br />+ Code
            </p>
            <p className="text-right">
              3D
              <br />
              Ready
            </p>
          </div>
        </FlowSection>

        <FlowSection ariaLabel="About toolkit" className="bg-ink text-paper">
          <ChapterHeader
            index="03"
            label="Toolkit"
            meta="Stack / tools / build logic"
          />

          <div className="grid flex-1 gap-10 lg:grid-cols-12 lg:items-end">
            <div className="lg:col-span-5">
              <p className="text-xs font-bold uppercase leading-none text-muted">
                Technical panel
              </p>
              <h2 className="mt-6 max-w-2xl text-[clamp(2.5rem,6vw,5.75rem)] font-bold uppercase leading-[0.88] tracking-[-0.05em]">
                The stack stays visible because the craft is technical.
              </h2>
            </div>

            <div className="lg:col-span-7">
              <ul className="grid grid-cols-2 border-l border-t border-line sm:grid-cols-3 lg:grid-cols-5">
                {stack.map((item, index) => (
                  <li
                    key={item.name}
                    aria-label={item.name}
                    tabIndex={0}
                    className="group relative min-h-[8rem] border-b border-r border-line p-3 outline outline-0 outline-offset-[-1px] outline-paper/0 transition-[background-color,outline-color,transform] duration-200 hover:-translate-y-1 hover:bg-card hover:outline hover:outline-1 hover:outline-paper/50 focus-visible:-translate-y-1 focus-visible:bg-card focus-visible:outline focus-visible:outline-2 focus-visible:outline-paper"
                  >
                    <div className="flex h-full flex-col justify-between gap-6">
                      <span className="text-[10px] font-bold uppercase leading-none text-muted transition-colors duration-200 group-hover:text-paper group-focus-visible:text-paper">
                        {String(index + 1).padStart(2, "0")}
                      </span>
                      <Image
                        src={item.icon}
                        alt=""
                        width={38}
                        height={38}
                        unoptimized
                        className="h-9 w-9 object-contain transition-transform duration-200 group-hover:scale-105 group-focus-visible:scale-105"
                      />
                      <p className="text-xs font-bold uppercase leading-none">
                        {item.name}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="grid gap-4 border-t border-line pt-4 text-sm leading-[1.45] text-muted md:grid-cols-12 md:text-base">
            <p className="md:col-span-4">
              Figma for structure, Next.js for delivery, Three.js for spatial
              work, and GSAP for precise scroll timing.
            </p>
            <p className="md:col-span-4 md:col-start-8">
              The result is a frontend practice built around clarity,
              performance, and controlled cinematic interaction.
            </p>
          </div>
        </FlowSection>
      </FlowArt>
    </section>
  );
}
