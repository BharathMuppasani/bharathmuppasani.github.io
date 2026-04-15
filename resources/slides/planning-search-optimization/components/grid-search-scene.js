(() => {
  "use strict";

  const { clearChildren, createSVG } = window.SlideUtils;

  function keyOf(cell) {
    return `${cell[0]},${cell[1]}`;
  }

  function normalizeCells(cells) {
    return new Set((cells || []).map((cell) => (typeof cell === "string" ? cell : keyOf(cell))));
  }

  function pointFor(config, col, row) {
    const x = config.padding + col * config.cell + config.cell / 2;
    const y = config.padding + row * config.cell + config.cell / 2;
    return { x, y };
  }

  function parseCell(value) {
    if (typeof value !== "string") {
      return value;
    }
    return value.split(",").map((part) => Number.parseInt(part, 10));
  }

  function createGridSearchScene(config) {
    const svg = createSVG("svg", {
      viewBox: `0 0 ${config.width} ${config.height}`,
      role: "img",
      "aria-label": config.ariaLabel || "Grid search scene",
    });
    clearChildren(config.mount);
    config.mount.appendChild(svg);

    const defs = createSVG("defs");
    defs.innerHTML = `
      <filter id="grid-search-shadow" x="-30%" y="-30%" width="160%" height="160%">
        <feDropShadow dx="0" dy="8" stdDeviation="10" flood-color="rgba(16,17,20,0.12)"></feDropShadow>
      </filter>
    `;
    svg.appendChild(defs);

    const layers = {
      floor: createSVG("g"),
      route: createSVG("g"),
      visited: createSVG("g"),
      frontier: createSVG("g"),
      heuristics: createSVG("g"),
      labels: createSVG("g"),
      overlay: createSVG("g"),
      actors: createSVG("g"),
    };
    Object.values(layers).forEach((layer) => svg.appendChild(layer));

    const wallSet = normalizeCells(config.walls);
    const cellMap = new Map();
    const labelMap = new Map();
    const cellStates = new Map();

    for (let row = 0; row < config.rows; row += 1) {
      for (let col = 0; col < config.cols; col += 1) {
        const id = keyOf([col, row]);
        const x = config.padding + col * config.cell;
        const y = config.padding + row * config.cell;
        const base = createSVG("rect", {
          x,
          y,
          width: config.cell,
          height: config.cell,
          rx: 10,
          fill: wallSet.has(id) ? "#d8dbdf" : "#ffffff",
          stroke: wallSet.has(id) ? "#d8dbdf" : "#dbe0e5",
          "stroke-width": wallSet.has(id) ? 1 : 1.6,
        });
        layers.floor.appendChild(base);
        cellMap.set(id, base);

        if (!wallSet.has(id)) {
          const state = createSVG("rect", {
            x: x + 3,
            y: y + 3,
            width: config.cell - 6,
            height: config.cell - 6,
            rx: 8,
            fill: "transparent",
            stroke: "transparent",
            "stroke-width": 0,
            style: "transition: fill 320ms ease, stroke 320ms ease, stroke-width 320ms ease, opacity 320ms ease;",
          });
          layers.visited.appendChild(state);
          cellStates.set(id, state);
        }

        const weight = config.weights?.[id];
        if (weight !== undefined && !wallSet.has(id)) {
          const w = createSVG("text", {
            x: x + config.cell - 8,
            y: y + 16,
            "font-family": '"SFMono-Regular", Menlo, monospace',
            "font-size": 12,
            "font-weight": 700,
            fill: "#8a5a1f",
            "text-anchor": "end",
          });
          w.textContent = `${weight}`;
          layers.labels.appendChild(w);
        }

        const cellLabel = config.cellLabels?.[id];
        if (cellLabel) {
          const label = createSVG("text", {
            x: x + config.cell / 2,
            y: y + config.cell + 24,
            "font-family": 'Avenir Next, Helvetica Neue, Arial, sans-serif',
            "font-size": 12,
            "font-weight": 700,
            fill: "#5a5f69",
            "text-anchor": "middle",
          });
          label.textContent = cellLabel;
          layers.labels.appendChild(label);
          labelMap.set(id, label);
        }
      }
    }

    function drawBadge(cell, fill, stroke, label, labelFill = "#101114") {
      const [col, row] = parseCell(cell);
      const point = pointFor(config, col, row);
      const group = createSVG("g", { filter: "url(#grid-search-shadow)" });
      const circle = createSVG("circle", {
        cx: point.x,
        cy: point.y,
        r: config.cell * 0.32,
        fill,
        stroke,
        "stroke-width": 4,
        style: "transition: fill 320ms ease, stroke 320ms ease, transform 320ms ease;",
      });
      const text = createSVG("text", {
        x: point.x,
        y: point.y + 6,
        "font-family": 'Avenir Next, Helvetica Neue, Arial, sans-serif',
        "font-size": config.cell * 0.36,
        "font-weight": 900,
        fill: labelFill,
        "text-anchor": "middle",
      });
      text.textContent = label;
      group.appendChild(circle);
      group.appendChild(text);
      return group;
    }

    const start = drawBadge(config.start, "#fff8f8", "#73000a", "S", "#73000a");
    const goal = drawBadge(config.goal, "#ebf8ef", "#1c7c54", "G", "#1c7c54");
    layers.actors.appendChild(start);
    layers.actors.appendChild(goal);

    function drawPolyline(path, color, options = {}) {
      if (!path || path.length < 2) {
        return;
      }
      const points = path.map((cell) => {
        const [col, row] = parseCell(cell);
        const point = pointFor(config, col, row);
        return `${point.x},${point.y}`;
      });
      const poly = createSVG("polyline", {
        points: points.join(" "),
        fill: "none",
        stroke: color,
        "stroke-linecap": "round",
        "stroke-linejoin": "round",
        "stroke-width": options.width || Math.max(8, config.cell * 0.18),
        opacity: 0,
        style: "transition: opacity 360ms ease;",
      });
      if (options.dasharray) {
        poly.setAttribute("stroke-dasharray", options.dasharray);
      }
      layers.route.appendChild(poly);
      window.requestAnimationFrame(() => {
        poly.setAttribute("opacity", `${options.opacity ?? 1}`);
      });
    }

    function clearDynamic() {
      clearChildren(layers.route);
      clearChildren(layers.frontier);
      clearChildren(layers.heuristics);
      clearChildren(layers.overlay);
      cellStates.forEach((state) => {
        state.setAttribute("fill", "transparent");
        state.setAttribute("stroke", "transparent");
        state.setAttribute("stroke-width", "0");
      });
    }

    function addStatCard(lines) {
      if (!lines || !lines.length) {
        return;
      }
      const group = createSVG("g", { filter: "url(#grid-search-shadow)" });
      const width = 180;
      const height = 26 + lines.length * 22;
      const x = config.width - width - 18;
      const y = 18;
      const bg = createSVG("rect", {
        x,
        y,
        width,
        height,
        rx: 16,
        fill: "#ffffff",
        stroke: "#d7dbe0",
      });
      group.appendChild(bg);
      lines.forEach((line, index) => {
        const text = createSVG("text", {
          x: x + 16,
          y: y + 26 + index * 21,
          "font-family": 'Avenir Next, Helvetica Neue, Arial, sans-serif',
          "font-size": 15,
          "font-weight": index === 0 ? 800 : 600,
          fill: index === 0 ? "#101114" : "#5a5f69",
        });
        text.textContent = line;
        group.appendChild(text);
      });
      layers.overlay.appendChild(group);
    }

    function applyFrame(frame = {}) {
      clearDynamic();
      const visited = normalizeCells(frame.visited);
      const frontier = normalizeCells(frame.frontier);
      const current = normalizeCells(frame.current ? [frame.current] : []);
      const path = frame.path || [];

      visited.forEach((id) => {
        const state = cellStates.get(id);
        if (state) {
          state.setAttribute("fill", frame.visitedFill || "#eaf2ff");
          state.setAttribute("stroke", "transparent");
        }
      });

      frontier.forEach((id) => {
        const state = cellStates.get(id);
        if (!state) {
          return;
        }
        state.setAttribute("fill", frame.frontierFill || "rgba(32,79,141,0.16)");
        state.setAttribute("stroke", frame.frontierStroke || "#204f8d");
        state.setAttribute("stroke-width", "3");
      });

      current.forEach((id) => {
        const state = cellStates.get(id);
        if (!state) {
          return;
        }
        state.setAttribute("fill", frame.currentFill || "rgba(115,0,10,0.12)");
        state.setAttribute("stroke", frame.currentStroke || "#73000a");
        state.setAttribute("stroke-width", "4");
      });

      drawPolyline(path, frame.pathColor || "#73000a", {
        width: frame.pathWidth,
        opacity: frame.pathOpacity,
        dasharray: frame.pathDasharray,
      });
      (frame.extraPaths || []).forEach((extraPath) => {
        drawPolyline(extraPath.path, extraPath.color || "#204f8d", {
          width: extraPath.width,
          opacity: extraPath.opacity,
          dasharray: extraPath.dasharray,
        });
      });

      Object.entries(frame.heuristics || {}).forEach(([id, value]) => {
        const [col, row] = parseCell(id);
        const x = config.padding + col * config.cell + config.cell - 8;
        const y = config.padding + row * config.cell + config.cell - 8;
        const rect = createSVG("rect", {
          x: x - 28,
          y: y - 18,
          width: 28,
          height: 18,
          rx: 9,
          fill: "#ffffff",
          stroke: "#d7dbe0",
        });
        const label = createSVG("text", {
          x: x - 14,
          y: y - 5,
          "font-family": '"SFMono-Regular", Menlo, monospace',
          "font-size": 11,
          "font-weight": 700,
          fill: "#5a5f69",
          "text-anchor": "middle",
        });
        label.textContent = `${value}`;
        layers.heuristics.appendChild(rect);
        layers.heuristics.appendChild(label);
      });

      if (frame.annotation) {
        const rect = createSVG("rect", {
          x: frame.annotation.x,
          y: frame.annotation.y,
          width: frame.annotation.width || Math.max(150, frame.annotation.text.length * 7.2),
          height: 34,
          rx: 17,
          fill: "#ffffff",
          stroke: "#d7dbe0",
        });
        const text = createSVG("text", {
          x: frame.annotation.x + 14,
          y: frame.annotation.y + 23,
          "font-family": 'Avenir Next, Helvetica Neue, Arial, sans-serif',
          "font-size": 15,
          "font-weight": 700,
          fill: frame.annotation.fill || "#101114",
        });
        text.textContent = frame.annotation.text;
        layers.overlay.appendChild(rect);
        layers.overlay.appendChild(text);
      }

      if (frame.stats) {
        addStatCard(frame.stats);
      }
    }

    function startLoop(frames, options = {}) {
      const exportMode = options.exportMode || document.body.classList.contains("render-mode") || document.body.classList.contains("export-mode");
      const reducedMotion = options.reducedMotion || document.body.classList.contains("reduced-motion");
      const fallback = frames[Math.max(0, Math.min(frames.length - 1, options.exportFrame ?? frames.length - 1))];

      if (!frames.length) {
        return { stop() {} };
      }
      if (exportMode || reducedMotion) {
        applyFrame(fallback);
        return { stop() {} };
      }

      let index = 0;
      let startedAt = null;
      let raf = null;

      function durationFor(frameIndex) {
        const frame = frames[frameIndex] || {};
        if (Number.isFinite(frame.duration)) {
          return frame.duration;
        }
        if (frameIndex === frames.length - 1 && Number.isFinite(options.holdLastMs)) {
          return options.holdLastMs;
        }
        return options.interval || 850;
      }

      function tick(timestamp) {
        if (startedAt === null) {
          startedAt = timestamp;
          applyFrame(frames[index]);
        }

        if (timestamp - startedAt >= durationFor(index)) {
          index = (index + 1) % frames.length;
          startedAt = timestamp;
          applyFrame(frames[index]);
        }

        raf = window.requestAnimationFrame(tick);
      }

      raf = window.requestAnimationFrame(tick);
      return {
        stop() {
          if (raf !== null) {
            window.cancelAnimationFrame(raf);
            raf = null;
          }
        },
      };
    }

    return {
      clearDynamic,
      applyFrame,
      startLoop,
      svg,
    };
  }

  window.createGridSearchScene = createGridSearchScene;
})();
