import { useEffect, useRef, useState } from "react";
import { gsap, useGSAP } from "../../lib/gsap";
import { subscribeScroll } from "../../lib/scroll";

const LOGO      = `${import.meta.env.BASE_URL}assets/clear-modern-logo.png`;
const APPLY_URL = "https://www.clearmodernmortgage.com/loan-officer/chris-gramly/apply-now";

export default function Header() {
  const headerRef = useRef<HTMLElement>(null);
  const [light, setLight] = useState(false);
  const [open,  setOpen]  = useState(false);

  useEffect(() => {
    const unsub = subscribeScroll(({ scrollY, vh }) => {
      setLight(scrollY > vh * 0.98);
    });
    return unsub;
  }, []);

  // Close mobile menu on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (!headerRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  useGSAP(() => {
    const tl = gsap.timeline({ delay: 0.25 });
    tl.from(headerRef.current, {
      y: -72,
      duration: 0.85,
      ease: "power3.out",
    }).from(
      ".main-nav a, .header-cta > *",
      {
        opacity: 0,
        y: -10,
        duration: 0.45,
        stagger: 0.06,
        ease: "power2.out",
      },
      "-=0.55",
    );
  }, { scope: headerRef });

  return (
    <header ref={headerRef} className={`site-header${light ? " is-light" : ""}`}>
      <a className="brand" href="#top" aria-label="Chris Gramly home">
        <img src={LOGO} alt="Clear Modern Mortgage" />
      </a>

      <nav className={`main-nav${open ? " is-open" : ""}`} aria-label="Primary">
        <a href="#about"     onClick={() => setOpen(false)}>About</a>
        <a href="#purchase"  onClick={() => setOpen(false)}>Purchase</a>
        <a href="#refinance" onClick={() => setOpen(false)}>Refinance</a>
        <a href="#resources" onClick={() => setOpen(false)}>Resources</a>
        <a href="#contact"   onClick={() => setOpen(false)}>Contact</a>
      </nav>

      <div className="header-cta">
        <a className="tel" href="tel:+17027674072">(702) 767-4072</a>
        <a className="btn primary" href={APPLY_URL} target="_blank" rel="noopener noreferrer">
          Apply Now
        </a>
        <button
          className="menu-toggle"
          aria-label={open ? "Close menu" : "Open menu"}
          aria-expanded={open}
          onClick={() => setOpen((o) => !o)}
        >
          {open ? (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          ) : (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M4 7h16M4 12h16M4 17h16" />
            </svg>
          )}
        </button>
      </div>
    </header>
  );
}
