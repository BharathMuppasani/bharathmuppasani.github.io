document.addEventListener('DOMContentLoaded', function () {
    const awardTags = document.querySelectorAll('.award-tag');

    // Get theme colors
    const style = getComputedStyle(document.body);
    const accentColor = style.getPropertyValue('--accent').trim() || '#b76e79';

    awardTags.forEach(tag => {
        tag.style.cursor = 'pointer';
        tag.style.userSelect = 'none';

        tag.addEventListener('click', function (e) {
            e.stopPropagation();

            // --- 1. Trigger Confetti ---
            const rect = tag.getBoundingClientRect();
            const x = (rect.left + rect.width / 2) / window.innerWidth;
            const y = (rect.top + rect.height / 2) / window.innerHeight;

            const count = 200;
            const defaults = {
                origin: { x: x, y: y },
                zIndex: 9999,
                disableForReducedMotion: true
            };

            function fire(particleRatio, opts) {
                confetti(Object.assign({}, defaults, opts, {
                    particleCount: Math.floor(count * particleRatio)
                }));
            }

            fire(0.25, { spread: 26, startVelocity: 55, colors: ['#ffd700', '#ffa500'] });
            fire(0.2, { spread: 60, colors: ['#ffd700', '#ffffff'] });
            fire(0.35, { spread: 100, decay: 0.91, scalar: 0.8, colors: [accentColor, '#ffd700'] });
            fire(0.1, { spread: 120, startVelocity: 25, decay: 0.92, scalar: 1.2, colors: ['#ffa500'] });
            fire(0.1, { spread: 120, startVelocity: 45, colors: [accentColor] });

            // --- 2. Find the Title ---
            const container = tag.closest('.publication-item') || tag.closest('.project-header') || tag.parentElement.parentElement;
            let title = null;

            if (container) {
                title = container.querySelector('h3, h4, h2');
            }

            // --- 3. Apply Text Shine & Twinkle Stars ---
            if (title) {
                // Set data-text for the pseudo-element content
                title.setAttribute('data-text', title.innerText);

                // Force reset if already animating
                title.classList.remove('gold-text-shine');
                void title.offsetWidth; // Force reflow

                // Add class to start animation
                title.classList.add('gold-text-shine');

                // Clean up after animation ends
                const cleanup = () => {
                    title.classList.remove('gold-text-shine');
                    title.removeEventListener('animationend', cleanup);
                };

                // Note: The animation is on the ::after pseudo-element, but the event bubbles/fires on the element
                title.addEventListener('animationend', cleanup);

                // Spawn Twinkle Stars
                const titleRect = title.getBoundingClientRect();
                const starCount = 8;

                for (let i = 0; i < starCount; i++) {
                    setTimeout(() => {
                        const star = document.createElement('div');
                        star.classList.add('twinkle-star');

                        const starX = titleRect.left + window.scrollX + (Math.random() * titleRect.width);
                        const starY = titleRect.top + window.scrollY + (Math.random() * titleRect.height);

                        star.style.left = `${starX}px`;
                        star.style.top = `${starY}px`;

                        const scale = 0.5 + Math.random() * 0.8;
                        star.style.transform = `scale(${scale})`;

                        document.body.appendChild(star);

                        star.addEventListener('animationend', () => {
                            star.remove();
                        });
                    }, i * 100);
                }
            }
        });
    });
});
