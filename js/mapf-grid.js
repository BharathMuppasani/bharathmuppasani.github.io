// MAPF Grid Background - Adapted from personal-index.html
// Grid with moving agents for background decoration

(function() {
  const canvas = document.getElementById('mapf-background');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  let width, height;
  const GRID_SIZE = 30;
  const agents = [];
  const bursts = [];
  const AGENT_COUNT = 40;
  const BURST_DURATION = 500;

  // Solid colors let the drawing opacity control visibility consistently.
  // Shades of the mauve/rose accent.
  const PALETTE = [
    '#b76e79',  // Accent
    '#9a5961',  // Darker accent
    '#cf838e',  // Lighter accent
    '#a0646e',  // Muted accent
    '#825058',  // Deep accent
    '#b48287'   // Soft accent
  ];
  let currentPalette = PALETTE;
  function syncPalette() {
    const value = getComputedStyle(document.documentElement).getPropertyValue('--agent-palette').trim();
    currentPalette = value ? value.split(',').map(color => color.trim()) : PALETTE;
  }

  function getGridColor() {
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    return isDark ? 'rgba(255,255,255,0.09)' : 'rgba(0,0,0,0.12)';
  }

  function getAgentOpacity() {
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    return isDark ? 0.8 : 0.7;
  }

  class Agent {
    constructor() {
      this.colorIndex = Math.floor(Math.random() * PALETTE.length);
      this.radius = 4;
      this.active = false;
      this.reset();
    }
    get color() {
      return currentPalette[this.colorIndex % currentPalette.length];
    }
    reset(now = 0) {
      // Spawn only at a free intersection, including after a collision.
      for (let attempt = 0; attempt < 30; attempt++) {
        const x = Math.floor(Math.random() * (width / GRID_SIZE)) * GRID_SIZE;
        const y = Math.floor(Math.random() * (height / GRID_SIZE)) * GRID_SIZE;
        const occupied = agents.some(other => other !== this && other.active &&
          Math.hypot(other.x - x, other.y - y) < this.radius + other.radius + 4);
        if (occupied) continue;
        this.x = x;
        this.y = y;
        this.pickDirection();
        this.active = true;
        return;
      }
      this.active = false;
      this.respawnAt = now + 250;
    }
    disappear(now) {
      this.active = false;
      this.respawnAt = now + 1500 + Math.random() * 1500;
    }
    pickDirection() {
      const s = 0.5;
      if (Math.random() > 0.5) {
        this.vx = Math.random() > 0.5 ? s : -s;
        this.vy = 0;
      } else {
        this.vx = 0;
        this.vy = Math.random() > 0.5 ? s : -s;
      }
    }
    update(now) {
      if (!this.active) {
        if (now >= this.respawnAt) this.reset(now);
        return;
      }
      this.x += this.vx;
      this.y += this.vy;
      if (this.x < 0) this.x = width;
      if (this.x > width) this.x = 0;
      if (this.y < 0) this.y = height;
      if (this.y > height) this.y = 0;
      // Turn at grid intersections
      if (Math.abs(this.x % GRID_SIZE) < 0.5 && Math.abs(this.y % GRID_SIZE) < 0.5) {
        if (Math.random() < 0.08) {
          const s = 0.5;
          if (this.vx !== 0) { this.vx = 0; this.vy = Math.random() > 0.5 ? s : -s; }
          else { this.vx = Math.random() > 0.5 ? s : -s; this.vy = 0; }
        }
      }
    }
    draw() {
      if (!this.active) return;
      const opacity = getAgentOpacity();
      ctx.globalAlpha = opacity;
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
      ctx.fillStyle = this.color;
      ctx.fill();
      ctx.globalAlpha = 1;
    }
  }

  function createBurst(a, b, now) {
    bursts.push({
      x: (a.x + b.x) / 2,
      y: (a.y + b.y) / 2,
      startedAt: now,
      color: a.color,
      particles: Array.from({ length: 12 }, (_, i) => {
        const angle = i * Math.PI * 2 / 12 + Math.random() * 0.2;
        const speed = 30 + Math.random() * 35;
        return { vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed,
          color: i % 2 ? a.color : b.color };
      })
    });
  }

  function detectCollisions(now) {
    const collided = new Set();
    for (let i = 0; i < agents.length; i++) {
      const a = agents[i];
      if (!a.active) continue;
      for (let j = i + 1; j < agents.length; j++) {
        const b = agents[j];
        if (!b.active) continue;
        const dx = a.x - b.x;
        const dy = a.y - b.y;
        if (dx * dx + dy * dy <= (a.radius + b.radius) ** 2) {
          createBurst(a, b, now);
          collided.add(a);
          collided.add(b);
        }
      }
    }
    // Remove all participants together so multi-agent collisions disappear fully.
    for (const agent of collided) agent.disappear(now);
  }

  function drawBursts(now) {
    for (let i = bursts.length - 1; i >= 0; i--) {
      const burst = bursts[i];
      const elapsed = now - burst.startedAt;
      if (elapsed >= BURST_DURATION) {
        bursts.splice(i, 1);
        continue;
      }
      const progress = elapsed / BURST_DURATION;
      ctx.globalAlpha = (1 - progress) * getAgentOpacity();
      ctx.strokeStyle = burst.color;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(burst.x, burst.y, 4 + progress * 18, 0, Math.PI * 2);
      ctx.stroke();
      for (const particle of burst.particles) {
        ctx.fillStyle = particle.color;
        ctx.beginPath();
        ctx.arc(burst.x + particle.vx * elapsed / 1000,
          burst.y + particle.vy * elapsed / 1000, 1.5 * (1 - progress), 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.globalAlpha = 1;
  }

  function resize() {
    // Canvas fills its CSS dimensions
    const rect = canvas.getBoundingClientRect();
    width = rect.width * (window.devicePixelRatio || 1);
    height = rect.height * (window.devicePixelRatio || 1);
    canvas.width = width;
    canvas.height = height;
    ctx.scale(window.devicePixelRatio || 1, window.devicePixelRatio || 1);
    width = rect.width;
    height = rect.height;
    initAgents();
  }

  function initAgents() {
    agents.length = 0;
    bursts.length = 0;
    for (let i = 0; i < AGENT_COUNT; i++) agents.push(new Agent());
  }

  function animate(now = performance.now()) {
    ctx.clearRect(0, 0, width, height);

    // Draw grid
    ctx.strokeStyle = getGridColor();
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let x = 0; x <= width; x += GRID_SIZE) { ctx.moveTo(x, 0); ctx.lineTo(x, height); }
    for (let y = 0; y <= height; y += GRID_SIZE) { ctx.moveTo(0, y); ctx.lineTo(width, y); }
    ctx.stroke();

    // Detect collisions before drawing so collided agents vanish in this frame.
    for (const agent of agents) agent.update(now);
    detectCollisions(now);
    for (const agent of agents) agent.draw();
    drawBursts(now);

    requestAnimationFrame(animate);
  }

  // Check for reduced motion preference
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  syncPalette();
  new MutationObserver(syncPalette).observe(document.documentElement, {
    attributes: true,
    attributeFilter: ['style', 'data-accent-hue', 'data-theme']
  });
  resize();
  window.addEventListener('resize', resize);
  animate();
})();
