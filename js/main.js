// Theme management
const theme = {
    init() {
        document.body.classList.add('theme-loaded');
    }
};

// Scroll animations
const scrollAnimations = {
    init() {
        this.animateOnScroll();
        window.addEventListener('scroll', () => this.animateOnScroll());
    },

    animateOnScroll() {
        const elements = document.querySelectorAll('.animate-on-scroll');
        elements.forEach(element => {
            if (this.isElementInViewport(element)) {
                element.classList.add('visible');
            }
        });
    },

    isElementInViewport(el) {
        const rect = el.getBoundingClientRect();
        return (
            rect.top >= 0 &&
            rect.left >= 0 &&
            rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
            rect.right <= (window.innerWidth || document.documentElement.clientWidth)
        );
    }
};

// Project filtering
const projectFilters = {
    init() {
        this.setupFilterListeners();
    },

    setupFilterListeners() {
        const filterButtons = document.querySelectorAll('[data-filter]');
        filterButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                const filter = e.target.dataset.filter;
                this.filterProjects(filter);
            });
        });
    },

    filterProjects(filter) {
        const projects = document.querySelectorAll('.project-card');
        projects.forEach(project => {
            if (filter === 'all' || project.dataset.category === filter) {
                project.style.display = 'block';
            } else {
                project.style.display = 'none';
            }
        });
    }
};

const themeToggle = {
    init() {
        this.createToggleButton();
        this.setupListeners();
        this.updateThemeUI();
    },

    createToggleButton() {
        if (document.querySelector('.theme-toggle')) return;

        const button = document.createElement('button');
        button.className = 'theme-toggle';
        button.setAttribute('aria-label', 'Toggle theme');
        
        button.innerHTML = `
            <svg class="sun-icon" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
            <svg class="moon-icon" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
            </svg>
        `;
        
        document.body.appendChild(button);
    },

    updateThemeUI() {
        const isDark = document.body.classList.contains('dark-theme');
        const sunIcon = document.querySelector('.sun-icon');
        const moonIcon = document.querySelector('.moon-icon');
        
        if (sunIcon && moonIcon) {
            sunIcon.style.display = isDark ? 'block' : 'none';
            moonIcon.style.display = isDark ? 'none' : 'block';
        }
    },

    toggleTheme() {
        const isDark = document.body.classList.contains('dark-theme');
        const newTheme = isDark ? 'light' : 'dark';
        
        // Update localStorage first
        localStorage.setItem('theme', newTheme);
        
        // Then update the UI
        document.body.classList.toggle('dark-theme');
        this.updateThemeUI();
    },

    setupListeners() {
        const button = document.querySelector('.theme-toggle');
        if (button) {
            button.addEventListener('click', () => this.toggleTheme());
        }

        // Handle page loads and navigation
        window.addEventListener('load', () => {
            const savedTheme = localStorage.getItem('theme');
            if (savedTheme === 'dark') {
                document.body.classList.add('dark-theme');
                this.updateThemeUI();
            }
        });

        // Handle back/forward navigation
        window.addEventListener('pageshow', (event) => {
            if (event.persisted) {
                const savedTheme = localStorage.getItem('theme');
                if (savedTheme === 'dark') {
                    document.body.classList.add('dark-theme');
                } else {
                    document.body.classList.remove('dark-theme');
                }
                this.updateThemeUI();
            }
        });
    }
};

// Initialize as soon as possible
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => themeToggle.init());
} else {
    themeToggle.init();
}

// Add transition class after initial load
document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
        document.body.classList.add('theme-loaded');
    }, 100);
});

// About card hover effects
document.addEventListener('DOMContentLoaded', function() {
    const card = document.querySelector('.about-card');
    if (!card) return;

    let rect = card.getBoundingClientRect();
    
    const updateBorderEffect = (e) => {
        rect = card.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        // Calculate distance from each edge
        const distToLeft = x;
        const distToRight = rect.width - x;
        const distToTop = y;
        const distToBottom = rect.height - y;
        
        // Find the nearest edge
        const minDist = Math.min(distToLeft, distToRight, distToTop, distToBottom);
        const threshold = 100; // Increased from 50 for wider effect range
        
        // Calculate angle based on nearest edge
        let angle;
        if (minDist === distToLeft) {
            angle = 180;
        } else if (minDist === distToRight) {
            angle = 0;
        } else if (minDist === distToTop) {
            angle = 270;
        } else {
            angle = 90;
        }
        
        // Calculate intensity based on distance with stronger effect
        const intensity = Math.max(0, Math.min(1, 1 - (minDist / threshold)));
        const distance = 100 - (intensity * 50); // Increased from 30 for more noticeable effect
        
        card.style.setProperty('--angle', `${angle}deg`);
        card.style.setProperty('--distance', `${distance}%`);
    };

    // Update rect on scroll or resize
    const updateRect = () => {
        rect = card.getBoundingClientRect();
    };
    
    window.addEventListener('scroll', updateRect);
    window.addEventListener('resize', updateRect);
    
    // Track mouse movement
    card.addEventListener('mousemove', updateBorderEffect);
    
    // Reset when mouse leaves
    card.addEventListener('mouseleave', () => {
        // Return to default right-side glow
        card.style.setProperty('--angle', '90deg');
        card.style.setProperty('--distance', '100%');
    });
});