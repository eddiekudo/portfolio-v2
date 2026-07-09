"use client";

import Image from "next/image";
import { useReveal } from "../lib/useReveal";

const socials = [
  { label: "GitHub", href: "https://github.com/eddiekudo" },
  { label: "LinkedIn", href: "https://www.linkedin.com/in/aditya-rawat-bb0640165/" },
  { label: "X/Twitter", href: "https://x.com/agenticeddie" },
];

export default function Contact() {
  const ref = useReveal<HTMLElement>();

  return (
    <section id="contact" ref={ref} className="relative overflow-hidden border-t border-line bg-soft text-white">
      <div className="absolute inset-0 z-0 opacity-10 pointer-events-none">
        <Image
          src="/assets/images/footer-bg.webp"
          alt=""
          fill
          sizes="100vw"
          className="object-cover"
        />
      </div>
      <div className="relative z-10 px-3 pb-[env(safe-area-inset-bottom)] pt-20 md:px-6 md:pt-28">
        <p data-reveal className="text-xs font-bold uppercase text-muted">
          Contact
        </p>
        <h2
          data-reveal
          className="mt-6 text-[15vw] font-bold uppercase leading-[0.9] tracking-[-0.02em] md:text-[10vw]"
        >
          Let&apos;s work
        </h2>

        <div data-reveal className="mt-12">
          <a
            href="mailto:eddiexkudo@gmail.com"
            className="roll-btn inline-flex h-12 items-center gap-3 bg-paper px-6 text-xs font-bold uppercase text-ink"
            data-cursor="open"
          >
            <span className="roll-label">
              <span data-text="eddiexkudo@gmail.com">eddiexkudo@gmail.com</span>
            </span>
            <span className="roll-arrow">↗</span>
          </a>
        </div>

        <footer className="mt-20 flex flex-col gap-4 border-t border-line pt-6 text-xs font-bold uppercase md:mt-28 md:flex-row md:items-center md:justify-between">
          <span className="text-muted py-3">© 2026 Aditya Rawat</span>
          <ul className="flex gap-6">
            {socials.map((social) => (
              <li key={social.label}>
                <a
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="link-reveal inline-block py-3"
                >
                  {social.label}
                </a>
              </li>
            ))}
          </ul>
          <a href="#home" className="link-reveal inline-block py-3">
            Back to top ↑
          </a>
        </footer>

        <div
          className="relative -mx-3 mt-8 flex justify-center overflow-hidden border-t border-line md:-mx-6 md:mt-12"
          aria-hidden="true"
        >
          <Image
            src="/assets/images/bg-portfolio.webp"
            alt=""
            width={1650}
            height={642}
            sizes="100vw"
            className="h-auto w-[67%] max-w-none"
          />
        </div>
      </div>
    </section>
  );
}
