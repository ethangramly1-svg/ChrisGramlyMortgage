import { useRef } from "react";
import { gsap, useGSAP } from "../../lib/gsap";

const ITEMS = [
  {
    num: "01",
    label: "Loan Programs",
    desc: "Conventional, FHA, VA, jumbo, and specialty options — compared plainly.",
    href: "https://www.clearmodernmortgage.com/loan-programs",
  },
  {
    num: "02",
    label: "Loan Process",
    desc: "A plain-language walkthrough of every step from application to closing.",
    href: "https://www.clearmodernmortgage.com/loan-process",
  },
  {
    num: "03",
    label: "Mortgage Basics",
    desc: "Key terms, how rates work, and what drives your monthly payment.",
    href: "https://www.clearmodernmortgage.com/mortgage-basics",
  },
  {
    num: "04",
    label: "Calculators",
    desc: "Tools for estimating payments, affordability, and refinance savings.",
    href: "https://www.clearmodernmortgage.com/mortgage-calculators",
  },
  {
    num: "05",
    label: "Online Forms",
    desc: "Secure document upload and application materials in one place.",
    href: "https://www.clearmodernmortgage.com/online-forms",
  },
  {
    num: "06",
    label: "FAQ",
    desc: "Answers to the questions Chris hears most — before, during, and after closing.",
    href: "https://www.clearmodernmortgage.com/faq",
  },
];

export default function Resources() {
  const sectionRef  = useRef<HTMLElement>(null);
  const listRef     = useRef<HTMLDivElement>(null);
  const footerRef   = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    gsap.from(".res-header", {
      opacity: 0,
      y: 28,
      duration: 0.7,
      stagger: 0.08,
      ease: "power3.out",
      scrollTrigger: {
        trigger: sectionRef.current,
        start: "top 82%",
        once: true,
      },
    });

    gsap.from(listRef.current!.querySelectorAll("a"), {
      opacity: 0,
      y: 18,
      duration: 0.5,
      stagger: 0.065,
      ease: "power2.out",
      scrollTrigger: {
        trigger: listRef.current,
        start: "top 85%",
        once: true,
      },
    });

    gsap.from(footerRef.current, {
      opacity: 0,
      y: 16,
      duration: 0.6,
      ease: "power2.out",
      scrollTrigger: {
        trigger: footerRef.current,
        start: "top 92%",
        once: true,
      },
    });
  }, { scope: sectionRef });

  return (
    <section id="resources" ref={sectionRef}>
      <p className="eyebrow res-header">Resources</p>
      <h2 className="res-header">Clear next steps for every stage.</h2>
      <p className="lede res-header">
        Programs, process guides, and reference tools — sourced directly from
        Clear Modern Mortgage and organized so you can find what you need, fast.
      </p>

      <div className="resource-list" ref={listRef}>
        {ITEMS.map((r) => (
          <a key={r.num} href={r.href} target="_blank" rel="noopener noreferrer">
            <span className="num">{r.num}</span>
            <span className="res-content">
              <span className="lbl">{r.label}</span>
              <span className="res-desc">{r.desc}</span>
            </span>
            <span className="arrow">Open →</span>
          </a>
        ))}
      </div>

      <div className="res-footer" ref={footerRef}>
        <p className="res-footer-text">
          Questions about any of these topics? Chris is a direct call or message away.
        </p>
        <a href="#contact" className="btn dark-ghost">
          Get in Touch
        </a>
      </div>
    </section>
  );
}
