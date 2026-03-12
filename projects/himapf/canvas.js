(() => {
    const REDUCED_MOTION = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    document.addEventListener("DOMContentLoaded", () => {
        initStrategySection();
    });

    function initStrategySection() {
        const canvas = document.getElementById("strategyCanvas");
        const details = document.getElementById("strategyDetails");
        const buttons = document.querySelectorAll(".strategy-tab");

        if (!canvas || !details || !buttons.length) {
            return;
        }

        let currentStrategy = "yield";
        let frameHandle = null;
        let lastTimestamp = null;
        let elapsed = 0;
        const ctx = canvas.getContext("2d");
        const baseWidth = 680;
        const baseHeight = 520;

        const shared = {
            gridSize: 5,
            padding: 52
        };

        const scenarios = {
            yield: {
                duration: 6200,
                draw(progress, layout) {
                    const pathA = [[2, 0], [2, 1], [2, 2], [2, 3], [2, 4], [2, 4], [2, 4], [2, 4], [2, 4]];
                    const pathB = [[2, 4], [2, 3], [1, 3], [1, 3], [1, 3], [2, 3], [2, 2], [2, 1], [2, 0]];
                    const originalB = [[2, 4], [2, 3], [2, 2], [2, 1], [2, 0]];

                    drawGrid(layout);
                    drawGoal(layout, 2, 4, COLORS.agentA);
                    drawGoal(layout, 2, 0, COLORS.agentB);

                    if (progress < 0.18) {
                        drawPath(layout, pathA, COLORS.agentA, false);
                        drawPath(layout, originalB, COLORS.alert, false);
                        drawConflict(layout, 2, 2);
                        drawAgent(layout, 2, 0, COLORS.agentA, "A");
                        drawAgent(layout, 2, 4, COLORS.agentB, "B");
                        drawStatus(layout, "Conflict detected. The cheapest repair is a local parking detour.");
                        return;
                    }

                    if (progress < 0.86) {
                        const p = (progress - 0.18) / 0.68;
                        drawPath(layout, pathA, COLORS.agentA, false);
                        drawPath(layout, pathB, COLORS.accent, true);
                        markCell(layout, 1, 3, COLORS.accent, "Park");
                        const posA = interpolate(pathA, p);
                        const posB = interpolate(pathB, p);
                        drawAgent(layout, posA[0], posA[1], COLORS.agentA, "A");
                        drawAgent(layout, posB[0], posB[1], COLORS.accent, "B");
                        drawStatus(layout, "B yields into a nearby parking cell, waits, then resumes.");
                        return;
                    }

                    drawPath(layout, pathA, COLORS.agentA, false);
                    drawPath(layout, pathB, COLORS.accent, true);
                    drawAgent(layout, 2, 4, COLORS.agentA, "A");
                    drawAgent(layout, 2, 0, COLORS.accent, "B");
                    drawStatus(layout, "Resolved with 1 IU occupancy checking. This is the dominant repair tier.");
                }
            },
            static: {
                duration: 6600,
                draw(progress, layout) {
                    const pathA = [[0, 2], [1, 2], [2, 2], [3, 2], [4, 2], [4, 2], [4, 2], [4, 2]];
                    const originalB = [[2, 0], [2, 1], [2, 2], [2, 3], [2, 4]];
                    const replannedB = [[2, 0], [1, 0], [0, 0], [0, 1], [0, 2], [0, 3], [0, 4], [1, 4], [2, 4]];

                    drawGrid(layout);
                    drawGoal(layout, 4, 2, COLORS.agentA);
                    drawGoal(layout, 2, 4, COLORS.agentB);

                    if (progress < 0.16) {
                        drawPath(layout, pathA, COLORS.agentA, false);
                        drawPath(layout, originalB, COLORS.alert, false);
                        drawConflict(layout, 2, 2);
                        drawAgent(layout, 0, 2, COLORS.agentA, "A");
                        drawAgent(layout, 2, 0, COLORS.agentB, "B");
                        drawStatus(layout, "Yield is insufficient. The coordinator now sends a bounded forbidden-cell alert.");
                        return;
                    }

                    if (progress < 0.3) {
                        markForbidden(layout, 2, 2);
                        drawAgent(layout, 0, 2, COLORS.agentA, "A");
                        drawAgent(layout, 2, 0, COLORS.agentB, "B");
                        drawStatus(layout, "Only the conflict cells are revealed. No other-agent trajectory is shared.");
                        return;
                    }

                    const p = Math.min(1, (progress - 0.3) / 0.56);
                    drawPath(layout, pathA, COLORS.agentA, false);
                    drawPath(layout, replannedB, COLORS.accent, true);
                    markForbidden(layout, 2, 2);
                    drawAgent(layout, ...interpolate(pathA, p), COLORS.agentA, "A");
                    drawAgent(layout, ...interpolate(replannedB, p), COLORS.accent, "B");
                    drawStatus(layout, "Bounded A* replanning around static constraints. This tier is near-perfect in the logs.");
                }
            },
            dynamic: {
                duration: 6800,
                draw(progress, layout) {
                    const pathA = [[0, 0], [0, 1], [0, 2], [0, 3], [0, 4], [0, 4], [0, 4], [0, 4]];
                    const originalB = [[0, 4], [0, 3], [0, 2], [0, 1], [0, 0]];
                    const replannedB = [[0, 4], [1, 4], [2, 4], [2, 3], [2, 2], [2, 1], [2, 0], [1, 0], [0, 0]];

                    drawGrid(layout);
                    drawGoal(layout, 0, 4, COLORS.agentA);
                    drawGoal(layout, 0, 0, COLORS.agentB);

                    if (progress < 0.16) {
                        drawPath(layout, pathA, COLORS.agentA, false);
                        drawPath(layout, originalB, COLORS.alert, false);
                        drawConflict(layout, 0, 2);
                        drawConflict(layout, 0, 3);
                        drawAgent(layout, 0, 0, COLORS.agentA, "A");
                        drawAgent(layout, 0, 4, COLORS.agentB, "B");
                        drawStatus(layout, "Static constraints are not enough. Short trajectory fragments are now revealed.");
                        return;
                    }

                    if (progress < 0.28) {
                        drawPath(layout, pathA, COLORS.warning, false);
                        drawAgent(layout, 0, 0, COLORS.agentA, "A");
                        drawAgent(layout, 0, 4, COLORS.agentB, "B");
                        drawStatus(layout, "The alert mask now encodes a short, time-indexed trajectory window for A.");
                        return;
                    }

                    const p = Math.min(1, (progress - 0.28) / 0.58);
                    drawPath(layout, pathA, COLORS.warning, false);
                    drawPath(layout, replannedB, COLORS.accent, true);
                    drawAgent(layout, ...interpolate(pathA, p), COLORS.warning, "A");
                    drawAgent(layout, ...interpolate(replannedB, p), COLORS.accent, "B");
                    drawStatus(layout, "Dynamic replanning is rare and expensive, so the framework uses it sparingly.");
                }
            },
            joint: {
                duration: 7200,
                draw(progress, layout) {
                    const openCells = new Set(["2,0", "2,1", "2,2", "2,3", "2,4", "1,2"]);
                    const shelfObstacles = [];
                    for (let row = 0; row < 5; row += 1) {
                        for (let col = 0; col < 5; col += 1) {
                            if (!openCells.has(`${row},${col}`)) {
                                shelfObstacles.push([row, col]);
                            }
                        }
                    }

                    const aPath = [[2, 0], [2, 1], [2, 2], [2, 3], [2, 4]];
                    const bPath = [[2, 4], [2, 3], [2, 2], [2, 1], [2, 0]];
                    const jointA = [[2, 0], [2, 1], [2, 1], [2, 2], [2, 3], [2, 4]];
                    const jointB = [[2, 4], [2, 3], [2, 2], [1, 2], [1, 2], [2, 2], [2, 1], [2, 0]];

                    drawGrid(layout, shelfObstacles);
                    drawGoal(layout, 2, 4, COLORS.agentA);
                    drawGoal(layout, 2, 0, COLORS.agentB);

                    if (progress < 0.18) {
                        drawPath(layout, aPath, COLORS.agentA, false);
                        drawPath(layout, bPath, COLORS.agentB, false);
                        drawConflict(layout, 2, 2);
                        drawAgent(layout, 2, 0, COLORS.agentA, "A");
                        drawAgent(layout, 2, 4, COLORS.agentB, "B");
                        drawStatus(layout, "A narrow shelf passage creates a tightly coupled conflict that cheaper repairs cannot resolve.");
                        return;
                    }

                    const p = Math.min(1, (progress - 0.18) / 0.64);
                    markCell(layout, 1, 2, COLORS.accent, "Bay");
                    drawPath(layout, jointA, COLORS.agentA, true);
                    drawPath(layout, jointB, COLORS.agentB, true);
                    drawAgent(layout, ...interpolate(jointA, p), COLORS.agentA, "A");
                    drawAgent(layout, ...interpolate(jointB, p), COLORS.agentB, "B");
                    drawStatus(layout, "Joint A* coordinates the pull-out and re-entry so B clears the bay, A passes, and B then uses the corridor.");
                }
            }
        };

        const resizeCanvas = () => {
            const rect = canvas.getBoundingClientRect();
            const dpr = window.devicePixelRatio || 1;
            canvas.width = Math.round(rect.width * dpr);
            canvas.height = Math.round((rect.width * (baseHeight / baseWidth)) * dpr);
            ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
            drawFrame();
        };

        const drawFrame = () => {
            const width = canvas.width / (window.devicePixelRatio || 1);
            const height = canvas.height / (window.devicePixelRatio || 1);
            ctx.clearRect(0, 0, width, height);
            ctx.fillStyle = document.documentElement.getAttribute('data-theme') === 'dark' ? '#1e1a1a' : '#ffffff';
            ctx.fillRect(0, 0, width, height);

            const layout = getLayout(width, height, shared.gridSize, shared.padding);
            const scenario = scenarios[currentStrategy];
            const progress = REDUCED_MOTION ? 0.9 : (elapsed % scenario.duration) / scenario.duration;
            scenario.draw(progress, layout);
        };

        const tick = (timestamp) => {
            if (lastTimestamp === null) {
                lastTimestamp = timestamp;
            }
            elapsed += timestamp - lastTimestamp;
            lastTimestamp = timestamp;
            drawFrame();
            frameHandle = window.requestAnimationFrame(tick);
        };

        buttons.forEach((button) => {
            button.addEventListener("click", () => {
                currentStrategy = button.dataset.strategy;
                elapsed = 0;
                lastTimestamp = null;
                buttons.forEach((item) => item.classList.toggle("is-active", item === button));
                renderStrategyDetails(currentStrategy, details);
                drawFrame();
            });
        });

        renderStrategyDetails(currentStrategy, details);
        resizeCanvas();
        window.addEventListener("resize", resizeCanvas);

        if (!REDUCED_MOTION) {
            frameHandle = window.requestAnimationFrame(tick);
        }

        window.addEventListener("pagehide", () => {
            if (frameHandle) {
                window.cancelAnimationFrame(frameHandle);
            }
        });
    }

    const STRATEGY_DATA = {
        "yield": {
            "badge": "S4.1 Yield",
            "ius": "1 IU",
            "label": "Local Position Yielding",
            "description": "When a predicted collision involves an unconstrained neighbor, the coordinator asks one agent to check occupancy of an adjacent non-path cell. If clear, the agent parks there until the other passes.",
            "usage": "91.8% - 99.2% of all conflict repairs depending on map density.",
            "note": "Yielding breaks most deadlocks without sharing coordinate paths."
        },
        "static": {
            "badge": "S4.2 Static",
            "ius": "|Δc| IUs",
            "label": "Static Conflict Replanning",
            "description": "If yielding is impossible, the coordinator reveals the bounding box of the conflict region. One agent treats this zone as a static obstacle and replans its path around it.",
            "usage": "0.8% - 7.6% of resolutions.",
            "note": "A highly successful tier that still avoids full trajectory revelation."
        },
        "dynamic": {
            "badge": "S4.3 Dynamic",
            "ius": "r IUs",
            "label": "Time-Indexed Replanning",
            "description": "When spatial padding blocks the only viable corridors, the coordinator reveals a tight time-indexed trajectory fragment for one agent. The other replans knowing exactly when those cells will be occupied.",
            "usage": "< 0.5% (observed mainly in dense random-32 layouts).",
            "note": "Dynamic planning requires strict vector dimensions and is used strictly as a fallback."
        },
        "joint": {
            "badge": "S4.4 Joint A*",
            "ius": "Full State",
            "label": "Local Joint Planning",
            "description": "Used only for persistent deadlocks where all cheaper repairs fail. The coordinator couples the conflicting agents and a local joint planner solves their combined state space over a bounded window.",
            "usage": "< 0.5% (reserved for hardest deadlocks).",
            "note": "The most expensive tier, exchanging full joint state, but guarantees resolution for tight choke points."
        }
    };

    function renderStrategyDetails(strategyKey, target) {
        const strategy = STRATEGY_DATA[strategyKey];
        if (!strategy) return;
        target.innerHTML = `
      <div class="strategy-meta">
        <span class="strategy-chip">${strategy.badge}</span>
        <span class="strategy-chip">${strategy.ius}</span>
      </div>
      <h3>${strategy.label}</h3>
      <p style="margin-bottom:0.6rem;">${strategy.description}</p>
      <p><strong>Observed usage:</strong> ${strategy.usage}</p>
      <p style="margin-top:0.4rem; opacity:0.7;"><em>${strategy.note}</em></p>
    `;
    }

    const COLORS = {
        grid: "#e4dcdc",
        obstacle: "#8a7575",
        alert: "#c0392b",
        warning: "#e67e22",
        accent: "#27ae60",
        agentA: "#b76e79",
        agentB: "#2a2020",
        text: "#2a2020",
        label: "#6b5b5b"
    };

    const DEFAULT_GRID_OBSTACLES = [
        [1, 1],
        [3, 3]
    ];

    function getLayout(width, height, gridSize, padding) {
        const boardSize = Math.min(width - padding * 2, height - padding * 2 - 30);
        const cell = boardSize / gridSize;
        const offsetX = (width - boardSize) / 2;
        const offsetY = (height - boardSize) / 2 - 18;

        return { width, height, gridSize, cell, offsetX, offsetY };
    }

    function drawGrid(layout, obstacles = DEFAULT_GRID_OBSTACLES) {
        const { gridSize, cell, offsetX, offsetY } = layout;
        const ctx = document.getElementById("strategyCanvas").getContext("2d");

        ctx.strokeStyle = COLORS.grid;
        ctx.lineWidth = 1;

        for (let i = 0; i <= gridSize; i++) {
            ctx.beginPath();
            ctx.moveTo(offsetX + i * cell, offsetY);
            ctx.lineTo(offsetX + i * cell, offsetY + gridSize * cell);
            ctx.stroke();

            ctx.beginPath();
            ctx.moveTo(offsetX, offsetY + i * cell);
            ctx.lineTo(offsetX + gridSize * cell, offsetY + i * cell);
            ctx.stroke();
        }

        ctx.fillStyle = COLORS.obstacle;
        obstacles.forEach(([r, c]) => {
            ctx.fillRect(offsetX + c * cell, offsetY + r * cell, cell, cell);
        });
    }

    function interpolate(path, progress) {
        if (progress <= 0) return path[0];
        if (progress >= 1) return path[path.length - 1];

        const idx = progress * (path.length - 1);
        const lower = Math.floor(idx);
        const upper = Math.ceil(idx);
        const t = idx - lower;

        if (lower === upper) return path[lower];

        const [r1, c1] = path[lower];
        const [r2, c2] = path[upper];
        return [r1 + (r2 - r1) * t, c1 + (c2 - c1) * t];
    }

    function drawAgent(layout, r, c, color, label) {
        const { cell, offsetX, offsetY } = layout;
        const ctx = document.getElementById("strategyCanvas").getContext("2d");
        const cx = offsetX + c * cell + cell / 2;
        const cy = offsetY + r * cell + cell / 2;
        const radius = cell * 0.35;

        ctx.beginPath();
        ctx.arc(cx, cy, radius, 0, Math.PI * 2);
        ctx.fillStyle = color;
        ctx.fill();

        ctx.fillStyle = "#ffffff";
        ctx.font = `bold ${Math.max(12, radius)}px "Instrument Sans", system-ui, sans-serif`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(label, cx, cy + 1);
    }

    function drawGoal(layout, r, c, color) {
        const { cell, offsetX, offsetY } = layout;
        const ctx = document.getElementById("strategyCanvas").getContext("2d");
        const cx = offsetX + c * cell + cell / 2;
        const cy = offsetY + r * cell + cell / 2;
        const radius = cell * 0.2;

        ctx.beginPath();
        ctx.arc(cx, cy, radius, 0, Math.PI * 2);
        ctx.lineWidth = 2;
        ctx.strokeStyle = color;
        ctx.setLineDash([4, 4]);
        ctx.stroke();
        ctx.setLineDash([]);
    }

    function drawPath(layout, path, color, dashed) {
        const { cell, offsetX, offsetY } = layout;
        const ctx = document.getElementById("strategyCanvas").getContext("2d");

        ctx.beginPath();
        path.forEach(([r, c], i) => {
            const px = offsetX + c * cell + cell / 2;
            const py = offsetY + r * cell + cell / 2;
            if (i === 0) ctx.moveTo(px, py);
            else ctx.lineTo(px, py);
        });

        ctx.lineWidth = 3;
        ctx.strokeStyle = color + "80"; // Alpha
        if (dashed) ctx.setLineDash([6, 6]);
        ctx.stroke();
        ctx.setLineDash([]);
    }

    function drawConflict(layout, r, c) {
        const { cell, offsetX, offsetY } = layout;
        const ctx = document.getElementById("strategyCanvas").getContext("2d");
        const gap = 4;

        ctx.fillStyle = COLORS.alert + "40";
        ctx.fillRect(offsetX + c * cell + gap, offsetY + r * cell + gap, cell - gap * 2, cell - gap * 2);

        ctx.strokeStyle = COLORS.alert;
        ctx.lineWidth = 2;
        ctx.strokeRect(offsetX + c * cell + gap, offsetY + r * cell + gap, cell - gap * 2, cell - gap * 2);

        ctx.fillStyle = COLORS.alert;
        ctx.font = `${Math.max(12, cell * 0.4)}px "Instrument Sans", system-ui, sans-serif`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText("!", offsetX + c * cell + cell / 2, offsetY + r * cell + cell / 2);
    }

    function markForbidden(layout, r, c) {
        const { cell, offsetX, offsetY } = layout;
        const ctx = document.getElementById("strategyCanvas").getContext("2d");

        ctx.fillStyle = COLORS.alert + "30";
        ctx.fillRect(offsetX + c * cell, offsetY + r * cell, cell, cell);

        ctx.beginPath();
        ctx.moveTo(offsetX + c * cell, offsetY + r * cell);
        ctx.lineTo(offsetX + (c + 1) * cell, offsetY + (r + 1) * cell);
        ctx.moveTo(offsetX + (c + 1) * cell, offsetY + r * cell);
        ctx.lineTo(offsetX + c * cell, offsetY + (r + 1) * cell);
        ctx.strokeStyle = COLORS.alert;
        ctx.lineWidth = 2;
        ctx.stroke();
    }

    function markCell(layout, r, c, color, label) {
        const { cell, offsetX, offsetY } = layout;
        const ctx = document.getElementById("strategyCanvas").getContext("2d");

        ctx.fillStyle = color + "20";
        ctx.fillRect(offsetX + c * cell, offsetY + r * cell, cell, cell);

        ctx.strokeStyle = color;
        ctx.lineWidth = 2;
        ctx.strokeRect(offsetX + c * cell + 2, offsetY + r * cell + 2, cell - 4, cell - 4);

        if (label) {
            ctx.fillStyle = color;
            ctx.font = `${Math.max(10, cell * 0.25)}px "Instrument Sans", system-ui, sans-serif`;
            ctx.textAlign = "center";
            ctx.textBaseline = "bottom";
            ctx.fillText(label, offsetX + c * cell + cell / 2, offsetY + r * cell + cell - 4);
        }
    }

    function drawStatus(layout, text) {
        const { width, height } = layout;
        const ctx = document.getElementById("strategyCanvas").getContext("2d");
        const barH = 52;

        const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
        ctx.fillStyle = isDark ? '#231e1e' : '#f2eded';
        ctx.fillRect(0, height - barH, width, barH);

        ctx.fillStyle = COLORS.text;
        ctx.font = '13px "Instrument Sans", system-ui, sans-serif';
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";

        // word-wrap into lines
        const maxW = width - 40;
        const words = text.split(' ');
        const lines = [];
        let line = '';
        for (const w of words) {
            const test = line ? line + ' ' + w : w;
            if (ctx.measureText(test).width > maxW) {
                lines.push(line);
                line = w;
            } else {
                line = test;
            }
        }
        if (line) lines.push(line);

        const lineH = 17;
        const startY = height - barH / 2 - ((lines.length - 1) * lineH) / 2;
        lines.forEach((l, i) => ctx.fillText(l, width / 2, startY + i * lineH));
    }

})();
