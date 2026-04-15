(() => {
  "use strict";

  const { clearChildren, createSVG } = window.SlideUtils;

  function createEnvironmentScene(config) {
    const svg = createSVG("svg", {
      viewBox: `0 0 ${config.width} ${config.height}`,
      role: "img",
      "aria-label": config.ariaLabel || "Environment scene",
    });
    clearChildren(config.mount);
    config.mount.appendChild(svg);

    const layers = {
      edges: createSVG("g"),
      path: createSVG("g"),
      locations: createSVG("g"),
      goals: createSVG("g"),
      packages: createSVG("g"),
      robot: createSVG("g"),
      labels: createSVG("g"),
      overlay: createSVG("g"),
    };
    Object.values(layers).forEach((layer) => svg.appendChild(layer));

    const locationById = new Map();
    const packageNodes = new Map();

    config.locations.forEach((loc) => {
      locationById.set(loc.id, loc);
    });

    config.edges.forEach((edge) => {
      const from = locationById.get(edge.from);
      const to = locationById.get(edge.to);
      const line = createSVG("line", {
        x1: from.x,
        y1: from.y,
        x2: to.x,
        y2: to.y,
        stroke: "#bcc3cd",
        "stroke-width": edge.primary ? 8 : 5,
        "stroke-linecap": "round",
      });
      layers.edges.appendChild(line);
      const label = createSVG("text", {
        x: (from.x + to.x) / 2,
        y: (from.y + to.y) / 2 - 12,
        "font-family": '"SFMono-Regular", Menlo, monospace',
        "font-size": 17,
        "font-weight": 700,
        fill: "#5a5f69",
        "text-anchor": "middle",
      });
      label.textContent = `${edge.cost}`;
      layers.labels.appendChild(label);
    });

    config.locations.forEach((loc) => {
      const ring = createSVG("rect", {
        x: loc.x - 72,
        y: loc.y - 42,
        width: 144,
        height: 84,
        rx: 20,
        fill: loc.goal ? "#ebf8ef" : "#ffffff",
        stroke: loc.goal ? "#1c7c54" : "#101114",
        "stroke-width": loc.goal ? 3 : 2.5,
      });
      const name = createSVG("text", {
        x: loc.x,
        y: loc.y + 30,
        "font-family": 'Inter, system-ui, -apple-system, Arial, sans-serif',
        "font-size": 24,
        "font-weight": 800,
        fill: "#101114",
        "text-anchor": "middle",
      });
      name.textContent = loc.label || loc.id;
      layers.locations.appendChild(ring);
      layers.locations.appendChild(name);
    });

    const robotGroup = createSVG("g");
    const robotBody = createSVG("rect", {
      x: -22,
      y: -18,
      width: 44,
      height: 36,
      rx: 10,
      fill: "#101114",
    });
    const robotTop = createSVG("rect", {
      x: -14,
      y: -34,
      width: 28,
      height: 18,
      rx: 8,
      fill: "#73000a",
    });
    const robotWheelL = createSVG("circle", { cx: -12, cy: 22, r: 6, fill: "#101114" });
    const robotWheelR = createSVG("circle", { cx: 12, cy: 22, r: 6, fill: "#101114" });
    const eyeL = createSVG("circle", { cx: -7, cy: -1, r: 3, fill: "#ffffff" });
    const eyeR = createSVG("circle", { cx: 7, cy: -1, r: 3, fill: "#ffffff" });
    robotGroup.appendChild(robotTop);
    robotGroup.appendChild(robotBody);
    robotGroup.appendChild(robotWheelL);
    robotGroup.appendChild(robotWheelR);
    robotGroup.appendChild(eyeL);
    robotGroup.appendChild(eyeR);
    layers.robot.appendChild(robotGroup);

    config.packages.forEach((pkg, index) => {
      const group = createSVG("g");
      const box = createSVG("rect", {
        x: -18,
        y: -18,
        width: 36,
        height: 36,
        rx: 10,
        fill: index % 2 === 0 ? "#eaf2ff" : "#fcebea",
        stroke: index % 2 === 0 ? "#204f8d" : "#73000a",
        "stroke-width": 2.5,
      });
      const label = createSVG("text", {
        x: 0,
        y: 7,
        "font-family": 'Inter, system-ui, -apple-system, Arial, sans-serif',
        "font-size": 18,
        "font-weight": 800,
        fill: index % 2 === 0 ? "#204f8d" : "#73000a",
        "text-anchor": "middle",
      });
      label.textContent = pkg.short || pkg.id.replace("package", "P");
      group.appendChild(box);
      group.appendChild(label);
      layers.packages.appendChild(group);
      packageNodes.set(pkg.id, { group, data: pkg });
    });

    let robotLocation = config.robot;
    const packageState = new Map(config.packages.map((pkg) => [pkg.id, { location: pkg.location, carried: false }]));

    function locate(node, x, y) {
      node.setAttribute("transform", `translate(${x}, ${y})`);
    }

    function reset() {
      clearChildren(layers.goals);
      clearChildren(layers.path);
      clearChildren(layers.overlay);
      robotLocation = config.robot;
      locate(robotGroup, locationById.get(robotLocation).x, locationById.get(robotLocation).y);
      config.packages.forEach((pkg, index) => {
        packageState.set(pkg.id, { location: pkg.location, carried: false });
        const loc = locationById.get(pkg.location);
        const offsetX = index === 0 ? -36 : 36;
        locate(packageNodes.get(pkg.id).group, loc.x + offsetX, loc.y + 58);
      });
    }

    function showGoals(goalIds) {
      goalIds.forEach((id) => {
        const loc = locationById.get(id);
        if (!loc) {
          return;
        }
        const ring = createSVG("circle", {
          cx: loc.x,
          cy: loc.y,
          r: 58,
          fill: "none",
          stroke: "#1c7c54",
          "stroke-dasharray": "6 8",
          "stroke-width": 4,
        });
        layers.goals.appendChild(ring);
      });
    }

    function showPath(path, options = {}) {
      for (let i = 0; i < path.length - 1; i += 1) {
        const from = locationById.get(path[i]);
        const to = locationById.get(path[i + 1]);
        if (!from || !to) {
          continue;
        }
        const line = createSVG("line", {
          x1: from.x,
          y1: from.y,
          x2: to.x,
          y2: to.y,
          stroke: options.stroke || "#73000a",
          "stroke-linecap": "round",
          "stroke-width": options.width || 10,
          opacity: options.opacity || 0.8,
        });
        layers.path.appendChild(line);
      }
    }

    function moveRobot(locationId) {
      const loc = locationById.get(locationId);
      if (!loc) {
        return;
      }
      robotLocation = locationId;
      locate(robotGroup, loc.x, loc.y);
      packageState.forEach((state, id) => {
        if (state.carried) {
          locate(packageNodes.get(id).group, loc.x + 48, loc.y - 18);
        }
      });
    }

    function pickObject(id) {
      const state = packageState.get(id);
      if (!state) {
        return;
      }
      state.carried = true;
      state.location = robotLocation;
      const robotLoc = locationById.get(robotLocation);
      locate(packageNodes.get(id).group, robotLoc.x + 48, robotLoc.y - 18);
    }

    function dropObject(id, locationId) {
      const state = packageState.get(id);
      const loc = locationById.get(locationId);
      if (!state || !loc) {
        return;
      }
      state.carried = false;
      state.location = locationId;
      locate(packageNodes.get(id).group, loc.x + 42, loc.y + 58);
    }

    function addObstacle(edgeId, options = {}) {
      const [fromId, toId] = edgeId.split("-");
      const from = locationById.get(fromId);
      const to = locationById.get(toId);
      if (!from || !to) {
        return;
      }
      const line = createSVG("line", {
        x1: from.x,
        y1: from.y,
        x2: to.x,
        y2: to.y,
        stroke: options.stroke || "#b42318",
        "stroke-width": 12,
        "stroke-linecap": "round",
        opacity: 0.8,
      });
      const slash = createSVG("line", {
        x1: (from.x + to.x) / 2 - 26,
        y1: (from.y + to.y) / 2 - 26,
        x2: (from.x + to.x) / 2 + 26,
        y2: (from.y + to.y) / 2 + 26,
        stroke: options.stroke || "#b42318",
        "stroke-width": 8,
        "stroke-linecap": "round",
      });
      layers.overlay.appendChild(line);
      layers.overlay.appendChild(slash);
    }

    function annotate(text, x, y, color = "#101114") {
      const rect = createSVG("rect", {
        x,
        y,
        width: Math.max(180, text.length * 10),
        height: 38,
        rx: 19,
        fill: "#ffffff",
        stroke: "#d7dbe0",
      });
      const label = createSVG("text", {
        x: x + 16,
        y: y + 25,
        "font-family": "Inter, system-ui, -apple-system, Arial, sans-serif",
        "font-size": 18,
        "font-weight": 700,
        fill: color,
      });
      label.textContent = text;
      layers.overlay.appendChild(rect);
      layers.overlay.appendChild(label);
    }

    reset();

    return {
      reset,
      showGoals,
      showPath,
      moveRobot,
      pickObject,
      dropObject,
      addObstacle,
      annotate,
    };
  }

  window.createEnvironmentScene = createEnvironmentScene;
})();
