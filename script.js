// Sketchbook prototype script (uses GSAP)
// No scaling: removed any viewport scaling logic so the layout remains predictable.
// script.js is deferred in index.html, so DOM is available

const enterBtn = document.getElementById('enterBtn');
const sketchbook = document.getElementById('sketchbook');
const cover = document.getElementById('cover');
const leftPage = document.getElementById('left');
const pagesContainer = document.getElementById('pages');
const pages = Array.from(document.querySelectorAll('.pages .page'));
const nextBtn = document.getElementById('nextBtn');
const prevBtn = document.getElementById('prevBtn');
const controls = document.querySelector('.controls');

// Page titles in order (must match the order of .pages .page elements)
const PAGE_TITLES = [
  'Home',
  'About Me',
  'Digital Art',
  'Animations/GIFs',
  'Sketchbook',
  'Demo Reel'
];

// Ensure each page heading matches the title list
pages.forEach((p, i) => {
  const h2 = p.querySelector('h2');
  if (h2) h2.textContent = PAGE_TITLES[i] || `Page ${i + 1}`;
});

// Apply provided images as backgrounds (expects assets/bookcover.jpg, assets/leftpage.png, assets/rightpage.png)
function applyBackgrounds() {
  // Cover image
  cover.style.backgroundImage = "url('assets/bookcover.jpg')";
  cover.style.backgroundSize = 'cover';
  cover.style.backgroundPosition = 'center';
  cover.style.backgroundRepeat = 'no-repeat';
  // Make cover's inner art area transparent so the image shows through
  const coverArt = cover.querySelector('.cover-art');
  if (coverArt) coverArt.style.background = 'transparent';

  // Left side background
  if (leftPage) {
    leftPage.style.backgroundImage = "url('assets/leftpage.png')";
    leftPage.style.backgroundSize = 'cover';
    leftPage.style.backgroundPosition = 'center';
    leftPage.style.backgroundRepeat = 'no-repeat';
  }

  // Right side / content page background (use same rightpage.png for every right page)
  pages.forEach(p => {
    p.style.backgroundImage = "url('assets/rightpage.png')";
    p.style.backgroundSize = 'cover';
    p.style.backgroundPosition = 'center';
    p.style.backgroundRepeat = 'no-repeat';
    // let the page-content be transparent so the background shows
    const content = p.querySelector('.page-content');
    if (content) {
      content.style.background = 'transparent';
      content.style.color = '#111'; // keep readable text
    }
  });
}

// Initial: only show the cover (hide left and pages and controls)
function setInitialView() {
  applyBackgrounds();

  // Cover title override per your request
  const coverTitle = cover.querySelector('.cover-title');
  if (coverTitle) coverTitle.textContent = "Brett's Portfolio";

  // Hide left and right pages until Enter
  if (leftPage) leftPage.style.display = 'none';
  if (pagesContainer) pagesContainer.style.display = 'none';
  if (controls) controls.style.display = 'none';

  // Ensure cover is reset visually
  cover.style.zIndex = 200;
  cover.style.transform = 'rotateY(0deg)';
  pages.forEach((p, i) => {
    p.style.transform = 'rotateY(0deg)';
    p.style.zIndex = (100 - i);
  });
}
setInitialView();

// Create a compact dropdown menu placed top-right inside the sketchbook
function createPageMenu() {
  // Remove previous if present
  const existing = document.getElementById('pageMenu');
  if (existing) existing.remove();

  const menu = document.createElement('div');
  menu.id = 'pageMenu';
  Object.assign(menu.style, {
    position: 'absolute',
    top: '12px',
    right: '14px',
    zIndex: 500,
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    fontFamily: 'inherit',
    pointerEvents: 'auto'
  });

  const btn = document.createElement('button');
  btn.type = 'button';
  btn.title = 'Menu';
  btn.innerHTML = '☰';
  Object.assign(btn.style, {
    fontSize: '20px',
    padding: '6px 8px',
    borderRadius: '6px',
    border: '2px solid rgba(0,0,0,0.12)',
    background: 'rgba(255,255,255,0.9)',
    cursor: 'pointer'
  });

  const select = document.createElement('select');
  select.id = 'pageSelect';
  Object.assign(select.style, {
    padding: '6px 8px',
    borderRadius: '6px',
    border: '2px solid rgba(0,0,0,0.12)',
    background: 'rgba(255,255,255,0.95)',
    display: 'none' // start hidden
  });

  PAGE_TITLES.forEach((title, idx) => {
    const opt = document.createElement('option');
    opt.value = String(idx);
    opt.textContent = title;
    select.appendChild(opt);
  });

  // Jump to page when selection changes
  select.addEventListener('change', async () => {
    const target = Number(select.value);
    if (isNaN(target)) return;
    await openAndReveal();
    await goToPage(target);
  });

  // Toggle the select (compact UI)
  btn.addEventListener('click', () => {
    select.style.display = (select.style.display === 'none' || !select.style.display) ? 'inline-block' : 'none';
  });

  menu.appendChild(btn);
  menu.appendChild(select);
  // append to sketchbook so it sits above the book
  sketchbook.appendChild(menu);
}
createPageMenu();

