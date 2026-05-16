import * as THREE from "three";

const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const isCoarsePointer = window.matchMedia("(hover: none), (pointer: coarse)").matches;

const header = document.querySelector("[data-elevate]");
const hero = document.querySelector(".spotlight");
const reveals = document.querySelectorAll(".reveal");

/* ========== Header elevate + scroll progress ========== */
const progressBar = document.querySelector(".scroll-progress span");

function onScroll() {
  const y = window.scrollY;
  header?.classList.toggle("is-scrolled", y > 8);

  if (progressBar) {
    const max = (document.documentElement.scrollHeight - window.innerHeight) || 1;
    const pct = Math.min(1, Math.max(0, y / max));
    progressBar.style.width = `${pct * 100}%`;
  }
}

window.addEventListener("scroll", onScroll, { passive: true });
onScroll();

/* ========== Calculator ========== */
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

document.querySelectorAll("#loanAmount, #interestRate, #loanTerm").forEach((control) => {
  control.addEventListener("input", calculatePayment);
});

/* ========== Contact form ========== */
async function sendContactForm(event) {
  event.preventDefault();

  const form = event.currentTarget;
  const button = form.querySelector("button[type='submit']");
  const originalText = button.innerHTML;

  button.disabled = true;
  button.innerHTML = "Sending...";

  try {
    const response = await fetch(form.action, {
      method: "POST",
      body: new FormData(form),
      headers: { "Accept": "application/json" }
    });

    if (response.ok) {
      window.location.href = "thank-you.html";
    } else {
      button.disabled = false;
      button.innerHTML = originalText;
      alert("Something went wrong. Please call Chris directly at (702) 767-4072.");
    }
  } catch {
    button.disabled = false;
    button.innerHTML = originalText;
    alert("Something went wrong. Please call Chris directly at (702) 767-4072.");
  }
}

document.getElementById("contactForm")?.addEventListener("submit", sendContactForm);

/* ========== Reveal observer ========== */
const observer = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      entry.target.classList.add("is-visible");
      observer.unobserve(entry.target);
    }
  });
}, { threshold: 0.16 });

reveals.forEach((item) => observer.observe(item));

/* ========== Hero pointer spotlight ========== */
if (hero) {
  hero.addEventListener("pointermove", (event) => {
    const rect = hero.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * 100;
    const y = ((event.clientY - rect.top) / rect.height) * 100;
    hero.style.setProperty("--mx", `${x}%`);
    hero.style.setProperty("--my", `${y}%`);
  });
}

/* ========== Custom cursor ========== */
const cursorAura = document.querySelector(".cursor-aura");
const cursorDot = document.querySelector(".cursor-dot");

if (!isCoarsePointer && !prefersReducedMotion && cursorAura && cursorDot) {
  let targetX = window.innerWidth / 2;
  let targetY = window.innerHeight / 2;
  let auraX = targetX;
  let auraY = targetY;
  let dotX = targetX;
  let dotY = targetY;
  let cursorReady = false;

  window.addEventListener("pointermove", (event) => {
    targetX = event.clientX;
    targetY = event.clientY;
    if (!cursorReady) {
      cursorReady = true;
      auraX = dotX = targetX;
      auraY = dotY = targetY;
      document.body.classList.add("cursor-ready");
    }
  }, { passive: true });

  function tick() {
    auraX += (targetX - auraX) * 0.12;
    auraY += (targetY - auraY) * 0.12;
    dotX += (targetX - dotX) * 0.42;
    dotY += (targetY - dotY) * 0.42;
    cursorAura.style.transform = `translate(${auraX}px, ${auraY}px) translate(-50%, -50%)`;
    cursorDot.style.transform = `translate(${dotX}px, ${dotY}px) translate(-50%, -50%)`;
    requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);

  const hoverables = document.querySelectorAll("a, button, .magnetic, [data-tilt]");
  hoverables.forEach((el) => {
    el.addEventListener("pointerenter", () => document.body.classList.add("cursor-hover"));
    el.addEventListener("pointerleave", () => document.body.classList.remove("cursor-hover"));
  });
}

/* ========== Magnetic buttons ========== */
if (!isCoarsePointer && !prefersReducedMotion) {
  const magnets = document.querySelectorAll("[data-magnetic]");
  magnets.forEach((el) => {
    let raf = 0;
    const strength = 0.32;

    el.addEventListener("pointermove", (event) => {
      const rect = el.getBoundingClientRect();
      const x = event.clientX - rect.left - rect.width / 2;
      const y = event.clientY - rect.top - rect.height / 2;
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        el.style.transform = `translate(${x * strength}px, ${y * strength}px)`;
      });
    });

    el.addEventListener("pointerleave", () => {
      cancelAnimationFrame(raf);
      el.style.transform = "translate(0, 0)";
    });
  });
}

