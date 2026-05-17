const header = document.querySelector("[data-elevate]");
const hero = document.querySelector(".spotlight");
const reveals = document.querySelectorAll(".reveal");

function elevateHeader() {
  header?.classList.toggle("is-scrolled", window.scrollY > 8);
}

function formatMoney(value) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0
  }).format(value);
}

function calculatePayment() {
  const amountInput = document.getElementById("loanAmount");
  const rateInput = document.getElementById("interestRate");
  const termInput = document.getElementById("loanTerm");
  const amountValue = document.getElementById("loanAmountValue");
  const rateValue = document.getElementById("interestRateValue");
  const paymentValue = document.getElementById("paymentValue");

  if (!amountInput || !rateInput || !termInput || !amountValue || !rateValue || !paymentValue) return;

  const principal = Number(amountInput.value);
  const annualRate = Number(rateInput.value);
  const months = Number(termInput.value) * 12;
  const monthlyRate = annualRate / 100 / 12;

  const payment = monthlyRate === 0
    ? principal / months
    : principal * (monthlyRate * Math.pow(1 + monthlyRate, months)) /
      (Math.pow(1 + monthlyRate, months) - 1);

  amountValue.textContent = formatMoney(principal);
  rateValue.textContent = `${annualRate.toFixed(2)}%`;
  paymentValue.textContent = `${formatMoney(payment)}/mo`;
}

function sendContactForm(event) {
  const button = event.currentTarget.querySelector("button[type='submit']");
  button.innerHTML = "Sending...";
}

window.addEventListener("scroll", elevateHeader, { passive: true });
elevateHeader();

if (hero) {
  hero.addEventListener("pointermove", (event) => {
    const rect = hero.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * 100;
    const y = ((event.clientY - rect.top) / rect.height) * 100;

    hero.style.setProperty("--mx", `${x}%`);
    hero.style.setProperty("--my", `${y}%`);
  });
}

const observer = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      entry.target.classList.add("is-visible");
      observer.unobserve(entry.target);
    }
  });
}, { threshold: 0.16 });

reveals.forEach((item) => observer.observe(item));

document.querySelectorAll("#loanAmount, #interestRate, #loanTerm").forEach((control) => {
  control.addEventListener("input", calculatePayment);
});

document.getElementById("contactForm")?.addEventListener("submit", sendContactForm);

window.addEventListener("load", () => {
  calculatePayment();
  window.lucide?.createIcons();
});
