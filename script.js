function prepareEmail(event) {
  event.preventDefault();

  const form = event.currentTarget;
  const data = new FormData(form);

  const subject = encodeURIComponent(`Mortgage question from ${data.get("name")}`);
  const body = encodeURIComponent(
    `Name: ${data.get("name")}\nEmail: ${data.get("email")}\nGoal: ${data.get("goal")}\n\nMessage:\n${data.get("message")}`
  );

  window.location.href = `mailto:chris.gramly@clearmtg.com?subject=${subject}&body=${body}`;

  setTimeout(() => {
    window.location.href = "thank-you.html";
  }, 700);
}

document.getElementById("contactForm")?.addEventListener("submit", prepareEmail);