// Reveal/hide logic when opening/closing the book
async function openAndReveal() {
  if (sketchbook.classList.contains('open')) {
    // already open: ensure UI visible
    if (controls) controls.style.display = 'flex';
    if (leftPage) leftPage.style.display = 'block';
    if (pagesContainer) pagesContainer.style.display = 'block';
    return;
  }

  // Make left and right pages visible behind the cover (but hidden initially)
  if (leftPage) {
    leftPage.style.display = 'block';
    leftPage.style.opacity = '0';
  }
  if (pagesContainer) {
    pagesContainer.style.display = 'block';
    pagesContainer.style.opacity = '0';
  }
  if (controls) controls.style.display = 'none';

  // Force a repaint for consistent animation start
  void sketchbook.offsetWidth;

  const tl = gsap.timeline({
    onStart: () => {
      sketchbook.classList.add('open');
      cover.setAttribute('aria-pressed', 'true');
    },
    onComplete: () => {
      if (controls) controls.style.display = 'flex';
      if (leftPage) leftPage.style.opacity = '';
      if (pagesContainer) pagesContainer.style.opacity = '';
    }
  });

  // Rotate cover and fade in pages concurrently
  tl.to(cover, { duration: 1.0, rotationY: -160, transformOrigin: "left center", ease: "power3.out" }, 0);
  tl.to([leftPage, pagesContainer], { duration: 0.6, opacity: 1, ease: "power2.out" }, 0.1);

  // Wait for animation to settle; gsap timeline returns a promise-like, but keep a safe timeout fallback
  await new Promise(res => setTimeout(res, 1100));
}

function closeAndHide() {
  if (!sketchbook.classList.contains('open')) return;

  if (controls) controls.style.display = 'none';

  const tl = gsap.timeline({
    onStart: () => {
      cover.setAttribute('aria-pressed', 'false');
    },
    onComplete: () => {
      sketchbook.classList.remove('open');
      // hide left and pages so only cover is visible
      if (leftPage) leftPage.style.display = 'none';
      if (pagesContainer) pagesContainer.style.display = 'none';
      cover.style.transform = 'rotateY(0deg)';
    }
  });

  tl.to([leftPage, pagesContainer], { duration: 0.45, opacity: 0, ease: "power2.in" }, 0);
  tl.to(cover, { duration: 0.9, rotationY: 0, transformOrigin: "left center", ease: "power2.in" }, 0.05);
}

// Enter button toggles open/close
enterBtn.addEventListener('click', async () => {
  if (!sketchbook.classList.contains('open')) {
    await openAndReveal();
  } else {
    closeAndHide();
  }
});

// Page flips (no change to page backgrounds: rightpage.png used for every right page)
let current = 0;
const maxIndex = pages.length - 1;
let flipping = false;

function resetPageStack() {
  pages.forEach((p, i) => {
    p.style.zIndex = (100 - i);
    p.style.transformOrigin = 'left center';
    p.style.transform = 'rotateY(0deg)';
  });
}
resetPageStack();

async function flipPage(index, direction = 'forward') {
  return new Promise((resolve) => {
    const page = pages[index];
    const tl = gsap.timeline({
      onComplete: () => {
        if (direction === 'forward') {
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
      page.style.transform = 'rotateY(-180deg)';
      page.style.zIndex = 300;
      tl.to(page, { duration: 0.65, rotationY: 0, transformOrigin: "left center", ease: "power2.inOut" });
    }
  });
}

// Arrow buttons
nextBtn.addEventListener('click', async () => {
  if (flipping) return;
  await openAndReveal();
  if (current >= maxIndex) return;
  flipping = true;
  await flipPage(current, 'forward');
  current++;
  flipping = false;
});

prevBtn.addEventListener('click', async () => {
  if (flipping) return;
  await openAndReveal();
  if (current <= 0) return;
  flipping = true;
  current--;
  await flipPage(current, 'backward');
  flipping = false;
});

// goToPage sequential flips
async function goToPage(target) {
  if (!sketchbook.classList.contains('open')) {
    await openAndReveal();
  }
  if (target === current) return;
  if (target > current) {
    while (current < target) {
      await flipPage(current, 'forward');
      current++;
    }
  } else {
    while (current > target) {
      current--;
      await flipPage(current, 'backward');
    }
  }
}

// keyboard controls
document.addEventListener('keydown', (e) => {
  if (e.key === 'ArrowRight') nextBtn.click();
  if (e.key === 'ArrowLeft') prevBtn.click();
  if (e.key === 'Escape') closeAndHide();
  if (e.key === 'Enter') {
    const tag = document.activeElement && document.activeElement.tagName;
    if (tag !== 'INPUT' && tag !== 'TEXTAREA' && tag !== 'SELECT') {
      enterBtn.click();
    }
  }
});

// Ambient doodles animation (unchanged)
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
