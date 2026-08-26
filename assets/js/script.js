// Mobile navigation menu: toggles the hamburger button and slide-out nav
const menuToggle = document.getElementById('menuToggle');
const siteNav = document.getElementById('siteNav');

if (menuToggle && siteNav) {
  menuToggle.addEventListener('click', () => {
    const expanded = menuToggle.getAttribute('aria-expanded') === 'true';
    menuToggle.setAttribute('aria-expanded', String(!expanded));
    siteNav.classList.toggle('open');
  });

  // Close the mobile nav when a link is clicked, so the user doesn't have to manually close it
  siteNav.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => {
      siteNav.classList.remove('open');
      menuToggle.setAttribute('aria-expanded', 'false');
    });
  });
}

// Scroll animations
const revealElements = document.querySelectorAll('.reveal');

if (revealElements.length) {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
      } else {
        entry.target.classList.remove('visible');
      }
    });
  }, { threshold: 0.15 }); // trigger once 15% of the element is on screen

  revealElements.forEach(element => observer.observe(element));
}

// Wedding countdown timer
const weddingDate = new Date('2027-07-30T15:00:00').getTime();
const countdownTargets = {
  days: document.getElementById('days'),
  hours: document.getElementById('hours'),
  minutes: document.getElementById('minutes'),
  seconds: document.getElementById('seconds')
};

function updateCountdown() {
  if (!countdownTargets.days) return; // no countdown element on this page

  const now = new Date().getTime();
  const distance = weddingDate - now;

  // Once the wedding date has passed, show zeros instead of negative numbers
  if (distance <= 0) {
    Object.values(countdownTargets).forEach(node => {
      if (node) node.textContent = '00';
    });
    return;
  }

  // Break the remaining time down into days, hours, minutes and seconds
  const day = 1000 * 60 * 60 * 24;
  const hour = 1000 * 60 * 60;
  const minute = 1000 * 60;

  const days = Math.floor(distance / day);
  const hours = Math.floor((distance % day) / hour);
  const minutes = Math.floor((distance % hour) / minute);
  const seconds = Math.floor((distance % minute) / 1000);

  // padStart keeps single digits displaying as "05" instead of "5"
  countdownTargets.days.textContent = String(days).padStart(2, '0');
  countdownTargets.hours.textContent = String(hours).padStart(2, '0');
  countdownTargets.minutes.textContent = String(minutes).padStart(2, '0');
  countdownTargets.seconds.textContent = String(seconds).padStart(2, '0');
}

updateCountdown();
setInterval(updateCountdown, 1000); // refresh once per second


// Landing screen intro : the full-screen photo shrinks down into the hero
// card once the visitor clicks, scrolls, or swipes
const landingScreen = document.getElementById('landingScreen');
const landingImg = document.getElementById('landingImg');
const targetCard = document.querySelector('#enterTarget .hero-photo');

// Declared up here, outside the if-block below, so the scroll-hint code
// further down the file can call it too
let animateToCard = null;
let isAnimating = false;

if (landingScreen && landingImg && targetCard) {
  document.body.classList.add('landing-active');

  animateToCard = function () {
    if (isAnimating) return; // animation already running, ignore repeat triggers
    isAnimating = true;

    landingScreen.classList.add('animate');

    const rect = targetCard.getBoundingClientRect();

    // Set the starting position and size explicitly (full screen)
    landingImg.style.top = '0px';
    landingImg.style.left = '0px';
    landingImg.style.width = '100vw';
    landingImg.style.height = '100vh';

    // Reading a layout property here forces the browser to apply the
    // styles above before the next change, so the transition below
    // actually animates instead of jumping straight to the end state
    landingImg.getBoundingClientRect();

    // Animate to the hero card's position and size
    landingImg.style.top = rect.top + 'px';
    landingImg.style.left = rect.left + 'px';
    landingImg.style.width = rect.width + 'px';
    landingImg.style.height = rect.height + 'px';
    landingImg.style.borderRadius = '34px';

    // Give the CSS transition time to finish, then hide the overlay for good
    setTimeout(() => {
      landingScreen.style.display = 'none';
      document.body.classList.remove('landing-active');
    }, 800);
  };

  landingScreen.addEventListener('click', animateToCard);

  window.addEventListener('wheel', (e) => {
    // Pinch-to-zoom and Ctrl/Cmd+scroll also fire wheel events, ignore
    // those so they don't accidentally dismiss the landing screen
    if (e.ctrlKey || e.metaKey) return;
    if (e.deltaY > 0) animateToCard();
  }, { passive: true });

  window.addEventListener('touchmove', animateToCard, { passive: true });
}

