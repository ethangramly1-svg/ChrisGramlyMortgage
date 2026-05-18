import { useRef, useState } from "react";
import { gsap, useGSAP } from "../../lib/gsap";

const PHOTO = `${import.meta.env.BASE_URL}assets/chris-gramly.png`;

export default function Contact() {
  const sectionRef = useRef<HTMLElement>(null);
  const formRef    = useRef<HTMLFormElement>(null);

  const [sending, setSending] = useState(false);
  const [sent,    setSent]    = useState(false);
  const [error,   setError]   = useState<string | null>(null);

  useGSAP(() => {
    gsap.from(".contact-anim", {
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

    gsap.from(".contact-form, .contact-success", {
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

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = formRef.current;
    if (!form) return;
    setSending(true);
    setError(null);
    try {
      const res = await fetch(form.action, {
        method: "POST",
        body: new FormData(form),
        headers: { Accept: "application/json" },
      });
      if (res.ok) {
        setSent(true);
      } else {
        setError("Something went wrong. Please call Chris directly at (702) 767-4072.");
        setSending(false);
      }
    } catch {
      setError("Something went wrong. Please call Chris directly at (702) 767-4072.");
      setSending(false);
    }
  }

  return (
    <section id="contact" ref={sectionRef}>
      <div className="contact-grid">

        {/* Left: profile + contact details */}
        <div>
          <p className="eyebrow contact-anim">Contact</p>
          <h2 className="contact-anim">Talk with Chris Gramly.</h2>
          <p className="lede contact-anim">
            Whether you are ready to apply, want to understand your options, or
            have a question about rates — Chris is available by phone, email, or
            through the form.
          </p>

          <div className="profile contact-anim">
            <div className="profile-photo">
              <img src={PHOTO} alt="Chris Gramly, Mortgage Loan Officer" />
            </div>
            <div className="profile-info">
              <p className="name">Chris Gramly</p>
              <p className="meta">Loan Officer &nbsp;·&nbsp; NMLS #1984074</p>
              <a
                href="https://www.clearmodernmortgage.com/loan-officer/chris-gramly"
                target="_blank"
                rel="noopener noreferrer"
              >
                Company Profile →
              </a>
            </div>
          </div>

          <dl className="contact-facts contact-anim">
            <div className="fact">
              <dt>Phone</dt>
              <dd><a href="tel:+17027674072">(702) 767-4072</a></dd>
            </div>
            <div className="fact">
              <dt>Email</dt>
              <dd><a href="mailto:chris.gramly@clearmtg.com">chris.gramly@clearmtg.com</a></dd>
            </div>
            <div className="fact">
              <dt>Office</dt>
              <dd>
                <a
                  href="https://maps.google.com/?q=8751+W+Charleston+Blvd+%23220+Las+Vegas+NV+89117"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  8751 W Charleston Blvd #220, Las Vegas, NV 89117
                </a>
              </dd>
            </div>
            <div className="fact">
              <dt>Licensed</dt>
              <dd>California &nbsp;·&nbsp; Nevada</dd>
            </div>
          </dl>

          <div className="contact-apply contact-anim">
            <a
              href="https://www.clearmodernmortgage.com/loan-officer/chris-gramly/apply-now"
              className="btn primary"
              target="_blank"
              rel="noopener noreferrer"
            >
              Apply Now
            </a>
          </div>
        </div>

        {/* Right: form or success */}
        {sent ? (
          <div className="contact-success">
            <div className="contact-success-icon">✓</div>
            <h3>Message received.</h3>
            <p>
              Chris will be in touch shortly. For an immediate response, call{" "}
              <a href="tel:+17027674072">(702) 767-4072</a>.
            </p>
          </div>
        ) : (
          <form
            ref={formRef}
            className="contact-form"
            action="https://formsubmit.co/ajax/chris.gramly@clearmtg.com"
            method="POST"
            onSubmit={onSubmit}
          >
            <h3>Send a question</h3>
            <input type="hidden" name="_subject" value="New lead — Chris Gramly mortgage site" />
            <input type="hidden" name="_captcha" value="false" />

            <label>
              <span className="label">Name</span>
              <input name="name" autoComplete="name" required />
            </label>
            <label>
              <span className="label">Email</span>
              <input name="email" type="email" autoComplete="email" required />
            </label>
            <label>
              <span className="label">Phone (optional)</span>
              <input name="phone" type="tel" autoComplete="tel" />
            </label>
            <label>
              <span className="label">Goal</span>
              <select name="goal" defaultValue="Buying a home">
                <option>Buying a home</option>
                <option>Refinancing</option>
                <option>Building a home</option>
                <option>General mortgage question</option>
              </select>
            </label>
            <label>
              <span className="label">Message</span>
              <textarea name="message" rows={4} required />
            </label>

            {error && <p className="contact-error">{error}</p>}

            <button className="btn primary" type="submit" disabled={sending}>
              {sending ? "Sending…" : "Send Question"}
            </button>
          </form>
        )}

      </div>
    </section>
  );
}
