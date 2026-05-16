import { useRef, useState } from "react";

const PHOTO = `${import.meta.env.BASE_URL}assets/chris-gramly.png`;

export default function Contact() {
  const formRef = useRef<HTMLFormElement | null>(null);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
        headers: { Accept: "application/json" }
      });
      if (res.ok) {
        window.location.href = `${import.meta.env.BASE_URL}thank-you.html`;
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
    <section id="contact" className="section deep">
      <div className="container contact-grid">
        <div>
          <p className="eyebrow">Find an Advisor</p>
          <h2>Talk with Chris Gramly.</h2>
          <p className="lede">
            After you apply, Chris will call to discuss the details of your loan. You can also reach out anytime by phone or email for personalized service and expert advice.
          </p>

          <div className="profile">
            <div className="profile-photo">
              <img src={PHOTO} alt="Chris Gramly" />
            </div>
            <div>
              <p className="name">Chris Gramly</p>
              <p className="meta">Loan Officer &nbsp;·&nbsp; NMLS 1984074</p>
              <a href="https://www.clearmodernmortgage.com/loan-officer/chris-gramly" target="_blank" rel="noopener">Company Profile →</a>
            </div>
          </div>

          <dl className="contact-facts">
            <div className="fact"><dt>Phone</dt><dd><a href="tel:+17027674072">(702) 767-4072</a></dd></div>
            <div className="fact"><dt>Email</dt><dd><a href="mailto:chris.gramly@clearmtg.com">chris.gramly@clearmtg.com</a></dd></div>
            <div className="fact"><dt>Office</dt><dd><a href="https://maps.google.com/?q=8751%20W%20Charleston%20Blvd%20%23220%20Las%20Vegas%20NV%2089117" target="_blank" rel="noopener">8751 W Charleston Blvd #220, Las Vegas, NV 89117</a></dd></div>
          </dl>
        </div>

        <form
          ref={formRef}
          className="contact-form"
          action="https://formsubmit.co/ajax/chris.gramly@clearmtg.com"
          method="POST"
          onSubmit={onSubmit}
        >
          <h3>Send a question</h3>
          <input type="hidden" name="_subject" value="New mortgage website lead for Chris Gramly" />
          <input type="hidden" name="_captcha" value="false" />
          <input type="hidden" name="_next" value={`${window.location.origin}${import.meta.env.BASE_URL}thank-you.html`} />

          <label>
            <span className="label">Name</span>
            <input name="name" autoComplete="name" required />
          </label>
          <label>
            <span className="label">Email</span>
            <input name="email" type="email" autoComplete="email" required />
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

          <button className="btn primary" type="submit" disabled={sending}>
            {sending ? "Sending..." : "Send Question"}
          </button>
          {error && <p style={{ marginTop: 16, color: "#b03028", fontSize: 14 }}>{error}</p>}
        </form>
      </div>
    </section>
  );
}