// "Scroll for details" hint shown under the landing screen
const scrollHint = document.getElementById('scrollHint');

if (scrollHint && landingScreen) {
  // The hint used to link straight to #overview, which skipped past the
  // hero section entirely. The hero already sits at the top of the page,
  // underneath the landing overlay, so clicking the hint now just
  // dismisses the overlay and lets the hero show through underneath.
  const scrollHintLink = scrollHint.querySelector('a');

  if (scrollHintLink) {
    scrollHintLink.addEventListener('click', (e) => {
      e.preventDefault();

      if (landingScreen.style.display === 'none') {
        return; // overlay already dismissed, e.g. by scrolling first
      }

      if (animateToCard) {
        animateToCard();
      }
    });
  }

  // Hide the hint once the landing overlay is gone and the visitor has
  // scrolled down. This checks on every scroll event instead of just once,
  // because on mobile the page can't actually scroll until the 800ms
  // dismiss animation finishes, a quick swipe often ends before that, so
  // a single check right when the overlay clears could easily miss it.
  function checkHideHint() {
    if (
        !document.body.classList.contains('landing-active') &&
        window.scrollY > 40
    ) {
      scrollHint.classList.add('hidden');
      window.removeEventListener('scroll', checkHideHint);
    }
  }

  window.addEventListener('scroll', checkHideHint, { passive: true });
}

// Image lightbox, clicking any <img class="zoomable"> opens an enlarged,
// centered version of it; clicking again (or pressing Esc) closes it
const zoomableImages = document.querySelectorAll('.zoomable');

if (zoomableImages.length) {
  // Build the lightbox markup once and reuse it for every image
  const overlay = document.createElement('div');
  overlay.className = 'lightbox-overlay';
  overlay.setAttribute('role', 'dialog');
  overlay.setAttribute('aria-modal', 'true');
  overlay.setAttribute('aria-hidden', 'true');

  const overlayImg = document.createElement('img');
  overlay.appendChild(overlayImg);

  const closeBtn = document.createElement('button');
  closeBtn.className = 'lightbox-close';
  closeBtn.type = 'button';
  closeBtn.setAttribute('aria-label', 'Close zoomed image');
  closeBtn.textContent = '×'; // ×
  overlay.appendChild(closeBtn);

  document.body.appendChild(overlay);

  let lastFocused = null; // the thumbnail that was opened, to refocus on close

  function openLightbox(sourceImg) {
    overlayImg.src = sourceImg.currentSrc || sourceImg.src;
    overlayImg.alt = sourceImg.alt || '';
    lastFocused = sourceImg;

    overlay.classList.add('active');
    overlay.setAttribute('aria-hidden', 'false');
    document.body.classList.add('lightbox-open');
    closeBtn.focus(); // move keyboard focus into the dialog
  }

  function closeLightbox() {
    overlay.classList.remove('active');
    overlay.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('lightbox-open');

    if (lastFocused) {
      lastFocused.focus({ preventScroll: true }); // send focus back to the thumbnail
    }
  }

  zoomableImages.forEach((img) => {
    img.setAttribute('tabindex', '0');
    img.setAttribute('role', 'button');
    img.setAttribute('aria-label', 'Click to zoom image');

    img.addEventListener('click', () => openLightbox(img));
    img.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        openLightbox(img);
      }
    });
  });

  // Clicking anywhere on the overlay, the dark backdrop or the zoomed
  // image itself , closes it again
  overlay.addEventListener('click', closeLightbox);
  closeBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    closeLightbox();
  });

  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && overlay.classList.contains('active')) {
      closeLightbox();
    }
  });
}

