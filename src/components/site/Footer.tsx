const LOGO = `${import.meta.env.BASE_URL}assets/clear-modern-logo.png`;
const EHO = `${import.meta.env.BASE_URL}assets/equal-housing.svg`;

export default function Footer() {
  return (
    <footer className="site-footer">
      <div className="footer-grid">
        <div>
          <img className="footer-logo" src={LOGO} alt="Clear Modern Mortgage" />
          <p>Chris Gramly, Loan Officer</p>
          <p>Licensed in CA and NV</p>
        </div>
        <div>
          <p className="footer-h">Company</p>
          <a href="https://www.clearmodernmortgage.com/" target="_blank" rel="noopener">Clear Modern Mortgage</a>
          <a href="https://www.apmortgage.com" target="_blank" rel="noopener">American Pacific Mortgage</a>
        </div>
        <div>
          <p className="footer-h">Contact</p>
          <a href="tel:+17027674072">(702) 767-4072</a>
          <a href="mailto:chris.gramly@clearmtg.com">chris.gramly@clearmtg.com</a>
          <p>8751 W Charleston Blvd #220<br />Las Vegas, NV 89117</p>
        </div>
      </div>

      <div className="legal">
        <img src={EHO} alt="Equal Housing Opportunity" />
        <p>
          &copy; 2026 American Pacific Mortgage Corporation. This material is provided for informational purposes only and is not guaranteed to be accurate or complete. Rates, terms, programs, and underwriting policies are subject to change without notice. This is not an offer to extend credit or a commitment to lend. All loans are subject to underwriting approval. Refinancing may result in higher total finance charges over the life of the loan. Not available in New York.
        </p>
      </div>
    </footer>
  );
}
