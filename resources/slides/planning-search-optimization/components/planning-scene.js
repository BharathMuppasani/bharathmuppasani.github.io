(() => {
  "use strict";

  const { clearChildren, createSVG } = window.SlideUtils;

  function createPlanningScene(config) {
    const svg = createSVG("svg", {
      viewBox: `0 0 ${config.width} ${config.height}`,
      role: "img",
      "aria-label": config.ariaLabel || "Planning search tree",
    });
    clearChildren(config.mount);
    config.mount.appendChild(svg);

    const layers = {
      edges: createSVG("g"),
      nodes: createSVG("g"),
      labels: createSVG("g"),
      heuristic: createSVG("g"),
      overlay: createSVG("g"),
    };
    Object.values(layers).forEach((layer) => svg.appendChild(layer));

    const nodeMap = new Map();

    config.nodes.forEach((node) => {
      nodeMap.set(node.id, node);
    });

    config.edges.forEach((edge) => {
      const from = nodeMap.get(edge.from);
      const to = nodeMap.get(edge.to);
      const line = createSVG("line", {
        x1: from.x,
        y1: from.y,
        x2: to.x,
        y2: to.y,
        stroke: "#ced4dd",
        "stroke-width": 3,
      });
      layers.edges.appendChild(line);
    });

    const circles = new Map();
    config.nodes.forEach((node) => {
      const circle = createSVG("rect", {
        x: node.x - 58,
        y: node.y - 28,
        width: 116,
        height: 56,
        rx: 16,
        fill: "#ffffff",
        stroke: "#101114",
        "stroke-width": 2.5,
      });
      const label = createSVG("text", {
        x: node.x,
        y: node.y - 5,
        "font-family": 'Avenir Next, Helvetica Neue, Arial, sans-serif',
        "font-size": 19,
        "font-weight": 800,
        fill: "#101114",
        "text-anchor": "middle",
      });
      label.textContent = node.label;
      const sub = createSVG("text", {
        x: node.x,
        y: node.y + 16,
        "font-family": "Avenir Next, Helvetica Neue, Arial, sans-serif",
        "font-size": 14,
        fill: "#5a5f69",
        "text-anchor": "middle",
      });
      sub.textContent = node.sub || "";
      layers.nodes.appendChild(circle);
      layers.labels.appendChild(label);
      layers.labels.appendChild(sub);
      circles.set(node.id, { circle, label, sub });
    });

    function reset() {
      clearChildren(layers.heuristic);
      clearChildren(layers.overlay);
      circles.forEach(({ circle, label, sub }) => {
        circle.setAttribute("fill", "#ffffff");
        circle.setAttribute("stroke", "#101114");
        circle.setAttribute("opacity", "1");
        label.setAttribute("opacity", "1");
        sub.setAttribute("opacity", "1");
      });
    }

    function expandWave(depth) {
      config.nodes.forEach((node) => {
        if (node.depth <= depth) {
          circles.get(node.id).circle.setAttribute("fill", "#eaf2ff");
          circles.get(node.id).circle.setAttribute("stroke", "#204f8d");
        }
        if (node.depth > depth + 1) {
          circles.get(node.id).circle.setAttribute("opacity", "0.3");
          circles.get(node.id).label.setAttribute("opacity", "0.35");
          circles.get(node.id).sub.setAttribute("opacity", "0.35");
        }
      });
    }

    function highlightGoal(id) {
      const node = circles.get(id);
      if (!node) {
        return;
      }
      node.circle.setAttribute("fill", "#ebf8ef");
      node.circle.setAttribute("stroke", "#1c7c54");
      node.circle.setAttribute("stroke-width", "4");
    }

    function focusPath(path) {
      for (let i = 0; i < path.length - 1; i += 1) {
        const from = nodeMap.get(path[i]);
        const to = nodeMap.get(path[i + 1]);
        if (!from || !to) {
          continue;
        }
        const line = createSVG("line", {
          x1: from.x,
          y1: from.y,
          x2: to.x,
          y2: to.y,
          stroke: "#73000a",
          "stroke-width": 7,
          "stroke-linecap": "round",
        });
        layers.overlay.appendChild(line);
      }
      path.forEach((id) => {
        const node = circles.get(id);
        if (node) {
          node.circle.setAttribute("fill", "rgba(115, 0, 10, 0.08)");
          node.circle.setAttribute("stroke", "#73000a");
          node.label.setAttribute("fill", "#73000a");
        }
      });
    }

    function setHeuristics(values) {
      Object.entries(values).forEach(([id, value]) => {
        const node = nodeMap.get(id);
        if (!node) {
          return;
        }
        const rect = createSVG("rect", {
          x: node.x - 26,
          y: node.y - 54,
          width: 52,
          height: 22,
          rx: 11,
          fill: "#ffffff",
          stroke: "#d7dbe0",
        });
        const label = createSVG("text", {
          x: node.x,
          y: node.y - 38,
          "font-family": '"SFMono-Regular", Menlo, monospace',
          "font-size": 14,
          "font-weight": 700,
          fill: "#5a5f69",
          "text-anchor": "middle",
        });
        label.textContent = `${value}`;
        layers.heuristic.appendChild(rect);
        layers.heuristic.appendChild(label);
      });
    }

    function annotate(text, x, y) {
      const rect = createSVG("rect", {
        x,
        y,
        width: Math.max(180, text.length * 9),
        height: 34,
        rx: 17,
        fill: "#ffffff",
        stroke: "#d7dbe0",
      });
      const label = createSVG("text", {
        x: x + 14,
        y: y + 23,
        "font-family": "Avenir Next, Helvetica Neue, Arial, sans-serif",
        "font-size": 18,
        "font-weight": 700,
        fill: "#101114",
      });
      label.textContent = text;
      layers.overlay.appendChild(rect);
      layers.overlay.appendChild(label);
    }

    function highlightFrontier(ids, options = {}) {
      ids.forEach((id) => {
        const node = circles.get(id);
        if (!node) {
          return;
        }
        node.circle.setAttribute("fill", options.fill || "#eaf2ff");
        node.circle.setAttribute("stroke", options.stroke || "#204f8d");
        node.circle.setAttribute("stroke-width", options.width || "4");
      });
    }

    function markInvalid(ids, options = {}) {
      ids.forEach((id) => {
        const node = circles.get(id);
        if (!node) {
          return;
        }
        node.circle.setAttribute("fill", options.fill || "#fcebea");
        node.circle.setAttribute("stroke", options.stroke || "#b42318");
        node.label.setAttribute("fill", options.textFill || "#b42318");
        const crossA = createSVG("line", {
          x1: nodeMap.get(id).x - 22,
          y1: nodeMap.get(id).y - 18,
          x2: nodeMap.get(id).x + 22,
          y2: nodeMap.get(id).y + 18,
          stroke: options.stroke || "#b42318",
          "stroke-width": 4,
          "stroke-linecap": "round",
        });
        const crossB = createSVG("line", {
          x1: nodeMap.get(id).x + 22,
          y1: nodeMap.get(id).y - 18,
          x2: nodeMap.get(id).x - 22,
          y2: nodeMap.get(id).y + 18,
          stroke: options.stroke || "#b42318",
          "stroke-width": 4,
          "stroke-linecap": "round",
        });
        layers.overlay.appendChild(crossA);
        layers.overlay.appendChild(crossB);
      });
    }

    function addBadge(id, text, options = {}) {
      const node = nodeMap.get(id);
      if (!node) {
        return;
      }
      const rect = createSVG("rect", {
        x: node.x - 34,
        y: node.y - 62,
        width: 68,
        height: 22,
        rx: 11,
        fill: "#ffffff",
        stroke: options.stroke || "#d7dbe0",
      });
      const label = createSVG("text", {
        x: node.x,
        y: node.y - 47,
        "font-family": '"SFMono-Regular", Menlo, monospace',
        "font-size": 13,
        "font-weight": 700,
        fill: options.fill || "#5a5f69",
        "text-anchor": "middle",
      });
      label.textContent = text;
      layers.heuristic.appendChild(rect);
      layers.heuristic.appendChild(label);
    }

    function showCounter(text, options = {}) {
      annotate(text, options.x || 20, options.y || 22);
    }

    reset();

    return {
      addBadge,
      reset,
      highlightFrontier,
      expandWave,
      highlightGoal,
      markInvalid,
      focusPath,
      setHeuristics,
      annotate,
      showCounter,
    };
  }

  window.createPlanningScene = createPlanningScene;
})();
