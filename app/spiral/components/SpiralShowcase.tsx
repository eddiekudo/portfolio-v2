'use client'

import Image from 'next/image'
import React, { useEffect, useRef, useState } from 'react'
import { projects, type Project } from '../data/projects'
import { SpiralShowcaseEngine } from '../utils/spiralEngine'

interface SpiralShowcaseProps {
  scrollProgressRef: React.RefObject<number>
  onProjectClick: (slug: string) => void
}

export default function SpiralShowcase({ scrollProgressRef, onProjectClick }: SpiralShowcaseProps) {
  const canvasHost = useRef<HTMLDivElement>(null)
  const [hoveredProject, setHoveredProject] = useState<Project | null>(null)
  const [webglUnavailable, setWebglUnavailable] = useState(false)

  useEffect(() => {
    const host = canvasHost.current
    if (!host) return

    const engine = new SpiralShowcaseEngine({
      canvasHost: host,
      projects,
      scrollProgressRef: scrollProgressRef as { readonly current: number },
      onProjectClick,
      onHoverChange: (project) => {
        setHoveredProject(project)
      },
      onWebGLUnavailable: () => {
        setWebglUnavailable(true)
      }
    })

    return () => {
      engine.destroy()
    }
  }, [scrollProgressRef, onProjectClick])

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: `
        .spiral-stage {
          inset: 0;
          opacity: 1;
          position: absolute;
          touch-action: pan-y pinch-zoom;
          z-index: 10;
        }

        .project-hover-overlay {
          align-items: center;
          bottom: 60px;
          display: flex;
          justify-content: center;
          left: 0;
          pointer-events: none;
          position: absolute;
          right: 0;
          z-index: 20;
          transition:
            opacity 0.35s cubic-bezier(0.455, 0.03, 0.515, 0.955),
            transform 0.35s cubic-bezier(0.455, 0.03, 0.515, 0.955);
        }

        .project-hover-content {
          align-items: center;
          background: #fafafa;
          border-radius: 14px;
          color: #0a0a0a;
          display: flex;
          gap: 12px;
          max-width: 400px;
          overflow: hidden;
          padding: 6px 16px 6px 6px;
          box-shadow: 0 10px 30px rgba(0,0,0,0.5);
        }

        .project-hover-content img {
          background: #0a0a0a;
          border-radius: 9px;
          height: 48px;
          object-fit: cover;
          width: 48px;
        }

        .project-hover-content h2 {
          font-size: 18px;
          font-weight: 500;
          margin: 0;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        @media (max-width: 900px) {
          .project-hover-overlay {
            display: none;
          }
        }

        .spiral-fallback {
          align-items: center;
          background:
            linear-gradient(90deg, rgba(255, 255, 255, 0.08) 1px, transparent 1px),
            linear-gradient(0deg, rgba(255, 255, 255, 0.08) 1px, transparent 1px),
            #090909;
          background-size: 64px 64px;
          display: grid;
          grid-template-columns: minmax(0, 0.72fr) minmax(280px, 1fr);
          gap: 24px;
          inset: 0;
          overflow: hidden;
          padding: 24px 0;
          position: absolute;
          z-index: 10;
        }

        .spiral-fallback__copy {
          align-self: end;
          color: #ffffff;
          max-width: 320px;
          padding: 0 0 56px 12px;
          text-transform: uppercase;
        }

        .spiral-fallback__copy p {
          color: #9f9f9f;
          font-size: 11px;
          font-weight: 700;
          line-height: 1.35;
          margin: 10px 0 0;
        }

        .spiral-fallback__copy strong {
          display: block;
          font-size: 12px;
          font-weight: 700;
          line-height: 1;
        }

        .spiral-fallback__grid {
          display: grid;
          gap: 8px;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          transform: rotate(-7deg) translateX(6%);
        }

        .spiral-fallback__card {
          aspect-ratio: 16 / 10;
          background-color: #161616;
          background-position: center;
          background-size: cover;
          border: 1px solid rgba(255, 255, 255, 0.22);
          color: #ffffff;
          cursor: pointer;
          display: flex;
          min-height: 160px;
          overflow: hidden;
          padding: 0;
          position: relative;
          text-align: left;
          touch-action: manipulation;
          transition:
            border-color 0.2s ease,
            transform 0.2s ease;
        }

        .spiral-fallback__card::after {
          background: linear-gradient(180deg, transparent 35%, rgba(0, 0, 0, 0.78));
          content: "";
          inset: 0;
          position: absolute;
        }

        .spiral-fallback__card:hover,
        .spiral-fallback__card:focus-visible {
          border-color: #ffffff;
          transform: translateY(-4px);
        }

        .spiral-fallback__card:focus-visible {
          outline: 2px solid #ffffff;
          outline-offset: 3px;
        }

        .spiral-fallback__card span {
          align-self: flex-end;
          font-size: 12px;
          font-weight: 700;
          line-height: 1;
          padding: 12px;
          position: relative;
          text-transform: uppercase;
          z-index: 1;
        }

        @media (max-width: 900px) {
          .spiral-fallback {
            align-content: center;
            grid-template-columns: 1fr;
            padding: 16px 12px 72px;
          }

          .spiral-fallback__copy {
            align-self: auto;
            padding: 0;
          }

          .spiral-fallback__grid {
            transform: none;
          }

          .spiral-fallback__card {
            min-height: 118px;
          }
        }
      ` }} />

      {webglUnavailable ? (
        <section className="spiral-fallback" aria-label="Project showcase">
          <div className="spiral-fallback__copy">
            <strong>WebGL unavailable</strong>
            <p>Enable browser graphics acceleration to view the real 3D spiral.</p>
          </div>
          <div className="spiral-fallback__grid">
            {projects.map((project) => (
              <button
                key={project.slug}
                type="button"
                className="spiral-fallback__card"
                style={{ backgroundImage: `url(${project.thumbnail})` }}
                onClick={() => onProjectClick(project.slug)}
                data-cursor="view"
              >
                <span>{project.title}</span>
              </button>
            ))}
          </div>
        </section>
      ) : (
        <div className="relative w-full h-full">
          <div
            ref={canvasHost}
            className="spiral-stage"
            role="application"
            aria-label="Interactive spiral project showcase"
          />
          {/* CSS Edge Fade Overlay */}
          <div className="pointer-events-none absolute inset-0 z-20 bg-gradient-to-b from-[#090909] via-transparent via-20% to-[#090909] to-80%" />
        </div>
      )}

      {!webglUnavailable && (
        <div
          className={`project-hover-overlay ${
            hoveredProject ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-4 scale-95'
          }`}
          aria-live="polite"
        >
          {hoveredProject && (
            <div className="project-hover-content">
              <Image src={hoveredProject.thumbnail} alt="" width={48} height={48} sizes="48px" />
              <h2>{hoveredProject.title}</h2>
            </div>
          )}
        </div>
      )}
    </>
  )
}
