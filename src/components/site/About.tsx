import { useRef } from "react";
import { gsap, useGSAP } from "../../lib/gsap";

export default function About() {
  const sectionRef = useRef<HTMLElement>(null);

  useGSAP(() => {
    gsap.from(".about-anim", {
      opacity: 0,
      y: 36,
      duration: 0.75,
      stagger: 0.09,
      ease: "power3.out",
      scrollTrigger: {
        trigger: sectionRef.current,
        start: "top 82%",
        once: true,
      },
    });

    gsap.from(".about-photo", {
      opacity: 0,
      scale: 0.97,
      duration: 0.9,
      ease: "power2.out",
      scrollTrigger: {
        trigger: sectionRef.current,
        start: "top 78%",
        once: true,
      },
    });
  }, { scope: sectionRef });

  return (
    <section id="about" ref={sectionRef}>
      <p className="eyebrow about-anim">About Chris</p>

      <div className="about-grid">

        {/* Left: content */}
        <div>
          <h2 className="about-anim">
            Fast answers,<br />
            clear options,<br />
            steady guidance.
          </h2>

          <p className="lede about-anim">
            Whether you are purchasing your first home, moving up, or refinancing
            to a better rate, you have a lot riding on who guides you through the
            process. Market conditions and mortgage programs change frequently —
            having someone who is responsive and accurate makes all the difference.
          </p>

          <p className="body about-anim">
            Chris brings the expertise and local knowledge to help you navigate
            financing options, understand every step, and choose the loan that
            fits your family and your long-term goals — in plain language, with
            no surprises.
          </p>

          <ul className="about-values about-anim">
            <li>
              <strong>Responsive</strong> — same-day answers and weekly progress
              updates from application through close.
            </li>
            <li>
              <strong>Clear</strong> — plain language at every step. No jargon,
              no last-minute surprises.
            </li>
            <li>
              <strong>Local</strong> — licensed in California and Nevada with
              deep knowledge of both markets.
            </li>
          </ul>

          <div className="about-actions about-anim">
            <a
              href="https://www.clearmodernmortgage.com/loan-officer/chris-gramly/apply-now"
              className="btn primary"
              target="_blank"
              rel="noopener noreferrer"
            >
              Apply Now
            </a>
            <a href="tel:+17027674072" className="about-tel">
              (702) 767-4072
            </a>
          </div>
        </div>

        {/* Right: portrait + credentials */}
        <aside>
          <div className="about-photo">
            <img
              src={`${import.meta.env.BASE_URL}assets/chris-gramly.png`}
              alt="Chris Gramly, Mortgage Loan Officer"
            />
          </div>

          <dl className="about-facts">
            <div className="about-fact">
              <dt>Coverage</dt>
              <dd>California &nbsp;·&nbsp; Nevada</dd>
            </div>
            <div className="about-fact">
              <dt>NMLS</dt>
              <dd>#1984074</dd>
            </div>
            <div className="about-fact">
              <dt>Office</dt>
              <dd>Las Vegas, NV</dd>
            </div>
            <div className="about-fact">
              <dt>Specialties</dt>
              <dd>Purchase · Refi · New Build</dd>
            </div>
          </dl>
        </aside>

      </div>
    </section>
  );
}
