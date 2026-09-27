/* =========================================================
   AGITAYDECIDE — INTERACTIONS
   ========================================================= */

document.addEventListener("DOMContentLoaded", () => {
  const menuToggle = document.querySelector(".menu-toggle");
  const nav = document.querySelector(".nav");

  // Mobile menu
  menuToggle?.addEventListener("click", () => {
    const isOpen = nav.classList.toggle("open");
    document.body.classList.toggle("menu-open", isOpen);
    menuToggle.setAttribute("aria-expanded", String(isOpen));
  });

  nav?.querySelectorAll("a").forEach(link => {
    link.addEventListener("click", () => {
      nav.classList.remove("open");
      document.body.classList.remove("menu-open");
      menuToggle?.setAttribute("aria-expanded", "false");
    });
  });

  // Reveal on scroll
  const revealItems = document.querySelectorAll(".reveal");

  if ("IntersectionObserver" in window) {
    const observer = new IntersectionObserver(
      entries => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add("visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -45px 0px" }
    );

    revealItems.forEach(item => observer.observe(item));
  } else {
    revealItems.forEach(item => item.classList.add("visible"));
  }

  // ---------------------------------------------------------
  // Real decision demo
  // ---------------------------------------------------------

  const optionList = document.querySelector("#option-list");
  const optionInput = document.querySelector("#option-input");
  const addOption = document.querySelector("#add-option");
  const shakeButton = document.querySelector("#shake-button");
  const againButton = document.querySelector("#again-button");
  const verdict = document.querySelector("#verdict");
  const verdictText = document.querySelector("#verdict-text");
  const verdictSubtext = document.querySelector("#verdict-subtext");
  const decisionCount = document.querySelector("#decision-count");
  const statusDot = document.querySelector(".status-dot");

  let options = ["Pizza", "Sushi", "Tacos"];
  let decisions = 0;
  let isDeciding = false;

  const emojiPool = ["🍕", "🍣", "🌮", "🍔", "🍜", "🥪", "🍗", "🥗"];

  function renderOptions() {
    optionList.innerHTML = "";

    options.forEach((option, index) => {
      const item = document.createElement("div");
      item.className = "option-item";

      const emoji = emojiPool[index % emojiPool.length];

      item.innerHTML = `
        <span>${emoji} ${escapeHTML(option)}</span>
        <button type="button" aria-label="Eliminar ${escapeHTML(option)}" data-index="${index}">×</button>
      `;

      item.querySelector("button").addEventListener("click", () => {
        if (options.length <= 2) {
          showTemporaryMessage("Faltan opciones. Pon al menos dos.");
          return;
        }

        options.splice(index, 1);
        renderOptions();
        resetVerdict();
      });

      optionList.appendChild(item);
    });
  }

  function escapeHTML(value) {
    const div = document.createElement("div");
    div.textContent = value;
    return div.innerHTML;
  }

  function addNewOption() {
    if (isDeciding) return;

    const value = optionInput.value.trim();

    if (!value) {
      optionInput.focus();
      optionInput.animate(
        [
          { transform: "translateX(0)" },
          { transform: "translateX(-5px)" },
          { transform: "translateX(5px)" },
          { transform: "translateX(0)" }
        ],
        { duration: 220 }
      );
      return;
    }

    if (options.some(item => item.toLowerCase() === value.toLowerCase())) {
      showTemporaryMessage("Esa opción ya está ahí.");
      return;
    }

    options.push(value);
    optionInput.value = "";
    renderOptions();
    resetVerdict();
  }

  function showTemporaryMessage(message) {
    verdict.classList.remove("is-result");
    verdictText.textContent = message;
    verdictSubtext.textContent = "Agrega otra opción y seguimos.";
  }

  function resetVerdict() {
    verdict.classList.remove("is-result");
    verdictText.textContent = "Aún no has agitado";
    verdictSubtext.textContent = "El azar está esperando.";
    statusDot.textContent = "LISTO";
  }

  function decide() {
    if (isDeciding) return;

    if (options.length < 2) {
      showTemporaryMessage("Faltan opciones.");
      return;
    }

    isDeciding = true;
    shakeButton.classList.remove("is-shaking");
    void shakeButton.offsetWidth;
    shakeButton.classList.add("is-shaking");

    statusDot.textContent = "AGITANDO";
    verdict.classList.remove("is-result");
    verdictText.textContent = "Agitando…";
    verdictSubtext.textContent = "El azar está pensando.";

    // Shuffle visual text a few times before settling.
    let cycles = 0;
    const interval = setInterval(() => {
      const preview = options[Math.floor(Math.random() * options.length)];
      verdictText.textContent = preview;
      cycles++;

      if (cycles >= 7) {
        clearInterval(interval);
        finishDecision();
      }
    }, 90);
  }

  function finishDecision() {
    const winner = options[Math.floor(Math.random() * options.length)];

    decisions++;
    decisionCount.textContent = String(decisions).padStart(2, "0");

    verdict.classList.add("is-result");
    verdictText.textContent = `🎯 ${winner}`;
    verdictSubtext.textContent = "Decidió el azar. Listo.";
    statusDot.textContent = "LISTO";

    isDeciding = false;

    if ("vibrate" in navigator) {
      navigator.vibrate([35, 45, 75]);
    }
  }

  addOption?.addEventListener("click", addNewOption);

  optionInput?.addEventListener("keydown", event => {
    if (event.key === "Enter") {
      event.preventDefault();
      addNewOption();
    }
  });

  shakeButton?.addEventListener("click", decide);
  againButton?.addEventListener("click", decide);

  renderOptions();

  // ---------------------------------------------------------
  // Device shake support
  // On supported mobile browsers, physically shaking the phone
  // can trigger the decision.
  // ---------------------------------------------------------

  let lastX = null;
  let lastY = null;
  let lastZ = null;
  let lastShakeTime = 0;

  function handleMotion(event) {
    const acceleration = event.accelerationIncludingGravity;
    if (!acceleration) return;

    const { x, y, z } = acceleration;

    if (lastX === null) {
      lastX = x;
      lastY = y;
      lastZ = z;
      return;
    }

    const delta =
      Math.abs(x - lastX) +
      Math.abs(y - lastY) +
      Math.abs(z - lastZ);

    lastX = x;
    lastY = y;
    lastZ = z;

    const now = Date.now();

    if (delta > 28 && now - lastShakeTime > 1200) {
      lastShakeTime = now;
      decide();
    }
  }

  function enableMotion() {
    if (!("DeviceMotionEvent" in window)) return;

    // iOS requires permission after a user gesture.
    if (typeof DeviceMotionEvent.requestPermission === "function") {
      DeviceMotionEvent.requestPermission()
        .then(permission => {
          if (permission === "granted") {
            window.addEventListener("devicemotion", handleMotion);
          }
        })
        .catch(() => {});
    } else {
      window.addEventListener("devicemotion", handleMotion);
    }
  }

  shakeButton?.addEventListener("click", enableMotion, { once: true });

  // Small parallax effect for decorative hero elements.
  const heroVisual = document.querySelector(".hero-visual");

  if (heroVisual && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    window.addEventListener("pointermove", event => {
      const x = (event.clientX / window.innerWidth - 0.5) * 10;
      const y = (event.clientY / window.innerHeight - 0.5) * 8;

      heroVisual.style.transform = `translate(${x}px, ${y}px)`;
    });
  }
});
