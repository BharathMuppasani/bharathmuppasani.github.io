const SLIDES = [
  "slide-01-title.html",
  "slide-02-outline.html",
  "slide-03-mapf-explanations.html",
  "slide-04-literature-gap.html",
  "slide-05-solution-overview.html",
  "slide-06-ontology-background.html",
  "slide-07-competency-questions.html",
  "slide-08-ontology-clusters.html",
  "slide-09-provenance-walkthrough.html",
  "slide-10-pipeline.html",
  "slide-11-explanation-interface.html",
  "slide-12-query-examples.html",
  "slide-13-evaluation.html",
  "slide-14-schema-scope.html",
  "slide-15-conclusion.html",
];
const RESOURCES_PAGE = "../../../../resources.html";

function fitPreview() {
  if (document.body.classList.contains("render-mode")) {
    document.documentElement.style.setProperty("--preview-scale", "1");
    return;
  }

  const width = window.innerWidth - 72;
  const height = window.innerHeight - 72;
  const scale = Math.min(1, width / 1920, height / 1080);
  document.documentElement.style.setProperty("--preview-scale", scale.toFixed(4));
}

function buildDeckNav() {
  const canvas = document.querySelector(".slide-canvas");
  if (!canvas) {
    return;
  }

  const filename = window.location.pathname.split("/").pop();
  const slideIndex = SLIDES.indexOf(filename);
  if (slideIndex === -1) {
    return;
  }

  const nav = document.createElement("nav");
  nav.className = "deck-nav";
  nav.setAttribute("aria-label", "Slide navigation");

  const resources = document.createElement("a");
  resources.className = "nav-btn nav-home";
  resources.href = RESOURCES_PAGE;
  resources.textContent = "Resources";
  nav.appendChild(resources);

  if (slideIndex > 0) {
    const home = document.createElement("a");
    home.className = "nav-btn nav-home";
    home.href = `./${SLIDES[0]}`;
    home.textContent = "Deck";
    nav.appendChild(home);
  }

  if (slideIndex > 0) {
    const prev = document.createElement("a");
    prev.className = "nav-btn";
    prev.href = `./${SLIDES[slideIndex - 1]}`;
    prev.textContent = "←";
    prev.setAttribute("aria-label", "Previous slide");
    nav.appendChild(prev);
  }

  if (slideIndex < SLIDES.length - 1) {
    const next = document.createElement("a");
    next.className = "nav-btn";
    next.href = `./${SLIDES[slideIndex + 1]}`;
    next.textContent = "→";
    next.setAttribute("aria-label", "Next slide");
    nav.appendChild(next);
  }

  canvas.appendChild(nav);

  window.addEventListener("keydown", (event) => {
    if (event.key === "ArrowLeft" && slideIndex > 0) {
      window.location.href = `./${SLIDES[slideIndex - 1]}`;
    }
    if (event.key === "ArrowRight" && slideIndex < SLIDES.length - 1) {
      window.location.href = `./${SLIDES[slideIndex + 1]}`;
    }
  });
}

function buildSlideFooter() {
  const canvas = document.querySelector(".slide-canvas");
  if (!canvas) {
    return;
  }

  const filename = window.location.pathname.split("/").pop();
  const slideIndex = SLIDES.indexOf(filename);
  if (slideIndex === -1) {
    return;
  }

  const existing = document.querySelector(".slide-footer");
  if (existing) {
    existing.style.display = "none";
  }

  const footer = document.createElement("div");
  footer.className = "runtime-slide-footer";
  const renderMode = document.body.classList.contains("render-mode");
  Object.assign(footer.style, {
    position: renderMode ? "fixed" : "absolute",
    left: "96px",
    right: "96px",
    bottom: "40px",
    zIndex: "6",
    pointerEvents: "none",
  });

  const rule = document.createElement("div");
  Object.assign(rule.style, {
    width: "100%",
    height: "5px",
    background: "#73000a",
  });

  const leftMeta = document.createElement("div");
  leftMeta.textContent = "AI4S | AIISC @ USC";
  Object.assign(leftMeta.style, {
    position: "absolute",
    left: "0",
    top: "15px",
    color: "#444444",
    fontFamily: "\"Open Sans\", Arial, sans-serif",
    fontSize: "15px",
    lineHeight: "1",
  });

  const meta = document.createElement("div");
  meta.textContent = "maPO · AAAI 2026 MAKE";
  Object.assign(meta.style, {
    position: "absolute",
    left: "50%",
    top: "15px",
    transform: "translateX(-50%)",
    color: "#444444",
    fontFamily: "\"Open Sans\", Arial, sans-serif",
    fontSize: "15px",
    lineHeight: "1",
  });

  const num = document.createElement("div");
  num.textContent = `${String(slideIndex + 1).padStart(2, "0")} / ${String(SLIDES.length).padStart(2, "0")}`;
  Object.assign(num.style, {
    position: "absolute",
    right: "0",
    top: "15px",
    color: "#444444",
    fontFamily: "\"Source Code Pro\", monospace",
    fontSize: "15px",
    lineHeight: "1",
  });

  footer.appendChild(rule);
  footer.appendChild(leftMeta);
  footer.appendChild(meta);
  footer.appendChild(num);
  canvas.appendChild(footer);
}

function ensureStage() {
  const shell = document.querySelector(".preview-shell");
  const canvas = document.querySelector(".slide-canvas");
  if (!shell || !canvas || canvas.parentElement?.classList.contains("slide-stage")) {
    return;
  }

  const stage = document.createElement("div");
  stage.className = "slide-stage";
  shell.insertBefore(stage, canvas);
  stage.appendChild(canvas);
}

function enableRenderMode() {
  const params = new URLSearchParams(window.location.search);
  if (params.get("render") === "1") {
    document.body.classList.add("render-mode");
  }
}

function enableVideoMode() {
  const params = new URLSearchParams(window.location.search);
  if (params.get("video") === "1") {
    document.body.classList.add("video-mode");
  }
}

function applyStepState() {
  const params = new URLSearchParams(window.location.search);
  const rawStep = params.get("step");
  if (rawStep === null) {
    return;
  }

  const currentStep = Number.parseInt(rawStep, 10);
  if (!Number.isFinite(currentStep) || currentStep < 0) {
    return;
  }

  document.body.classList.add("step-mode");

  document.querySelectorAll("[data-step]").forEach((node) => {
    const element = /** @type {HTMLElement} */ (node);
    const start = Number.parseInt(element.dataset.step || "", 10);
    const end = element.dataset.stepEnd
      ? Number.parseInt(element.dataset.stepEnd, 10)
      : Number.POSITIVE_INFINITY;

    if (!Number.isFinite(start)) {
      return;
    }

    if (!element.dataset.stepDisplay) {
      const computedDisplay = window.getComputedStyle(element).display;
      element.dataset.stepDisplay =
        element.dataset.stepDisplay || computedDisplay || "block";
    }

    const active = currentStep >= start && currentStep < end;
    element.style.display = active ? element.dataset.stepDisplay : "none";
    element.setAttribute("aria-hidden", active ? "false" : "true");
  });
}

window.addEventListener("DOMContentLoaded", () => {
  enableRenderMode();
  enableVideoMode();
  document.body.classList.add("slide-page");
  ensureStage();
  buildDeckNav();
  buildSlideFooter();
  applyStepState();
  fitPreview();
  window.addEventListener("resize", fitPreview);
});
