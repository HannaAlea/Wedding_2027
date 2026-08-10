const menuToggle = document.getElementById('menuToggle');
const siteNav = document.getElementById('siteNav');

if (menuToggle && siteNav) {
  menuToggle.addEventListener('click', () => {
    const expanded = menuToggle.getAttribute('aria-expanded') === 'true';
    menuToggle.setAttribute('aria-expanded', String(!expanded));
    siteNav.classList.toggle('open');
  });

  siteNav.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => {
      siteNav.classList.remove('open');
      menuToggle.setAttribute('aria-expanded', 'false');
    });
  });
}

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
  }, { threshold: 0.15 });

  revealElements.forEach(element => observer.observe(element));
}

const weddingDate = new Date('2027-07-30T15:00:00').getTime();
const countdownTargets = {
  days: document.getElementById('days'),
  hours: document.getElementById('hours'),
  minutes: document.getElementById('minutes'),
  seconds: document.getElementById('seconds')
};

function updateCountdown() {
  if (!countdownTargets.days) return;

  const now = new Date().getTime();
  const distance = weddingDate - now;

  if (distance <= 0) {
    Object.values(countdownTargets).forEach(node => {
      if (node) node.textContent = '00';
    });
    return;
  }

  const day = 1000 * 60 * 60 * 24;
  const hour = 1000 * 60 * 60;
  const minute = 1000 * 60;

  const days = Math.floor(distance / day);
  const hours = Math.floor((distance % day) / hour);
  const minutes = Math.floor((distance % hour) / minute);
  const seconds = Math.floor((distance % minute) / 1000);

  countdownTargets.days.textContent = String(days).padStart(2, '0');
  countdownTargets.hours.textContent = String(hours).padStart(2, '0');
  countdownTargets.minutes.textContent = String(minutes).padStart(2, '0');
  countdownTargets.seconds.textContent = String(seconds).padStart(2, '0');
}

updateCountdown();
setInterval(updateCountdown, 1000);


const landingScreen = document.getElementById('landingScreen');
const landingImg = document.getElementById('landingImg');
const targetCard = document.querySelector('#enterTarget .hero-photo');

if (landingScreen && landingImg && targetCard) {
  document.body.classList.add('landing-active');

  let isAnimating = false;

  function animateToCard() {
    if (isAnimating) return;
    isAnimating = true;

    landingScreen.classList.add('animate');

    const rect = targetCard.getBoundingClientRect();

    // Start fullscreen (already is)
    landingImg.style.top = '0px';
    landingImg.style.left = '0px';
    landingImg.style.width = '100vw';
    landingImg.style.height = '100vh';

    // force repaint
    landingImg.getBoundingClientRect();

    // Move directly to card
    landingImg.style.top = rect.top + 'px';
    landingImg.style.left = rect.left + 'px';
    landingImg.style.width = rect.width + 'px';
    landingImg.style.height = rect.height + 'px';
    landingImg.style.borderRadius = '34px';

    setTimeout(() => {
      landingScreen.style.display = 'none';
      document.body.classList.remove('landing-active');
    }, 800);
  }

  landingScreen.addEventListener('click', animateToCard);

  window.addEventListener('wheel', (e) => {
    // Ignore pinch-to-zoom / Ctrl+scroll zoom gestures — these also fire
    // wheel events with a positive deltaY and should not dismiss the landing screen.
    if (e.ctrlKey || e.metaKey) return;
    if (e.deltaY > 0) animateToCard();
  }, { passive: true });

  window.addEventListener('touchmove', animateToCard, { passive: true });
}

const scrollHint = document.getElementById('scrollHint');

if (scrollHint && landingScreen) {
  // Clicking the hint's link only jumped to #overview before — it never
  // dismissed the landing screen, since the link isn't a child of
  // landingScreen and doesn't fire the click/wheel/touchmove listeners above.
  // Dismiss the landing screen first, then scroll to the target once it's done.
  const scrollHintLink = scrollHint.querySelector('a');

  if (scrollHintLink) {
    scrollHintLink.addEventListener('click', (e) => {
      e.preventDefault();

      const targetSelector = scrollHintLink.getAttribute('href');
      const targetEl = targetSelector ? document.querySelector(targetSelector) : null;

      if (typeof animateToCard === 'function') {
        animateToCard();
      }

      // Matches the 800ms landing-dismissal timer in animateToCard, plus a
      // small buffer, so the page is scrollable before we scroll it.
      setTimeout(() => {
        if (targetEl) targetEl.scrollIntoView({ behavior: 'smooth' });
      }, 820);
    });
  }

  // Only hide after landing is gone AND user scrolls down
  function onLandingDone() {
    // If the page is already scrolled past the threshold the moment landing
    // finishes, hide immediately instead of waiting for a scroll event that
    // may never come (e.g. no scroll event fires from a zoom gesture).
    if (window.scrollY > 40) {
      scrollHint.classList.add('hidden');
      return;
    }

    window.addEventListener('scroll', () => {
      if (window.scrollY > 40) scrollHint.classList.add('hidden');
    }, { passive: true, once: true });
  }

  // Hook into the existing setTimeout in animateToCard by watching body class
  const observer = new MutationObserver(() => {
    if (!document.body.classList.contains('landing-active')) {
      onLandingDone();
      observer.disconnect();
    }
  });

  observer.observe(document.body, { attributes: true, attributeFilter: ['class'] });
}