const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

const header = document.querySelector("[data-elevate]");
const reveals = document.querySelectorAll(".reveal");
const floorLinks = Array.from(document.querySelectorAll(".floor-nav a"));
const floorSections = floorLinks
  .map((link) => {
    const id = link.getAttribute("href").slice(1);
    return { link, section: document.getElementById(id) };
  })
  .filter((item) => item.section);

/* ========== Header elevate ========== */
function elevateHeader() {
  header?.classList.toggle("is-scrolled", window.scrollY > 8);
}

/* ========== Active floor indicator ========== */
function updateActiveFloor() {
  const probe = window.scrollY + window.innerHeight * 0.4;
  let activeIdx = 0;
  floorSections.forEach((item, i) => {
    const top = item.section.offsetTop;
    if (probe >= top) activeIdx = i;
  });
  floorSections.forEach((item, i) => {
    item.link.classList.toggle("is-active", i === activeIdx);
  });
}

window.addEventListener("scroll", () => {
  elevateHeader();
  updateActiveFloor();
}, { passive: true });

elevateHeader();
updateActiveFloor();

/* ========== Reveal observer ========== */
if (reveals.length) {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.18 });
  reveals.forEach((el) => observer.observe(el));
}

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
  const original = button.innerHTML;

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
      button.innerHTML = original;
      alert("Something went wrong. Please call Chris directly at (702) 767-4072.");
    }
  } catch {
    button.disabled = false;
    button.innerHTML = original;
    alert("Something went wrong. Please call Chris directly at (702) 767-4072.");
  }
}

document.getElementById("contactForm")?.addEventListener("submit", sendContactForm);

window.addEventListener("load", () => {
  calculatePayment();
  window.lucide?.createIcons();
});

/* ========================================================================
   3D Tower — scroll-bound camera descending a stylized skyscraper
   ======================================================================== */
