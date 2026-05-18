import { useMemo, useRef, useState } from "react";
import { gsap, useGSAP } from "../../lib/gsap";

const REASONS = [
  {
    title: "Rate & Term",
    body: "Reduce your interest rate or shorten your term to build equity faster and pay less overall.",
  },
  {
    title: "Cash-Out",
    body: "Access your home equity for renovations, debt consolidation, or investment — without selling.",
  },
  {
    title: "Payment Relief",
    body: "Extend your term to lower monthly obligations during a career transition or financial reset.",
  },
];

function fmt(n: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(n);
}

export default function Refinance() {
  const sectionRef = useRef<HTMLElement>(null);

  const [principal, setPrincipal] = useState(520000);
  const [rate,      setRate]      = useState(6.5);
  const [years,     setYears]     = useState(30);

  const { monthly, totalInterest } = useMemo(() => {
    const months = years * 12;
    const mr     = rate / 100 / 12;
    const monthly =
      mr === 0
        ? principal / months
        : (principal * (mr * Math.pow(1 + mr, months))) /
          (Math.pow(1 + mr, months) - 1);
    return { monthly, totalInterest: monthly * months - principal };
  }, [principal, rate, years]);

  useGSAP(() => {
    gsap.from(".refi-anim", {
      opacity: 0,
      y: 32,
      duration: 0.75,
      stagger: 0.09,
      ease: "power3.out",
      scrollTrigger: {
        trigger: sectionRef.current,
        start: "top 82%",
        once: true,
      },
    });

    gsap.from(".calculator", {
      opacity: 0,
      x: 28,
      duration: 0.85,
      ease: "power3.out",
      scrollTrigger: {
        trigger: sectionRef.current,
        start: "top 78%",
        once: true,
      },
    });
  }, { scope: sectionRef });

  return (
    <section id="refinance" ref={sectionRef}>
      <div className="refi-grid">

        {/* Left: context + reasons */}
        <div>
          <p className="eyebrow refi-anim">Refinance</p>
          <h2 className="refi-anim">
            Look at the full picture before you change your loan.
          </h2>
          <p className="lede refi-anim">
            Refinancing may help with rate strategy, monthly payment goals, equity
            access, or long-term planning. The right move depends on your specific
            numbers — not a rule of thumb.
          </p>

          <ul className="refi-reasons refi-anim">
            {REASONS.map((r) => (
              <li key={r.title}>
                <strong>{r.title}</strong> — {r.body}
              </li>
            ))}
          </ul>

          <p className="body refi-anim">
            Use the snapshot to feel out the numbers, then reach out to Chris to
            weigh the tradeoffs for your situation.
          </p>

          <div className="refi-actions refi-anim">
            <a href="#contact" className="btn dark-ghost">
              Talk Through Your Options
            </a>
          </div>
        </div>

        {/* Right: calculator */}
        <div className="calculator" aria-label="Payment snapshot">
          <div className="calc-tag">
            <h3>Payment Snapshot</h3>
            <span>Estimate only</span>
          </div>

          <div className="calc-row">
            <span className="label">Loan amount</span>
            <span className="value">{fmt(principal)}</span>
            <input
              type="range"
              min={150000} max={1200000} step={10000}
              value={principal}
              onChange={(e) => setPrincipal(Number(e.target.value))}
              aria-label="Loan amount"
            />
          </div>

          <div className="calc-row">
            <span className="label">Interest rate</span>
            <span className="value">{rate.toFixed(2)}%</span>
            <input
              type="range"
              min={3} max={9} step={0.125}
              value={rate}
              onChange={(e) => setRate(Number(e.target.value))}
              aria-label="Interest rate"
            />
          </div>

          <div className="calc-row">
            <span className="label">Term</span>
            <span className="value">{years} yr</span>
            <select
              value={years}
              onChange={(e) => setYears(Number(e.target.value))}
              aria-label="Loan term"
            >
              <option value={30}>30 years</option>
              <option value={20}>20 years</option>
              <option value={15}>15 years</option>
            </select>
          </div>

          <div className="calc-result">
            <div>
              <div className="calc-result-label">Monthly payment</div>
              <strong>
                {fmt(monthly)}
                <span className="calc-result-unit">/mo</span>
              </strong>
            </div>
            <div className="calc-result-secondary">
              <div className="calc-result-label">Total interest</div>
              <span className="calc-result-interest">{fmt(totalInterest)}</span>
            </div>
          </div>

          <p className="calc-disclaimer">
            Does not include taxes, insurance, HOA, or escrow.
          </p>
        </div>

      </div>
    </section>
  );
}
