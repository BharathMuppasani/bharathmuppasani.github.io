// Network/Graph Background - for Opinion Networks / InfoSpread pages
// Draws a subtle animated graph with nodes and edges

(function() {
  const canvas = document.getElementById('network-background');
  if (!canvas) return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  const ctx = canvas.getContext('2d');
  let width, height;
  const nodes = [];
  const NODE_COUNT = 35;
  const CONNECTION_DIST = 85;

  function getColors() {
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    return {
      node: isDark ? 'rgba(207,131,142,0.35)' : 'rgba(183,110,121,0.3)',
      edge: isDark ? 'rgba(207,131,142,0.1)' : 'rgba(183,110,121,0.07)',
      infected: isDark ? 'rgba(170,100,110,0.4)' : 'rgba(150,80,90,0.3)',
    };
  }

  class Node {
    constructor() {
      this.x = Math.random() * width;
      this.y = Math.random() * height;
      this.vx = (Math.random() - 0.5) * 0.3;
      this.vy = (Math.random() - 0.5) * 0.3;
      this.radius = Math.random() * 2.5 + 1.5;
      this.infected = Math.random() < 0.15;
    }
    update() {
      this.x += this.vx;
      this.y += this.vy;
      if (this.x < 0 || this.x > width) this.vx *= -1;
      if (this.y < 0 || this.y > height) this.vy *= -1;
      // Occasionally toggle infection state
      if (Math.random() < 0.001) this.infected = !this.infected;
    }
    draw(colors) {
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
      ctx.fillStyle = this.infected ? colors.infected : colors.node;
      ctx.fill();
    }
  }

  function resize() {
    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);
    width = rect.width;
    height = rect.height;
    nodes.length = 0;
    for (let i = 0; i < NODE_COUNT; i++) nodes.push(new Node());
  }

  function animate() {
    ctx.clearRect(0, 0, width, height);
    const colors = getColors();

    // Draw edges
    ctx.lineWidth = 0.5;
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const dx = nodes[i].x - nodes[j].x;
        const dy = nodes[i].y - nodes[j].y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < CONNECTION_DIST) {
          const opacity = 1 - dist / CONNECTION_DIST;
          ctx.globalAlpha = opacity;
          ctx.strokeStyle = colors.edge;
          ctx.beginPath();
          ctx.moveTo(nodes[i].x, nodes[i].y);
          ctx.lineTo(nodes[j].x, nodes[j].y);
          ctx.stroke();
        }
      }
    }
    ctx.globalAlpha = 1;

    // Update and draw nodes
    for (const node of nodes) {
      node.update();
      node.draw(colors);
    }

    requestAnimationFrame(animate);
  }

  resize();
  window.addEventListener('resize', resize);
  animate();
})();
