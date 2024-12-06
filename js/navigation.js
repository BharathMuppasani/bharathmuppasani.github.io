// Navigation handling
const navigation = {
    init() {
        this.setupSmoothScroll();
        this.setupMobileMenu();
        this.setupScrollSpy();
        this.setupActiveNavHighlight();
        this.handleMobileNavigation();
    },

    setupSmoothScroll() {
        document.querySelectorAll('a[href^="#"]').forEach(anchor => {
            anchor.addEventListener('click', (e) => {
                e.preventDefault();
                const targetId = anchor.getAttribute('href');
                if (targetId === '#') return;
                
                const target = document.querySelector(targetId);
                if (!target) return;
    
                const headerOffset = 150; // Increased offset to align with sidebar
                const targetPosition = target.getBoundingClientRect().top + window.pageYOffset - headerOffset;
                const startPosition = window.pageYOffset;
                const distance = targetPosition - startPosition;
                
                let startTime = null;
                const duration = 800;
    
                function easeInOutQuart(t) {
                    return t < 0.5 
                        ? 8 * t * t * t * t 
                        : 1 - Math.pow(-2 * t + 2, 4) / 2;
                }
    
                function animate(currentTime) {
                    if (startTime === null) {
                        startTime = currentTime;
                    }
    
                    const elapsedTime = currentTime - startTime;
                    const progress = Math.min(elapsedTime / duration, 1);
                    const eased = easeInOutQuart(progress);
    
                    window.scrollTo({
                        top: startPosition + (distance * eased),
                        behavior: 'auto'
                    });
    
                    if (progress < 1) {
                        requestAnimationFrame(animate);
                    } else {
                        history.pushState(null, '', targetId);
                    }
                }
    
                requestAnimationFrame(animate);
            });
        });
    },

    setupMobileMenu() {
        const menuButton = document.querySelector('.mobile-menu-button');
        const mobileMenu = document.querySelector('.mobile-menu');
        const overlay = document.querySelector('.mobile-overlay');

        if (menuButton && mobileMenu) {
            menuButton.addEventListener('click', () => {
                mobileMenu.classList.toggle('hidden');
                overlay?.classList.toggle('hidden');
                document.body.classList.toggle('overflow-hidden');
            });

            // Close menu when clicking outside
            overlay?.addEventListener('click', () => {
                mobileMenu.classList.add('hidden');
                overlay.classList.add('hidden');
                document.body.classList.remove('overflow-hidden');
            });

            // Close menu when clicking a link
            mobileMenu.querySelectorAll('a[href^="#"]').forEach(link => {
                link.addEventListener('click', () => {
                    mobileMenu.classList.add('hidden');
                    overlay?.classList.add('hidden');
                    document.body.classList.remove('overflow-hidden');
                });
            });
        }
    },

    setupScrollSpy() {
        const sections = document.querySelectorAll('section[id]');
        const navLinks = document.querySelectorAll('.nav a');

        const observerOptions = {
            root: null, // viewport
            rootMargin: '-20% 0px -80% 0px', // when section is 20% from top
            threshold: 0
        };

        const observerCallback = (entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const currentId = entry.target.getAttribute('id');
                    this.updateActiveNavLink(currentId);
                }
            });
        };

        const observer = new IntersectionObserver(observerCallback, observerOptions);
        sections.forEach(section => observer.observe(section));
    },

    updateActiveNavLink(currentId) {
        const navLinks = document.querySelectorAll('.nav a');
        navLinks.forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('href') === `#${currentId}`) {
                link.classList.add('active');
            }
        });
    },

    setupActiveNavHighlight() {
        const navLinks = document.querySelectorAll('.nav a');
        navLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                navLinks.forEach(otherLink => otherLink.classList.remove('active'));
                link.classList.add('active');
            });
        });
    },

    handleMobileNavigation() {
        const checkMobileNav = () => {
            const nav = document.querySelector('.nav');
            const mobileMenu = document.querySelector('.mobile-menu');
            const overlay = document.querySelector('.mobile-overlay');

            if (window.innerWidth < 1024) { // lg breakpoint
                nav?.classList.add('hidden');
                if (!mobileMenu?.classList.contains('hidden')) {
                    mobileMenu?.classList.add('hidden');
                    overlay?.classList.add('hidden');
                    document.body.classList.remove('overflow-hidden');
                }
            } else {
                nav?.classList.remove('hidden');
            }
        };

        // Check on load and resize
        checkMobileNav();
        let resizeTimer;
        window.addEventListener('resize', () => {
            clearTimeout(resizeTimer);
            resizeTimer = setTimeout(checkMobileNav, 100);
        });
    },

    handleScrollProgress() {
        const progressBar = document.querySelector('.scroll-progress');
        if (progressBar) {
            const windowHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight;
            const scrolled = (window.scrollY / windowHeight) * 100;
            progressBar.style.width = `${scrolled}%`;
        }
    },

    isInViewport(element) {
        const rect = element.getBoundingClientRect();
        return (
            rect.top >= 0 &&
            rect.left >= 0 &&
            rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
            rect.right <= (window.innerWidth || document.documentElement.clientWidth)
        );
    }
};

// Initialize navigation and set up scroll handlers
document.addEventListener('DOMContentLoaded', () => {
    navigation.init();
    
    // Handle scroll progress
    window.addEventListener('scroll', () => {
        navigation.handleScrollProgress();
    }, { passive: true });

    // Handle scroll-based animations
    window.addEventListener('scroll', () => {
        requestAnimationFrame(() => {
            navigation.handleScrollProgress();
        });
    }, { passive: true });
});

// Export navigation object if using modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = navigation;
}