// MAPF Grid Background - Adapted from personal-index.html
// Subtle grid with moving agents for background decoration

(function() {
  const canvas = document.getElementById('mapf-background');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  let width, height;
  const GRID_SIZE = 30;
  const agents = [];
  let agentCount = 35;

  // Color palette - muted to work as background
  // Color palette - shades of the mauve/rose accent
  const PALETTE = [
    'rgba(183,110,121,0.5)',  // Accent
    'rgba(154,89,97,0.5)',    // Darker accent
    'rgba(207,131,142,0.5)',  // Lighter accent
    'rgba(160,100,110,0.4)',  // Muted accent
    'rgba(130,80,88,0.4)',    // Deep accent
    'rgba(180,130,135,0.4)'   // Faded accent
  ];

  function getGridColor() {
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    return isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.08)';
  }

  function getAgentOpacity() {
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    return isDark ? 0.5 : 0.45;
  }

  class Agent {
    constructor() {
      this.reset();
      this.color = PALETTE[Math.floor(Math.random() * PALETTE.length)];
    }
    reset() {
      this.x = Math.floor(Math.random() * (width / GRID_SIZE)) * GRID_SIZE;
      this.y = Math.floor(Math.random() * (height / GRID_SIZE)) * GRID_SIZE;
      this.pickDirection();
      this.radius = 3;
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
    update() {
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
      const opacity = getAgentOpacity();
      ctx.globalAlpha = opacity;
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
      ctx.fillStyle = this.color;
      ctx.fill();
      ctx.globalAlpha = 1;
    }
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
    for (let i = 0; i < agentCount; i++) agents.push(new Agent());
  }

  function animate() {
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    // Clear with slight trail
    ctx.clearRect(0, 0, width, height);

    // Draw grid
    ctx.strokeStyle = getGridColor();
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let x = 0; x <= width; x += GRID_SIZE) { ctx.moveTo(x, 0); ctx.lineTo(x, height); }
    for (let y = 0; y <= height; y += GRID_SIZE) { ctx.moveTo(0, y); ctx.lineTo(width, y); }
    ctx.stroke();

    // Update and draw agents
    for (const agent of agents) {
      agent.update();
      agent.draw();
    }

    requestAnimationFrame(animate);
  }

  // Check for reduced motion preference
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  resize();
  window.addEventListener('resize', resize);
  animate();
})();
