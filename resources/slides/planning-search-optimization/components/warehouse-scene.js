(() => {
  "use strict";

  const { clearChildren, createSVG } = window.SlideUtils;

  const DEFAULT_WORLD = {
    locations: [
      { id: "mailroom", label: "mailroom", x: 170, y: 210, zone: "ingress" },
      { id: "hallway", label: "hallway", x: 430, y: 300, zone: "hub" },
      { id: "storage", label: "storage", x: 430, y: 470, zone: "work" },
      { id: "lab", label: "lab", x: 1020, y: 160, zone: "goal" },
      { id: "office", label: "office", x: 1020, y: 470, zone: "goal" },
    ],
    edges: [
      { id: "mailroom-hallway", from: "mailroom", to: "hallway", cost: 2, primary: true },
      { id: "hallway-storage", from: "hallway", to: "storage", cost: 3, primary: true },
      { id: "hallway-lab", from: "hallway", to: "lab", cost: 5, primary: true },
      { id: "storage-office", from: "storage", to: "office", cost: 4, primary: true },
      { id: "storage-lab", from: "storage", to: "lab", cost: 6 },
    ],
    packages: [
      { id: "packageA", short: "A", location: "mailroom", color: "#204f8d" },
      { id: "packageB", short: "B", location: "storage", color: "#73000a" },
    ],
  };

  function createWarehouseScene(config) {
    const world = {
      locations: (config.locations || DEFAULT_WORLD.locations).map((loc) => ({ ...loc })),
      edges: (config.edges || DEFAULT_WORLD.edges).map((edge) => ({ ...edge })),
      packages: (config.packages || DEFAULT_WORLD.packages).map((pkg) => ({ ...pkg })),
    };

    const width = config.width || 1180;
    const height = config.height || 620;
    const svg = createSVG("svg", {
      viewBox: `0 0 ${width} ${height}`,
      role: "img",
      "aria-label": config.ariaLabel || "Warehouse delivery robot scene",
    });
    clearChildren(config.mount);
    config.mount.appendChild(svg);

    const defs = createSVG("defs");
    defs.innerHTML = `
      <filter id="warehouse-shadow" x="-30%" y="-30%" width="160%" height="160%">
        <feDropShadow dx="0" dy="8" stdDeviation="10" flood-color="rgba(16,17,20,0.12)"></feDropShadow>
      </filter>
    `;
    svg.appendChild(defs);

    const layers = {
      base: createSVG("g"),
      path: createSVG("g"),
      nodes: createSVG("g"),
      goals: createSVG("g"),
      packages: createSVG("g"),
      robot: createSVG("g"),
      labels: createSVG("g"),
      facts: createSVG("g"),
      overlay: createSVG("g"),
    };
    Object.values(layers).forEach((layer) => svg.appendChild(layer));

    const locationMap = new Map();
    world.locations.forEach((loc) => locationMap.set(loc.id, loc));
    const edgeMap = new Map();
    world.edges.forEach((edge) => {
      edgeMap.set(edge.id, edge);
      edgeMap.set(`${edge.to}-${edge.from}`, edge);
    });

    function paletteForZone(zone) {
      if (zone === "goal") {
        return { fill: "#f3fbf6", stroke: "#1c7c54" };
      }
      if (zone === "hub") {
        return { fill: "#f4f6fb", stroke: "#204f8d" };
      }
      if (zone === "work") {
        return { fill: "#fbf6f6", stroke: "#73000a" };
      }
      return { fill: "#ffffff", stroke: "#101114" };
    }

    world.edges.forEach((edge) => {
      const from = locationMap.get(edge.from);
      const to = locationMap.get(edge.to);
      const line = createSVG("line", {
        x1: from.x,
        y1: from.y,
        x2: to.x,
        y2: to.y,
        stroke: edge.primary ? "#bfc8d2" : "#d5dbe2",
        "stroke-width": edge.primary ? 12 : 8,
        "stroke-linecap": "round",
      });
      layers.base.appendChild(line);

      const label = createSVG("text", {
        x: (from.x + to.x) / 2,
        y: (from.y + to.y) / 2 - 14,
        "font-family": '"SFMono-Regular", Menlo, monospace',
        "font-size": 18,
        "font-weight": 700,
        fill: "#5a5f69",
        "text-anchor": "middle",
      });
      label.textContent = `${edge.cost}`;
      layers.labels.appendChild(label);
    });

    const locationNodes = new Map();
    world.locations.forEach((loc) => {
      const palette = paletteForZone(loc.zone);
      const group = createSVG("g");
      const rect = createSVG("rect", {
        x: loc.x - 86,
        y: loc.y - 48,
        width: 172,
        height: 96,
        rx: 24,
        fill: palette.fill,
        stroke: palette.stroke,
        "stroke-width": 3,
      });
      const name = createSVG("text", {
        x: loc.x,
        y: loc.y + 34,
        "font-family": 'Inter, system-ui, -apple-system, Arial, sans-serif',
        "font-size": 28,
        "font-weight": 800,
        fill: "#101114",
        "text-anchor": "middle",
      });
      name.textContent = loc.label;
      group.appendChild(rect);
      group.appendChild(name);
      layers.nodes.appendChild(group);
      locationNodes.set(loc.id, { group, rect, name });
    });

    const robot = createSVG("g");
    robot.innerHTML = `
      <rect x="-28" y="-20" width="56" height="40" rx="12" fill="#111419"></rect>
      <rect x="-16" y="-40" width="32" height="20" rx="10" fill="#73000a"></rect>
      <circle cx="-16" cy="24" r="6" fill="#111419"></circle>
      <circle cx="16" cy="24" r="6" fill="#111419"></circle>
      <circle cx="-8" cy="-2" r="3.5" fill="#ffffff"></circle>
      <circle cx="8" cy="-2" r="3.5" fill="#ffffff"></circle>
    `;
    layers.robot.appendChild(robot);

    const packageNodes = new Map();
    world.packages.forEach((pkg) => {
      const group = createSVG("g");
      const rect = createSVG("rect", {
        x: -22,
        y: -22,
        width: 44,
        height: 44,
        rx: 12,
        fill: `${pkg.color}15`,
        stroke: pkg.color,
        "stroke-width": 3,
      });
      const label = createSVG("text", {
        x: 0,
        y: 8,
        "font-family": 'Inter, system-ui, -apple-system, Arial, sans-serif',
        "font-size": 20,
        "font-weight": 800,
        fill: pkg.color,
        "text-anchor": "middle",
      });
      label.textContent = pkg.short;
      group.appendChild(rect);
      group.appendChild(label);
      layers.packages.appendChild(group);
      packageNodes.set(pkg.id, { group, data: { ...pkg } });
    });

    const state = {
      robot: config.robot || "hallway",
      carrying: null,
      packages: Object.fromEntries(world.packages.map((pkg) => [pkg.id, { location: pkg.location, delivered: false }])),
    };

    function locate(node, x, y) {
      node.setAttribute("transform", `translate(${x}, ${y})`);
    }

    function reset() {
      clearChildren(layers.path);
      clearChildren(layers.goals);
      clearChildren(layers.facts);
      clearChildren(layers.overlay);
      state.robot = config.robot || "hallway";
      state.carrying = null;
      world.packages.forEach((pkg) => {
        state.packages[pkg.id] = { location: pkg.location, delivered: false };
      });
      const robotLoc = locationMap.get(state.robot);
      locate(robot, robotLoc.x, robotLoc.y);
      world.packages.forEach((pkg, idx) => {
        const loc = locationMap.get(pkg.location);
        const dx = idx === 0 ? -44 : 44;
        locate(packageNodes.get(pkg.id).group, loc.x + dx, loc.y + 72);
      });
    }

    function showGoals(goalIds) {
      goalIds.forEach((id) => {
        const loc = locationMap.get(id);
        if (!loc) {
          return;
        }
        const ring = createSVG("circle", {
          cx: loc.x,
          cy: loc.y,
          r: 66,
          fill: "none",
          stroke: "#1c7c54",
          "stroke-width": 4,
          "stroke-dasharray": "7 9",
        });
        layers.goals.appendChild(ring);
      });
    }

    function showPath(path, options = {}) {
      if (!Array.isArray(path) || path.length < 2) {
        return;
      }
      const points = path.map((id) => {
        const loc = locationMap.get(id);
        return `${loc.x},${loc.y}`;
      });
      const poly = createSVG("polyline", {
        points: points.join(" "),
        fill: "none",
        stroke: options.stroke || "#73000a",
        "stroke-width": options.width || 12,
        "stroke-linecap": "round",
        "stroke-linejoin": "round",
        opacity: options.opacity || 0.92,
      });
      layers.path.appendChild(poly);
    }

    function setRobot(locationId, options = {}) {
      const loc = locationMap.get(locationId);
      if (!loc) {
        return;
      }
      state.robot = locationId;
      if (options.carrying !== undefined) {
        state.carrying = options.carrying;
      }
      locate(robot, loc.x, loc.y);
      if (state.carrying && packageNodes.has(state.carrying)) {
        locate(packageNodes.get(state.carrying).group, loc.x + 62, loc.y - 22);
      }
    }

    function setPackage(packageId, snapshot) {
      const pkgNode = packageNodes.get(packageId);
      const packageState = state.packages[packageId];
      if (!pkgNode || !packageState || !snapshot) {
        return;
      }
      if (snapshot.carried) {
        state.carrying = packageId;
        packageState.location = state.robot;
        locate(pkgNode.group, locationMap.get(state.robot).x + 62, locationMap.get(state.robot).y - 22);
        return;
      }
      if (snapshot.location && locationMap.has(snapshot.location)) {
        packageState.location = snapshot.location;
        packageState.delivered = !!snapshot.delivered;
        const loc = locationMap.get(snapshot.location);
        const dx = packageId === "packageA" ? -44 : 44;
        locate(pkgNode.group, loc.x + dx, loc.y + 72);
      }
    }

    function addObstacle(edgeId, options = {}) {
      const edge = edgeMap.get(edgeId);
      if (!edge) {
        return;
      }
      const from = locationMap.get(edge.from);
      const to = locationMap.get(edge.to);
      const midX = (from.x + to.x) / 2;
      const midY = (from.y + to.y) / 2;
      const ring = createSVG("circle", {
        cx: midX,
        cy: midY,
        r: 30,
        fill: "#ffffff",
        stroke: options.stroke || "#b42318",
        "stroke-width": 4,
        opacity: 0.96,
      });
      const slash = createSVG("line", {
        x1: midX - 18,
        y1: midY - 18,
        x2: midX + 18,
        y2: midY + 18,
        stroke: options.stroke || "#b42318",
        "stroke-width": 7,
        "stroke-linecap": "round",
      });
      const slashB = createSVG("line", {
        x1: midX + 18,
        y1: midY - 18,
        x2: midX - 18,
        y2: midY + 18,
        stroke: options.stroke || "#b42318",
        "stroke-width": 7,
        "stroke-linecap": "round",
      });
      layers.overlay.appendChild(ring);
      layers.overlay.appendChild(slash);
      layers.overlay.appendChild(slashB);
    }

    function showFacts(items) {
      clearChildren(layers.facts);
      (items || []).forEach((item, idx) => {
        const x = 28 + idx * 172;
        const y = height - 58;
        const badge = createSVG("rect", {
          x,
          y,
          width: 156,
          height: 34,
          rx: 17,
          fill: item.fill || "#ffffff",
          stroke: item.stroke || "#d7dbe0",
        });
        const label = createSVG("text", {
          x: x + 14,
          y: y + 23,
          "font-family": '"SFMono-Regular", Menlo, monospace',
          "font-size": 15,
          "font-weight": 700,
          fill: item.color || "#101114",
        });
        label.textContent = item.text;
        layers.facts.appendChild(badge);
        layers.facts.appendChild(label);
      });
    }

    function annotate(text, x, y, color = "#101114") {
      const rect = createSVG("rect", {
        x,
        y,
        width: Math.max(220, text.length * 10),
        height: 40,
        rx: 20,
        fill: "#ffffff",
        stroke: "#d7dbe0",
      });
      const label = createSVG("text", {
        x: x + 18,
        y: y + 27,
        "font-family": "Inter, system-ui, -apple-system, Arial, sans-serif",
        "font-size": 18,
        "font-weight": 700,
        fill: color,
      });
      label.textContent = text;
      layers.overlay.appendChild(rect);
      layers.overlay.appendChild(label);
    }

    function applySnapshot(snapshot) {
      reset();
      showGoals(snapshot.goals || []);
      if (snapshot.primaryPath) {
        showPath(snapshot.primaryPath, {
          stroke: snapshot.primaryStroke || "#73000a",
          width: snapshot.primaryWidth || 12,
          opacity: snapshot.primaryOpacity || 0.92
        });
      }
      if (snapshot.secondaryPath) {
        showPath(snapshot.secondaryPath, {
          stroke: snapshot.secondaryStroke || "#204f8d",
          width: snapshot.secondaryWidth || 10,
          opacity: snapshot.secondaryOpacity || 0.82
        });
      }
      if (snapshot.blockedEdge) {
        addObstacle(snapshot.blockedEdge, { stroke: snapshot.blockedStroke || "#b42318" });
      }
      if (snapshot.robot) {
        setRobot(snapshot.robot, { carrying: snapshot.carrying || null });
      }
      Object.entries(snapshot.packages || {}).forEach(([packageId, pkgSnapshot]) => {
        setPackage(packageId, pkgSnapshot);
      });
      if (snapshot.facts) {
        showFacts(snapshot.facts);
      }
      if (snapshot.annotation) {
        annotate(snapshot.annotation.text, snapshot.annotation.x, snapshot.annotation.y, snapshot.annotation.color);
      }
    }

    function startLoop(frames, options = {}) {
      const list = Array.isArray(frames) ? frames : [];
      let timer = null;
      let index = 0;

      function render(frameIndex) {
        const frame = list[Math.max(0, Math.min(frameIndex, list.length - 1))];
        if (frame) {
          applySnapshot(frame);
        } else {
          reset();
        }
      }

      if (!list.length) {
        reset();
        return {
          stop() {}
        };
      }

      if (options.exportMode || options.reducedMotion) {
        render(options.exportFrame ?? (list.length - 1));
        return {
          stop() {}
        };
      }

      render(0);
      timer = window.setInterval(() => {
        index = (index + 1) % list.length;
        render(index);
      }, options.interval || 1400);

      return {
        stop() {
          if (timer !== null) {
            window.clearInterval(timer);
            timer = null;
          }
        }
      };
    }

    reset();

    return {
      addObstacle,
      annotate,
      applySnapshot,
      reset,
      setPackage,
      setRobot,
      startLoop,
      showFacts,
      showGoals,
      showPath,
      svg,
      world,
    };
  }

  window.createWarehouseScene = createWarehouseScene;
})();
