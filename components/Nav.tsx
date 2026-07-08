"use client";

import { useState, useEffect } from "react";

const links = [
  { href: "#work", label: "Skills" },
  { href: "#about", label: "About" },
  { href: "#contact", label: "Contact" },
];

export default function Nav() {
  const [isOpen, setIsOpen] = useState(false);

  // Disable body scroll when mobile menu is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  return (
    <>
      <header className="fixed inset-x-0 top-0 z-50 border-b border-line bg-ink/85 backdrop-blur pt-[env(safe-area-inset-top)]">
        <nav className="relative flex h-11 items-center justify-between px-3 md:px-6">
          {/* Mobile Menu Button */}
          <button
            type="button"
            onClick={() => setIsOpen(!isOpen)}
            className="flex min-h-[44px] min-w-[44px] items-center justify-center text-xs font-bold uppercase tracking-wider text-white md:hidden z-50 focus:outline-none cursor-pointer"
            aria-label="Toggle navigation menu"
          >
            {isOpen ? "Close" : "Menu"}
          </button>

          {/* Desktop Nav Links */}
          <ul className="hidden items-center gap-6 md:flex">
            {links.map((link) => (
              <li key={link.href}>
                <a
                  href={link.href}
                  className="link-reveal text-xs font-bold uppercase"
                >
                  {link.label}
                </a>
              </li>
            ))}
          </ul>

          {/* Logo (Centered) */}
          <a
            href="#home"
            onClick={() => setIsOpen(false)}
            className="absolute left-1/2 -translate-x-1/2 text-xs font-bold uppercase tracking-tight text-white"
          >
            AdityaRwt®
          </a>

          {/* Right Status */}
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-2 text-xs font-bold uppercase text-muted">
              <span className="h-1.5 w-1.5 bg-[#028D00]" />
              Open to work
            </span>
          </div>
        </nav>
      </header>

      {/* Mobile Full Screen Menu Overlay */}
      <div
        className={`fixed inset-0 z-40 flex flex-col justify-between bg-ink px-6 pt-[calc(6rem+env(safe-area-inset-top))] pb-[calc(3rem+env(safe-area-inset-bottom))] transition-all duration-300 md:hidden ${
          isOpen ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-4 pointer-events-none"
        }`}
      >
        <ul className="flex flex-col gap-8">
          {links.map((link, idx) => (
            <li
              key={link.href}
              className={`transition-all duration-500 transform ${
                isOpen ? "translate-x-0 opacity-100" : "-translate-x-8 opacity-0"
              }`}
              style={{ transitionDelay: `${idx * 100}ms` }}
            >
              <a
                href={link.href}
                onClick={() => setIsOpen(false)}
                className="block py-2 text-4xl font-bold uppercase tracking-tight text-white hover:text-muted transition-colors"
              >
                {link.label}
              </a>
            </li>
          ))}
        </ul>

        <div
          className={`flex flex-col gap-4 border-t border-line pt-8 transition-all duration-500 delay-300 transform ${
            isOpen ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0"
          }`}
        >
          <span className="flex items-center gap-2 text-xs font-bold uppercase text-muted">
            <span className="h-1.5 w-1.5 bg-[#028D00]" />
            Aditya Rawat — Open to work
          </span>
          <p className="text-xs uppercase text-muted/60">
            Frontend Designer & Creative Developer
          </p>
        </div>
      </div>
    </>
  );
}
