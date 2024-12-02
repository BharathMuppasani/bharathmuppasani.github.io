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
                const target = document.querySelector(anchor.getAttribute('href'));
                if (target) {
                    target.scrollIntoView({
                        behavior: 'smooth',
                        block: 'start'
                    });
                    // Update URL without page reload
                    history.pushState(null, '', anchor.getAttribute('href'));
                }
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
        }
    },

    setupScrollSpy() {
        const sections = document.querySelectorAll('section[id]');
        const navLinks = document.querySelectorAll('.nav a');

        window.addEventListener('scroll', () => {
            let current = '';
            sections.forEach(section => {
                const sectionTop = section.offsetTop;
                const sectionHeight = section.clientHeight;
                if (window.scrollY >= sectionTop - 150) {
                    current = section.getAttribute('id');
                }
            });

            navLinks.forEach(link => {
                link.classList.remove('active');
                if (link.getAttribute('href').slice(1) === current) {
                    link.classList.add('active');
                }
            });
        });
    },

    setupActiveNavHighlight() {
        // Add active state to nav items
        const navItems = document.querySelectorAll('.nav a');
        navItems.forEach(item => {
            item.addEventListener('click', (e) => {
                navItems.forEach(link => link.classList.remove('active'));
                e.target.closest('a').classList.add('active');
            });
        });
    },

    handleMobileNavigation() {
        // Handle mobile navigation state
        const checkMobileNav = () => {
            const nav = document.querySelector('.nav');
            if (window.innerWidth < 1024) { // lg breakpoint
                nav?.classList.add('hidden');
            } else {
                nav?.classList.remove('hidden');
            }
        };

        // Check on load and resize
        checkMobileNav();
        window.addEventListener('resize', checkMobileNav);
    },

    // Helper function to check if element is in viewport
    isInViewport(element) {
        const rect = element.getBoundingClientRect();
        return (
            rect.top >= 0 &&
            rect.left >= 0 &&
            rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
            rect.right <= (window.innerWidth || document.documentElement.clientWidth)
        );
    },

    // Helper function to handle scroll progress
    handleScrollProgress() {
        const progressBar = document.querySelector('.scroll-progress');
        if (progressBar) {
            const windowHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight;
            const scrolled = (window.scrollY / windowHeight) * 100;
            progressBar.style.width = `${scrolled}%`;
        }
    }
};

// Initialize navigation
document.addEventListener('DOMContentLoaded', () => {
    navigation.init();
    
    // Add scroll progress indicator
    window.addEventListener('scroll', () => {
        navigation.handleScrollProgress();
    });
});

// Export navigation object if using modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = navigation;
}