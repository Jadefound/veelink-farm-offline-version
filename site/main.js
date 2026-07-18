document.addEventListener('DOMContentLoaded', () => {
  const toggle = document.getElementById('menuToggle');
  const nav = document.getElementById('nav');

  if (toggle && nav) {
    toggle.addEventListener('click', () => {
      nav.classList.toggle('open');
      const isOpen = nav.classList.contains('open');
      toggle.setAttribute('aria-expanded', String(isOpen));
      toggle.setAttribute('aria-label', isOpen ? 'Close menu' : 'Open menu');
    });

    nav.querySelectorAll('a').forEach((link) => {
      link.addEventListener('click', () => {
        nav.classList.remove('open');
        toggle.setAttribute('aria-expanded', 'false');
        toggle.setAttribute('aria-label', 'Open menu');
      });
    });
  }

  // Track download button clicks for simple analytics / hook replacement
  document.querySelectorAll('.download-btn').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      const href = btn.getAttribute('href');
      if (!href || href === '#') {
        e.preventDefault();
        const platform = btn.getAttribute('data-platform') || 'unknown';
        console.log(`[VeeLink] Download link clicked for platform: ${platform} (placeholder)`);
      }
    });
  });

  // Parallax phone cluster in the hero
  const phoneCluster = document.getElementById('phoneCluster');
  if (phoneCluster && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    const phones = phoneCluster.querySelectorAll('.phone');
    let ticking = false;

    const updateParallax = () => {
      const scrollY = window.scrollY;
      const hero = document.querySelector('.hero');
      if (!hero) return;
      const heroHeight = hero.offsetHeight || 1;
      const progress = Math.min(scrollY / heroHeight, 1);

      phones.forEach((phone) => {
        const speed = parseFloat(phone.dataset.speed || '0');
        const base = phone.dataset.base || 'translateY(0)';
        const parallaxOffset = scrollY * speed;
        const sway = Math.sin(progress * Math.PI) * 8; // gentle horizontal sway
        phone.style.transform = `${base} translateY(${parallaxOffset}px) translateX(${sway}px)`;

        const img = phone.querySelector('img');
        if (img) {
          // reveal more of the screenshot as the user scrolls
          const focus = Math.round(progress * 35);
          img.style.objectPosition = `center ${focus}%`;
        }
      });

      ticking = false;
    };

    const onScroll = () => {
      if (!ticking) {
        requestAnimationFrame(updateParallax);
        ticking = true;
      }
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    updateParallax(); // initial position
  }
});
