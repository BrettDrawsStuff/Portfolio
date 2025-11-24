// Sketchbook prototype script (uses GSAP)
// script.js is deferred in index.html, so DOM is available

const enterBtn = document.getElementById('enterBtn');
const sketchbook = document.getElementById('sketchbook');
const cover = document.getElementById('cover');
const pages = Array.from(document.querySelectorAll('.pages .page'));
const nextBtn = document.getElementById('nextBtn');
const prevBtn = document.getElementById('prevBtn');
const navItems = Array.from(document.querySelectorAll('.left-nav .nav-item'));

// design dimensions must match the CSS --design-w/--design-h values
const DESIGN_W = 1000;
const DESIGN_H = 680;

// Minimum scale to keep things readable on very small viewports.
// Set to a smaller value if you want the book to shrink more on tiny phones.
const MIN_SCALE = 0.5;

let current = 0;
const maxIndex = pages.length - 1;
let flipping = false;

// stacking initial order
pages.forEach((p, i) => {
  p.style.zIndex = (100 - i);
  p.style.transformOrigin = 'left center';
  p.style.transform = 'rotateY(0deg)';
});

// ----- Full-screen scaling helpers -----
// compute and apply scale so the design fits the viewport while preserving aspect
// This clamps the final scale between MIN_SCALE and 1 (no upscaling).
function applyScale() {
  const vw = Math.max(1, window.innerWidth);
  const vh = Math.max(1, window.innerHeight);

  // Fit the design inside the viewport while preserving aspect ratio
  const rawScale = Math.min(vw / DESIGN_W, vh / DESIGN_H);

  // Clamp so we never upscale beyond 1, and never drop below MIN_SCALE
  const scale = Math.max(MIN_SCALE, Math.min(1, rawScale));

  // Apply the scale about the center. Centering is handled by #app flexbox in CSS.
  // This keeps the sketchbook visible and prevents the "too large" problem.
  sketchbook.style.transform = `scale(${scale})`;
  sketchbook.style.transformOrigin = 'center center';
}

// Run applyScale on load and when the viewport changes.
window.addEventListener('resize', applyScale);
window.addEventListener('orientationchange', () => {
  // small timeout to allow orientation layout to settle
  setTimeout(applyScale, 120);
});
window.addEventListener('load', () => {
  // Some fonts (Adobe Fonts) may change layout after load; run twice to be safe.
  applyScale();
  setTimeout(applyScale, 200);
});
applyScale(); // initial call (script is deferred so DOM is available)

// helper to open the book (returns a Promise)
function openBook() {
  return new Promise((resolve) => {
    if (sketchbook.classList.contains('open')) {
      resolve();
      return;
    }
    sketchbook.classList.add('open');
    cover.setAttribute('aria-pressed', 'true');
    // animate cover open and resolve when animation completes
    gsap.to(cover, {
      duration: 1.2,
      rotationY: -160,
      transformOrigin: "left center",
      ease: "power3.out",
      onComplete: () => resolve()
    });
    // small pop on the first page for nicety
    gsap.fromTo(pages[0], { y: -6, opacity: 0 }, { duration: 0.8, y: 0, opacity: 1, delay: 0.4, ease: "power2.out" });
  });
}

// helper to close the book
function closeBook() {
  if (!sketchbook.classList.contains('open')) return;
  sketchbook.classList.remove('open');
  cover.setAttribute('aria-pressed', 'false');
  gsap.to(cover, { duration: 0.9, rotationY: 0, ease: "power2.in" });
}

// Enter button toggles open/close
enterBtn.addEventListener('click', () => {
  if (!sketchbook.classList.contains('open')) {
    openBook();
  } else {
    closeBook();
  }
});

// next / prev: ensure book is open first, then flip
nextBtn.addEventListener('click', async () => {
  if (flipping) return;
  await openBook();
  if (current >= maxIndex) return;
  flipping = true;
  await flipPage(current, 'forward');
  current++;
  flipping = false;
});

prevBtn.addEventListener('click', async () => {
  if (flipping) return;
  await openBook();
  if (current <= 0) return;
  // flip the previous page backward
  flipping = true;
  current--;
  await flipPage(current, 'backward');
  flipping = false;
});

// nav click to go to a specific page index (auto-opens book)
navItems.forEach(btn => {
  btn.addEventListener('click', async () => {
    const target = Number(btn.getAttribute('data-target'));
    if (isNaN(target)) return;
    await openBook();
    await goToPage(target);
  });
});

// keyboard
document.addEventListener('keydown', (e) => {
  if (e.key === 'ArrowRight') nextBtn.click();
  if (e.key === 'ArrowLeft') prevBtn.click();
  if (e.key === 'Enter') enterBtn.click();
});

// flipPage returns a Promise that resolves when animation completes
function flipPage(index, direction = 'forward') {
  return new Promise((resolve) => {
    const page = pages[index];
    const tl = gsap.timeline({
      onComplete: () => {
        // housekeeping of stacking order after flip
        if (direction === 'forward') {
          // Reset transform to a clean state so subsequent flips work consistently
          page.style.transform = 'rotateY(0deg)';
          page.style.zIndex = 10 + index;
        } else {
          page.style.transform = 'rotateY(0deg)';
          page.style.zIndex = 100 - index;
        }
        resolve();
      }
    });

    if (direction === 'forward') {
      page.style.zIndex = 300;
      tl.to(page, { duration: 0.65, rotationY: -180, transformOrigin: "left center", ease: "power2.inOut" });
    } else {
      // simulate flipping back: start visually rotated then animate to 0
      page.style.transform = 'rotateY(-180deg)';
      page.style.zIndex = 300;
      tl.to(page, { duration: 0.65, rotationY: 0, transformOrigin: "left center", ease: "power2.inOut" });
    }
  });
}

// goToPage flips sequentially toward the target index
async function goToPage(target) {
  if (target === current) return;
  // going forward
  if (target > current) {
    while (current < target) {
      await flipPage(current, 'forward');
      current++;
    }
  } else {
    // going backward
    while (current > target) {
      current--;
      await flipPage(current, 'backward');
    }
  }
}

// ambient animations
gsap.utils.toArray('.floating').forEach((el, i) => {
  gsap.to(el, {
    y: (i + 1) * 10,
    x: (i % 2 ? -14 : 14),
    duration: 4 + i * 1.2,
    repeat: -1,
    yoyo: true,
    ease: 'sine.inOut',
    delay: i * 0.3
  });
});
