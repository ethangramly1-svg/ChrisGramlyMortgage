import { useRef } from "react";
import { gsap, useGSAP } from "../../lib/gsap";

const STEPS = [
  {
    num: "01",
    title: "Pre-Approval Clarity",
    body: "Understand your buying range, required documentation, and realistic timeline before writing an offer. Pre-approval signals seriousness to sellers and locks in your rate window early.",
  },
  {
    num: "02",
    title: "Loan Path Planning",
    body: "Compare conventional, FHA, VA, and jumbo programs. Chris reviews your income, assets, and long-term goals to find which option keeps the most money in your pocket over the life of the loan.",
  },
  {
    num: "03",
    title: "Close With Confidence",
    body: "From conditional approval through signing day — clear next steps, proactive communication, and no surprises at the table. Chris stays reachable at every milestone.",
  },
];

const LOAN_TYPES = [
  {
    name: "Conventional",
    desc: "Strong credit, flexible terms. Ideal for buyers putting 5–20% down with solid income history.",
  },
  {
    name: "FHA",
    desc: "Lower down payment and flexible qualifying standards. A common path for first-time buyers.",
  },
  {
    name: "VA",
    desc: "Zero down payment for eligible veterans and active-duty service members.",
  },
  {
    name: "Jumbo",
    desc: "Financing above conventional limits for higher-value properties across California and Nevada.",
  },
];

export default function Purchase() {
  const sectionRef = useRef<HTMLElement>(null);
  const loansRef  = useRef<HTMLDivElement>(null);
  const ctaRef    = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    gsap.from(".purchase-anim", {
      opacity: 0,
      y: 32,
      duration: 0.7,
      stagger: 0.08,
      ease: "power3.out",
      scrollTrigger: {
        trigger: sectionRef.current,
        start: "top 82%",
        once: true,
      },
    });

    gsap.from(".loan-type", {
      opacity: 0,
      y: 24,
      duration: 0.6,
      stagger: 0.07,
      ease: "power2.out",
      scrollTrigger: {
        trigger: loansRef.current,
        start: "top 88%",
        once: true,
      },
    });

    gsap.from(ctaRef.current, {
      opacity: 0,
      y: 20,
      duration: 0.6,
      ease: "power2.out",
      scrollTrigger: {
        trigger: ctaRef.current,
        start: "top 90%",
        once: true,
      },
    });
  }, { scope: sectionRef });

  return (
    <section id="purchase" ref={sectionRef}>
      <p className="eyebrow purchase-anim">Purchase</p>
      <h2 className="purchase-anim">Start strong before you shop.</h2>
      <p className="lede purchase-anim">
        Three checkpoints that turn a home search into a clean, financed offer.
      </p>

      <div className="steps">
        {STEPS.map((s) => (
          <article key={s.num} className="step purchase-anim">
            <div className="step-num">{s.num}</div>
            <h3>{s.title}</h3>
            <p className="body">{s.body}</p>
          </article>
        ))}
      </div>

      <div className="purchase-loans" ref={loansRef}>
        <p className="purchase-loans-label">Loan programs</p>
        <div className="purchase-loans-grid">
          {LOAN_TYPES.map((l) => (
            <div key={l.name} className="loan-type">
              <h4 className="loan-type-name">{l.name}</h4>
              <p className="loan-type-desc">{l.desc}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="purchase-cta" ref={ctaRef}>
        <p className="purchase-cta-line">
          Ready to make a move? Chris will walk you through your options — no obligation.
        </p>
        <div className="purchase-cta-actions">
          <a
            href="https://www.clearmodernmortgage.com/loan-officer/chris-gramly/apply-now"
            className="btn primary"
            target="_blank"
            rel="noopener noreferrer"
          >
            Get Pre-Approved
          </a>
          <a href="#contact" className="btn dark-ghost">
            Ask a Question
          </a>
        </div>
      </div>
    </section>
  );
}
