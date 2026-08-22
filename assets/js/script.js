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