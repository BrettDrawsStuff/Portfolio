// Sketchbook prototype script (uses GSAP)
// This version removes all viewport scaling. It:
// - Shows only the cover at load (centered).
// - "Enter" button opens the book into a two-page spread (left + right backgrounds).
// - Uses assets/bookcover.jpg, assets/leftpage.png, assets/rightpage.png as backgrounds.
// - Ensures each page's H2 matches the page section title.
// - Provides top-right compact menu (hamburger + select) and bottom arrow controls.

const enterBtn = document.getElementById('enterBtn');
const sketchbook = document.getElementById('sketchbook');
const cover = document.getElementById('cover');
const leftPage = document.getElementById('left');
const pagesContainer = document.getElementById('pages');
const pages = Array.from(document.querySelectorAll('.pages .page'));
const nextBtn = document.getElementById('nextBtn');
const prevBtn = document.getElementById('prevBtn');
const controls = document.querySelector('.controls');

// Section titles in order
const PAGE_TITLES = [
  'Home',
  'About Me',
  'Digital Art',
  'Animations/GIFs',
  'Sketchbook',
  'Demo Reel'
];

// Ensure page H2 headings match PAGE_TITLES
pages.forEach((p, i) => {
  const h2 = p.querySelector('h2');
  if (h2) h2.textContent = PAGE_TITLES[i] || `Page ${i+1}`;
});

// Apply provided images as backgrounds
function applyBackgrounds() {
  // Cover background
  cover.style.backgroundImage = "url('assets/bookcover.jpg')";
  cover.style.backgroundSize = 'cover';
  cover.style.backgroundPosition = 'center';
  cover.style.backgroundRepeat = 'no-repeat';

  // Left page background
  if (leftPage) {
    leftPage.style.backgroundImage = "url('assets/leftpage.png')";
    leftPage.style.backgroundSize = 'cover';
    leftPage.style.backgroundPosition = 'center';
    leftPage.style.backgroundRepeat = 'no-repeat';
  }

  // Right page background for all right pages
  pages.forEach(p => {
    p.style.backgroundImage = "url('assets/rightpage.png')";
    p.style.backgroundSize = 'cover';
    p.style.backgroundPosition = 'center';
    p.style.backgroundRepeat = 'no-repeat';
    const content = p.querySelector('.page-content');
    if (content) {
      content.style.background = 'transparent';
      content.style.color = '#111';
    }
  });
}

// Initial view: only the cover should be visible and centered
function setInitialView() {
  applyBackgrounds();

  // Cover title text
  const coverTitle = cover.querySelector('.cover-title');
  if (coverTitle) coverTitle.textContent = "Brett's Portfolio";

  // Hide left and pages and controls until Enter is clicked
  if (leftPage) leftPage.style.display = 'none';
  if (pagesContainer) pagesContainer.style.display = 'none';
  if (controls) controls.style.display = 'none';

  // Reset transforms
  cover.style.transform = 'rotateY(0deg)';
  pages.forEach((p,i) => {
    p.style.transform = 'rotateY(0deg)';
    p.style.zIndex = (100 - i);
  });
}
setInitialView();

// Build a compact dropdown menu in the top-right of the sketchbook
function createPageMenu() {
  // Remove any previous menu
  const existing = document.getElementById('pageMenu');
  if (existing) existing.remove();

  const menu = document.createElement('div');
  menu.id = 'pageMenu';
  Object.assign(menu.style, {
    position: 'absolute',
    top: '12px',
    right: '14px',
    zIndex: 800,
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
    display: 'none'
  });

  PAGE_TITLES.forEach((title, idx) => {
    const opt = document.createElement('option');
    opt.value = String(idx);
    opt.textContent = title;
    select.appendChild(opt);
  });

  select.addEventListener('change', async () => {
    const target = Number(select.value);
    if (!isNaN(target)) {
      await openAndReveal();
      await goToPage(target);
    }
  });

  btn.addEventListener('click', () => {
    select.style.display = (select.style.display === 'none' || !select.style.display) ? 'inline-block' : 'none';
  });

  menu.appendChild(btn);
  menu.appendChild(select);
  sketchbook.appendChild(menu);
}
createPageMenu();

// Open the book and reveal left/right pages (animation)
async function openAndReveal() {
  if (sketchbook.classList.contains('open')) {
    // Already open: ensure UI visible
    if (controls) controls.style.display = 'flex';
    if (leftPage) leftPage.style.display = 'block';
    if (pagesContainer) pagesContainer.style.display = 'block';
    return;
  }

  // Make left and pages visible behind the cover (hidden initially)
  if (leftPage) {
    leftPage.style.display = 'block';
    leftPage.style.opacity = '0';
  }
  if (pagesContainer) {
    pagesContainer.style.display = 'block';
    pagesContainer.style.opacity = '0';
  }
  if (controls) controls.style.display = 'none';

  // Ensure styles applied before animating
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

  // Rotate cover and fade-in pages for the opening effect
  tl.to(cover, { duration: 1.0, rotationY: -160, transformOrigin: "left center", ease: "power3.out" }, 0);
  tl.to([leftPage, pagesContainer], { duration: 0.6, opacity: 1, ease: "power2.out" }, 0.1);

  // Wait for animation to finish (safe wait)
  await new Promise(res => setTimeout(res, 1100));
}

// Close/hide the book so only the cover remains visible
function closeAndHide() {
  if (!sketchbook.classList.contains('open')) return;

  if (controls) controls.style.display = 'none';

  const tl = gsap.timeline({
    onStart: () => {
      cover.setAttribute('aria-pressed', 'false');
    },
    onComplete: () => {
      sketchbook.classList.remove('open');
      if (leftPage) leftPage.style.display = 'none';
      if (pagesContainer) pagesContainer.style.display = 'none';
      cover.style.transform = 'rotateY(0deg)';
    }
  });

  tl.to([leftPage, pagesContainer], { duration: 0.45, opacity: 0, ease: "power2.in" }, 0);
  tl.to(cover, { duration: 0.9, rotationY: 0, transformOrigin: "left center", ease: "power2.in" }, 0.05);
}

// Hook Enter button
enterBtn.addEventListener('click', async () => {
  if (!sketchbook.classList.contains('open')) {
    await openAndReveal();
  } else {
    closeAndHide();
  }
});

// Page flipping logic (no pages are scaled)
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

async function flipPage(index, direction='forward') {
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

// Sequential navigation to a specific page
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

// Keyboard shortcuts
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

// Ambient doodles (unchanged)
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