// Floating heart trail — mouse trail on desktop, tap bursts on mobile.
// Respects prefers-reduced-motion; cleans up via animationend so nothing
// piles up in the DOM.
(function () {
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (prefersReducedMotion) return;

  const HEART_PATH = 'M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z';
  const MAX_HEARTS = 8;

  let activeHearts = 0;

  function spawnHeart(x, y) {
    if (activeHearts >= MAX_HEARTS) return;
    activeHearts++;

    const heart = document.createElement('div');
    heart.className = 'cursor-heart';
    heart.style.left = x + 'px';
    heart.style.top = y + 'px';
    heart.style.setProperty('--heart-rot', (Math.random() * 24 - 12) + 'deg');
    heart.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="' + HEART_PATH + '"/></svg>';

    heart.addEventListener('animationend', () => {
      heart.remove();
      activeHearts--;
    }, { once: true });

    document.body.appendChild(heart);
  }

  // --- Desktop: mouse trail ---
  const hasFinePointer = window.matchMedia('(pointer: fine)').matches;

  if (hasFinePointer) {
    const SPAWN_INTERVAL = 260; // ms between hearts while the pointer moves
    let lastSpawn = 0;

    window.addEventListener('pointermove', (e) => {
      if (e.pointerType !== 'mouse') return;
      const now = Date.now();
      if (now - lastSpawn < SPAWN_INTERVAL) return;
      lastSpawn = now;
      spawnHeart(e.clientX, e.clientY);
    }, { passive: true });
  }

  // --- Mobile/touch: tap bursts ---
  // Ignores taps on interactive elements (links, buttons, form fields,
  // zoomable photos) and ignores drags/scrolls, only firing on a genuine tap.
  const TAP_MOVE_THRESHOLD = 12; // px of allowed finger movement to still count as a tap
  const TAP_TIME_THRESHOLD = 350; // ms - longer holds/drags are ignored
  const SKIP_SELECTOR = 'a, button, input, textarea, select, .zoomable, .menu-toggle, summary';

  let touchStartX = 0;
  let touchStartY = 0;
  let touchStartTime = 0;
  let touchStartValid = false;

  window.addEventListener('touchstart', (e) => {
    if (e.touches.length !== 1) { touchStartValid = false; return; }
    if (e.target.closest(SKIP_SELECTOR)) { touchStartValid = false; return; }

    touchStartX = e.touches[0].clientX;
    touchStartY = e.touches[0].clientY;
    touchStartTime = Date.now();
    touchStartValid = true;
  }, { passive: true });

  window.addEventListener('touchend', (e) => {
    if (!touchStartValid) return;
    touchStartValid = false;

    const touch = e.changedTouches[0];
    if (!touch) return;

    const dx = touch.clientX - touchStartX;
    const dy = touch.clientY - touchStartY;
    const distance = Math.sqrt(dx * dx + dy * dy);
    const duration = Date.now() - touchStartTime;

    if (distance > TAP_MOVE_THRESHOLD || duration > TAP_TIME_THRESHOLD) return; // it was a scroll/drag, not a tap

    // small burst of hearts around the tap point
    const burstCount = 3;
    for (let i = 0; i < burstCount; i++) {
      const offsetX = (Math.random() - 0.5) * 30;
      const offsetY = (Math.random() - 0.5) * 20;
      setTimeout(() => {
        spawnHeart(touch.clientX + offsetX, touch.clientY + offsetY);
      }, i * 60);
    }
  }, { passive: true });
})();