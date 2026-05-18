import { useRef } from "react";
import { gsap, useGSAP } from "../../lib/gsap";

const LOGO      = `${import.meta.env.BASE_URL}assets/clear-modern-logo.png`;
const EHO       = `${import.meta.env.BASE_URL}assets/equal-housing.svg`;
const APPLY_URL = "https://www.clearmodernmortgage.com/loan-officer/chris-gramly/apply-now";

const NAV = [
  { label: "About",     href: "#about"     },
  { label: "Purchase",  href: "#purchase"  },
  { label: "Refinance", href: "#refinance" },
  { label: "Resources", href: "#resources" },
  { label: "Contact",   href: "#contact"   },
];

export default function Footer() {
  const footerRef = useRef<HTMLElement>(null);

  useGSAP(() => {
    gsap.from(".footer-col", {
      opacity: 0,
      y: 28,
      duration: 0.7,
      stagger: 0.09,
      ease: "power3.out",
      scrollTrigger: {
        trigger: footerRef.current,
        start: "top 90%",
        once: true,
      },
    });
    gsap.from(".legal", {
      opacity: 0,
      y: 16,
      duration: 0.6,
      ease: "power2.out",
      scrollTrigger: {
        trigger: ".legal",
        start: "top 96%",
        once: true,
      },
    });
  }, { scope: footerRef });

  return (
    <footer className="site-footer" ref={footerRef}>
      <div className="footer-grid">

        <div className="footer-col">
          <img className="footer-logo" src={LOGO} alt="Clear Modern Mortgage" />
          <p>Chris Gramly, Loan Officer</p>
          <p className="footer-nmls">NMLS #1984074</p>
          <p>Licensed in California &amp; Nevada</p>
          <a
            className="btn primary footer-apply"
            href={APPLY_URL}
            target="_blank"
            rel="noopener noreferrer"
          >
            Apply Now
          </a>
        </div>

        <div className="footer-col">
          <p className="footer-h">Navigate</p>
          {NAV.map((l) => (
            <a key={l.href} href={l.href}>{l.label}</a>
          ))}
        </div>

        <div className="footer-col">
          <p className="footer-h">Company</p>
          <a href="https://www.clearmodernmortgage.com/" target="_blank" rel="noopener noreferrer">
            Clear Modern Mortgage
          </a>
          <a
            href="https://www.clearmodernmortgage.com/loan-officer/chris-gramly"
            target="_blank"
            rel="noopener noreferrer"
          >
            Chris's Profile
          </a>
          <a href="https://www.apmortgage.com" target="_blank" rel="noopener noreferrer">
            American Pacific Mortgage
          </a>
        </div>

        <div className="footer-col">
          <p className="footer-h">Contact</p>
          <a href="tel:+17027674072">(702) 767-4072</a>
          <a href="mailto:chris.gramly@clearmtg.com">chris.gramly@clearmtg.com</a>
          <p>
            8751 W Charleston Blvd #220<br />
            Las Vegas, NV 89117
          </p>
        </div>

      </div>

      <div className="legal">
        <img src={EHO} alt="Equal Housing Opportunity" />
        <p>
          &copy; 2026 American Pacific Mortgage Corporation. NMLS #1850196.
          Chris Gramly NMLS #1984074. This material is provided for informational
          purposes only and is not guaranteed to be accurate or complete. Rates,
          terms, programs, and underwriting policies are subject to change without
          notice. This is not an offer to extend credit or a commitment to lend.
          All loans are subject to underwriting approval. Refinancing may result
          in higher total finance charges over the life of the loan. Not available
          in New York.
        </p>
      </div>
    </footer>
  );
}