/* ========== 3D tilt ========== */
if (!isCoarsePointer && !prefersReducedMotion) {
  const tilters = document.querySelectorAll("[data-tilt]");
  tilters.forEach((el) => {
    const strength = Number(el.dataset.tiltStrength) || 8;
    let raf = 0;

    el.addEventListener("pointermove", (event) => {
      const rect = el.getBoundingClientRect();
      const x = (event.clientX - rect.left) / rect.width;
      const y = (event.clientY - rect.top) / rect.height;
      const rx = (0.5 - y) * strength;
      const ry = (x - 0.5) * strength;
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        el.style.transform = `perspective(1100px) rotateX(${rx}deg) rotateY(${ry}deg) translateZ(0)`;
        el.style.setProperty("--mx", `${x * 100}%`);
        el.style.setProperty("--my", `${y * 100}%`);
      });
    });

    el.addEventListener("pointerleave", () => {
      cancelAnimationFrame(raf);
      el.style.transform = "perspective(1100px) rotateX(0deg) rotateY(0deg) translateZ(0)";
    });
  });
}

/* ========== Parallax on scroll ========== */
if (!prefersReducedMotion) {
  const parallaxItems = document.querySelectorAll("[data-parallax-speed]");

  function updateParallax() {
    const vh = window.innerHeight;
    parallaxItems.forEach((el) => {
      const rect = el.getBoundingClientRect();
      if (rect.bottom < -200 || rect.top > vh + 200) return;
      const speed = Number(el.dataset.parallaxSpeed) || 0.1;
      const offset = (rect.top + rect.height / 2 - vh / 2) * speed;
      el.style.transform = `translate3d(0, ${offset * -1}px, 0)`;
    });
  }

  window.addEventListener("scroll", updateParallax, { passive: true });
  window.addEventListener("resize", updateParallax);
  updateParallax();
}

/* ========== Lucide icons ========== */
window.addEventListener("load", () => {
  calculatePayment();
  window.lucide?.createIcons();
});

