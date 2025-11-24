// script.js
// Updated to set an --open-bg-url CSS variable on the sketchbook element so the CSS
// .sketchbook.open::before uses the rightpage.png as the full-spread background when open.
// Also preserves previous behavior (cover background, left/right sync, flipping, menu visibility).

const enterBtn = document.getElementById('enterBtn');
const sketchbook = document.getElementById('sketchbook');
const cover = document.getElementById('cover');
const leftPage = document.getElementById('left');
const pagesContainer = document.getElementById('pages');
const pages = Array.from(document.querySelectorAll('.pages .page'));
const nextBtn = document.getElementById('nextBtn');
const prevBtn = document.getElementById('prevBtn');
const controls = document.querySelector('.controls');

// Asset paths (relative)
const COVER_SRC = 'assets/bookcover.jpg';
const LEFT_SRC = 'assets/leftpage.png';
const RIGHT_SRC = 'assets/rightpage.png';

// Section titles
const PAGE_TITLES = [
  'Home',
  'About Me',
  'Digital Art',
  'Animations/GIFs',
  'Sketchbook',
  'Demo Reel'
];

// Capture right-page templates (HTML inside .page-content)
const pageTemplates = pages.map(p => {
  const content = p.querySelector('.page-content');
  return content ? content.innerHTML : '';
});

// Ensure left has a dedicated content slot at top
function ensureLeftSlot() {
  if (!leftPage) return null;
  const container = leftPage.querySelector('.page-content');
  if (!container) return null;
  let slot = container.querySelector('.left-page-section');
  if (!slot) {
    slot = document.createElement('div');
    slot.className = 'left-page-section';
    const nav = container.querySelector('.left-nav');
    if (nav && nav.parentNode === container) {
      nav.insertAdjacentElement('beforebegin', slot);
    } else {
      container.insertAdjacentElement('afterbegin', slot);
    }
  }
  return slot;
}
const leftSlot = ensureLeftSlot();

// Strip the leading H2 from a template HTML string
function stripLeadingH2(html) {
  const temp = document.createElement('div');
  temp.innerHTML = html || '';
  const firstH2 = temp.querySelector('h2');
  if (firstH2) firstH2.remove();
  return temp.innerHTML;
}

// Sync left slot for index
function syncLeftForIndex(index) {
  const i = Math.max(0, Math.min(index, pageTemplates.length - 1));
  const templateHtml = pageTemplates[i] || '';
  const bodyHtml = stripLeadingH2(templateHtml);
  const leftHtml = `<h2>${PAGE_TITLES[i] || `Page ${i+1}`}</h2>` + bodyHtml;
  if (leftSlot) leftSlot.innerHTML = leftHtml;
  const activeRight = pages[i];
  if (activeRight) {
    const h2 = activeRight.querySelector('h2');
    if (h2) h2.textContent = PAGE_TITLES[i] || h2.textContent;
  }
}

// Apply inline backgrounds for left/right as fallback (kept for safety)
function applyInlineBackgrounds() {
  if (leftPage) {
    leftPage.style.backgroundImage = `url('${LEFT_SRC}')`;
    leftPage.style.backgroundSize = 'contain';
    leftPage.style.backgroundPosition = 'center';
    leftPage.style.backgroundRepeat = 'no-repeat';
  }
  pages.forEach(p => {
    p.style.backgroundImage = `url('${RIGHT_SRC}')`;
    p.style.backgroundSize = 'contain';
    p.style.backgroundPosition = 'center';
    p.style.backgroundRepeat = 'no-repeat';
  });
}

// Ensure cover image loads, then inject CSS variable used by .cover::before
function ensureCoverBackground() {
  if (!cover) return;
  const img = new Image();
  img.onload = () => {
    cover.style.setProperty('--cover-url', `url('${COVER_SRC}')`);
    cover.style.backgroundImage = `url('${COVER_SRC}')`;
    cover.style.backgroundSize = 'contain';
    cover.style.backgroundPosition = 'center';
    cover.style.backgroundRepeat = 'no-repeat';
    console.log('Cover image loaded and applied:', COVER_SRC);
  };
  img.onerror = () => {
    console.error('Failed to load cover image at', COVER_SRC);
  };
  img.src = COVER_SRC;
}

