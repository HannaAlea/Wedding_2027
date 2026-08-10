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

// Declared here (not inside the block below) so the scroll-hint handler
// further down can reliably call it. Relying on function declarations
// inside an `if` block to be visible outside it depends on legacy
// "Annex B" hoisting rules that only apply in non-strict scripts —
// declaring it explicitly avoids that fragility.
let animateToCard = null;
let isAnimating = false;

if (landingScreen && landingImg && targetCard) {
  document.body.classList.add('landing-active');

  animateToCard = function () {
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
  };

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
  // Clicking the hint used to jump straight to #overview, which skipped
  // right over the hero section (headline, countdown, CTA buttons) the
  // instant the landing overlay cleared — the hero is already sitting at
  // scroll position 0 underneath the overlay, so nothing needs to be
  // scrolled to reveal it. Clicking now only dismisses the overlay.
  const scrollHintLink = scrollHint.querySelector('a');

  if (scrollHintLink) {
    scrollHintLink.addEventListener('click', (e) => {
      e.preventDefault();

      if (landingScreen.style.display === 'none') {
        // Already dismissed (e.g. user scrolled with the wheel first) —
        // nothing to do.
        return;
      }

      if (animateToCard) {
        animateToCard();
      }
    });
  }

  // Hide the hint once the landing overlay is gone AND the user has
  // actually scrolled down. This is deliberately NOT a one-shot listener
  // tied to the exact moment the overlay clears: on mobile, `body`'s
  // overflow:hidden blocks real scrolling for the full 800ms dismiss
  // animation, and a single swipe is usually shorter than that — the
  // finger lifts before the page is scrollable, so no further scroll
  // event ever arrives to satisfy a one-shot listener. Checking on every
  // scroll event (and detaching once satisfied) works regardless of when,
  // or in how many separate gestures, the actual scroll happens.
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