/* ========== Three.js floating hero scene ========== */
function initHeroScene() {
  const canvas = document.getElementById("hero-canvas");
  if (!canvas) return;
  if (prefersReducedMotion) return;

  const heroEl = canvas.parentElement;
  let width = heroEl.clientWidth;
  let height = heroEl.clientHeight;

  const scene = new THREE.Scene();

  const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
  camera.position.set(0, 0, 8);

  const renderer = new THREE.WebGLRenderer({
    canvas,
    alpha: true,
    antialias: true,
    powerPreference: "high-performance"
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(width, height, false);
  renderer.outputColorSpace = THREE.SRGBColorSpace;

  /* Lights */
  scene.add(new THREE.AmbientLight(0xffffff, 0.55));

  const keyLight = new THREE.DirectionalLight(0xffe8b5, 1.4);
  keyLight.position.set(4, 6, 5);
  scene.add(keyLight);

  const rimLight = new THREE.DirectionalLight(0x2ce6c8, 1.0);
  rimLight.position.set(-5, -2, 3);
  scene.add(rimLight);

  const fillLight = new THREE.PointLight(0xffcf6b, 1.6, 18);
  fillLight.position.set(0, 0, 4);
  scene.add(fillLight);

  /* Materials */
  const goldMat = new THREE.MeshPhysicalMaterial({
    color: 0xdfb65e,
    metalness: 0.85,
    roughness: 0.18,
    clearcoat: 0.6,
    clearcoatRoughness: 0.15,
    emissive: 0xdfb65e,
    emissiveIntensity: 0.06
  });

  const tealMat = new THREE.MeshPhysicalMaterial({
    color: 0x2ce6c8,
    metalness: 0.55,
    roughness: 0.22,
    clearcoat: 0.8,
    emissive: 0x0c7c82,
    emissiveIntensity: 0.18,
    transmission: 0.15,
    thickness: 0.8
  });

  const navyMat = new THREE.MeshPhysicalMaterial({
    color: 0x10243e,
    metalness: 0.4,
    roughness: 0.4,
    emissive: 0x0c7c82,
    emissiveIntensity: 0.22
  });

  /* Group of floating shapes */
  const group = new THREE.Group();
  scene.add(group);

  const torusKnot = new THREE.Mesh(
    new THREE.TorusKnotGeometry(0.6, 0.18, 140, 18),
    goldMat
  );
  torusKnot.position.set(2.6, 0.6, 0);
  group.add(torusKnot);

  const icosa = new THREE.Mesh(
    new THREE.IcosahedronGeometry(0.55, 0),
    tealMat
  );
  icosa.position.set(-2.8, 0.2, 0.5);
  group.add(icosa);

  const sphere = new THREE.Mesh(
    new THREE.SphereGeometry(0.42, 48, 48),
    new THREE.MeshPhysicalMaterial({
      color: 0xffffff,
      metalness: 0.2,
      roughness: 0.05,
      clearcoat: 1,
      transmission: 0.85,
      ior: 1.45,
      thickness: 1.2,
      emissive: 0x2ce6c8,
      emissiveIntensity: 0.05
    })
  );
  sphere.position.set(1.4, -1.6, 1.2);
  group.add(sphere);

  /* Mini house silhouette built from boxes */
  const house = new THREE.Group();
  const houseBody = new THREE.Mesh(
    new THREE.BoxGeometry(0.7, 0.55, 0.55),
    navyMat
  );
  const houseRoof = new THREE.Mesh(
    new THREE.ConeGeometry(0.55, 0.4, 4),
    goldMat
  );
  houseRoof.position.y = 0.48;
  houseRoof.rotation.y = Math.PI / 4;
  const door = new THREE.Mesh(
    new THREE.BoxGeometry(0.18, 0.28, 0.02),
    new THREE.MeshStandardMaterial({ color: 0xffcf6b, emissive: 0xffcf6b, emissiveIntensity: 0.4 })
  );
  door.position.set(0, -0.13, 0.28);
  house.add(houseBody, houseRoof, door);
  house.position.set(-1.6, -1.4, 0.4);
  house.scale.setScalar(0.95);
  group.add(house);

  /* Coin ring around torus */
  const coinMat = new THREE.MeshPhysicalMaterial({
    color: 0xffcf6b,
    metalness: 0.95,
    roughness: 0.16,
    emissive: 0xffcf6b,
    emissiveIntensity: 0.08
  });

  const coins = new THREE.Group();
  const coinCount = 6;
  for (let i = 0; i < coinCount; i++) {
    const coin = new THREE.Mesh(
      new THREE.CylinderGeometry(0.13, 0.13, 0.04, 24),
      coinMat
    );
    const angle = (i / coinCount) * Math.PI * 2;
    coin.position.set(Math.cos(angle) * 1.1, Math.sin(angle) * 1.1, 0);
    coin.rotation.z = angle;
    coin.userData.angle = angle;
    coins.add(coin);
  }
  coins.position.copy(torusKnot.position);
  group.add(coins);

  /* Particle dust */
  const particleCount = 600;
  const particleGeom = new THREE.BufferGeometry();
  const positions = new Float32Array(particleCount * 3);
  for (let i = 0; i < particleCount; i++) {
    positions[i * 3] = (Math.random() - 0.5) * 18;
    positions[i * 3 + 1] = (Math.random() - 0.5) * 12;
    positions[i * 3 + 2] = (Math.random() - 0.5) * 8 - 2;
  }
  particleGeom.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  const particleMat = new THREE.PointsMaterial({
    color: 0xffcf6b,
    size: 0.03,
    transparent: true,
    opacity: 0.75,
    depthWrite: false,
    blending: THREE.AdditiveBlending
  });
  const particles = new THREE.Points(particleGeom, particleMat);
  scene.add(particles);

  /* Mouse + scroll */
  const target = { x: 0, y: 0 };
  const current = { x: 0, y: 0 };

  heroEl.addEventListener("pointermove", (event) => {
    const rect = heroEl.getBoundingClientRect();
    target.x = ((event.clientX - rect.left) / rect.width - 0.5) * 2;
    target.y = ((event.clientY - rect.top) / rect.height - 0.5) * 2;
  }, { passive: true });

  let scrollY = 0;
  window.addEventListener("scroll", () => {
    scrollY = window.scrollY;
  }, { passive: true });

  /* Resize */
  function resize() {
    width = heroEl.clientWidth;
    height = heroEl.clientHeight;
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height, false);
  }
  window.addEventListener("resize", resize);

  /* Pause when off-screen */
  let active = true;
  const heroObserver = new IntersectionObserver(([entry]) => {
    active = entry.isIntersecting;
  }, { threshold: 0.05 });
  heroObserver.observe(heroEl);

  /* Animate */
  const clock = new THREE.Clock();

  function animate() {
    requestAnimationFrame(animate);
    if (!active) return;

    const t = clock.getElapsedTime();

    current.x += (target.x - current.x) * 0.06;
    current.y += (target.y - current.y) * 0.06;

    group.rotation.y = current.x * 0.4 + scrollY * 0.0008;
    group.rotation.x = current.y * 0.25 - scrollY * 0.0004;

    torusKnot.rotation.x = t * 0.4;
    torusKnot.rotation.y = t * 0.55;

    icosa.rotation.x = t * 0.6;
    icosa.rotation.y = t * 0.32;
    icosa.position.y = 0.2 + Math.sin(t * 0.9) * 0.32;

    sphere.position.y = -1.6 + Math.cos(t * 0.7) * 0.28;
    sphere.rotation.y = t * 0.2;

    house.rotation.y = t * 0.4;
    house.position.y = -1.4 + Math.sin(t * 0.8 + 1.2) * 0.18;

    coins.rotation.z = t * 0.6;
    coins.position.copy(torusKnot.position);
    coins.children.forEach((coin, i) => {
      const angle = coin.userData.angle + t * 0.6;
      coin.position.x = Math.cos(angle) * 1.15;
      coin.position.y = Math.sin(angle) * 1.15;
      coin.rotation.x = t * 1.5 + i;
    });

    particles.rotation.y = t * 0.02;
    particles.rotation.x = scrollY * 0.0003;

    fillLight.position.x = current.x * 4;
    fillLight.position.y = current.y * 3;

    camera.position.x = current.x * 0.5;
    camera.position.y = -current.y * 0.4;
    camera.lookAt(0, 0, 0);

    renderer.render(scene, camera);
  }

  animate();
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initHeroScene);
} else {
  initHeroScene();
}
