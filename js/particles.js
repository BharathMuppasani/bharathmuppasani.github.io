class Particle {
    constructor(canvas) {
      this.canvas = canvas;
      this.ctx = canvas.getContext('2d');
      this.init();
    }

    static isMobile() {
        return window.innerWidth <= 768;
    }

    init() {
        this.x = Math.random() * this.canvas.width;
        this.y = Math.random() * this.canvas.height;
        this.size = Particle.isMobile() ? Math.random() * 1.2 + 0.5 : Math.random() * 2 + 1;
        this.baseSize = this.size;
        
        // Slower base speed
        const speedFactor = Particle.isMobile() ? 0.5 : 1.0;
        this.vx = (Math.random() - 0.5) * speedFactor;
        this.vy = (Math.random() - 0.5) * speedFactor;
        
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
            const maxDistance = Particle.isMobile() ? 100 : 200; // Adjusted interaction radius

            if (distance < maxDistance) {
                // Stronger repulsion force
                const force = (maxDistance - distance) / maxDistance;
                const angle = Math.atan2(dy, dx);
                
                // Increased repulsion strength
                const repulsionStrength = Particle.isMobile() ? 1.5 : 2.0;
                this.vx -= Math.cos(angle) * force * repulsionStrength;
                this.vy -= Math.sin(angle) * force * repulsionStrength;
                
                // Size increase near mouse
                this.size = this.baseSize * (1 + force * 0.5);
            } else {
                this.size = this.baseSize;
            }
        }

        // Apply velocity
        this.x += this.vx;
        this.y += this.vy;

        // Boundary check
        if (this.x < 0 || this.x > this.canvas.width) this.vx *= -1;
        if (this.y < 0 || this.y > this.canvas.height) this.vy *= -1;

        // Add slight randomness to movement
        this.vx += (Math.random() - 0.5) * 0.1;
        this.vy += (Math.random() - 0.5) * 0.1;

        // Speed limiting
        const maxSpeed = Particle.isMobile() ? 2 : 4;
        this.vx = Math.min(Math.max(this.vx, -maxSpeed), maxSpeed);
        this.vy = Math.min(Math.max(this.vy, -maxSpeed), maxSpeed);

        // Friction
        this.vx *= 0.95;
        this.vy *= 0.95;
    }

    draw() {
        const isLightTheme = document.body.classList.contains('light-theme');
        const color = isLightTheme ? '#9a5961' : '#ad656d';
        
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
    let isScrolling = false;
    let scrollTimeout;

    function init() {
        particles = [];
        const particleCount = Particle.isMobile() ? 40 : 80;
        for (let i = 0; i < particleCount; i++) {
            particles.push(new Particle(canvas));
        }
    }

    function drawConnections() {
        particles.forEach((p1, i) => {
            particles.slice(i + 1).forEach(p2 => {
                const dx = p1.x - p2.x;
                const dy = p1.y - p2.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                const maxDistance = Particle.isMobile() ? 50 : 100;

                if (distance < maxDistance) {
                    const isLightTheme = document.body.classList.contains('light-theme');
                    const baseOpacity = Particle.isMobile() ? 0.1 : 0.2;
                    const opacity = (1 - (distance / maxDistance)) * baseOpacity;
                    const color = isLightTheme ? '#9a5961' : '#ad656d';
                    
                    ctx.beginPath();
                    ctx.moveTo(p1.x, p1.y);
                    ctx.lineTo(p2.x, p2.y);
                    ctx.strokeStyle = color;
                    ctx.lineWidth = Particle.isMobile() ? 0.3 : 0.5;
                    ctx.stroke();
                }
            });
        });
    }

    function animate() {
        if (Particle.isMobile() && isScrolling) {
            animationFrameId = requestAnimationFrame(animate);
            return;
        }

        ctx.clearRect(0, 0, canvas.width, canvas.height);
        drawConnections();
        
        particles.forEach(particle => {
            particle.update(mouseX, mouseY);
            particle.draw();
        });
        
        animationFrameId = requestAnimationFrame(animate);
    }

    // Mouse/Touch event handlers
    function updateMousePosition(e) {
        const rect = canvas.getBoundingClientRect();
        mouseX = (e.clientX || e.touches[0].clientX) - rect.left;
        mouseY = (e.clientY || e.touches[0].clientY) - rect.top;
    }

    // Mouse events
    document.addEventListener('mousemove', updateMousePosition);
    document.addEventListener('mouseleave', () => {
        mouseX = null;
        mouseY = null;
    });

    // Touch events
    if (Particle.isMobile()) {
        document.addEventListener('touchstart', (e) => updateMousePosition(e), { passive: true });
        document.addEventListener('touchmove', (e) => updateMousePosition(e), { passive: true });
        document.addEventListener('touchend', () => {
            mouseX = null;
            mouseY = null;
        });
    }

    // Scroll handling
    document.addEventListener('scroll', () => {
        isScrolling = true;
        clearTimeout(scrollTimeout);
        scrollTimeout = setTimeout(() => {
            isScrolling = false;
        }, 150);
    });

    function resizeCanvas() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        init();
    }

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
        document.removeEventListener('mousemove', updateMousePosition);
        document.removeEventListener('touchstart', updateMousePosition);
        document.removeEventListener('touchmove', updateMousePosition);
        cancelAnimationFrame(animationFrameId);
    };
}

document.addEventListener('DOMContentLoaded', initParticles);