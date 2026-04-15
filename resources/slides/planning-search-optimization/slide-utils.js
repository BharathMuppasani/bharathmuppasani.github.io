(() => {
  "use strict";

  function qs(name, search = window.location.search) {
    return new URLSearchParams(search).get(name);
  }

  function clamp(value, min, max) {
    return Math.min(max, Math.max(min, value));
  }

  function lerp(a, b, t) {
    return a + (b - a) * t;
  }

  function createSVG(tag, attrs = {}) {
    const node = document.createElementNS("http://www.w3.org/2000/svg", tag);
    Object.entries(attrs).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        node.setAttribute(key, `${value}`);
      }
    });
    return node;
  }

  function clearChildren(node) {
    while (node.firstChild) {
      node.removeChild(node.firstChild);
    }
  }

  function setStepVisibility(root, step) {
    root.querySelectorAll("[data-step]").forEach((node) => {
      const start = Number.parseInt(node.getAttribute("data-step") || "0", 10);
      const endAttr = node.getAttribute("data-step-end");
      const end = endAttr === null ? Number.POSITIVE_INFINITY : Number.parseInt(endAttr, 10);
      const active = step >= start && step < end;

      if (!node.dataset.stepDisplay) {
        const display = window.getComputedStyle(node).display;
        node.dataset.stepDisplay = display === "none" ? "block" : display;
      }

      node.style.display = active ? node.dataset.stepDisplay : "none";
      node.setAttribute("aria-hidden", active ? "false" : "true");
    });
  }

  function forceSceneToStep(scene, step, ctx = {}) {
    if (scene && typeof scene.setStep === "function") {
      scene.setStep(step, ctx);
    }
  }

  function animateIfAllowed(fn, options = {}) {
    const reducedMotion = options.reducedMotion || window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const exportMode = options.exportMode || document.body.classList.contains("export-mode");
    if (reducedMotion || exportMode) {
      return;
    }
    fn();
  }

  function isExportMode() {
    return document.body.classList.contains("export-mode") || document.body.classList.contains("render-mode");
  }

  function isReducedMotion() {
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches || document.body.classList.contains("reduced-motion");
  }

  function createFrameLoop(config) {
    const frames = Array.isArray(config.frames) ? config.frames : [];
    const applyFrame = typeof config.applyFrame === "function" ? config.applyFrame : () => {};
    const frameMs = config.frameMs || 1200;
    const initialFrame = Number.isFinite(config.initialFrame) ? config.initialFrame : 0;
    const exportFrame = Number.isFinite(config.exportFrame)
      ? config.exportFrame
      : Math.max(0, frames.length - 1);

    let timer = null;
    let index = clamp(initialFrame, 0, Math.max(0, frames.length - 1));

    function render(idx) {
      if (!frames.length) {
        return;
      }
      index = clamp(idx, 0, frames.length - 1);
      applyFrame(frames[index], index);
    }

    function stop() {
      if (timer !== null) {
        window.clearInterval(timer);
        timer = null;
      }
    }

    function start() {
      stop();
      if (!frames.length) {
        return;
      }
      if (isExportMode() || isReducedMotion()) {
        render(exportFrame);
        return;
      }
      render(index);
      timer = window.setInterval(() => {
        index = (index + 1) % frames.length;
        render(index);
      }, frameMs);
    }

    return {
      start,
      stop,
      setFrame(frameIndex) {
        stop();
        render(frameIndex);
      },
      reset() {
        index = clamp(initialFrame, 0, Math.max(0, frames.length - 1));
        render(index);
      },
    };
  }

  window.SlideUtils = {
    animateIfAllowed,
    clamp,
    clearChildren,
    createFrameLoop,
    createSVG,
    forceSceneToStep,
    isExportMode,
    isReducedMotion,
    lerp,
    qs,
    setStepVisibility,
  };
})();
