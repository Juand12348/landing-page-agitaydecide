/* =========================================================
   AGITAYDECIDE — INTERACTIONS
   ========================================================= */

document.addEventListener("DOMContentLoaded", () => {
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // ---------------------------------------------------------
  // Mobile menu
  // ---------------------------------------------------------

  const menuToggle = document.querySelector(".menu-toggle");
  const nav = document.querySelector(".nav");

  function setMenu(isOpen) {
    nav.classList.toggle("open", isOpen);
    document.body.classList.toggle("menu-open", isOpen);
    menuToggle.setAttribute("aria-expanded", String(isOpen));
    menuToggle.setAttribute("aria-label", isOpen ? "Cerrar menú" : "Abrir menú");
  }

  menuToggle?.addEventListener("click", () => {
    setMenu(!nav.classList.contains("open"));
  });

  nav?.querySelectorAll("a").forEach(link => {
    link.addEventListener("click", () => setMenu(false));
  });

  document.addEventListener("keydown", event => {
    if (event.key === "Escape" && nav?.classList.contains("open")) {
      setMenu(false);
      menuToggle.focus();
    }
  });

  // ---------------------------------------------------------
  // Reveal on scroll
  // ---------------------------------------------------------

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
      { threshold: 0.12, rootMargin: "0px 0px -40px 0px" }
    );

    revealItems.forEach(item => observer.observe(item));
  } else {
    revealItems.forEach(item => item.classList.add("visible"));
  }

  // ---------------------------------------------------------
  // Decision demo: the AGITAR button on the solution phone
  // picks one option at random and shows it on the verdict card.
  // ---------------------------------------------------------

  const options = ["Pizza", "Sushi", "Tacos"];

  const agitarButton = document.querySelector("#agitar");
  const phone = document.querySelector("#solution-phone");
  const card = document.querySelector("#verdict-card");
  const verdictName = document.querySelector("#verdict-name");
  const verdictLive = document.querySelector("#verdict-live");
  const icons = document.querySelectorAll("#verdict-card [data-icon]");

  let isDeciding = false;
  let current = "Tacos";

  function showOption(option) {
    verdictName.textContent = option;
    icons.forEach(icon => {
      icon.classList.toggle("is-hidden", icon.dataset.icon !== option);
    });
  }

  function restartAnimation(element, className) {
    element.classList.remove(className);
    void element.getBoundingClientRect();
    element.classList.add(className);
  }

  function decide() {
    if (isDeciding || !agitarButton) return;
    isDeciding = true;

    restartAnimation(phone, "is-shaking");
    restartAnimation(agitarButton, "is-shaking");
    verdictLive.textContent = "Agitando…";

    // Shuffle the card a few times before settling.
    let cycles = 0;
    const totalCycles = reduceMotion ? 1 : 7;

    const interval = setInterval(() => {
      const preview = options[(options.indexOf(current) + 1 + cycles) % options.length];
      showOption(preview);
      cycles++;

      if (cycles >= totalCycles) {
        clearInterval(interval);
        finishDecision();
      }
    }, 90);
  }

  function finishDecision() {
    current = options[Math.floor(Math.random() * options.length)];
    showOption(current);
    restartAnimation(card, "is-pop");
    verdictLive.textContent = `Decidió el azar: ${current}.`;

    isDeciding = false;

    if ("vibrate" in navigator) {
      navigator.vibrate([35, 45, 75]);
    }
  }

  agitarButton?.addEventListener("click", decide);
  agitarButton?.addEventListener("click", enableMotion, { once: true });

  // "Agitar y decidir" links scroll to the solution and shake right away.
  document.querySelectorAll("[data-shake]").forEach(link => {
    link.addEventListener("click", event => {
      const target = document.querySelector("#solucion");
      if (!target) return;

      event.preventDefault();
      target.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "center" });
      history.replaceState(null, "", "#solucion");
      setTimeout(decide, reduceMotion ? 0 : 650);
    });
  });

  // ---------------------------------------------------------
  // Device shake support
  // On supported mobile browsers, physically shaking the phone
  // triggers the decision.
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

  // ---------------------------------------------------------
  // Modal de registro (se abre desde el botón del hero)
  // ---------------------------------------------------------

  const modal = document.getElementById("hubspot-modal");
  const modalPanel = modal?.querySelector(".lead-modal__panel");
  const leadForm = document.getElementById("lead-form");
  const leadMsg = document.getElementById("lead-msg");
  const leadSubmit = leadForm?.querySelector(".lead-submit");
  const emailInput = document.getElementById("lead-email");
  let previousFocus = null;

  function openModal(event) {
    event.preventDefault();
    previousFocus = document.activeElement;
    modal.classList.add("is-open");
    modal.setAttribute("aria-hidden", "false");
    document.body.classList.add("lead-modal-open");
    modalPanel.focus();
  }

  function closeModal() {
    modal.classList.remove("is-open");
    modal.setAttribute("aria-hidden", "true");
    document.body.classList.remove("lead-modal-open");
    if (previousFocus) previousFocus.focus();
  }

  if (modal) {
    document.querySelectorAll("[data-hubspot-open]").forEach(button => {
      button.addEventListener("click", openModal);
    });

    modal.querySelectorAll("[data-hubspot-close]").forEach(button => {
      button.addEventListener("click", closeModal);
    });

    document.addEventListener("keydown", event => {
      if (event.key === "Escape" && modal.classList.contains("is-open")) closeModal();
    });
  }

  // ---------------------------------------------------------
  // Envío del formulario a HubSpot (Forms API pública)
  // portalId y formId son los de tu formulario original.
  // ---------------------------------------------------------

  const HUBSPOT_PORTAL_ID = "52177911";
  const HUBSPOT_FORM_ID = "568c5b1c-cb70-471b-af35-c376a8fe497e";
  const HUBSPOT_URL =
    `https://api.hsforms.com/submissions/v3/integration/submit/${HUBSPOT_PORTAL_ID}/${HUBSPOT_FORM_ID}`;

  function setMessage(text, isOk = false) {
    leadMsg.textContent = text;
    leadMsg.classList.toggle("ok", isOk);
  }

  // Solo limpia el estado de error cuando el usuario vuelve a escribir.
  emailInput?.addEventListener("input", () => {
    emailInput.classList.remove("is-invalid");
    if (!leadMsg.classList.contains("ok")) setMessage("");
  });

  leadForm?.addEventListener("submit", async event => {
    event.preventDefault();

    const data = new FormData(leadForm);
    const email = String(data.get("email") || "").trim();

    if (!/^\S+@\S+\.\S+$/.test(email)) {
      emailInput.classList.add("is-invalid");
      setMessage(email ? "Escribe un correo válido." : "Rellena este campo obligatorio.");
      emailInput.focus();
      return;
    }

    const payload = {
      fields: [
        { name: "firstname", value: String(data.get("firstname") || "").trim() },
        { name: "lastname", value: String(data.get("lastname") || "").trim() },
        { name: "email", value: email }
      ],
      context: {
        pageUri: window.location.href,
        pageName: document.title
      }
    };

    leadSubmit.disabled = true;
    setMessage("Enviando…", true);

    try {
      const response = await fetch(HUBSPOT_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (!response.ok) throw new Error(`HubSpot respondió ${response.status}`);

      leadForm.reset();
      setMessage("¡Listo! Te avisaremos de las novedades.", true);
    } catch (error) {
      console.error(error);
      setMessage("No se pudo enviar. Inténtalo de nuevo.");
    } finally {
      leadSubmit.disabled = false;
    }
  });
});