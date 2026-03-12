// Ontology/Knowledge Graph Background - for Ontology project page
// Draws a subtle animated tree/graph structure with labeled nodes

(function() {
  const canvas = document.getElementById('ontology-background');
  if (!canvas) return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  const ctx = canvas.getContext('2d');
  let width, height;
  const nodes = [];
  const edges = [];
  const NODE_COUNT = 30;

  function getColors() {
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    return {
      node: isDark ? 'rgba(207,131,142,0.3)' : 'rgba(183,110,121,0.22)',
      edge: isDark ? 'rgba(207,131,142,0.08)' : 'rgba(183,110,121,0.06)',
      ring: isDark ? 'rgba(207,131,142,0.15)' : 'rgba(183,110,121,0.1)',
    };
  }

  class OntNode {
    constructor(depth) {
      this.x = Math.random() * width;
      this.y = Math.random() * height;
      this.vx = (Math.random() - 0.5) * 0.15;
      this.vy = (Math.random() - 0.5) * 0.15;
      this.radius = depth === 0 ? 5 : (depth === 1 ? 3.5 : 2);
      this.depth = depth;
      this.children = [];
    }
    update() {
      this.x += this.vx;
      this.y += this.vy;
      if (this.x < 0 || this.x > width) this.vx *= -1;
      if (this.y < 0 || this.y > height) this.vy *= -1;
    }
    draw(colors) {
      // Outer ring for root/branch nodes
      if (this.depth < 2) {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius + 3, 0, Math.PI * 2);
        ctx.strokeStyle = colors.ring;
        ctx.lineWidth = 0.5;
        ctx.stroke();
      }
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
      ctx.fillStyle = colors.node;
      ctx.fill();
    }
  }

  function buildTree() {
    nodes.length = 0;
    edges.length = 0;
    // Create hierarchical structure
    const root = new OntNode(0);
    root.x = width * 0.5;
    root.y = height * 0.3;
    nodes.push(root);

    const branchCount = 4 + Math.floor(Math.random() * 3);
    for (let i = 0; i < branchCount; i++) {
      const branch = new OntNode(1);
      branch.x = width * (0.15 + Math.random() * 0.7);
      branch.y = height * (0.2 + Math.random() * 0.6);
      nodes.push(branch);
      edges.push([root, branch]);

      const leafCount = 2 + Math.floor(Math.random() * 3);
      for (let j = 0; j < leafCount; j++) {
        const leaf = new OntNode(2);
        leaf.x = branch.x + (Math.random() - 0.5) * 100;
        leaf.y = branch.y + (Math.random() - 0.5) * 80;
        nodes.push(leaf);
        edges.push([branch, leaf]);
      }
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
    buildTree();
  }

  function animate() {
    ctx.clearRect(0, 0, width, height);
    const colors = getColors();

    // Draw edges (hierarchy lines)
    ctx.lineWidth = 0.8;
    ctx.strokeStyle = colors.edge;
    for (const [a, b] of edges) {
      ctx.beginPath();
      ctx.moveTo(a.x, a.y);
      // Slight curve for organic feel
      const mx = (a.x + b.x) / 2;
      const my = (a.y + b.y) / 2 - 10;
      ctx.quadraticCurveTo(mx, my, b.x, b.y);
      ctx.stroke();
    }

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
