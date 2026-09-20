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
// centered version of it. Images that share a "data-gallery" value (used by
// the story-timeline photo stacks) open together as a swipeable gallery with
// prev/next arrows; images without one just open on their own, same as before.
//
// The photo "flies" out of its spot on the page into the center (and back on
// close) using a FLIP-style transform animation, so it stays smooth even on
// phones: only transform/opacity are animated on the GPU, and the big blurred
// backdrop that used to cause the lag is gone.
const zoomableImages = document.querySelectorAll('.zoomable');

if (zoomableImages.length) {
  const OPEN_MS = 480;
  const CLOSE_MS = 360;
  const EASE = 'cubic-bezier(0.22, 1, 0.36, 1)';
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

  // Group images into galleries. Anything without data-gallery becomes a
  // gallery of one, keyed by its own position, so existing single photos
  // (e.g. on the dress code page) behave exactly as before.
  const galleries = new Map();
  zoomableImages.forEach((img, i) => {
    const key = img.dataset.gallery || `__single-${i}`;
    if (!galleries.has(key)) galleries.set(key, []);
    galleries.get(key).push(img);
  });

  // Build the lightbox markup once and reuse it for every image
  const overlay = document.createElement('div');
  overlay.className = 'lightbox-overlay';
  overlay.setAttribute('role', 'dialog');
  overlay.setAttribute('aria-modal', 'true');
  overlay.setAttribute('aria-hidden', 'true');

  const stage = document.createElement('div');
  stage.className = 'lightbox-stage';
  overlay.appendChild(stage);

  const overlayImg = document.createElement('img');
  stage.appendChild(overlayImg);

  const prevBtn = document.createElement('button');
  prevBtn.className = 'lightbox-arrow lightbox-prev';
  prevBtn.type = 'button';
  prevBtn.setAttribute('aria-label', 'Previous photo');
  prevBtn.innerHTML = '&#10094;';
  stage.appendChild(prevBtn);

  const nextBtn = document.createElement('button');
  nextBtn.className = 'lightbox-arrow lightbox-next';
  nextBtn.type = 'button';
  nextBtn.setAttribute('aria-label', 'Next photo');
  nextBtn.innerHTML = '&#10095;';
  stage.appendChild(nextBtn);

  const counter = document.createElement('div');
  counter.className = 'lightbox-counter';
  overlay.appendChild(counter);

  const closeBtn = document.createElement('button');
  closeBtn.className = 'lightbox-close';
  closeBtn.type = 'button';
  closeBtn.setAttribute('aria-label', 'Close zoomed image');
  closeBtn.textContent = '×'; // ×
  overlay.appendChild(closeBtn);

  document.body.appendChild(overlay);

  let lastFocused = null; // the thumbnail that was opened, to refocus on close
  let currentGallery = [];
  let currentIndex = 0;
  let flyAnim = null;      // the running open/close animation, if any

  // Keep decoded copies of the gallery photos so flipping between them (and
  // the very first open) never waits on a network fetch or image decode.
  const preloaded = new Map();
  function preload(src) {
    if (!src || preloaded.has(src)) return;
    const p = new Image();
    p.decoding = 'async';
    p.src = src;
    if (p.decode) p.decode().catch(() => {});
    preloaded.set(src, p);
  }
  const srcOf = (img) => img.currentSrc || img.src;

  function renderCurrent() {
    const img = currentGallery[currentIndex];
    overlayImg.src = srcOf(img);
    overlayImg.alt = img.alt || '';

    const multiple = currentGallery.length > 1;
    prevBtn.hidden = !multiple;
    nextBtn.hidden = !multiple;
    counter.hidden = !multiple;
    if (multiple) {
      counter.textContent = `${currentIndex + 1} / ${currentGallery.length}`;
    }
  }

  // Move to the previous (-1) or next (+1) photo. The new photo slides in
  // from the side you're heading towards, so it feels like turning a page.
  let navToken = 0; // lets a fast second tap/swipe cancel the first one's animation
  function go(dir) {
    if (currentGallery.length < 2) return;
    stopFlight();

    const token = ++navToken;
    currentIndex = (currentIndex + dir + currentGallery.length) % currentGallery.length;

    // hide the old photo, swap in the new one, and only reveal it once it is
    // decoded, so there is never a flash of the wrong picture
    overlayImg.style.opacity = '0';
    renderCurrent();

    const reveal = () => {
      if (token !== navToken) return;
      overlayImg.style.opacity = '';
      if (reduceMotion.matches || !overlayImg.animate) return;
      flyAnim = overlayImg.animate(
          [
            { transform: `translate3d(${dir * 48}px, 0, 0)`, opacity: 0 },
            { transform: 'translate3d(0, 0, 0)', opacity: 1 }
          ],
          { duration: 260, easing: EASE }
      );
      flyAnim.onfinish = () => { flyAnim = null; };
    };

    if (overlayImg.decode) overlayImg.decode().then(reveal, reveal);
    else reveal();
  }

  const showPrev = () => go(-1);
  const showNext = () => go(1);

  // The visible photo area of a thumbnail on screen (inside its border), plus
  // its corner radius and object-position, so the flight starts exactly where
  // the picture visibly is.
  function measureThumb(el) {
    const r = el.getBoundingClientRect();
    const cs = getComputedStyle(el);
    const b = parseFloat(cs.borderTopWidth) || 0;
    const pos = (cs.objectPosition || '50% 50%').split(' ');
    const frac = (v) => (v && v.endsWith('%') ? parseFloat(v) / 100 : 0.5);
    return {
      left: r.left + b,
      top: r.top + b,
      width: Math.max(1, r.width - b * 2),
      height: Math.max(1, r.height - b * 2),
      radius: Math.max(0, (parseFloat(cs.borderTopLeftRadius) || 0) - b),
      px: cs.objectFit === 'cover' ? frac(pos[0]) : 0.5,
      py: cs.objectFit === 'cover' ? frac(pos[1]) : 0.5
    };
  }

  // Keyframes that make the big centered image look like the small thumbnail:
  // scaled + moved onto it, and cropped (clip-path) to the thumbnail's shape.
  function thumbFrames(from, to) {
    const s = Math.max(from.width / to.width, from.height / to.height);
    const visW = from.width / s;
    const visH = from.height / s;
    const cropL = (to.width - visW) * from.px;
    const cropT = (to.height - visH) * from.py;
    const cropR = to.width - visW - cropL;
    const cropB = to.height - visH - cropT;

    // centre of the visible crop, relative to the image's own centre
    const ox = cropL + visW / 2 - to.width / 2;
    const oy = cropT + visH / 2 - to.height / 2;
    const dx = (from.left + from.width / 2) - (to.left + to.width / 2) - s * ox;
    const dy = (from.top + from.height / 2) - (to.top + to.height / 2) - s * oy;

    return {
      start: {
        transform: `translate3d(${dx}px, ${dy}px, 0) scale(${s})`,
        clipPath: `inset(${cropT}px ${cropR}px ${cropB}px ${cropL}px round ${from.radius / s}px)`
      },
      end: {
        transform: 'translate3d(0, 0, 0) scale(1)',
        clipPath: 'inset(0px 0px 0px 0px round 18px)'
      }
    };
  }

  function stopFlight() {
    if (flyAnim) {
      flyAnim.cancel();
      flyAnim = null;
    }
  }

  // After the photo lands back on its thumbnail, hold the thumbnail still (no
  // hover lift / shadow change) until the mouse actually moves. Otherwise the
  // hover effect kicks in right as it lands and the photo visibly "settles".
  const lastPtr = { x: 0, y: 0 };
  window.addEventListener('pointermove', (e) => {
    lastPtr.x = e.clientX;
    lastPtr.y = e.clientY;
  }, { passive: true });

  function quietThumb(thumb) {
    thumb.classList.add('lightbox-quiet');
    const p0 = { x: lastPtr.x, y: lastPtr.y };
    const onMove = (e) => {
      if (Math.hypot(e.clientX - p0.x, e.clientY - p0.y) < 8) return;
      thumb.classList.remove('lightbox-quiet');
      window.removeEventListener('pointermove', onMove);
    };
    window.addEventListener('pointermove', onMove, { passive: true });
  }

  function openLightbox(sourceImg) {
    const key = sourceImg.dataset.gallery || null;
    currentGallery = key ? galleries.get(key) : [sourceImg];
    currentIndex = currentGallery.indexOf(sourceImg);
    if (currentIndex < 0) currentIndex = 0;
    lastFocused = sourceImg;

    stopFlight();
    navToken++;
    overlayImg.style.opacity = '';
    sourceImg.classList.remove('lightbox-quiet');
    currentGallery.forEach((img) => preload(srcOf(img)));
    renderCurrent();

    overlay.classList.add('active');
    overlay.setAttribute('aria-hidden', 'false');
    document.body.classList.add('lightbox-open');
    closeBtn.focus({ preventScroll: true }); // move keyboard focus into the dialog

    if (reduceMotion.matches || !overlayImg.animate) return;

    // Measure after the body scroll-lock so the thumbnail position is final.
    const from = measureThumb(sourceImg);

    // Keep the big image invisible until the flight is ready to start, so it
    // never flashes at full size first.
    overlayImg.style.visibility = 'hidden';

    const fly = () => {
      const to = overlayImg.getBoundingClientRect();
      if (!to.width || !to.height) {
        overlayImg.style.visibility = '';
        return;
      }
      const f = thumbFrames(from, to);
      flyAnim = overlayImg.animate([f.start, f.end], { duration: OPEN_MS, easing: EASE });
      overlayImg.style.visibility = '';
      sourceImg.classList.add('lightbox-source-hidden'); // the photo "lifts off" the page
      flyAnim.onfinish = () => { flyAnim = null; };
    };

    if (overlayImg.decode) overlayImg.decode().then(fly, fly);
    else fly();
  }

  function closeLightbox() {
    if (!overlay.classList.contains('active')) return;

    overlay.classList.remove('active');
    overlay.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('lightbox-open');

    const thumb = lastFocused;
    const restoreThumb = () => {
      if (!thumb) return;
      quietThumb(thumb);
      thumb.classList.remove('lightbox-source-hidden');
    };

    if (thumb && !reduceMotion.matches && overlayImg.animate) {
      stopFlight();
      const to = overlayImg.getBoundingClientRect();
      const from = measureThumb(thumb); // measured after the scroll-lock is released
      if (to.width && to.height) {
        const f = thumbFrames(from, to);
        // fill: forwards keeps it parked on the thumbnail until the overlay hides
        flyAnim = overlayImg.animate([f.end, f.start], {
          duration: CLOSE_MS,
          easing: EASE,
          fill: 'forwards'
        });
        flyAnim.onfinish = restoreThumb;
      } else {
        restoreThumb();
      }
    } else {
      restoreThumb();
    }

    if (thumb) {
      thumb.focus({ preventScroll: true }); // send focus back to the thumbnail
    }
  }

  zoomableImages.forEach((img) => {
    img.setAttribute('tabindex', '0');
    img.setAttribute('role', 'button');
    img.setAttribute('aria-label', img.dataset.gallery ? 'Click to view photos' : 'Click to zoom image');

    // Warm the cache as soon as someone points at a photo
    img.addEventListener('pointerenter', () => preload(srcOf(img)), { once: true });

    img.addEventListener('click', () => openLightbox(img));
    img.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        openLightbox(img);
      }
    });
  });

  prevBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    showPrev();
  });
  nextBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    showNext();
  });

  // On touch screens, tapping the right half of the photo goes to the next
  // one and tapping the left half goes back to the previous one. (Swiping
  // left/right does the same, see the touch handlers below.)
  const coarsePointer = window.matchMedia('(pointer: coarse)');
  overlayImg.addEventListener('click', (e) => {
    if (currentGallery.length < 2 || !coarsePointer.matches) return;
    const r = overlayImg.getBoundingClientRect();
    if (e.clientX >= r.left + r.width / 2) showNext();
    else showPrev();
  });

  // Clicking the dark backdrop closes it; clicking the image, arrows or
  // counter should not (so people can flip through photos without exiting).
  overlay.addEventListener('click', closeLightbox);
  stage.addEventListener('click', (e) => e.stopPropagation());
  counter.addEventListener('click', (e) => e.stopPropagation());
  closeBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    closeLightbox();
  });

  // Block page scrolling behind the lightbox WITHOUT hiding the page's
  // scrollbar. Hiding it made the page (and the photo) shift sideways by a
  // few pixels on open/close, which showed up as a jump at the end of the
  // close animation.
  const blockScroll = (e) => e.preventDefault();
  overlay.addEventListener('wheel', blockScroll, { passive: false });
  overlay.addEventListener('touchmove', blockScroll, { passive: false });

  window.addEventListener('keydown', (e) => {
    if (!overlay.classList.contains('active')) return;
    if (['ArrowUp', 'ArrowDown', 'PageUp', 'PageDown', 'Home', 'End'].includes(e.key)) {
      e.preventDefault();
    }
    if (e.key === 'Escape') closeLightbox();
    if (e.key === 'ArrowLeft') showPrev();
    if (e.key === 'ArrowRight') showNext();
  });

  // Touch swipe: left/right flips through the gallery, a small vertical
  // tolerance keeps it from misfiring on an intentional up/down scroll.
  let touchStartX = 0;
  let touchStartY = 0;

  overlay.addEventListener('touchstart', (e) => {
    touchStartX = e.changedTouches[0].clientX;
    touchStartY = e.changedTouches[0].clientY;
  }, { passive: true });

  overlay.addEventListener('touchend', (e) => {
    if (currentGallery.length < 2) return;
    const dx = e.changedTouches[0].clientX - touchStartX;
    const dy = e.changedTouches[0].clientY - touchStartY;
    if (Math.abs(dx) > 45 && Math.abs(dx) > Math.abs(dy)) {
      if (dx > 0) showPrev();
      else showNext();
    }
  }, { passive: true });
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