// Set the open state background variable so CSS can show the full-spread rightpage image
function applyOpenBackgroundVariable() {
  if (!sketchbook) return;
  sketchbook.style.setProperty('--open-bg-url', `url('${RIGHT_SRC}')`);
}

// ---------- controls visibility helper (unchanged) ----------
function updateControlsVisibility() {
  if (!controls) return;
  if (!sketchbook.classList.contains('open')) {
    controls.style.display = 'none';
    return;
  }
  controls.style.display = 'flex';
  if (current <= 0) {
    prevBtn.style.display = 'none';
    prevBtn.setAttribute('aria-hidden', 'true');
    prevBtn.setAttribute('aria-disabled', 'true');
    prevBtn.disabled = true;
  } else {
    prevBtn.style.display = '';
    prevBtn.removeAttribute('aria-hidden');
    prevBtn.removeAttribute('aria-disabled');
    prevBtn.disabled = false;
  }
  if (current >= maxIndex) {
    nextBtn.style.display = 'none';
    nextBtn.setAttribute('aria-hidden', 'true');
    nextBtn.setAttribute('aria-disabled', 'true');
    nextBtn.disabled = true;
  } else {
    nextBtn.style.display = '';
    nextBtn.removeAttribute('aria-hidden');
    nextBtn.removeAttribute('aria-disabled');
    nextBtn.disabled = false;
  }
}

// initial: apply backgrounds, set left slot content (Home), hide pages until open
function setInitialView() {
  applyInlineBackgrounds();
  syncLeftForIndex(0);
  ensureCoverBackground();
  applyOpenBackgroundVariable(); // set the CSS variable for the open background

  const coverTitle = cover.querySelector('.cover-title');
  if (coverTitle) coverTitle.textContent = "Brett's Portfolio";

  if (leftPage) leftPage.style.display = 'none';
  if (pagesContainer) pagesContainer.style.display = 'none';
  if (controls) controls.style.display = 'none';

  hidePageMenu?.();

  cover.style.transform = 'rotateY(0deg)';
  pages.forEach((p, i) => {
    p.style.transform = 'rotateY(0deg)';
    p.style.zIndex = (100 - i);
  });

  updateControlsVisibility();
}
setInitialView();

// menu creation (unchanged)
function createPageMenu() {
  const existing = document.getElementById('pageMenu');
  if (existing) existing.remove();

  const menu = document.createElement('div');
  menu.id = 'pageMenu';
  menu.setAttribute('aria-hidden', 'true');
  Object.assign(menu.style, {
    position: 'absolute', top: '12px', right: '14px', zIndex: 800,
    display: 'none',
    alignItems: 'center', gap: '6px', fontFamily: 'inherit', pointerEvents: 'none'
  });

  const btn = document.createElement('button');
  btn.type = 'button'; btn.title = 'Menu'; btn.innerHTML = '☰';
  Object.assign(btn.style, { fontSize:'20px', padding:'6px 8px', borderRadius:'6px', border:'2px solid rgba(0,0,0,0.12)', background:'rgba(255,255,255,0.9)', cursor:'pointer', fontFamily: '"Carrotflower", "Amatic SC", sans-serif' });

  const select = document.createElement('select');
  select.id = 'pageSelect';
  Object.assign(select.style, { padding:'6px 8px', borderRadius:'6px', border:'2px solid rgba(0,0,0,0.12)', background:'rgba(255,255,255,0.95)', display:'none' });

  PAGE_TITLES.forEach((t, idx) => {
    const o = document.createElement('option');
    o.value = String(idx);
    o.textContent = t;
    select.appendChild(o);
  });

  select.addEventListener('change', async () => {
    const target = Number(select.value);
    if (!isNaN(target)) {
      await openAndReveal();
      await goToPage(target);
      syncLeftForIndex(current);
      updateControlsVisibility();
    }
  });

  btn.addEventListener('click', () => {
    select.style.display = (select.style.display === 'none' || !select.style.display) ? 'inline-block' : 'none';
  });

  menu.appendChild(btn);
  menu.appendChild(select);
  sketchbook.appendChild(menu);
  hidePageMenu(); // keep hidden initially
}
createPageMenu();

