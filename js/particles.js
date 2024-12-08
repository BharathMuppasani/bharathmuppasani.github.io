class Particle {
    constructor(canvas) {
      this.canvas = canvas;
      this.ctx = canvas.getContext('2d');
      this.init();
    }

    init() {
      this.x = Math.random() * this.canvas.width;
      this.y = Math.random() * this.canvas.height;
      this.size = Math.random() * 2 + 1;  // Slightly larger particles
      this.baseSize = this.size;
      
      // Slower base speed for more controlled movement
      this.vx = (Math.random() - 0.5) * 1.0;
      this.vy = (Math.random() - 0.5) * 1.0;
      
      this.targetX = this.x;
      this.targetY = this.y;
      
      this.opacity = Math.random() * 0.5 + 0.4;
      this.baseOpacity = 1;
    }

    update(mouseX, mouseY) {
      if (mouseX && mouseY) {
        const dx = mouseX - this.x;
        const dy = mouseY - this.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        const maxDistance = 200;  // Increased interaction radius

        if (distance < maxDistance) {
          // Much stronger push away from mouse
          const force = (maxDistance - distance) / maxDistance;
          const angle = Math.atan2(dy, dx);
          
          // Significantly increased repulsion force
          this.vx -= Math.cos(angle) * force * 2.0;
          this.vy -= Math.sin(angle) * force * 2.0;
          
          // Make particles larger when near mouse
          this.size = this.baseSize * (1 + force * 0.5);
        } else {
          this.size = this.baseSize;
        }
      }

      // Apply velocity directly for more responsive movement
      this.x += this.vx;
      this.y += this.vy;

      // Boundary check with bounce
      if (this.x < 0 || this.x > this.canvas.width) {
        this.vx *= -1;
      }
      if (this.y < 0 || this.y > this.canvas.height) {
        this.vy *= -1;
      }

      // Add random movement
      this.vx += (Math.random() - 0.5) * 0.2;
      this.vy += (Math.random() - 0.5) * 0.2;

      // Increased speed limits for more dramatic movement
      this.vx = Math.min(Math.max(this.vx, -4), 4);
      this.vy = Math.min(Math.max(this.vy, -4), 4);

      // Reduced friction to maintain speed longer
      this.vx *= 0.95;
      this.vy *= 0.95;
    }

    draw() {
      const isLightTheme = document.body.classList.contains('light-theme');
      const color = isLightTheme ? '#9a5961' : '#9a5961';
      
      this.ctx.beginPath();
      this.ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
      this.ctx.fillStyle = color;
      this.ctx.fill();
    }
}

function initParticles() {
    const canvas = document.getElementById('particles-background');
    const ctx = canvas.getContext('2d');
    let particles = [];
    let mouseX = null;
    let mouseY = null;
    let animationFrameId;

    function init() {
      particles = [];
      for (let i = 0; i < 80; i++) {
        particles.push(new Particle(canvas));
      }
    }

    function drawConnections() {
      particles.forEach((p1, i) => {
        particles.slice(i + 1).forEach(p2 => {
          const dx = p1.x - p2.x;
          const dy = p1.y - p2.y;
          const distance = Math.sqrt(dx * dx + dy * dy);
          const maxDistance = 100;  // Slightly increased for more connections

          if (distance < maxDistance) {
            const isLightTheme = document.body.classList.contains('light-theme');
            const opacity = (1 - (distance / maxDistance)) * 0.3;  // Increased opacity
            const color = isLightTheme ? `#9a5961` : `#9a5961`;
            
            ctx.beginPath();
            ctx.moveTo(p1.x, p1.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.strokeStyle = color;
            ctx.lineWidth = 0.8;  // Slightly thicker lines
            ctx.stroke();
          }
        });
      });
    }

    function resizeCanvas() {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      init();
    }

    function animate() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      drawConnections();
      
      particles.forEach(particle => {
        particle.update(mouseX, mouseY);
        particle.draw();
      });
      
      animationFrameId = requestAnimationFrame(animate);
    }

    // Improved mouse tracking - using document instead of canvas for better coverage
    document.addEventListener('mousemove', (e) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
    });

    document.addEventListener('touchmove', (e) => {
      e.preventDefault();
      mouseX = e.touches[0].clientX;
      mouseY = e.touches[0].clientY;
    }, { passive: false });

    document.addEventListener('mouseleave', () => {
      mouseX = null;
      mouseY = null;
    });

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    animate();

    const observer = new MutationObserver(() => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    });

    observer.observe(document.body, {
      attributes: true,
      attributeFilter: ['class']
    });

    return () => {
      observer.disconnect();
      window.removeEventListener('resize', resizeCanvas);
      cancelAnimationFrame(animationFrameId);
    };
}

document.addEventListener('DOMContentLoaded', initParticles);