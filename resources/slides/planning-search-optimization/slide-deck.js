const SLIDES = [
  { file: "slide-01-title.html", short: "Title" },
  { file: "slide-02-why-planning.html", short: "Outline" },
  { file: "slide-03-search-graphs.html", short: "Motivation" },
  { file: "slide-04-planning-generalizes.html", short: "Metrics on Paths" },
  { file: "slide-05-classical-formalism.html", short: "BFS vs DFS" },
  { file: "slide-06-delivery-robot.html", short: "A*" },
  { file: "slide-07-pddl-modeling.html", short: "Modeling" },
  { file: "slide-08-feasible-plan.html", short: "Formalism" },
  { file: "slide-09-constraint-optimization.html", short: "State Expansion" },
  { file: "slide-10-metric-tradeoffs.html", short: "Blind Search" },
  { file: "slide-11-plan-search.html", short: "Optimization View" },
  { file: "slide-12-heuristics-practical.html", short: "Metric Sensitivity" },
  { file: "slide-13-heuristic-families.html", short: "Heuristic Guidance" },
  { file: "slide-14-planner-skeleton.html", short: "Heuristic Design" },
  { file: "slide-15-classical-limits.html", short: "Planner Skeleton" },
  { file: "slide-16-dynamic-responses.html", short: "Classical Limits" },
  { file: "slide-17-planning-to-rl.html", short: "Dynamic Response" },
  { file: "slide-18-takeaways.html", short: "Why Learning?" },
  { file: "slide-19-learning-bridge.html", short: "Labels vs Rewards" },
  { file: "slide-20-takeaways.html", short: "Takeaways" },
];
const RESOURCES_PAGE = "../../../resources.html";

let currentStep = 0;
let maxStep = 0;
let slideController = null;
let currentSlideFile = "";

function fitPreview() {
  if (document.body.classList.contains("render-mode") || document.body.classList.contains("export-mode")) {
    document.documentElement.style.setProperty("--preview-scale", "1");
    return;
  }

  const width = window.innerWidth - 72;
  const height = window.innerHeight - 72;
  const scale = Math.min(1, width / 1920, height / 1080);
  document.documentElement.style.setProperty("--preview-scale", scale.toFixed(4));
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

function enableModes() {
  const params = new URLSearchParams(window.location.search);
  if (params.get("render") === "1") {
    document.body.classList.add("render-mode");
  }
  if (params.get("export") === "1" || params.get("print") === "1") {
    document.body.classList.add("export-mode");
  }
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    document.body.classList.add("reduced-motion");
  }
}

function getSlideIndex(filename) {
  return SLIDES.findIndex((slide) => slide.file === filename);
}

function getFilename() {
  return window.location.pathname.split("/").pop() || "";
}

function buildDeckNav() {
  const canvas = document.querySelector(".slide-canvas");
  if (!canvas) {
    return;
  }

  const slideIndex = getSlideIndex(currentSlideFile);
  if (slideIndex === -1) {
    return;
  }

  if (canvas.querySelector(".deck-nav")) {
    return;
  }

  const nav = document.createElement("nav");
  nav.className = "deck-nav";
  nav.setAttribute("aria-label", "Slide navigation");

  const resources = document.createElement("a");
  resources.className = "nav-btn secondary";
  resources.href = RESOURCES_PAGE;
  resources.textContent = "Resources";
  nav.appendChild(resources);

  if (slideIndex > 0) {
    const home = document.createElement("a");
    home.className = "nav-btn secondary";
    home.href = `./${SLIDES[0].file}`;
    home.textContent = "Deck";
    nav.appendChild(home);
  }

  if (slideIndex > 0) {
    const prev = document.createElement("a");
    prev.className = "nav-btn secondary";
    prev.href = `./${SLIDES[slideIndex - 1].file}?step=999`;
    prev.textContent = "←";
    nav.appendChild(prev);
  }

  if (slideIndex < SLIDES.length - 1) {
    const next = document.createElement("a");
    next.className = "nav-btn";
    next.href = `./${SLIDES[slideIndex + 1].file}`;
    next.textContent = "→";
    nav.appendChild(next);
  }

  canvas.appendChild(nav);
}