function showPageMenu() {
  const menu = document.getElementById('pageMenu');
  if (!menu) return;
  menu.style.display = 'flex';
  menu.setAttribute('aria-hidden', 'false');
  menu.style.pointerEvents = 'auto';
}
function hidePageMenu() {
  const menu = document.getElementById('pageMenu');
  if (!menu) return;
  menu.style.display = 'none';
  menu.setAttribute('aria-hidden', 'true');
  menu.style.pointerEvents = 'none';
}

// open animation: reveal left & right pages while rotating cover
async function openAndReveal() {
  if (sketchbook.classList.contains('open')) {
    if (controls) controls.style.display = 'flex';
    if (leftPage) leftPage.style.display = 'block';
    if (pagesContainer) pagesContainer.style.display = 'block';
    showPageMenu();
    updateControlsVisibility();
    return;
  }

  if (leftPage) { leftPage.style.display = 'block'; leftPage.style.opacity = '0'; }
  if (pagesContainer) { pagesContainer.style.display = 'block'; pagesContainer.style.opacity = '0'; }
  if (controls) controls.style.display = 'none';
  void sketchbook.offsetWidth; // force reflow

  const tl = gsap.timeline({
    onStart: () => {
      sketchbook.classList.add('open');
      cover.setAttribute('aria-pressed', 'true');
      // ensure the open-background variable is set (safe)
      applyOpenBackgroundVariable();
    },
    onComplete: () => {
      if (controls) controls.style.display = 'flex';
      if (leftPage) leftPage.style.opacity = '';
      if (pagesContainer) pagesContainer.style.opacity = '';
      showPageMenu();
      updateControlsVisibility();
    }
  });

  tl.to(cover, { duration: 1.0, rotationY: -160, transformOrigin: "left center", ease: "power3.out" }, 0);
  tl.to([leftPage, pagesContainer], { duration: 0.6, opacity: 1, ease: "power2.out" }, 0.1);

  syncLeftForIndex(current);
  await new Promise(res => setTimeout(res, 1100));
}

// close: hide left/right and reset cover; hide menu and update controls
function closeAndHide() {
  if (!sketchbook.classList.contains('open')) return;
  if (controls) controls.style.display = 'none';

  const tl = gsap.timeline({
    onStart: () => { cover.setAttribute('aria-pressed', 'false'); },
    onComplete: () => {
      sketchbook.classList.remove('open');
      if (leftPage) leftPage.style.display = 'none';
      if (pagesContainer) pagesContainer.style.display = 'none';
      cover.style.transform = 'rotateY(0deg)';
      hidePageMenu();
      updateControlsVisibility();
    }
  });

  tl.to([leftPage, pagesContainer], { duration: 0.45, opacity: 0, ease: "power2.in" }, 0);
  tl.to(cover, { duration: 0.9, rotationY: 0, transformOrigin: "left center", ease: "power2.in" }, 0.05);
}

// Enter button toggles
enterBtn.addEventListener('click', async () => {
  if (!sketchbook.classList.contains('open')) {
    await openAndReveal();
  } else {
    closeAndHide();
  }
});

// Page flip logic (unchanged)
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

function flipPage(index, direction = 'forward') {
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

// Next / Prev handlers
nextBtn.addEventListener('click', async () => {
  if (flipping) return;
  await openAndReveal();
  if (current >= maxIndex) return;
  flipping = true;
  await flipPage(current, 'forward');
  current++;
  syncLeftForIndex(current);
  updateControlsVisibility();
  flipping = false;
});

prevBtn.addEventListener('click', async () => {
  if (flipping) return;
  await openAndReveal();
  if (current <= 0) return;
  flipping = true;
  current--;
  await flipPage(current, 'backward');
  syncLeftForIndex(current);
  updateControlsVisibility();
  flipping = false;
});

// goToPage: sequential flips, then sync left slot and update controls
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
  syncLeftForIndex(current);
  updateControlsVisibility();
}

// keyboard
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

// ambient doodles (unchanged)
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

// Ensure cover + backgrounds are applied when the page loads, and set open background variable
window.addEventListener('load', () => {
  ensureCoverBackground();
  applyInlineBackgrounds();
  applyOpenBackgroundVariable();
  syncLeftForIndex(current);
  updateControlsVisibility();
});
