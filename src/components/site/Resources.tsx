const ITEMS = [
  { num: "01", label: "Loan Programs", href: "https://www.clearmodernmortgage.com/loan-programs" },
  { num: "02", label: "Loan Process", href: "https://www.clearmodernmortgage.com/loan-process" },
  { num: "03", label: "Mortgage Basics", href: "https://www.clearmodernmortgage.com/mortgage-basics" },
  { num: "04", label: "Calculators", href: "https://www.clearmodernmortgage.com/mortgage-calculators" },
  { num: "05", label: "Online Forms", href: "https://www.clearmodernmortgage.com/online-forms" },
  { num: "06", label: "FAQ", href: "https://www.clearmodernmortgage.com/faq" }
];

export default function Resources() {
  return (
    <section id="resources" className="section alt">
      <div className="container">
        <p className="eyebrow">Resources</p>
        <h2>Clear next steps for every stage.</h2>
        <p className="lede">
          Programs, process, and reference material — straight from Clear Modern Mortgage.
        </p>

        <div className="resource-list">
          {ITEMS.map((r) => (
            <a key={r.num} href={r.href} target="_blank" rel="noopener">
              <span className="num">{r.num}</span>
              <span className="lbl">{r.label}</span>
              <span className="arrow">Open →</span>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}