function buildFooter() {
  const footer = document.querySelector(".slide-footer");
  if (!footer) {
    return;
  }

  const slideIndex = getSlideIndex(currentSlideFile);
  if (slideIndex <= 0) {
    return;
  }

  let page = footer.querySelector(".page-number");
  if (!page) {
    page = document.createElement("div");
    page.className = "page-number";
    footer.appendChild(page);
  }
  page.textContent = `${String(slideIndex + 1).padStart(2, "0")}`;

  if (!footer.querySelector(".footer-mark") && !document.querySelector(".title-slide")) {
    const mark = document.createElement("div");
    mark.className = "footer-mark";
    mark.innerHTML = "<span>Planning as Search and Optimization</span><span>Optimization Class</span>";
    footer.appendChild(mark);
  }
}

function computeMaxStep() {
  maxStep = 0;
  document.querySelectorAll("[data-step]").forEach((node) => {
    const raw = Number.parseInt(node.getAttribute("data-step") || "0", 10);
    const rawEnd = Number.parseInt(node.getAttribute("data-step-end") || "0", 10);
    if (Number.isFinite(raw)) {
      maxStep = Math.max(maxStep, raw);
    }
    if (Number.isFinite(rawEnd)) {
      maxStep = Math.max(maxStep, rawEnd - 1);
    }
  });
}

function setUrlStep(step) {
  const params = new URLSearchParams(window.location.search);
  if (step <= 0) {
    params.delete("step");
  } else {
    params.set("step", `${step}`);
  }
  const next = `${window.location.pathname}${params.toString() ? `?${params.toString()}` : ""}`;
  window.history.replaceState({}, "", next);
}

function runInit(step) {
  const ctx = {
    step,
    maxStep,
    root: document.querySelector(".slide-canvas"),
    exportMode: document.body.classList.contains("export-mode") || document.body.classList.contains("render-mode"),
    reducedMotion: document.body.classList.contains("reduced-motion"),
    slideFile: currentSlideFile,
  };

  if (!slideController && typeof window.initSlide === "function") {
    slideController = window.initSlide(ctx) || null;
  }

  if (slideController && typeof slideController.setStep === "function") {
    slideController.setStep(step, ctx);
  }
}

function applyStep(step) {
  currentStep = Math.max(0, Math.min(step, maxStep));
  SlideUtils.setStepVisibility(document.body, currentStep);
  setUrlStep(currentStep);
  runInit(currentStep);
}

function goToSlide(index, step = 0) {
  if (index < 0 || index >= SLIDES.length) {
    return;
  }
  const suffix = step > 0 ? `?step=${step}` : "";
  window.location.href = `./${SLIDES[index].file}${suffix}`;
}

function handleKey(event) {
  const slideIndex = getSlideIndex(currentSlideFile);
  if (slideIndex === -1) {
    return;
  }

  if (["ArrowRight", "PageDown", " "].includes(event.key)) {
    event.preventDefault();
    if (currentStep < maxStep) {
      applyStep(currentStep + 1);
    } else {
      goToSlide(slideIndex + 1, 0);
    }
  }

  if (["ArrowLeft", "PageUp", "Backspace"].includes(event.key)) {
    event.preventDefault();
    if (currentStep > 0) {
      applyStep(currentStep - 1);
    } else {
      goToSlide(slideIndex - 1, 999);
    }
  }

  if (event.key === "Home") {
    event.preventDefault();
    goToSlide(0, 0);
  }

  if (event.key === "End") {
    event.preventDefault();
    goToSlide(SLIDES.length - 1, 999);
  }
}

window.addEventListener("DOMContentLoaded", () => {
  enableModes();
  currentSlideFile = getFilename();
  ensureStage();
  computeMaxStep();
  const requested = Number.parseInt(new URLSearchParams(window.location.search).get("step") || "0", 10);
  buildDeckNav();
  buildFooter();
  fitPreview();
  applyStep(Number.isFinite(requested) ? requested : 0);
  window.addEventListener("resize", fitPreview);
  window.addEventListener("keydown", handleKey);
});
