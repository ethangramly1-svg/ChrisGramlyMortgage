import { useMemo, useState } from "react";

function fmt(n: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0
  }).format(n);
}

export default function Refinance() {
  const [principal, setPrincipal] = useState(520000);
  const [rate, setRate] = useState(6.5);
  const [years, setYears] = useState(30);

  const monthly = useMemo(() => {
    const months = years * 12;
    const mr = rate / 100 / 12;
    if (mr === 0) return principal / months;
    return (principal * (mr * Math.pow(1 + mr, months))) / (Math.pow(1 + mr, months) - 1);
  }, [principal, rate, years]);

  return (
    <section id="refinance" className="section">
      <div className="container refi-grid">
        <div>
          <p className="eyebrow">Refinance</p>
          <h2>Look at the full picture before changing your loan.</h2>
          <p className="lede">
            Refinancing may help with rate strategy, monthly payment goals, cash flow, or long-term planning. Use the snapshot to feel out the numbers, then call Chris to weigh the tradeoffs.
          </p>
          <p className="body">
            The estimate uses a simple amortization. It does not include taxes, insurance, HOA, or escrow.
          </p>
          <a className="btn ghost" href="https://www.clearmodernmortgage.com/loan-officer/chris-gramly" target="_blank" rel="noopener">View Chris's Profile</a>
        </div>

        <div className="calculator" aria-label="Payment snapshot">
          <div className="calc-tag">
            <h3>Payment Snapshot</h3>
            <span>Estimate only</span>
          </div>

          <div className="calc-row">
            <span className="label">Loan amount</span>
            <span className="value">{fmt(principal)}</span>
            <input
              type="range" min={150000} max={1200000} step={10000}
              value={principal}
              onChange={(e) => setPrincipal(Number(e.target.value))}
              aria-label="Loan amount"
            />
          </div>

          <div className="calc-row">
            <span className="label">Interest rate</span>
            <span className="value">{rate.toFixed(2)}%</span>
            <input
              type="range" min={3} max={9} step={0.125}
              value={rate}
              onChange={(e) => setRate(Number(e.target.value))}
              aria-label="Interest rate"
            />
          </div>

          <div className="calc-row">
            <span className="label">Term</span>
            <span className="value">{years} years</span>
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
            <span className="label">Estimated monthly payment</span>
            <strong>{fmt(monthly)}/mo</strong>
          </div>
        </div>
      </div>
    </section>
  );
}