async function initTower() {
  const canvas = document.getElementById("tower-canvas");
  if (!canvas || prefersReducedMotion) return;

  let THREE;
  try {
    THREE = await import("three");
  } catch (err) {
    console.warn("Three.js failed to load — tower scene disabled.", err);
    canvas.style.display = "none";
    return;
  }

  let width = canvas.clientWidth;
  let height = canvas.clientHeight;

  const scene = new THREE.Scene();
  scene.fog = new THREE.Fog(0x0c0f10, 14, 60);

  const camera = new THREE.PerspectiveCamera(38, width / height, 0.1, 200);

  const renderer = new THREE.WebGLRenderer({
    canvas,
    alpha: true,
    antialias: true,
    powerPreference: "high-performance"
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(width, height, false);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;

  /* ---- Lights ---- */
  scene.add(new THREE.AmbientLight(0x1a2030, 0.6));

  const moon = new THREE.DirectionalLight(0xbcd0ff, 0.55);
  moon.position.set(-10, 30, 8);
  scene.add(moon);

  const warmKey = new THREE.DirectionalLight(0xe9c176, 0.9);
  warmKey.position.set(8, 6, 10);
  scene.add(warmKey);

  /* ---- Materials ---- */
  const concreteMat = new THREE.MeshStandardMaterial({
    color: 0x232628,
    metalness: 0.25,
    roughness: 0.78
  });

  const glassMat = new THREE.MeshStandardMaterial({
    color: 0x12161a,
    metalness: 0.55,
    roughness: 0.18,
    envMapIntensity: 0.6
  });

  const trimMat = new THREE.MeshStandardMaterial({
    color: 0x3a3128,
    metalness: 0.7,
    roughness: 0.45
  });

  const windowMat = new THREE.MeshBasicMaterial({ color: 0xe9c176 });
  const windowDimMat = new THREE.MeshBasicMaterial({ color: 0x4a3a1f });

  /* ---- Tower ---- */
  const floors = 30;
  const floorH = 1.2;
  const towerW = 3.4;
  const towerD = 3.4;
  const towerTopY = floors * floorH;

  const tower = new THREE.Group();
  scene.add(tower);

  // Core shaft (one big mesh, cheaper than per-floor)
  const shaft = new THREE.Mesh(
    new THREE.BoxGeometry(towerW, towerTopY, towerD),
    concreteMat
  );
  shaft.position.y = towerTopY / 2;
  tower.add(shaft);

  // Glass curtain wall on front + back (slightly recessed)
  const curtainGeom = new THREE.BoxGeometry(towerW * 0.86, towerTopY * 0.985, 0.06);
  const curtainFront = new THREE.Mesh(curtainGeom, glassMat);
  curtainFront.position.set(0, towerTopY / 2, towerD / 2 + 0.005);
  tower.add(curtainFront);
  const curtainBack = curtainFront.clone();
  curtainBack.position.z = -towerD / 2 - 0.005;
  tower.add(curtainBack);

  // Horizontal slab lines between floors
  const slabGeom = new THREE.BoxGeometry(towerW + 0.12, 0.04, towerD + 0.12);
  for (let i = 0; i <= floors; i++) {
    const slab = new THREE.Mesh(slabGeom, trimMat);
    slab.position.y = i * floorH;
    tower.add(slab);
  }

  // Window dots — front face
  const winW = 0.16;
  const winH = 0.34;
  const colCount = 7;
  const colSpacing = (towerW * 0.78) / (colCount - 1);
  const winGeom = new THREE.PlaneGeometry(winW, winH);

  // Highlighted floors (matches floor-nav levels 28, 21, 14, 7, GF)
  const highlightFloors = new Set([28, 21, 14, 7, 0]);

  for (let f = 0; f < floors; f++) {
    const lit = highlightFloors.has(f) || Math.random() > 0.32;
    const mat = highlightFloors.has(f) ? windowMat : (lit ? windowMat : windowDimMat);

    for (let c = 0; c < colCount; c++) {
      const x = -((colCount - 1) * colSpacing) / 2 + c * colSpacing;
      const y = f * floorH + floorH / 2;

      // Front
      const wFront = new THREE.Mesh(winGeom, mat);
      wFront.position.set(x, y, towerD / 2 + 0.04);
      tower.add(wFront);

      // Back
      const wBack = new THREE.Mesh(winGeom, mat);
      wBack.position.set(x, y, -towerD / 2 - 0.04);
      wBack.rotation.y = Math.PI;
      tower.add(wBack);
    }

    // Side windows (left/right) — sparser
    if (lit) {
      for (let s = 0; s < 3; s++) {
        const z = -1 + s;
        const wL = new THREE.Mesh(winGeom, mat);
        wL.position.set(-towerW / 2 - 0.04, f * floorH + floorH / 2, z);
        wL.rotation.y = -Math.PI / 2;
        tower.add(wL);

        const wR = wL.clone();
        wR.position.x = towerW / 2 + 0.04;
        wR.rotation.y = Math.PI / 2;
        tower.add(wR);
      }
    }
  }

  // Penthouse crown — top "level 28" cap
  const crownH = 1.6;
  const crown = new THREE.Mesh(
    new THREE.BoxGeometry(towerW * 1.18, crownH, towerD * 1.18),
    concreteMat
  );
  crown.position.y = towerTopY + crownH / 2;
  tower.add(crown);

  const crownGlass = new THREE.Mesh(
    new THREE.BoxGeometry(towerW * 1.04, crownH * 0.82, towerD * 1.04),
    new THREE.MeshStandardMaterial({
      color: 0x1a1f2a,
      metalness: 0.7,
      roughness: 0.12,
      emissive: 0xe9c176,
      emissiveIntensity: 0.25
    })
  );
  crownGlass.position.y = crown.position.y;
  tower.add(crownGlass);

  // Antenna / spire
  const spire = new THREE.Mesh(
    new THREE.CylinderGeometry(0.04, 0.08, 3.6, 8),
    trimMat
  );
  spire.position.y = crown.position.y + crownH / 2 + 1.8;
  tower.add(spire);

  // Penthouse warm glow
  const penthouseGlow = new THREE.PointLight(0xe9c176, 1.8, 18, 1.6);
  penthouseGlow.position.set(0, towerTopY + 0.4, 0);
  tower.add(penthouseGlow);

  /* ---- Distant city silhouettes ---- */
  const skyline = new THREE.Group();
  scene.add(skyline);

  const skylineMat = new THREE.MeshStandardMaterial({
    color: 0x0e1112,
    metalness: 0.1,
    roughness: 1
  });
  const winFarMat = new THREE.MeshBasicMaterial({ color: 0x5a4623 });

  const farBuildings = 14;
  for (let i = 0; i < farBuildings; i++) {
    const w = 1.6 + Math.random() * 1.6;
    const h = 6 + Math.random() * 18;
    const d = 1.6 + Math.random() * 1.6;
    const bx = -28 + (i / (farBuildings - 1)) * 56 + (Math.random() - 0.5) * 3;
    const bz = -22 - Math.random() * 14;

    const b = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), skylineMat);
    b.position.set(bx, h / 2, bz);
    skyline.add(b);

    // a few warm lit windows
    const dotCount = Math.floor(h * 1.4);
    for (let j = 0; j < dotCount; j++) {
      if (Math.random() > 0.55) continue;
      const dot = new THREE.Mesh(
        new THREE.PlaneGeometry(0.12, 0.16),
        winFarMat
      );
      dot.position.set(
        bx + (Math.random() - 0.5) * w * 0.7,
        Math.random() * (h - 0.5) + 0.4,
        bz + d / 2 + 0.02
      );
      skyline.add(dot);
    }
  }

  /* ---- Ground plane ---- */
  const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(120, 120),
    new THREE.MeshStandardMaterial({ color: 0x080a0b, metalness: 0.2, roughness: 0.9 })
  );
  ground.rotation.x = -Math.PI / 2;
  ground.position.y = -0.01;
  scene.add(ground);

  /* ---- Stars ---- */
  const starsGeom = new THREE.BufferGeometry();
  const starsCount = 700;
  const starPositions = new Float32Array(starsCount * 3);
  for (let i = 0; i < starsCount; i++) {
    starPositions[i * 3] = (Math.random() - 0.5) * 200;
    starPositions[i * 3 + 1] = Math.random() * 80 + 10;
    starPositions[i * 3 + 2] = -30 - Math.random() * 60;
  }
  starsGeom.setAttribute("position", new THREE.BufferAttribute(starPositions, 3));
  const stars = new THREE.Points(
    starsGeom,
    new THREE.PointsMaterial({
      color: 0xc9d6ff,
      size: 0.06,
      transparent: true,
      opacity: 0.7,
      depthWrite: false
    })
  );
  scene.add(stars);

  /* ---- Camera scroll binding ---- */
  // Camera orbits the tower as user scrolls. Start: high & wide on the crown.
  // End: looking up at the entrance from ground level.
  const camStart = new THREE.Vector3(11, towerTopY + 4, 14);
  const camEnd = new THREE.Vector3(7, 2.5, 11);
  const lookStart = new THREE.Vector3(0, towerTopY - 1, 0);
  const lookEnd = new THREE.Vector3(0, 4, 0);

  // Mouse parallax
  const pointer = { x: 0, y: 0 };
  const pointerTarget = { x: 0, y: 0 };
  window.addEventListener("pointermove", (e) => {
    pointerTarget.x = (e.clientX / window.innerWidth - 0.5) * 2;
    pointerTarget.y = (e.clientY / window.innerHeight - 0.5) * 2;
  }, { passive: true });

  function scrollProgress() {
    const max = (document.documentElement.scrollHeight - window.innerHeight) || 1;
    return Math.min(1, Math.max(0, window.scrollY / max));
  }

  /* ---- Resize ---- */
  function resize() {
    width = canvas.clientWidth;
    height = canvas.clientHeight;
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height, false);
  }
  window.addEventListener("resize", resize);

  /* ---- Pause when tab hidden ---- */
  let visible = true;
  document.addEventListener("visibilitychange", () => {
    visible = !document.hidden;
  });

  /* ---- Animate ---- */
  const clock = new THREE.Clock();
  const tmpCam = new THREE.Vector3();
  const tmpLook = new THREE.Vector3();

  function animate() {
    requestAnimationFrame(animate);
    if (!visible) return;

    const t = clock.getElapsedTime();
    const p = scrollProgress();

    // Smooth pointer
    pointer.x += (pointerTarget.x - pointer.x) * 0.05;
    pointer.y += (pointerTarget.y - pointer.y) * 0.05;

    // Lerp camera + lookAt along scroll path
    tmpCam.lerpVectors(camStart, camEnd, p);
    tmpLook.lerpVectors(lookStart, lookEnd, p);

    // Mouse parallax offsets
    tmpCam.x += pointer.x * 0.8;
    tmpCam.y += -pointer.y * 0.5;

    // Subtle ambient sway
    tmpCam.x += Math.sin(t * 0.18) * 0.15;
    tmpCam.y += Math.cos(t * 0.22) * 0.15;

    camera.position.copy(tmpCam);
    camera.lookAt(tmpLook);

    // Penthouse glow breathes
    penthouseGlow.intensity = 1.5 + Math.sin(t * 1.3) * 0.25;

    // Stars subtle drift
    stars.rotation.y = t * 0.005;

    renderer.render(scene, camera);
  }
  animate();
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initTower);
} else {
  initTower();
}
